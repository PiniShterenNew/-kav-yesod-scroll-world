import type { ScrollWorldConfig } from "@/types/scroll-world";

const desktopPath = "/assets/scroll-world/desktop";
const mobilePath = "/assets/scroll-world/mobile";

export const scrollWorldConfig = {
  diveScroll: 1.35,
  connScroll: 0.85,
  crossfade: 0.08,
  hint: "גללו כדי לבנות",
  nav: false,
  atmosphere: false,
  opening: {
    id: "opening",
    label: "הבטחה",
    still: `${desktopPath}/01-opening.png`,
    stillMobile: `${mobilePath}/01-opening.png`,
    clip: null,
    clipMobile: null,
    accent: "#B85C38",
    scroll: 1.65,
    linger: 0.45,
    eyebrow: "קו יסוד · בנייה פרטית",
    title: "מהקרקע ועד המפתח.",
    body: "אנחנו מחברים את כל שלבי הבנייה למסלול אחד ברור — מהתכנון הראשון ועד היום שבו נכנסים הביתה."
  },
  sections: [
    {
      id: "planning",
      label: "תכנון",
      still: `${desktopPath}/02-planning.png`,
      stillMobile: `${mobilePath}/02-planning.png`,
      clip: null,
      clipMobile: null,
      accent: "#B85C38",
      scroll: 1.4,
      linger: 0.32,
      eyebrow: "01 · תכנון",
      title: "כל בית טוב מתחיל בהחלטות נכונות.",
      body: "מגדירים צרכים, תקציב ותכניות לפני שהעבודה עוברת לשטח.",
      tags: ["תכנון מקדים", "תקציב ברור", "כתובת אחת"]
    },
    {
      id: "foundation",
      label: "יסודות",
      still: `${desktopPath}/03-foundations.png`,
      stillMobile: `${mobilePath}/03-foundations.png`,
      clip: null,
      clipMobile: null,
      accent: "#D89A2B",
      scroll: 1.3,
      linger: 0.25,
      eyebrow: "02 · יסודות",
      title: "מה שלא רואים, מחזיק הכול.",
      body: "קרקע, ברזל ובטון נבדקים ומתועדים לפני שהבית מתחיל לעלות.",
      tags: ["בקרת איכות", "תיעוד", "רצף נכון"]
    },
    {
      id: "structure",
      label: "שלד",
      still: `${desktopPath}/04-structure.png`,
      stillMobile: `${mobilePath}/04-structure.png`,
      clip: null,
      clipMobile: null,
      accent: "#B85C38",
      scroll: 1.45,
      linger: 0.3,
      eyebrow: "03 · שלד",
      title: "דיוק שנבנה קומה אחר קומה.",
      body: "אנחנו מחברים בין צוותים, תכניות וקצב ביצוע בלי לדלג על נקודות הבקרה.",
      tags: ["תיאום צוותים", "פיקוח", "לוחות זמנים"]
    },
    {
      id: "systems",
      label: "מערכות",
      still: `${desktopPath}/05-systems.png`,
      stillMobile: `${mobilePath}/05-systems.png`,
      clip: null,
      clipMobile: null,
      accent: "#7D8773",
      scroll: 1.35,
      linger: 0.3,
      eyebrow: "04 · מערכות",
      title: "כאן הבית מתחיל לעבוד.",
      body: "חשמל, אינסטלציה, מיזוג ותקשורת מתואמים יחד כדי למנוע אילתורים יקרים בהמשך.",
      tags: ["תיאום מערכות", "בדיקות", "תכנון קדימה"]
    },
    {
      id: "finishes",
      label: "גמרים",
      still: `${desktopPath}/06-finishes.png`,
      stillMobile: `${mobilePath}/06-finishes.png`,
      clip: null,
      clipMobile: null,
      accent: "#B85C38",
      scroll: 1.45,
      linger: 0.38,
      eyebrow: "05 · גמרים",
      title: "הפרטים הופכים מבנה לבית.",
      body: "חומרים, נגרות, תאורה וגמרים נפגשים תחת פיקוח אחד ועד לרמת החיבור האחרון.",
      tags: ["חומריות", "דיוק בפרטים", "בקרת גמר"]
    },
    {
      id: "handover",
      label: "מסירה",
      still: `${desktopPath}/07-handover.png`,
      stillMobile: `${mobilePath}/07-handover.png`,
      clip: null,
      clipMobile: null,
      accent: "#7D8773",
      scroll: 1.8,
      linger: 0.5,
      eyebrow: "06 · מסירה",
      title: "נכנסים לבית. לא לקצוות פתוחים.",
      body: "מסירה מסודרת, בדיקות, תיקונים ואחריות — כדי שהמפתח יהיה התחלה שקטה.",
      tags: ["בדיקות מסירה", "אחריות", "ליווי"],
      cta: {
        primary: { label: "מתחילים לתכנן", href: "#contact-demo" },
        secondary: { label: "לראות את המסע שוב", href: "#top" }
      }
    }
  ],
  connectors: [],
  connectorsMobile: []
} satisfies ScrollWorldConfig;
