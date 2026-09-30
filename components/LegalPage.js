import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { getLegalPage } from "../lib/db";

export const revalidate = 60;

// Shared renderer for the four legal pages.
export default async function LegalPage({ slug }) {
  const page = await getLegalPage(slug);
  if (!page) notFound();

  return (
    <>
      <SiteHeader />
      <section className="section">
        <div className="container" style={{ maxWidth: 820 }}>
          <span className="eyebrow">Legal</span>
          <h1 className="h2" style={{ marginBottom: 8 }}>{page.title}</h1>
          <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 30 }}>
            Last updated: {page.last_updated_at
              ? new Date(page.last_updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
              : "—"}
          </p>
          <div className="legal-body">
            <ReactMarkdown>{page.body || ""}</ReactMarkdown>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
