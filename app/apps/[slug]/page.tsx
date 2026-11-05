import { notFound } from "next/navigation";
import apps from "../../../apps.json";

type App = { slug: string; title: string; tag: string };

export function generateStaticParams() {
  return (apps as App[]).map((a) => ({ slug: a.slug }));
}

export default function AppPage({ params, searchParams }: { params: { slug: string }; searchParams?: { webgl?: string } }) {
  const app = (apps as App[]).find((a) => a.slug === params.slug);
  if (!app) notFound();
  const src = `/bundles/${app.slug}/index.html${searchParams?.webgl !== undefined ? "?webgl" : ""}`;
  return (
    <main style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#101216" }}>
      <header className="appbar">
        <a href="/">← All apps</a>
        <strong>{app.title}</strong>
        <small>{app.tag}</small>
        <a href={src} className="spacer">Reload</a>
      </header>
      <iframe src={src} title={app.title} allow="fullscreen; clipboard-read; clipboard-write" allowFullScreen style={{ flex: 1, width: "100%", border: 0 }} />
    </main>
  );
}
