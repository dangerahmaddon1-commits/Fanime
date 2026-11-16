import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Fanime — Your anime universe", template: "%s | Fanime" },
  description: "Discover anime, explore episodes, and keep track of what you want to watch.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const analyticsToken = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN;
  return <html lang="en"><body>{children}{analyticsToken ? <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon={JSON.stringify({ token: analyticsToken })} /> : null}</body></html>;
}
