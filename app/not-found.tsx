import Link from "next/link";
export default function NotFound() {
  return <section className="prose"><h1 className="title">Shiur not found</h1><p>That page doesn&apos;t exist. <Link href="/">Browse all shiurim</Link>.</p></section>;
}
