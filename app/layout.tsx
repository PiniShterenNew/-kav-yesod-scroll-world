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

// Set NEXT_PUBLIC_SITE_URL to the production origin when the project gets a
// domain — it feeds metadataBase so OG/Twitter URLs come out absolute.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
    url: "/",
    siteName: "קו יסוד",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "קו יסוד - פרויקט קונספט"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "קו יסוד — מהקרקע ועד המפתח",
    description: "פרויקט קונספט קולנועי לששת שלבי בניית בית פרטי.",
    images: ["/og-image.jpg"]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f2eee7"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${notoSerifHebrew.variable}`}>
      <body>
        {/* The opening still is the LCP on both breakpoints — fetch it before
            the engine mounts. React hoists these into <head>. */}
        <link
          rel="preload"
          as="image"
          href="/assets/scroll-world/desktop/01-opening.webp"
          media="(min-width: 861px)"
        />
        <link
          rel="preload"
          as="image"
          href="/assets/scroll-world/mobile/01-opening.webp"
          media="(max-width: 860px)"
        />
        <a className="skip-link" href="#site-footer">
          דילוג אל סוף המסע ופרטי הפרויקט
        </a>
        {children}
      </body>
    </html>
  );
}
