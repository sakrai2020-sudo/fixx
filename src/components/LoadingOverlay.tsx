import { useSyncExternalStore } from "react";
import { Logo } from "./Logo";

type OverlayState = { visible: boolean; message: string };

let listeners = new Set<() => void>();
let overlayState: OverlayState = { visible: false, message: "" };
let currentToken = 0;
let safetyTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return overlayState;
}

function getServerSnapshot(): OverlayState {
  return { visible: false, message: "" };
}

export const loadingOverlay = {
  show(message?: string) {
    const token = ++currentToken;
    overlayState = { visible: true, message: message ?? "" };
    emit();
    if (safetyTimer) clearTimeout(safetyTimer);
    safetyTimer = setTimeout(() => {
      overlayState = { visible: false, message: "" };
      emit();
    }, 45000);
    return token;
  },
  hide(token?: number) {
    if (token && token !== currentToken) return;
    if (safetyTimer) {
      clearTimeout(safetyTimer);
      safetyTimer = null;
    }
    overlayState = { visible: false, message: "" };
    emit();
  },
  subscribe,
  getSnapshot,
};

export function GlobalLoadingOverlay() {
  const { visible, message } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (!visible) return null;

  return (
    <div
      id="fixx-global-loading-overlay"
      aria-hidden="true"
      className="fixed inset-0 flex flex-col items-center justify-center mx-auto max-w-[390px]"
      style={{
        zIndex: 2147483647,
        background: "#0B1628",
        opacity: 1,
        transition: "none",
        animation: "none",
      }}
    >
      <div className="flex flex-col items-center justify-center px-6 text-center">
        <div className="relative inline-flex items-center justify-center">
          <div
            aria-hidden
            className="absolute inset-0 -m-8 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(0,194,168,0.45) 0%, rgba(0,194,168,0) 70%)",
              filter: "blur(18px)",
            }}
          />
          <Logo size={56} />
        </div>
        <div
          className="fixx-overlay-spinner mt-8 rounded-full"
          style={{
            width: 40,
            height: 40,
            border: "3px solid rgba(0,194,168,0.20)",
            borderTopColor: "#00C2A8",
          }}
        />
        {message ? (
          <p
            className="mt-6 text-base font-bold text-white"
            style={{ lineHeight: 1.45 }}
          >
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
