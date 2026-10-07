import type { Metadata } from "next";
import { SITE_URL } from "@/data/profile";
import type { Site } from "@/lib/content";

/** Cut text at a word boundary so meta descriptions end cleanly (Google shows roughly 155-160 characters). */
export function clip(text: string, max = 158) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).replace(/[,;:.\s]+$/, "")}…`;
}

export function pageMeta({ title, description, path = "/", image, type = "website", publishedTime, modifiedTime, absolute }: { title: string; description: string; path?: string; image?: string; type?: "website" | "article"; publishedTime?: string; modifiedTime?: string; absolute?: boolean }): Metadata {
  const og = image || `/og?title=${encodeURIComponent(title)}&kind=${type === "article" ? "Article" : "Profile"}`;
  const desc = clip(description);
  return {
    title: absolute ? { absolute: title } : title,
    description: desc,
    alternates: { canonical: path },
    openGraph: { title, description: desc, url: path, type, images: [{ url: og, width: 1200, height: 630, alt: title }], publishedTime, modifiedTime, siteName: "xerk.io", locale: "en_US" },
    twitter: { card: "summary_large_image", title, description: desc, images: [og], creator: "@xerk" },
  };
}

/** Topics the Person entity is known for, most specific first (search engines and assistants read the first few). */
const CORE_TOPICS = ["NestJS", "Node.js", "TypeScript", "Next.js", "Real-time systems", "WebSockets", "Socket.io", "AI agents", "Model Context Protocol (MCP)", "Retrieval-augmented generation (RAG)", "LLM evaluation", "Microservices", "GraphQL", "AWS", "Kubernetes"];

export function personJsonLd({ profile, links: socials, experience, skills }: Site) {
  const knowsAbout = [...new Set([...CORE_TOPICS, ...Object.values(skills).flat()])].slice(0, 50);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: profile.name,
    alternateName: ["xerk", `${profile.name} (xerk)`],
    jobTitle: profile.title,
    description: profile.description,
    url: SITE_URL,
    mainEntityOfPage: `${SITE_URL}/`,
    image: { "@type": "ImageObject", url: `${SITE_URL}${profile.avatar}`, caption: `${profile.name}, ${profile.title}` },
    email: `mailto:${profile.email}`,
    address: { "@type": "PostalAddress", addressLocality: "Cairo", addressCountry: "EG" },
    homeLocation: { "@type": "Place", name: profile.location },
    sameAs: [...new Set(socials.map((s) => s.href).filter((h) => /^https?:\/\//.test(h)).concat(["https://github.com/xerk"]))],
    worksFor: experience[0]?.company ? { "@type": "Organization", name: experience[0].company } : undefined,
    hasOccupation: {
      "@type": "Occupation",
      name: profile.title,
      occupationLocation: { "@type": "City", name: "Cairo" },
      skills: CORE_TOPICS.slice(0, 10).join(", "),
    },
    alumniOf: [{ "@type": "CollegeOrUniversity", name: profile.education.school }],
    knowsAbout,
    knowsLanguage: ["ar", "en"],
    seeks: profile.available ? { "@type": "Demand", name: "Freelance and contract software projects", url: `${SITE_URL}/hire` } : undefined,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "xerk.io",
    alternateName: "Ahmed Mamdouh (xerk)",
    inLanguage: "en",
    publisher: { "@id": `${SITE_URL}/#person` },
    author: { "@id": `${SITE_URL}/#person` },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE_URL}${it.path}` })) };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
}

/** A service offered by the Person, for /hire and the focused hire pages. No prices on purpose. */
export function serviceJsonLd({ name, description, path, serviceType, knowsAbout, offers }: { name: string; description: string; path: string; serviceType: string; knowsAbout?: string[]; offers?: { name: string; description: string }[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}${path}#service`,
    name,
    description,
    url: `${SITE_URL}${path}`,
    serviceType,
    image: `${SITE_URL}/profile.png`,
    founder: { "@id": `${SITE_URL}/#person` },
    employee: { "@id": `${SITE_URL}/#person` },
    address: { "@type": "PostalAddress", addressLocality: "Cairo", addressCountry: "EG" },
    areaServed: "Worldwide",
    availableLanguage: ["English", "Arabic"],
    knowsAbout,
    makesOffer: offers?.map((o) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: o.name, description: o.description, provider: { "@id": `${SITE_URL}/#person` } } })),
  };
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
