export const SWITCH_GUIDE_CATEGORIES = ["חברת חשמל", "קופת חולים"] as const;

export type SwitchGuide = {
  headline: string;
  steps: [string, string, string];
  competitor: string;
};

export function usesSwitchGuide(category?: string | null): boolean {
  if (!category) return false;
  return SWITCH_GUIDE_CATEGORIES.includes(category.trim() as (typeof SWITCH_GUIDE_CATEGORIES)[number]);
}

export function getSwitchGuide(
  category: string,
  providerName: string,
  competitor: string,
): SwitchGuide {
  const headline = "הסוכן מצא את ההצעה הטובה ביותר עבורך — הנה איך לעבור ב-3 צעדים פשוטים";

  if (category === "חברת חשמל") {
    return {
      headline,
      competitor,
      steps: [
        `היכנס לאזור האישי של ${providerName} באתר או באפליקציה`,
        `בחר "מעבר ספק" והזמן את ${competitor}`,
        "אשר את המעבר — החשמל ימשיך לזרום ללא הפסקה",
      ],
    };
  }

  if (category === "קופת חולים") {
    return {
      headline,
      competitor,
      steps: [
        `היכנס לאזור האישי של ${providerName} באתר או באפליקציה`,
        `בחר מעבר ל${competitor} ומלא את טופס ההצטרפות`,
        "שלח את הטופס — המעבר יתבצע בתיאום עם הקופה הנוכחית",
      ],
    };
  }

  return {
    headline,
    competitor,
    steps: [
      `היכנס לאזור האישי של ${providerName}`,
      `בחר מעבר ל${competitor}`,
      "אשר את המעבר ועקוב אחרי אישור הספק",
    ],
  };
}
