import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "F Anime — Your anime universe", template: "%s | F Anime" },
  description: "Discover anime, explore new episodes, and find titles across Japanese, English, Hindi, Tamil, Telugu and more.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const analyticsToken = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN;
  return <html lang="en"><body>{children}{analyticsToken ? <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon={JSON.stringify({ token: analyticsToken })} /> : null}</body></html>;
}
