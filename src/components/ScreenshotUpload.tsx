import { useId, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Upload, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { scanStatement, type DetectedCharge } from "@/lib/scan-statement.functions";

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(f);
  });
}

type ScreenshotUploadProps = {
  onResults: (charges: DetectedCharge[]) => void;
  className?: string;
  buttonLabel?: string;
  showPrivacyNote?: boolean;
};

export function ScreenshotUpload({
  onResults,
  className = "mt-4 rounded-2xl p-4 text-center",
  buttonLabel = "בחר צילום מהגלריה",
  showPrivacyNote = true,
}: ScreenshotUploadProps) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const scan = useServerFn(scanStatement);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const openPicker = () => {
    fileRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("יש לבחור קובץ תמונה");
      return;
    }

    setScanning(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setPreview(dataUrl);
      const charges = await scan({ data: { imageDataUrl: dataUrl } });
      if (charges.length === 0) {
        toast.error("לא נמצאו חיובים קבועים בצילום");
        setPreview(null);
        return;
      }
      onResults(charges);
      setPreview(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "שגיאה בעיבוד הצילום";
      toast.error(message);
      setPreview(null);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div
      className={className}
      style={{ border: "2px dashed rgba(0,194,168,0.4)", background: "rgba(0,194,168,0.04)" }}
    >
      <input
        ref={fileRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onFileChange}
      />

      {scanning ? (
        <div className="flex flex-col items-center py-2">
          {preview && (
            <img
              src={preview}
              alt="תצוגה מקדימה"
              className="mb-4 max-h-40 w-auto max-w-full rounded-xl border border-border object-contain"
            />
          )}
          <Loader2 className="size-8 animate-spin" style={{ color: "var(--primary)" }} />
          <p className="mt-3 text-sm font-semibold">הסוכן סורק את הצילום שלך…</p>
          <p className="mt-1 text-xs text-muted-foreground">זה ייקח כמה שניות</p>
        </div>
      ) : (
        <>
          <Upload className="size-6 mx-auto" style={{ color: "var(--primary)" }} />
          <p className="mt-2 font-semibold text-sm">📸 העלה צילום מסך מהוראות קבע</p>
          <button
            type="button"
            data-inline="true"
            onClick={openPicker}
            className="btn-inline mt-3 rounded-full px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground teal-glow min-h-[44px]"
          >
            {buttonLabel}
          </button>
          {showPrivacyNote && (
            <p className="mt-3 text-[11px] text-muted-foreground flex items-start gap-1 text-right">
              <Lock className="size-3 mt-0.5 shrink-0" />
              <span>
                הצילום מעובד ונמחק מיד. Fixx אינה שומרת צילומי מסך. אל תעלה מספר חשבון בנק או פרטי כרטיס אשראי.
              </span>
            </p>
          )}
        </>
      )}
    </div>
  );
}
