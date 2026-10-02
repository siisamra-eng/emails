"use client";

import { useState } from "react";

const ideas = [
  {
    number: "01",
    title: "Built for the long haul",
    angle: "Field-tested proof",
    description:
      "Put the watch through its paces: show the details that earn their place on a hard day, then connect durability to the next adventure.",
    offer: "Free shipping",
    product: "Outlast · 200M / WR / GMT",
    tag: "PROOF LED",
  },
  {
    number: "02",
    title: "One watch. Every shift.",
    angle: "A day-in-the-life",
    description:
      "Follow one wearer from first light to lights out. A practical story about reliable timekeeping that never asks for the spotlight.",
    offer: "Bundle & save",
    product: "Field collection",
    tag: "STORY LED",
  },
  {
    number: "03",
    title: "The kit you count on",
    angle: "Useful gear, no noise",
    description:
      "Pair the watch with everyday-carry essentials in a concise checklist, making the product the tool that ties the kit together.",
    offer: "No offer · editorial",
    product: "Watch + everyday carry",
    tag: "EDUCATIONAL",
  },
];

const campaigns = [
  { subject: "Built to outlast the elements", date: "Sep 24", offer: "Free shipping", clicks: "4.8%", revenue: "$3,842", status: "Strong" },
  { subject: "Your next field-ready essential", date: "Sep 18", offer: "10% off Outlast", clicks: "3.9%", revenue: "$3,115", status: "Good" },
  { subject: "The watch that works as hard as you", date: "Sep 12", offer: "Bundle & save", clicks: "5.2%", revenue: "$4,206", status: "Top email" },
];

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const shared = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  switch (name) {
    case "grid": return <svg {...shared}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>;
    case "spark": return <svg {...shared}><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></svg>;
    case "mail": return <svg {...shared}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>;
    case "bookmark": return <svg {...shared}><path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-3.6L6 21V4.8Z"/></svg>;
    case "settings": return <svg {...shared}><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1-.1 1.8Z" transform="translate(-1 -1)"/></svg>;
    case "arrow": return <svg {...shared}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case "plus": return <svg {...shared}><path d="M12 5v14M5 12h14"/></svg>;
    case "clock": return <svg {...shared}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case "chart": return <svg {...shared}><path d="M4 19V5M4 19h17M8 15l4-4 3 2 5-6"/></svg>;
    case "menu": return <svg {...shared}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
    default: return <svg {...shared}><circle cx="12" cy="12" r="9"/></svg>;
  }
}

