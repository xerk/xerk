import Link from "next/link";
import { Logo, SocialLinks, Button, DockNav } from "./ui";
import { CommandPalette, ScrollHUD, SearchTrigger, ThemeToggle, type PaletteItem } from "./client";
import { profile, socials, bookingUrl, upworkHref } from "@/data/profile";
import { projects } from "@/data/projects";
import { getPosts } from "@/lib/posts";

export const NAV = [
  { label: "Work", href: "/work" },
  { label: "AI", href: "/ai" },
  { label: "Blog", href: "/blog" },
  { label: "Hire", href: "/hire" },
  { label: "CV", href: "/cv" },
];

export function SiteHeader() {
  return (
    <div className="xk-sticky">
      <header className="xk-header">
        <Logo href="/" size={26} />
        <nav className="xk-header-nav" aria-label="Main">
          {NAV.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
        </nav>
        <div className="xk-header-actions">
          <SearchTrigger />
          <ThemeToggle />
          <Button variant="primary" size="sm" href="/hire" track="hire_click">Hire me</Button>
        </div>
      </header>
      <ScrollHUD />
    </div>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="xk-footer xk-container">
      <div className="xk-footer-brand">
        <Logo size={24} />
        <p>Senior full-stack &amp; AI engineer. Real-time platforms, AI agents, SaaS. {profile.location}, working worldwide.</p>
        <SocialLinks links={socials} medium="footer" />
      </div>
      <div className="xk-footer-col"><span className="xk-label">Play</span><ul><li><Link href="/work">Level select</Link></li><li><Link href="/#achievements">Achievements</Link></li><li><Link href="/#console">Terminal</Link></li><li><Link href="/ai">AI work</Link></li></ul></div>
      <div className="xk-footer-col"><span className="xk-label">Hire</span><ul><li><Link href="/hire">Services</Link></li><li><a href={upworkHref} target="_blank" rel="noopener me">Upwork</a></li><li><a href={bookingUrl}>Book a call</a></li><li><Link href="/cv">CV</Link></li></ul></div>
      <div className="xk-footer-col"><span className="xk-label">More</span><ul><li><Link href="/blog">Blog</Link></li><li><Link href="/uses">Uses</Link></li><li><Link href="/now">Now</Link></li><li><a href="/llms.txt">llms.txt</a></li></ul></div>
      <div className="xk-footer-base"><span>© {year} {profile.name}</span><span className="xk-muted">Built with Next.js, Three.js, GSAP &amp; Supabase</span></div>
    </footer>
  );
}

export function MobileDock() {
  return (
    <div className="xk-dock-wrap">
      <DockNav items={[
        { label: "Home", href: "/", icon: "house" },
        { label: "Work", href: "/work", icon: "game-controller" },
        { label: "AI", href: "/ai", icon: "sparkle" },
        { label: "Blog", href: "/blog", icon: "pen-nib" },
        { label: "Hire", href: "/hire", icon: "handshake" },
      ]} />
    </div>
  );
}

export async function Palette() {
  const posts = await getPosts();
  const items: PaletteItem[] = [
    ...projects.map((p) => ({ group: "Stages", label: p.title, href: `/work/${p.slug}`, icon: p.ai ? "robot" : "game-controller", hint: p.code, ai: p.ai })),
    ...posts.slice(0, 12).map((p) => ({ group: "Blog", label: p.title, href: `/blog/${p.slug}`, icon: "pen-nib", hint: "post" })),
    { group: "Actions", label: "Ask my CV anything", href: "/ai#ask", icon: "sparkle", ai: true },
    { group: "Actions", label: "Open terminal", href: "/#console", icon: "terminal-window", hint: "`" },
    { group: "Actions", label: "View CV", href: "/cv", icon: "read-cv-logo" },
    { group: "Actions", label: "Download CV (PDF)", href: profile.cvPdf, icon: "download-simple" },
    { group: "Actions", label: "Hire me", href: "/hire", icon: "handshake" },
    { group: "Actions", label: "Hire me on Upwork", href: upworkHref, brand: "upwork" },
    { group: "Actions", label: "Email me", href: `mailto:${profile.email}`, icon: "envelope-simple" },
    { group: "Pages", label: "AI work", href: "/ai", icon: "brain" },
    { group: "Pages", label: "Uses", href: "/uses", icon: "stack" },
    { group: "Pages", label: "Now", href: "/now", icon: "clock" },
  ];
  return <CommandPalette items={items} />;
}
