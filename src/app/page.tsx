"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { CatalogCategory, CatalogProduct, CatalogResponse } from "@/lib/products";
import type { CampaignPerformance } from "@/lib/campaigns";

type Idea = {
  title: string;
  angleKey: string;
  angle: string;
  subject: string;
  preheader: string;
  body: string;
  cta: string;
  performanceRationale: string;
};

type CampaignResponse = {
  connected: boolean;
  source: string;
  campaigns: CampaignPerformance[];
  recentCampaigns?: Array<{ id: string; name: string; sentAt: string }>;
  message: string;
};

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const shared = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  switch (name) {
    case "grid": return <svg {...shared}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>;
    case "spark": return <svg {...shared}><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></svg>;
    case "mail": return <svg {...shared}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>;
    case "arrow": return <svg {...shared}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case "chart": return <svg {...shared}><path d="M4 19V5M4 19h17M8 15l4-4 3 2 5-6"/></svg>;
    case "clock": return <svg {...shared}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case "check": return <svg {...shared}><path d="m5 12 4 4L19 6"/></svg>;
    case "copy": return <svg {...shared}><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>;
    case "menu": return <svg {...shared}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
    default: return <svg {...shared}><circle cx="12" cy="12" r="9"/></svg>;
  }
}

export default function Home() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [accessConfigured, setAccessConfigured] = useState(true);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [focus, setFocus] = useState("Performance-led mix");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("any");
  const [verifiedOffer, setVerifiedOffer] = useState("");
  const [verifiedFacts, setVerifiedFacts] = useState("");
  const [campaigns, setCampaigns] = useState<CampaignPerformance[]>([]);
  const [recentCampaignNames, setRecentCampaignNames] = useState<string[]>([]);
  const [klaviyoConnected, setKlaviyoConnected] = useState(false);
  const [campaignSource, setCampaignSource] = useState("audited-top-50");
  const [campaignMessage, setCampaignMessage] = useState("");
  const [campaignLoading, setCampaignLoading] = useState(true);
  const [generatedIdeas, setGeneratedIdeas] = useState<Idea[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [copiedIdea, setCopiedIdea] = useState<number | null>(null);
  const [emailCount, setEmailCount] = useState(50);

  useEffect(() => {
    let active = true;
    fetch("/api/auth")
      .then((response) => response.json() as Promise<{ authenticated: boolean; configured: boolean }>)
      .then((result) => {
        if (!active) return;
        setAccessConfigured(result.configured);
        setAuthenticated(result.authenticated);
      })
      .catch(() => { if (active) { setAccessConfigured(false); setAuthenticated(false); } });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (authenticated !== true) return;
    let active = true;

    fetch("/api/products")
      .then(async (response) => {
        const result = await response.json() as CatalogResponse & { error?: string };
        if (!response.ok) throw new Error(result.error || "Couldn't load Carbinox products.");
        return result;
      })
      .then((result) => { if (active) setProducts(result.products); })
      .catch((error: unknown) => { if (active) setCatalogError(error instanceof Error ? error.message : "Couldn't load Carbinox products."); })
      .finally(() => { if (active) setCatalogLoading(false); });

    fetch("/api/campaigns")
      .then(async (response) => {
        const result = await response.json() as CampaignResponse;
        if (!response.ok) throw new Error(result.message || "Couldn't load email performance.");
        return result;
      })
      .then((result) => {
        if (!active) return;
        setCampaigns(result.campaigns);
        setRecentCampaignNames(result.recentCampaigns?.map((campaign) => campaign.name) ?? []);
        setKlaviyoConnected(result.connected);
        setCampaignSource(result.source);
        setCampaignMessage(result.message);
        setEmailCount(result.campaigns.length);
      })
      .catch((error: unknown) => { if (active) setCampaignMessage(error instanceof Error ? error.message : "Couldn't load campaign performance."); })
      .finally(() => { if (active) setCampaignLoading(false); });

    return () => { active = false; };
  }, [authenticated]);

  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? null;
  const categories: CatalogCategory[] = ["Watches", "Watch accessories", "Gear & bundles"];
  const formatPrice = (price: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);
  const money = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
  const avgTopRevenuePerRecipient = useMemo(() => {
    const top = campaigns.slice(0, 10).filter((campaign) => campaign.delivered > 0);
    return top.length ? top.reduce((sum, campaign) => sum + campaign.revenue / campaign.delivered, 0) / top.length : 0;
  }, [campaigns]);

  async function generate() {
    setGenerating(true);
    setGenerationError("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focus, product: selectedProduct, verifiedOffer, verifiedFacts, recentCampaignNames, campaignPerformance: campaigns }),
      });
      const result = await response.json() as { ideas?: { ideas?: Idea[] } | Idea[]; error?: string };
      if (!response.ok) throw new Error(result.error || "Couldn't generate ideas.");
      const payload = result.ideas;
      const ideas = Array.isArray(payload) ? payload : payload?.ideas;
      if (!ideas?.length) throw new Error("No ideas came back. Please try again.");
      setGeneratedIdeas(ideas);
      setActiveNav("Idea studio");
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "Couldn't generate ideas.");
    } finally {
      setGenerating(false);
    }
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: loginPassword }),
      });
      const result = await response.json() as { error?: string; authenticated?: boolean };
      if (!response.ok || !result.authenticated) throw new Error(result.error || "Sign in failed.");
      setAuthenticated(true);
      setLoginPassword("");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Sign in failed.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function copyIdea(idea: Idea, index: number) {
    const text = `Subject: ${idea.subject}\nPreheader: ${idea.preheader || "(blank)"}\n\n${idea.body}\n\n${idea.cta}`;
    await navigator.clipboard.writeText(text);
    setCopiedIdea(index);
    window.setTimeout(() => setCopiedIdea(null), 1800);
  }

  const visibleCampaigns = activeNav === "Email library" ? campaigns : campaigns.slice(0, 8);

  if (authenticated === null) {
    return <main className="auth-screen"><div className="auth-card"><span className="brand-mark">C</span><strong>Checking workspace access…</strong></div></main>;
  }

  if (!authenticated) {
    return <main className="auth-screen"><form className="auth-card" onSubmit={signIn}><span className="brand-mark">C</span><div><span className="section-kicker">CARBINOX NEWSLETTER STUDIO</span><h1>Private workspace.</h1><p>{accessConfigured ? "Enter your workspace password to continue." : "Workspace access is not configured yet. Add APP_PASSWORD and APP_SESSION_SECRET on the server."}</p></div><label>WORKSPACE PASSWORD<input type="password" autoComplete="current-password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} disabled={!accessConfigured} required/></label>{loginError && <span className="login-error" role="alert">{loginError}</span>}<button className="generate-button" type="submit" disabled={!accessConfigured || loginLoading}>{loginLoading ? "Signing in…" : "Open workspace"}<Icon name="arrow" size={16}/></button></form></main>;
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="Carbinox Studio home"><span className="brand-mark">C</span><span className="brand-name">CARBINOX<span>NEWSLETTER STUDIO</span></span></a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          {[["Overview", "grid"], ["Idea studio", "spark"], ["Email library", "mail"]].map(([label, icon]) => <button key={label} className={`nav-item ${activeNav === label ? "active" : ""}`} onClick={() => setActiveNav(label)}><Icon name={icon}/><span>{label}</span></button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-label">PERFORMANCE SOURCES</div>
          <div className="source-row"><span className={`source-dot ${klaviyoConnected ? "connected" : ""}`}/><span>Klaviyo</span><span className="source-state">{klaviyoConnected ? "Live" : "Setup needed"}</span></div>
          <div className="source-row"><span className="source-dot connected"/><span>Audited winners</span><span className="source-count">{emailCount}</span></div>
          <div className="sidebar-setup"><strong>Performance only</strong><span>Drafts are grounded in campaign results. There is no favorite-email or subjective rating input.</span></div>
          <div className="profile"><div className="avatar">C</div><div><strong>Carbinox team</strong><span>Private workspace</span></div></div>
        </div>
      </aside>

      <section className="main-area" id="top">
        <header className="topbar"><button className="mobile-menu" aria-label="Open menu"><Icon name="menu"/></button><div className="crumb">Workspace <span>/</span> <strong>{activeNav}</strong></div><div className="topbar-right"><span className={`preview-pill ${klaviyoConnected ? "live" : ""}`}><i/> {klaviyoConnected ? "Live Klaviyo data" : "Audited performance data"}</span><button className="avatar small-avatar" aria-label="Carbinox workspace">C</button></div></header>
        <div className="page-content">
          <div className="eyebrow"><span className="yellow-line"/> BUILT TO OUTLAST</div>
          <div className="welcome-row"><div><h1>{activeNav === "Email library" ? "Performance library." : activeNav === "Idea studio" ? "Build the next winner." : "Good afternoon."}</h1><p className="lede">{activeNav === "Email library" ? "Campaigns ranked by attributed revenue, with efficiency metrics beside them." : "Use what performed to shape the next send."}</p></div><a className="quiet-button" href="#idea-studio"><Icon name="spark" size={16}/> Generate copy</a></div>

          <div className={`notice ${klaviyoConnected ? "notice-live" : ""}`}><span className="notice-icon">{klaviyoConnected ? <Icon name="check" size={13}/> : "i"}</span><p><strong>{klaviyoConnected ? "Klaviyo is connected" : "Using the reviewed winner set"}</strong><span>{campaignMessage || "The audited top 50 emails inform performance-led generation. Live data loads when KLAVIYO_PRIVATE_API_KEY is configured on the server."}</span></p><span className="readonly-badge">READ ONLY</span></div>

          <div className="section-heading"><div><span className="section-kicker">PERFORMANCE SNAPSHOT</span><h2>What has earned attention.</h2><p>Ranked by attributed revenue; efficiency metrics help keep audience size in context.</p></div><div className="history-chip"><Icon name="clock" size={15}/> {klaviyoConnected ? "Last 365 days" : "2-year audit"}<span>{campaignLoading ? "…" : `${campaigns.length} emails`}</span></div></div>

          <div className="stat-grid">
            <article className="stat-card"><span>TOP ATTRIBUTED REVENUE</span><strong>{campaigns[0] ? money(campaigns[0].revenue) : "—"}</strong><small>{campaigns[0]?.name ?? "Waiting for campaign data"}</small></article>
            <article className="stat-card"><span>TOP SEND CLICK RATE</span><strong>{campaigns[0] ? `${(Math.max(...campaigns.map((item) => item.clickRate)) * 100).toFixed(2)}%` : "—"}</strong><small>Unique clicks ÷ delivered emails</small></article>
            <article className="stat-card"><span>TOP 10 AVG. REVENUE / RECIPIENT</span><strong>{avgTopRevenuePerRecipient ? `$${avgTopRevenuePerRecipient.toFixed(3)}` : "—"}</strong><small>Normalizes for send size</small></article>
          </div>

          <section className="generator-card" id="idea-studio" aria-label="Performance-led newsletter copy generator">
            <div className="generator-top"><div className="generator-symbol"><Icon name="spark" size={20}/></div><div><strong>Performance-led idea studio</strong><span>THREE DISTINCT ANGLES · FULL EMAIL COPY</span></div><span className="step-label">RESULTS FIRST</span></div>
            <div className="generator-controls generator-controls-expanded">
              <label>Generation focus<select value={focus} onChange={(event) => setFocus(event.target.value)}><option>Performance-led mix</option><option>Product proof</option><option>Offer and urgency</option><option>Trade-in value</option><option>Early access</option><option>Seasonal value</option></select></label>
              <label>Product<select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}><option value="any">Choose from performance patterns</option>{categories.map((category) => <optgroup key={category} label={category}>{products.filter((product) => product.category === category).map((product) => <option key={product.id} value={product.id} disabled={!product.available}>{product.title}{product.price !== null ? ` · ${formatPrice(product.price)}` : ""}{product.available ? "" : " · Sold out"}</option>)}</optgroup>)}{catalogLoading && <option disabled>Loading store catalog…</option>}</select></label>
              <label>Verified offer <span className="optional-label">optional</span><input value={verifiedOffer} onChange={(event) => setVerifiedOffer(event.target.value)} placeholder="e.g. 15% off Edge through Sunday"/></label>
              <label>Verified product details <span className="optional-label">optional</span><input value={verifiedFacts} onChange={(event) => setVerifiedFacts(event.target.value)} placeholder="Only facts you have confirmed; no claims will be invented"/></label>
              <button className="generate-button" onClick={generate} disabled={generating || catalogLoading}><Icon name="spark" size={17}/>{generating ? "Using performance data…" : "Generate 3 concepts"}<Icon name="arrow" size={16}/></button>
            </div>
            <div className="generator-foot"><span><span className="tiny-check">✓</span>Ranks by attributed revenue and efficiency</span><span><span className="tiny-check">✓</span>{catalogLoading ? "Loading products…" : catalogError ? "Store catalog unavailable" : `${products.length} current catalog products`}</span><span className="foot-note">{klaviyoConnected && recentCampaignNames.length ? `Checks ${recentCampaignNames.length} recent sent campaign names` : klaviyoConnected ? "Recent offer rotation unavailable" : "Live offer rotation needs a Klaviyo key"}</span></div>
            {klaviyoConnected && recentCampaignNames.length > 0 && <div className="rotation-status"><b>RECENT SENT CAMPAIGNS · USED FOR OFFER ROTATION</b><div>{recentCampaignNames.slice(0, 5).map((name, index) => <span key={`${name}-${index}`}>{name}</span>)}</div></div>}
            {generationError && <div className="generation-error" role="alert">{generationError}</div>}
          </section>

          {generatedIdeas.length > 0 && <section className="generated-section"><div className="ideas-heading"><div><span className="section-kicker">COPY DRAFTS</span><h2>Three performance-grounded concepts.</h2></div><span className="draft-label">DRAFT · REVIEW BEFORE SENDING</span></div><div className="generated-grid">{generatedIdeas.map((idea, index) => <article className="generated-card" key={`${idea.title}-${index}`}><div className="generated-card-head"><span className="idea-tag">{idea.angle}</span><button className="copy-button" onClick={() => void copyIdea(idea, index)}><Icon name={copiedIdea === index ? "check" : "copy"} size={14}/>{copiedIdea === index ? "Copied" : "Copy"}</button></div><h3>{idea.title}</h3><div className="copy-field"><b>SUBJECT</b><span>{idea.subject}</span></div><div className="copy-field"><b>PREHEADER</b><span>{idea.preheader || <em>Leave blank</em>}</span></div><div className="copy-body">{idea.body}</div><div className="copy-cta">{idea.cta}</div><div className="performance-rationale"><b>WHY THIS ANGLE</b><span>{idea.performanceRationale}</span></div></article>)}</div></section>}

          <section className="campaign-section"><div className="campaign-heading"><div><span className="section-kicker">{campaignSource === "klaviyo-live" ? "LIVE KLAVIYO PERFORMANCE" : "TWO-YEAR KLAVIYO AUDIT"}</span><h2>{activeNav === "Email library" ? "Ranked email library" : "Top performing campaigns"}</h2></div><button className="text-button" onClick={() => setActiveNav(activeNav === "Email library" ? "Overview" : "Email library")}>{activeNav === "Email library" ? "Back to overview" : "View all campaigns"}<Icon name="arrow" size={15}/></button></div><div className="campaign-table-wrap"><table><thead><tr><th>RANK · CAMPAIGN</th><th>SENT</th><th>UNIQUE CLICKS</th><th>CLICK RATE</th><th>DELIVERED</th><th>ATTRIBUTED REVENUE</th><th>REV. / RECIPIENT</th></tr></thead><tbody>{visibleCampaigns.map((campaign) => <tr key={`${campaign.id}-${campaign.rank}`}><td><span className={`campaign-icon ${campaign.rank <= 3 ? "top" : ""}`}><span>#{campaign.rank}</span></span><strong>{campaign.name}</strong></td><td>{campaign.sentAt}</td><td className="metric">{campaign.uniqueClicks.toLocaleString("en-US")}</td><td className="metric">{(campaign.clickRate * 100).toFixed(2)}%</td><td className="metric">{campaign.delivered.toLocaleString("en-US")}</td><td className="metric">{money(campaign.revenue)}</td><td className="metric">{campaign.delivered ? `$${(campaign.revenue / campaign.delivered).toFixed(3)}` : "—"}</td></tr>)}</tbody></table>{!campaigns.length && <div className="empty-table">{campaignLoading ? "Loading Klaviyo campaign results…" : "No campaign performance data is available."}</div>}<div className="table-demo-note">Revenue ranking can favor larger audiences. Revenue per recipient and click rate are shown as efficiency context; rankings do not establish causation.</div></div></section>

          <footer className="footer"><span>CARBINOX <b>·</b> TACTICAL BY DESIGN</span><span>Performance-led Newsletter Studio <b>·</b> Read only</span></footer>
        </div>
      </section>
    </main>
  );
}
