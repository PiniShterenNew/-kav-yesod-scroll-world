import type { Metadata, Viewport } from "next";
import { Heebo, Noto_Serif_Hebrew } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-heebo"
});

const notoSerifHebrew = Noto_Serif_Hebrew({
  subsets: ["hebrew"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-noto-serif-hebrew"
});

export const metadata: Metadata = {
  title: "קו יסוד — מהקרקע ועד המפתח | פרויקט קונספט",
  description: "מסע אינטראקטיבי דרך ששת השלבים של בניית בית פרטי — מהתכנון ועד המסירה.",
  robots: {
    index: false,
    follow: false
  },
  icons: {
    icon: [{ url: "/brand/favicon.svg", type: "image/svg+xml" }]
  },
  openGraph: {
    title: "קו יסוד — מהקרקע ועד המפתח",
    description: "פרויקט קונספט קולנועי לששת שלבי בניית בית פרטי.",
    type: "website",
    locale: "he_IL",
    images: [
      {
        // Interim: the opening frame until the dedicated 1200x630 OG render
        // is delivered (see assets-manifest "pending").
        url: "/assets/scroll-world/desktop/01-opening.png",
        width: 1672,
        height: 941,
        alt: "קו יסוד - פרויקט קונספט"
      }
    ]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${notoSerifHebrew.variable}`}>
      <body>{children}</body>
    </html>
  );
}
