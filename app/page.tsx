import apps from "../apps.json";

export default function Home() {
  return (
    <main className="registry-main">
      <h1>Craft Web Registry</h1>
      <p><a href="https://github.com/storytold" target="_blank" rel="noreferrer">Storytold</a> Craft apps on the web. Pick one to launch.</p>
      <div className="registry-grid">
        {(apps as { slug: string; title: string; blurb: string; tag: string }[]).map((a) => (
          <a key={a.slug} href={`/apps/${a.slug}`} className="registry-card">
            <h3>{a.title}</h3>
            <p>{a.blurb}</p>
            <small>{a.tag}</small>
          </a>
        ))}
      </div>
    </main>
  );
}
