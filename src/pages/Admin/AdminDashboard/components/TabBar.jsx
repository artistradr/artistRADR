export default function TabBar({ tab, setTab, openCount }) {
  const tabs = [
    { id: "posts", label: "Blog Posts" },
    { id: "submissions", label: `Playlist Submissions${openCount > 0 ? ` (${openCount})` : ""}` },
  ];

  return (
    <div className="adm-scroll-x" style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          className="adm-tab"
          onClick={() => setTab(id)}
          style={{ background: tab === id ? "var(--color-red)" : "transparent", borderColor: tab === id ? "var(--color-red)" : "rgba(255,255,255,0.12)", color: tab === id ? "white" : "rgba(255,255,255,0.5)" }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}