export default function Home() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [focus, setFocus] = useState("Surprise me");
  const [generated, setGenerated] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="Carbinox Studio home"><span className="brand-mark">C</span><span className="brand-name">CARBINOX<span>NEWSLETTER STUDIO</span></span></a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          {[["Overview", "grid"], ["Idea studio", "spark"], ["Email library", "mail"], ["Saved ideas", "bookmark"]].map(([label, icon]) => <button key={label} className={`nav-item ${activeNav === label ? "active" : ""}`} onClick={() => setActiveNav(label)}><Icon name={icon}/><span>{label}</span>{label === "Saved ideas" && saved.length > 0 && <small>{saved.length}</small>}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-label">YOUR SOURCES</div>
          <div className="source-row"><span className="source-dot connected"/><span>Klaviyo</span><span className="source-state">Preview</span></div>
          <div className="source-row"><span className="source-dot"/><span>Email library</span><span className="source-count">24</span></div>
          <button className="nav-item settings-link" onClick={() => setActiveNav("Settings")}><Icon name="settings"/><span>Settings</span></button>
          <div className="profile"><div className="avatar">C</div><div><strong>Carbinox team</strong><span>Private workspace</span></div><span className="profile-dots">···</span></div>
        </div>
      </aside>

      <section className="main-area" id="top">
        <header className="topbar"><button className="mobile-menu" aria-label="Open menu"><Icon name="menu"/></button><div className="crumb">Workspace <span>/</span> <strong>{activeNav}</strong></div><div className="topbar-right"><span className="preview-pill"><i/> Preview workspace</span><button className="avatar small-avatar" aria-label="Profile">C</button></div></header>
        <div className="page-content">
          <div className="eyebrow"><span className="yellow-line"/> BUILT TO OUTLAST</div>
          <div className="welcome-row"><div><h1>Good afternoon.</h1><p className="lede">Make the next send your strongest one yet.</p></div><button className="quiet-button" onClick={() => setActiveNav("Email library")}><Icon name="plus" size={16}/> Add an email</button></div>

          <div className="notice"><span className="notice-icon">i</span><p><strong>Preview mode</strong><span>Connect Klaviyo and add your email examples to get ideas grounded in your real campaign history.</span></p><button onClick={() => setActiveNav("Settings")}>Set up sources <Icon name="arrow" size={15}/></button></div>

          <div className="section-heading"><div><span className="section-kicker">YOUR NEXT SEND</span><h2>Find your next angle.</h2><p>Start with a focus, or let the studio find a fresh direction.</p></div><div className="history-chip"><Icon name="clock" size={15}/> Offer rotation <span>Preview</span></div></div>

          <section className="generator-card" aria-label="Newsletter idea generator">
            <div className="generator-top"><div className="generator-symbol"><Icon name="spark" size={20}/></div><div><strong>Idea studio</strong><span>CONCEPTS BUILT FROM WHAT WORKS</span></div><span className="step-label">01 <i/> 02 <i/> 03</span></div>
            <div className="generator-controls"><label>What should this email focus on?<select value={focus} onChange={event => setFocus(event.target.value)}><option>Surprise me</option><option>Product proof</option><option>Education</option><option>Customer story</option><option>Seasonal moment</option></select></label><label>Which product?<select defaultValue="Any watch"><option>Any watch</option><option>Outlast</option><option>Field collection</option><option>Everyday carry</option></select></label><button className="generate-button" onClick={() => setGenerated(true)}><Icon name="spark" size={17}/>{generated ? "Refresh ideas" : "Generate ideas"}<Icon name="arrow" size={16}/></button></div>
            <div className="generator-foot"><span><span className="tiny-check">✓</span> Considers recent offers</span><span><span className="tiny-check">✓</span> Learns from your best emails</span><span className="foot-note">You choose what to send</span></div>
          </section>

          <div className="ideas-heading"><div><span className="section-kicker">{generated ? "FRESH DIRECTIONS" : "STARTER DIRECTIONS"}</span><h2>{generated ? "Three angles to explore." : "A few directions to get moving."}</h2></div><button className="text-button" onClick={() => setShowAll(value => !value)}>{showAll ? "Show less" : "See all ideas"}<Icon name="arrow" size={15}/></button></div>
          <div className="idea-grid">{(showAll ? [...ideas, ...ideas.slice(0, 1)] : ideas).map((idea, index) => <article className="idea-card" key={`${idea.number}-${index}`}><div className="idea-card-top"><span className="idea-number">{idea.number}</span><span className="idea-tag">{idea.tag}</span><button className={`save-button ${saved.includes(idea.title) ? "is-saved" : ""}`} aria-label={saved.includes(idea.title) ? "Remove saved idea" : "Save idea"} onClick={() => setSaved(current => current.includes(idea.title) ? current.filter(item => item !== idea.title) : [...current, idea.title])}><Icon name="bookmark" size={17}/></button></div><span className="idea-angle">{focus === "Surprise me" ? idea.angle : focus}</span><h3>{idea.title}</h3><p>{idea.description}</p><div className="idea-meta"><span><b>OFFER</b>{idea.offer}</span><span><b>PRODUCT</b>{idea.product}</span></div><button className="outline-button" onClick={() => setSaved(current => current.includes(idea.title) ? current : [...current, idea.title])}>{saved.includes(idea.title) ? "Saved to your ideas" : "Build this idea"}<Icon name="arrow" size={15}/></button></article>)}</div>

          <section className="campaign-section"><div className="campaign-heading"><div><span className="section-kicker">CAMPAIGN PULSE</span><h2>Recent sends</h2></div><button className="text-button" onClick={() => setActiveNav("Email library")}>View campaign history <Icon name="arrow" size={15}/></button></div><div className="campaign-table-wrap"><table><thead><tr><th>CAMPAIGN</th><th>SENT</th><th>OFFER</th><th><Icon name="chart" size={14}/> CLICKS</th><th>REVENUE</th><th>READ</th></tr></thead><tbody>{campaigns.map((campaign, index) => <tr key={campaign.subject}><td><span className={`campaign-icon ${index === 2 ? "top" : ""}`}><Icon name="mail" size={15}/></span><strong>{campaign.subject}</strong></td><td>{campaign.date}</td><td><span className="offer-pill">{campaign.offer}</span></td><td className="metric">{campaign.clicks}</td><td className="metric">{campaign.revenue}</td><td><span className={`result ${index === 2 ? "best" : ""}`}>{campaign.status}</span></td></tr>)}</tbody></table><div className="table-demo-note">Example campaign data · Connect Klaviyo to see your real results</div></div></section>

          <footer className="footer"><span>CARBINOX <b>·</b> TACTICAL BY DESIGN</span><span>Newsletter Studio <b>·</b> Early workspace</span></footer>
        </div>
      </section>
    </main>
  );
}
