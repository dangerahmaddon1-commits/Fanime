import type { Metadata } from "next";
import "./globals.css";
import FirebaseAnalytics from "@/components/firebase-analytics";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  applicationName: "F Anime",
  title: { default: "F Anime — Your anime universe", template: "%s | F Anime" },
  description: "Discover anime, explore new episodes, and find titles across Japanese, English, Hindi, Tamil, Telugu and more.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "F Anime",
    title: "F Anime — Your anime universe",
    description: "Discover anime, explore new episodes, and find titles across Japanese, English, Hindi, Tamil, Telugu and more.",
  },
  twitter: {
    card: "summary_large_image",
    title: "F Anime — Your anime universe",
    description: "Discover anime, explore new episodes, and find titles across Japanese, English, Hindi, Tamil, Telugu and more.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<FirebaseAnalytics /></body></html>;
}
