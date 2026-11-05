import apps from "../apps.json";

export default function Home() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <h1>Craft Web Registry</h1>
      <p>Storytold Craft apps on the web. Pick one to launch.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
        {(apps as { slug: string; title: string; blurb: string; tag: string }[]).map((a) => (
          <a key={a.slug} href={`/apps/${a.slug}`} style={{ border: "1px solid #333", borderRadius: 8, padding: 16, textDecoration: "none" }}>
            <h3 style={{ margin: "0 0 8px" }}>{a.title}</h3>
            <p style={{ margin: "0 0 8px", color: "#888" }}>{a.blurb}</p>
            <small style={{ color: "#666" }}>{a.tag}</small>
          </a>
        ))}
      </div>
    </main>
  );
}
