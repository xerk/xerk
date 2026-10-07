import type { Metadata } from "next";
import { SITE_URL } from "@/data/profile";
import type { Site } from "@/lib/content";

export function pageMeta({ title, description, path = "/", image, type = "website", publishedTime }: { title: string; description: string; path?: string; image?: string; type?: "website" | "article"; publishedTime?: string }): Metadata {
  const og = image || `/og?title=${encodeURIComponent(title)}&kind=${type === "article" ? "Article" : "Profile"}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type, images: [{ url: og, width: 1200, height: 630 }], publishedTime, siteName: "xerk.io" },
    twitter: { card: "summary_large_image", title, description, images: [og], creator: "@xerk" },
  };
}

export function personJsonLd({ profile, links: socials, experience, skills }: Site) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: profile.name,
    alternateName: "xerk",
    jobTitle: profile.title,
    description: profile.description,
    url: SITE_URL,
    image: `${SITE_URL}${profile.avatar}`,
    email: `mailto:${profile.email}`,
    address: { "@type": "PostalAddress", addressLocality: "Cairo", addressCountry: "EG" },
    sameAs: [...new Set(socials.map((s) => s.href).concat(["https://github.com/xerk"]))],
    worksFor: { "@type": "Organization", name: experience[0]?.company },
    alumniOf: [{ "@type": "CollegeOrUniversity", name: profile.education.school }],
    knowsAbout: Object.values(skills).flat().slice(0, 40),
    knowsLanguage: ["ar", "en"],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "xerk.io",
    publisher: { "@id": `${SITE_URL}/#person` },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE_URL}${it.path}` })) };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
