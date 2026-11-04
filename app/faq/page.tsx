import type { Metadata } from "next";
import Link from "next/link";
import { masechtos, newest } from "@/lib/catalog";
import { SITE } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
import { Listen } from "@/components/Listen";

export const metadata: Metadata = {
  title: "Ein Yaakov: questions and answers",
  description: "What Ein Yaakov is, who compiled it, how it differs from learning Gemara, why it is learned between Mincha and Maariv, and how to listen to the shiur with Rabbi Fogelman.",
  alternates: { canonical: "/faq" },
};

type QA = { q: string; a: string; more?: React.ReactNode };

export default function Faq() {
  const latest = newest()[0];
  const now = latest ? masechtos().find((m) => m.slug === latest.masechta) : undefined;
  const items: QA[] = [
    {
      q: "What is Ein Yaakov?",
      a: "Ein Yaakov is a collection of the aggados of the Talmud: the stories, parables and teachings found throughout the Gemara, gathered masechta by masechta so they can be learned on their own. It was compiled by Rabbi Yaakov ibn Chaviv, one of the scholars expelled from Spain in 1492, and completed after his passing by his son, Rabbi Levi ibn Chaviv.",
    },
    {
      q: "How is Ein Yaakov different from learning Gemara?",
      a: "Ein Yaakov leaves out the Gemara's halachic discussion and keeps its aggadah, in the order it appears in each masechta. The text is the Gemara's own, printed with commentaries that explain the aggados, so you learn the Gemara's teachings about Hashem, the soul and how a person should live, without the legal give-and-take around them.",
    },
    {
      q: "Why is Ein Yaakov learned between Mincha and Maariv?",
      a: "For generations, shuls have held an Ein Yaakov shiur in the time between Mincha and Maariv, when people are already gathered and a short, self-contained piece of aggadah fits. In Chabad, the Alter Rebbe asks in Iggeres HaKodesh (Epistle 23) that chassidim learn Ein Yaakov together in that time every weekday.",
    },
    {
      q: "Is the shiur suitable for beginners?",
      a: "Yes. Rabbi Fogelman reads the Gemara inside and explains it with the commentaries, so you can follow without background. You can follow along in any edition of Ein Yaakov, or just listen.",
    },
    {
      q: "Which masechta is the shiur learning now?",
      a: now ? `The shiur is learning Masechta ${now.name} (${now.he}). Every shiur on it is in order on the ${now.name} page.` : "Each masechta's shiurim are listed in order on its own page.",
      more: now ? <Link href={`/${now.slug}`}>All shiurim on {now.name}</Link> : null,
    },
    {
      q: "How do I find the shiur on a specific daf?",
      a: `Type the masechta and daf into the search box on the home page, for example "${now?.name ?? "Kesuvos"} 17a", or use "Go to daf" on a masechta's page. Both Ashkenazi and Sephardi spellings work, such as Kesuvos or Ketubot.`,
    },
    {
      q: "How can I listen to the shiur?",
      a: "On this site, or as a podcast on Spotify, Apple Podcasts and other podcast apps. A new shiur comes out every week.",
      more: <Listen />,
    },
    {
      q: "When and where is the shiur given live?",
      a: `${SITE.rav} gives the shiur ${SITE.when} at ${SITE.shul}. Everyone is welcome.`,
    },
  ];
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({ "@type": "Question", name: it.q, acceptedAnswer: { "@type": "Answer", text: it.a } })),
  };
  return (
    <section className="main-col prose faq" style={{ maxWidth: "46rem" }}>
      <JsonLd data={ld} />
      <span className="eyebrow">Questions and answers</span>
      <h1 className="title">About Ein Yaakov and the shiur</h1>
      {items.map((it) => (
        <div key={it.q} className="qa">
          <h2>{it.q}</h2>
          <p>{it.a}</p>
          {it.more}
        </div>
      ))}
    </section>
  );
}
