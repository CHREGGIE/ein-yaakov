import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "L'iluy nishmas Rabbi Shmuel Eliyahu ben Chaim Elchonon Fogelman",
  description: `The learning of this shiur is dedicated by ${SITE.rav} l'iluy nishmas his father, Rabbi Shmuel Eliyahu ben Chaim Elchonon Fogelman, a dedicated educator for more than 60 years.`,
  alternates: { canonical: "/dedication" },
};

export default function Dedication() {
  return (
    <article className="main-col prose dedication-page" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <div className="ded-head">
        <span className="he ded-lein" lang="he">לעילוי נשמת</span>
        <h1 className="title">Rabbi Shmuel Eliyahu ben Chaim Elchonon Fogelman</h1>
        <span className="he ded-name" lang="he">הרב שמואל אליהו בן חיים אלחנן</span>
        <span className="eyebrow">Passed away 19 Elul 5778 · August 30, 2018</span>
      </div>

      <p>Rabbi Shmuel Eliyahu ben Chaim Elchonon Fogelman, a dedicated educator for more than 60 years, passed away on the 19th of Elul, 5778 (August 30, 2018), just eight days shy of his 89th birthday.</p>
      <p>Throughout his remarkable career in Jewish education, from which he never truly retired, Rabbi Fogelman touched countless lives through his warmth, wisdom, and unmistakable sense of humor. He was known for his positive outlook and his ability to encourage rather than criticize, to guide rather than berate. His approach was firm yet gentle, disciplined yet compassionate, and almost always accompanied by a touch of playful humor. These qualities became the hallmarks of his many decades in chinuch and left an enduring impression on generations of students and colleagues.</p>
      <p>After his son, Rabbi Chaim Fogelman, became the Rav of Itchkes, Rabbi Fogelman would frequently daven there. Those fortunate enough to share the shul with him were inspired simply by watching him daven. Every word was pronounced slowly, deliberately, and with love and devotion.</p>

      <figure className="ded-quote">
        <figcaption>Rabbi Chaim fondly recalls:</figcaption>
        <blockquote>
          <p>“As a child, and really throughout my entire life, I remember my father, OB”M, always having a chavrusa and participating in the shiurim at the shul where he davened. He was a living example of the importance of davening with a minyan and learning Torah whenever and wherever possible. He instilled in me not only a love for Torah and davening, but also an appreciation for a good, geshmack vort.”</p>
        </blockquote>
      </figure>

      <p>Rabbi Fogelman’s legacy extends far beyond the many years he devoted to education. It lives on in the students he inspired, the values he instilled, the example he set, and the countless people who were touched by his kindness, warmth, and genuine love for Yiddishkeit.</p>
      <p className="ded-close">May his memory continue to inspire us, and may he have a lichtiker Gan Eden.</p>
      <p className="ded-tnzbh he" lang="he">ת.נ.צ.ב.ה.</p>

      <p className="muted-s"><Link href="/">Learn a shiur</Link> in his memory.</p>
    </article>
  );
}
