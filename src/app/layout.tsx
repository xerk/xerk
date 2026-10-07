import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader, SiteFooter, MobileDock, Palette } from "@/components/xerk/chrome";
import { AchievementToaster, MotionRoot, QuestPanel } from "@/components/xerk/client";
import { SITE_URL } from "@/data/profile";
import { getSite } from "@/lib/content";
import { JsonLd, personJsonLd, websiteJsonLd } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getSite();
  return {
  metadataBase: new URL(SITE_URL),
  title: { default: `${profile.name} — ${profile.title}`, template: `%s | ${profile.name}` },
  description: profile.description,
  applicationName: "xerk.io",
  authors: [{ name: profile.name, url: SITE_URL }],
  creator: profile.name,
  keywords: ["Senior Full-Stack Engineer", "AI Engineer", "NestJS", "Node.js", "Next.js", "TypeScript", "AI agents", "MCP server", "RAG", "Real-time systems", "WebSockets", "Laravel", "Freelance developer Egypt", "Upwork full-stack developer", "Ahmed Mamdouh", "xerk"],
  openGraph: { type: "website", siteName: "xerk.io", locale: "en_US", images: [{ url: "/og?kind=Profile", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", creator: "@xerk" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  alternates: { canonical: "/", types: { "application/rss+xml": "/rss.xml" } },
  verification: { google: "RB2dzZGLiNJe7uPzE0s-vpARRoG0ZGv_6mOFsIlFAf4" },
  };
}

export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0a0b0d" }, { media: "(prefers-color-scheme: light)", color: "#fafaf9" }], colorScheme: "dark light" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const site = await getSite();
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <JsonLd data={personJsonLd(site)} />
        <JsonLd data={websiteJsonLd()} />
      </head>
      <body>
        <Providers>
          <a href="#main" className="xk-skip">Skip to content</a>
          <SiteHeader />
          <main id="main" className="xk-main">{children}</main>
          <SiteFooter />
          <MobileDock />
          <Palette />
          <AchievementToaster />
          <QuestPanel />
          <MotionRoot />
        </Providers>
      </body>
    </html>
  );
}
