import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
/* ============================================================
   CallHistoryPage — SOT design system
   ============================================================ */


/* ---------- Lucide icon helper (matches dashboard) ---------- */
function Icon({ name, size = 16, color = "currentColor", strokeWidth = 1.75, style }) {
  const ref = useRef(null);
  useEffect(() => {
    if (window.lucide && ref.current) {
      ref.current.innerHTML = "";
      const el = document.createElement("i");
      el.setAttribute("data-lucide", name);
      ref.current.appendChild(el);
      window.lucide.createIcons({
        attrs: { width: size, height: size, "stroke-width": strokeWidth, stroke: color },
        nameAttr: "data-lucide",
        elements: [el],
      });
    }
  }, [name, size, strokeWidth, color]);
  return (
    <span
      ref={ref}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        flex: "none",
        color,
        ...style,
      }}
    />
  );
}

/* ---------- Tag primitive ---------- */
function Tag({ label, value, tone = "default" }) {
  const cls = `sot-bracket-tag${tone !== "default" ? " " + tone : ""}`;
  return (
    <span className={cls}>
      {label}
      {value != null && (
        <>
          : <span className="v">{value}</span>
        </>
      )}
    </span>
  );
}

/* ---------- Status pill ---------- */
function StatusPill({ status }) {
  const map = {
    qualified: { color: "var(--sot-verify)", soft: "var(--sot-verify-soft)", label: "QUALIFIED" },
    pending:   { color: "var(--sot-warn)",   soft: "var(--sot-warn-soft)",   label: "PENDING" },
    rejected:  { color: "var(--sot-alert)",  soft: "var(--sot-alert-soft)",  label: "REJECTED" },
  };
  const s = map[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 8px",
        background: s.soft,
        border: `1px solid ${s.color}`,
        color: s.color,
        fontFamily: "var(--sot-font-mono)",
        fontSize: 10,
        letterSpacing: "var(--sot-tracking-tag)",
        borderRadius: "var(--sot-r-pill)",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 5, height: 5, background: s.color, borderRadius: 999 }} />
      {s.label}
    </span>
  );
}

/* ---------- Quality bars (replaces stars per SOT — no emoji) ---------- */
function QualityBars({ score, size = "sm" }) {
  const w = size === "lg" ? 14 : 10;
  const h = size === "lg" ? 6 : 4;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <div style={{ display: "flex", gap: 2 }}>
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            style={{
              width: w,
              height: h,
              background:
                i < Math.round(score / 2)
                  ? score >= 7
                    ? "var(--sot-verify)"
                    : score >= 4
                    ? "var(--sot-warn)"
                    : "var(--sot-alert)"
                  : "var(--sot-line-strong)",
            }}
          />
        ))}
      </div>
      <span
        className="sot-mono"
        style={{
          fontSize: size === "lg" ? 13 : 11,
          color: "var(--sot-fg-2)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {score}/10
      </span>
    </div>
  );
}

/* ---------- Pulse dot ---------- */
function PulseDot({ color = "var(--sot-alert)", size = 7 }) {
  return (
    <span style={{ position: "relative", width: size, height: size, display: "inline-block", flex: "none" }}>
      <span style={{ position: "absolute", inset: 0, background: color, borderRadius: 999 }} />
      <span
        style={{
          position: "absolute",
          inset: 0,
          background: color,
          borderRadius: 999,
          animation: "sotPing 1.8s cubic-bezier(0,0,.2,1) infinite",
          opacity: 0.6,
        }}
      />
    </span>
  );
}

/* ============================================================
   MOCK DATA — 60 calls
   ============================================================ */
const FIRST_NAMES = ["John", "Sara", "Daniel", "Maya", "Hiro", "Aisha", "Liam", "Priya", "Marcus", "Elena",
                    "Theo", "Nina", "Owen", "Yui", "Carlos", "Zara", "Ben", "Anika", "Jonas", "Mira"];
const LAST_NAMES  = ["Smith", "Lee", "Rivera", "Patel", "Tanaka", "Khan", "Park", "Johansson", "Foster", "Walker",
                     "Ng", "Diaz", "Cohen", "Murphy", "Becker", "Vasquez", "Sato", "Cole", "Hassan", "Reid"];
const COMPANIES   = ["Tech Corp", "Northwind", "Helios Mfg.", "Arcadia Labs", "Cascade Energy", "Ferro Logistics",
                     "Polaris Health", "Quill & Co.", "Vector Studio", "Greenfield Power"];
const INTENTS     = ["Lead Qualify", "Support", "Book Demo", "Pricing", "Cancellation", "Spam", "Renewal"];
const SENTIMENTS  = ["POSITIVE", "NEUTRAL", "POSITIVE", "POSITIVE", "NEUTRAL", "NEGATIVE", "POSITIVE"];

function seedRng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function generateCalls(n = 60) {
  const rng = seedRng(42);
  const now = new Date(2026, 4, 24, 16, 30); // May 24 2026, 4:30 PM
  return Array.from({ length: n }).map((_, i) => {
    const minsAgo = Math.floor(i * (rng() * 14 + 4) + rng() * 10);
    const t = new Date(now.getTime() - minsAgo * 60000);
    const fn = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    const ln = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const intent = INTENTS[Math.floor(rng() * INTENTS.length)];
    const quality =
      intent === "Spam"
        ? Math.floor(rng() * 3) + 1
        : intent === "Cancellation"
        ? Math.floor(rng() * 4) + 3
        : Math.floor(rng() * 6) + 5;
    const status =
      intent === "Spam"
        ? "rejected"
        : quality >= 7
        ? "qualified"
        : quality >= 4
        ? "pending"
        : "rejected";
    const durSec = Math.floor(rng() * 320) + 20;
    const phoneTail = (100 + i).toString().padStart(4, "0");
    const sentiment = SENTIMENTS[Math.floor(rng() * SENTIMENTS.length)];
    const confidence = Math.floor(rng() * 25) + 72;
    const crm = rng() > 0.2 ? "SYNCED" : "QUEUED";
    const followup =
      status === "qualified"
        ? rng() > 0.3
          ? "SCHEDULED"
          : "PENDING"
        : status === "pending"
        ? "REVIEW"
        : "NONE";
    return {
      id: `CALL_${String(i + 1001).padStart(5, "0")}`,
      time: t,
      phone: "+1-555-" + phoneTail,
      name: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@${COMPANIES[Math.floor(rng() * COMPANIES.length)]
        .toLowerCase()
        .replace(/[^a-z]/g, "")}.com`,
      company: COMPANIES[Math.floor(rng() * COMPANIES.length)],
      duration: durSec,
      quality,
      intent,
      status,
      sentiment,
      confidence,
      crm,
      followup,
      transcript: buildTranscript(intent, fn),
    };
  });
}

function buildTranscript(intent, fn) {
  const base = [
    { speaker: "AGENT", text: `Hi, this is Aria from the demo team — am I catching you at an OK time?` },
  ];
  if (intent === "Lead Qualify" || intent === "Book Demo") {
    return [
      ...base,
      { speaker: "CALLER", text: `Yeah, ${fn} here — calling about the voice-AI product, saw the demo on your site.` },
      { speaker: "AGENT", text: `Great. Quick question — are you evaluating this for inbound, outbound, or both?` },
      { speaker: "CALLER", text: `Mostly inbound. We get a lot of leads at night that just go to voicemail.` },
      { speaker: "AGENT", text: `Got it. Roughly how many inbound calls per week?` },
      { speaker: "CALLER", text: `Probably 600 to 800 in a busy week.` },
      { speaker: "AGENT", text: `Perfect — I'd like to put 20 minutes on the calendar with a solutions engineer. Does Thursday afternoon work?` },
      { speaker: "CALLER", text: `Thursday after 2pm Eastern is fine.` },
      { speaker: "AGENT", text: `Booked. You'll get a confirmation email in the next minute.` },
    ];
  }
  if (intent === "Support") {
    return [
      ...base,
      { speaker: "CALLER", text: `I'm having trouble with the call routing — calls keep dropping at the handoff.` },
      { speaker: "AGENT", text: `I can see two failed handoffs on your account in the last hour. Are you on the v2.3 SIP trunk?` },
      { speaker: "CALLER", text: `Yes — we switched last week.` },
      { speaker: "AGENT", text: `OK, this is a known issue with 2.3.1. I'll open a ticket and escalate to engineering. You'll have an update by end of day.` },
    ];
  }
  if (intent === "Spam") {
    return [
      ...base,
      { speaker: "CALLER", text: `[silence]` },
      { speaker: "AGENT", text: `Hello? Is anyone there?` },
      { speaker: "CALLER", text: `[disconnect]` },
    ];
  }
  if (intent === "Pricing") {
    return [
      ...base,
      { speaker: "CALLER", text: `Just want to understand the pricing tiers — saw three on the website but no numbers.` },
      { speaker: "AGENT", text: `Sure. Pricing scales by call volume. Mid-tier starts at $1,800/mo for up to 1,000 calls. Want me to email a one-pager?` },
      { speaker: "CALLER", text: `Please.` },
    ];
  }
  return [
    ...base,
    { speaker: "CALLER", text: `Following up on my account renewal — got the notice yesterday.` },
    { speaker: "AGENT", text: `I can see your renewal is due in 14 days. Would you like me to transfer you to your account manager?` },
    { speaker: "CALLER", text: `Yes please.` },
  ];
}

const ALL_CALLS = generateCalls(60);

/* ---------- Format helpers ---------- */
const fmtTime = (d) =>
  d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
const fmtDuration = (sec) => {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};
const ymd = (d) => d.toISOString().slice(0, 10);

/* ============================================================
   HEADER
   ============================================================ */
function PageHeader({ onRefresh, refreshing }) {
  return (
    <header
      style={{
        height: 64,
        background: "var(--sot-surface-1)",
        borderBottom: "1px solid var(--sot-line)",
        display: "flex",
        alignItems: "center",
        padding: "0 var(--sot-s-6)",
        gap: "var(--sot-s-5)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sot-s-3)" }}>
        <div
          style={{
            width: 32,
            height: 32,
            border: "1px solid var(--sot-line-strong)",
            background: "var(--sot-ink)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <Icon name="audio-waveform" size={18} color="var(--sot-fg-1)" />
          <span
            style={{
              position: "absolute",
              top: -1,
              right: -1,
              width: 6,
              height: 6,
              background: "var(--sot-construction)",
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
          <span
            style={{
              fontFamily: "var(--sot-font-sans)",
              fontWeight: 800,
              fontSize: 15,
              letterSpacing: "-0.01em",
              color: "var(--sot-fg-1)",
            }}
          >
            Voice AI Agent
          </span>
          <span className="sot-tag" style={{ fontSize: 10 }}>
            CONSOLE · v2.4
          </span>
        </div>
      </div>

      <nav style={{ display: "flex", gap: 4, marginLeft: 20 }}>
        {[
          { label: "DASHBOARD",    href: "/" },
          { label: "CALL_HISTORY", href: "/calls", active: true },
          { label: "LEADS",        href: "/leads" },
          { label: "AGENTS",       href: "/agents" },
          { label: "ANALYTICS",    href: "/analytics" },
          { label: "SETTINGS",     href: "/settings" },
        ].map((l) =>
          l.active ? (
            <span
              key={l.label}
              className="sot-tag"
              style={{
                padding: "8px 12px",
                fontSize: 11,
                color: "var(--sot-fg-1)",
                background: "var(--sot-ink)",
                border: "1px solid var(--sot-line-strong)",
                fontWeight: 600,
              }}
            >
              {l.label}
            </span>
          ) : (
            <a
              key={l.label}
              href={l.href}
              onClick={l.href === "#" ? (e) => e.preventDefault() : undefined}
              className="sot-tag"
              style={{
                padding: "8px 12px",
                fontSize: 11,
                color: "var(--sot-fg-3)",
                textDecoration: "none",
              }}
            >
              {l.label}
            </a>
          )
        )}
      </nav>

      <span style={{ flex: 1 }} />

      <button
        className="sot-btn ghost"
        onClick={onRefresh}
        style={{ height: 36 }}
        disabled={refreshing}
      >
        <Icon
          name="refresh-cw"
          size={13}
          style={
            refreshing
              ? { animation: "sotSpin 1s linear infinite" }
              : undefined
          }
        />
        {refreshing ? "Refreshing…" : "Refresh"}
      </button>
      <button className="sot-btn ghost" style={{ height: 36 }}>
        <Icon name="download" size={13} /> Export CSV
      </button>
      <button className="sot-btn primary" style={{ height: 36 }}>
        <Icon name="file-output" size={13} /> Export report
      </button>
    </header>
  );
}

/* ============================================================
   FILTER BAR (collapsible)
   ============================================================ */
function FilterBar({ filters, setFilters, open, setOpen, total, resultCount }) {
  const update = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const reset = () =>
    setFilters({
      search: "",
      from: "2026-05-01",
      to: "2026-05-24",
      minQuality: 0,
      statuses: { qualified: true, pending: true, rejected: true },
      intent: "All",
      sortBy: "recent",
    });

  return (
    <div
      className="sot-card"
      style={{
        padding: 0,
        marginBottom: "var(--sot-s-4)",
      }}
    >
      {/* Top row — always visible */}
      <div
        style={{
          padding: "var(--sot-s-4) var(--sot-s-5)",
          display: "flex",
          gap: "var(--sot-s-3)",
          alignItems: "center",
          borderBottom: open ? "1px solid var(--sot-line)" : "none",
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--sot-ink)",
            border: "1px solid var(--sot-line-strong)",
            padding: "0 12px",
            height: 36,
            flex: "1 1 280px",
            minWidth: 240,
            maxWidth: 420,
          }}
        >
          <Icon name="search" size={13} color="var(--sot-fg-3)" />
          <input
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
            placeholder="Search by phone, name, or company…"
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              color: "var(--sot-fg-1)",
              fontFamily: "var(--sot-font-text)",
              fontSize: 13,
              outline: "none",
            }}
          />
          {filters.search && (
            <button
              onClick={() => update("search", "")}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--sot-fg-3)",
                padding: 0,
                display: "flex",
              }}
            >
              <Icon name="x" size={12} />
            </button>
          )}
        </div>

        {/* Sort */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="sot-tag" style={{ fontSize: 10 }}>
            SORT
          </span>
          <div style={{ display: "flex", border: "1px solid var(--sot-line-strong)" }}>
            {[
              { id: "recent", label: "Recent" },
              { id: "quality", label: "Quality" },
              { id: "duration", label: "Duration" },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => update("sortBy", opt.id)}
                style={{
                  padding: "8px 12px",
                  height: 34,
                  background:
                    filters.sortBy === opt.id ? "var(--sot-surface-3)" : "transparent",
                  color:
                    filters.sortBy === opt.id ? "var(--sot-fg-1)" : "var(--sot-fg-3)",
                  border: "none",
                  borderRight: "1px solid var(--sot-line)",
                  cursor: "pointer",
                  fontFamily: "var(--sot-font-mono)",
                  fontSize: 10,
                  letterSpacing: "var(--sot-tracking-tag)",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  transition: "background var(--sot-dur-fast) var(--sot-ease)",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <span style={{ flex: 1 }} />

        <span className="sot-mono" style={{ fontSize: 11, color: "var(--sot-fg-3)" }}>
          {resultCount.toLocaleString()} / {total.toLocaleString()} RESULTS
        </span>

        <button
          className="sot-btn ghost"
          style={{ height: 36 }}
          onClick={() => setOpen(!open)}
        >
          <Icon name={open ? "chevron-up" : "sliders-horizontal"} size={13} />
          {open ? "Hide filters" : "Show filters"}
        </button>
      </div>

      {/* Expanded filters */}
      {open && (
        <div
          style={{
            padding: "var(--sot-s-5)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "var(--sot-s-5)",
          }}
        >
          {/* Date range */}
          <div>
            <span className="sot-tag" style={{ fontSize: 10, display: "block", marginBottom: 8 }}>
              DATE_RANGE
            </span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                type="date"
                value={filters.from}
                onChange={(e) => update("from", e.target.value)}
                className="sot-field"
                style={{ height: 34, fontSize: 12, padding: "0 8px", fontFamily: "var(--sot-font-mono)" }}
              />
              <span style={{ color: "var(--sot-fg-4)" }}>→</span>
              <input
                type="date"
                value={filters.to}
                onChange={(e) => update("to", e.target.value)}
                className="sot-field"
                style={{ height: 34, fontSize: 12, padding: "0 8px", fontFamily: "var(--sot-font-mono)" }}
              />
            </div>
          </div>

          {/* Quality slider */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span className="sot-tag" style={{ fontSize: 10 }}>
                MIN_QUALITY
              </span>
              <span
                className="sot-mono"
                style={{ fontSize: 11, color: "var(--sot-fg-1)", fontWeight: 600 }}
              >
                {filters.minQuality === 0 ? "ANY" : `${filters.minQuality}+`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={filters.minQuality}
              onChange={(e) => update("minQuality", Number(e.target.value))}
              style={{
                width: "100%",
                accentColor: "var(--sot-verify)",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 4,
                fontFamily: "var(--sot-font-mono)",
                fontSize: 9,
                color: "var(--sot-fg-4)",
                letterSpacing: "var(--sot-tracking-tag)",
              }}
            >
              <span>0</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>

          {/* Status filter */}
          <div>
            <span className="sot-tag" style={{ fontSize: 10, display: "block", marginBottom: 8 }}>
              STATUS
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { id: "qualified", label: "Qualified", color: "var(--sot-verify)" },
                { id: "pending", label: "Pending", color: "var(--sot-warn)" },
                { id: "rejected", label: "Rejected", color: "var(--sot-alert)" },
              ].map((s) => (
                <label
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <span
                    onClick={() =>
                      update("statuses", {
                        ...filters.statuses,
                        [s.id]: !filters.statuses[s.id],
                      })
                    }
                    style={{
                      width: 14,
                      height: 14,
                      border: `1px solid ${
                        filters.statuses[s.id] ? s.color : "var(--sot-line-strong)"
                      }`,
                      background: filters.statuses[s.id] ? s.color : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all var(--sot-dur-fast) var(--sot-ease)",
                    }}
                  >
                    {filters.statuses[s.id] && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" style={{ width: 10, height: 10 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--sot-fg-1)" }}>{s.label}</span>
                  <span
                    className="sot-mono"
                    style={{ fontSize: 10, color: "var(--sot-fg-4)", marginLeft: "auto" }}
                  >
                    {ALL_CALLS.filter((c) => c.status === s.id).length}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Intent dropdown */}
          <div>
            <span className="sot-tag" style={{ fontSize: 10, display: "block", marginBottom: 8 }}>
              INTENT
            </span>
            <div style={{ position: "relative" }}>
              <select
                value={filters.intent}
                onChange={(e) => update("intent", e.target.value)}
                className="sot-field"
                style={{
                  height: 34,
                  fontSize: 12,
                  padding: "0 32px 0 10px",
                  appearance: "none",
                  WebkitAppearance: "none",
                  cursor: "pointer",
                  fontFamily: "var(--sot-font-text)",
                }}
              >
                <option value="All">All intents</option>
                {INTENTS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
              <span
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              >
                <Icon name="chevron-down" size={12} color="var(--sot-fg-3)" />
              </span>
            </div>
          </div>

          {/* Clear */}
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              className="sot-btn ghost"
              onClick={reset}
              style={{ height: 34, fontSize: 10 }}
            >
              <Icon name="x" size={12} /> Clear filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   TABLE
   ============================================================ */
function HistoryTable({ rows, loading, sortKey, sortDir, onSort, expandedId, onExpand }) {
  const cols = [
    { id: "time",     label: "Time",          sortable: true,  w: "12%" },
    { id: "phone",    label: "Phone",         sortable: false, w: "12%" },
    { id: "name",     label: "Caller",        sortable: false, w: "16%" },
    { id: "duration", label: "Duration",      sortable: true,  w: "8%"  },
    { id: "quality",  label: "Quality",       sortable: true,  w: "12%" },
    { id: "intent",   label: "Intent",        sortable: false, w: "12%" },
    { id: "status",   label: "Status",        sortable: false, w: "11%" },
    { id: "actions",  label: "",              sortable: false, w: "8%"  },
  ];

  if (loading) return <TableSkeleton />;
  if (rows.length === 0) return <EmptyState />;

  return (
    <div className="sot-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            minWidth: 960,
            borderCollapse: "collapse",
            fontFamily: "var(--sot-font-text)",
          }}
        >
          <thead>
            <tr style={{ background: "var(--sot-ink)", borderBottom: "1px solid var(--sot-line)" }}>
              <th style={{ width: 32, padding: "10px 12px" }} />
              {cols.map((c) => (
                <th
                  key={c.id}
                  onClick={() => c.sortable && onSort(c.id)}
                  style={{
                    textAlign: c.id === "actions" ? "right" : "left",
                    padding: "10px 16px",
                    width: c.w,
                    cursor: c.sortable ? "pointer" : "default",
                    userSelect: "none",
                  }}
                  className="sot-tag"
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      color: sortKey === c.id ? "var(--sot-fg-1)" : "var(--sot-fg-3)",
                      fontWeight: 600,
                      fontSize: 10,
                    }}
                  >
                    {c.label.toUpperCase()}
                    {c.sortable && (
                      <span
                        style={{
                          color:
                            sortKey === c.id ? "var(--sot-verify)" : "var(--sot-fg-4)",
                          display: "inline-flex",
                        }}
                      >
                        <Icon
                          name={
                            sortKey !== c.id
                              ? "chevrons-up-down"
                              : sortDir === "asc"
                              ? "chevron-up"
                              : "chevron-down"
                          }
                          size={11}
                        />
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <Row
                key={r.id}
                row={r}
                zebra={i % 2 === 1}
                expanded={expandedId === r.id}
                onExpand={() => onExpand(expandedId === r.id ? null : r.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ row, zebra, expanded, onExpand }) {
  return (
    <>
      <tr
        onClick={onExpand}
        style={{
          background: expanded
            ? "var(--sot-surface-2)"
            : zebra
            ? "rgba(255,255,255,.012)"
            : "transparent",
          borderBottom: expanded ? "1px solid var(--sot-verify)" : "1px solid var(--sot-line)",
          cursor: "pointer",
          transition: "background var(--sot-dur-fast) var(--sot-ease)",
        }}
        onMouseEnter={(e) => {
          if (!expanded) e.currentTarget.style.background = "var(--sot-surface-2)";
        }}
        onMouseLeave={(e) => {
          if (!expanded)
            e.currentTarget.style.background = zebra
              ? "rgba(255,255,255,.012)"
              : "transparent";
        }}
      >
        <td style={{ padding: "0 4px 0 12px", width: 32 }}>
          <span
            style={{
              display: "inline-flex",
              transition: "transform var(--sot-dur-base) var(--sot-ease)",
              transform: expanded ? "rotate(90deg)" : "rotate(0)",
              color: expanded ? "var(--sot-verify)" : "var(--sot-fg-3)",
            }}
          >
            <Icon
              name="chevron-right"
              size={14}
              color={expanded ? "var(--sot-verify)" : "var(--sot-fg-3)"}
            />
          </span>
        </td>
        <td style={{ padding: "14px 16px", fontFamily: "var(--sot-font-mono)", fontSize: 12, color: "var(--sot-fg-2)" }}>
          {fmtTime(row.time)}
        </td>
        <td style={{ padding: "14px 16px", fontFamily: "var(--sot-font-mono)", fontSize: 12, color: "var(--sot-fg-1)" }}>
          {row.phone}
        </td>
        <td style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <span style={{ fontSize: 13, color: "var(--sot-fg-1)", fontWeight: 500 }}>
              {row.name}
            </span>
            <span
              className="sot-mono"
              style={{ fontSize: 10, color: "var(--sot-fg-4)", marginTop: 2 }}
            >
              {row.company.toUpperCase()}
            </span>
          </div>
        </td>
        <td style={{ padding: "14px 16px", fontFamily: "var(--sot-font-mono)", fontSize: 12, color: "var(--sot-fg-2)", fontVariantNumeric: "tabular-nums" }}>
          {fmtDuration(row.duration)}
        </td>
        <td style={{ padding: "14px 16px" }}>
          <QualityBars score={row.quality} />
        </td>
        <td style={{ padding: "14px 16px" }}>
          <span className="sot-tag" style={{ fontSize: 10, color: "var(--sot-fg-2)" }}>
            {row.intent.toUpperCase().replace(/ /g, "_")}
          </span>
        </td>
        <td style={{ padding: "14px 16px" }}>
          <StatusPill status={row.status} />
        </td>
        <td
          style={{ padding: "14px 16px", textAlign: "right" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "inline-flex", gap: 4 }}>
            <button
              className="sot-btn ghost"
              style={{ height: 28, padding: "0 8px" }}
              title="View details"
            >
              <Icon name="eye" size={12} />
            </button>
            <button
              className="sot-btn ghost"
              style={{ height: 28, padding: "0 8px" }}
              title="Download recording"
            >
              <Icon name="download" size={12} />
            </button>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr style={{ background: "var(--sot-ink)", borderBottom: "1px solid var(--sot-line)" }}>
          <td colSpan={9} style={{ padding: 0 }}>
            <ExpandedDetail row={row} />
          </td>
        </tr>
      )}
    </>
  );
}

/* ============================================================
   EXPANDED ROW DETAIL
   ============================================================ */
function ExpandedDetail({ row }) {
  const sentimentColor =
    row.sentiment === "POSITIVE"
      ? "var(--sot-verify)"
      : row.sentiment === "NEGATIVE"
      ? "var(--sot-alert)"
      : "var(--sot-fg-2)";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.6fr) minmax(280px, 1fr)",
        gap: "var(--sot-s-5)",
        padding: "var(--sot-s-5) var(--sot-s-6)",
        borderTop: "1px solid var(--sot-verify)",
      }}
    >
      {/* Transcript */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <Icon name="file-text" size={13} color="var(--sot-fg-2)" />
          <span
            className="sot-tag"
            style={{ fontSize: 11, color: "var(--sot-fg-1)", fontWeight: 600 }}
          >
            TRANSCRIPT
          </span>
          <Tag label="LANG" value="EN_US" />
          <Tag label="MODEL" value="ARIA_3.1" />
        </div>
        <div
          style={{
            background: "var(--sot-surface-1)",
            border: "1px solid var(--sot-line)",
            padding: "var(--sot-s-4)",
            maxHeight: 280,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {row.transcript.map((m, i) => {
            const isAI = m.speaker === "AGENT";
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: "var(--sot-font-mono)",
                    fontSize: 10,
                    letterSpacing: "var(--sot-tracking-tag)",
                    color: isAI ? "var(--sot-verify)" : "var(--sot-fg-3)",
                    textTransform: "uppercase",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      background: isAI ? "var(--sot-verify)" : "var(--sot-fg-3)",
                      borderRadius: 999,
                    }}
                  />
                  {m.speaker}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: "var(--sot-fg-1)",
                    paddingLeft: 14,
                    borderLeft: `1px solid ${
                      isAI ? "var(--sot-verify)" : "var(--sot-line-strong)"
                    }`,
                  }}
                >
                  {m.text}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right side: meta */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sot-s-4)" }}>
        {/* Analysis */}
        <div
          style={{
            border: "1px solid var(--sot-line)",
            background: "var(--sot-surface-1)",
            padding: "var(--sot-s-4)",
          }}
        >
          <span className="sot-tag" style={{ fontSize: 10, display: "block", marginBottom: 12 }}>
            CALL_ANALYSIS
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <MetaRow label="SENTIMENT" mono>
              <span style={{ color: sentimentColor, fontWeight: 600 }}>{row.sentiment}</span>
            </MetaRow>
            <MetaRow label="AI_CONFIDENCE" mono>
              <span style={{ color: "var(--sot-fg-1)", fontWeight: 600 }}>{row.confidence}%</span>
              <div
                style={{
                  width: 64,
                  height: 3,
                  background: "var(--sot-line-strong)",
                  marginLeft: 8,
                  display: "inline-block",
                  verticalAlign: "middle",
                }}
              >
                <div
                  style={{
                    width: `${row.confidence}%`,
                    height: "100%",
                    background: "var(--sot-verify)",
                  }}
                />
              </div>
            </MetaRow>
            <MetaRow label="CRM_SYNC" mono>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  color:
                    row.crm === "SYNCED" ? "var(--sot-verify)" : "var(--sot-warn)",
                  fontWeight: 600,
                }}
              >
                <Icon
                  name={row.crm === "SYNCED" ? "check-circle-2" : "loader"}
                  size={11}
                />
                {row.crm}
              </span>
            </MetaRow>
            <MetaRow label="FOLLOW_UP" mono>
              <span style={{ color: "var(--sot-fg-1)", fontWeight: 600 }}>
                {row.followup}
              </span>
            </MetaRow>
            <MetaRow label="CALL_ID" mono>
              <span style={{ color: "var(--sot-fg-3)" }}>{row.id}</span>
            </MetaRow>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button className="sot-btn primary" style={{ justifyContent: "center", height: 38 }}>
            <Icon name="arrow-up-right" size={13} color="black" /> View full details
          </button>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <button className="sot-btn" style={{ justifyContent: "center" }}>
              <Icon name="headphones" size={13} /> Recording
            </button>
            <button className="sot-btn" style={{ justifyContent: "center" }}>
              <Icon name="share-2" size={13} /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, mono, children }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        paddingBottom: 8,
        borderBottom: "1px dashed var(--sot-line)",
      }}
    >
      <span className="sot-tag" style={{ fontSize: 9, color: "var(--sot-fg-3)" }}>
        {label}
      </span>
      <span
        style={{
          fontFamily: mono ? "var(--sot-font-mono)" : "var(--sot-font-text)",
          fontSize: 12,
          color: "var(--sot-fg-1)",
          textAlign: "right",
        }}
      >
        {children}
      </span>
    </div>
  );
}

/* ============================================================
   SKELETON LOADERS
   ============================================================ */
function TableSkeleton() {
  return (
    <div className="sot-card" style={{ padding: 0, overflow: "hidden" }}>
      <div
        style={{
          padding: "10px 16px",
          background: "var(--sot-ink)",
          borderBottom: "1px solid var(--sot-line)",
          display: "flex",
          gap: 16,
        }}
      >
        {["TIME", "PHONE", "CALLER", "DURATION", "QUALITY", "INTENT", "STATUS"].map((h) => (
          <span key={h} className="sot-tag" style={{ fontSize: 10, flex: 1 }}>
            {h}
          </span>
        ))}
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 16,
            padding: "16px",
            borderBottom: "1px solid var(--sot-line)",
            alignItems: "center",
          }}
        >
          {[1, 1, 1, 1, 1, 1, 1].map((_, j) => (
            <div
              key={j}
              style={{
                flex: 1,
                height: 14,
                background:
                  "linear-gradient(90deg, var(--sot-surface-2) 0%, var(--sot-surface-3) 50%, var(--sot-surface-2) 100%)",
                backgroundSize: "200% 100%",
                animation: "sotShimmer 1.4s linear infinite",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   EMPTY STATE
   ============================================================ */
function EmptyState() {
  return (
    <div
      className="sot-card sot-brackets neutral"
      style={{
        padding: "64px 32px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <span className="b tl" />
      <span className="b tr" />
      <span className="b bl" />
      <span className="b br" />

      {/* Engineering illustration — phone + dimension lines */}
      <svg
        viewBox="0 0 160 100"
        style={{ width: 160, height: 100, opacity: 0.85 }}
      >
        {/* grid */}
        {Array.from({ length: 9 }).map((_, i) => (
          <line
            key={"v" + i}
            x1={i * 20}
            y1={0}
            x2={i * 20}
            y2={100}
            stroke="var(--sot-line)"
            strokeWidth="0.5"
          />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line
            key={"h" + i}
            x1={0}
            y1={i * 20}
            x2={160}
            y2={i * 20}
            stroke="var(--sot-line)"
            strokeWidth="0.5"
          />
        ))}
        {/* phone outline */}
        <rect
          x="62"
          y="30"
          width="36"
          height="56"
          fill="none"
          stroke="var(--sot-fg-3)"
          strokeWidth="1.5"
        />
        <line x1="62" y1="40" x2="98" y2="40" stroke="var(--sot-fg-3)" strokeWidth="1" />
        <line x1="62" y1="78" x2="98" y2="78" stroke="var(--sot-fg-3)" strokeWidth="1" />
        <circle cx="80" cy="82" r="1.5" fill="var(--sot-fg-3)" />
        {/* dimension */}
        <line x1="50" y1="30" x2="50" y2="86" stroke="var(--sot-fg-4)" strokeWidth="0.5" />
        <line x1="47" y1="30" x2="53" y2="30" stroke="var(--sot-fg-4)" strokeWidth="0.5" />
        <line x1="47" y1="86" x2="53" y2="86" stroke="var(--sot-fg-4)" strokeWidth="0.5" />
        {/* "no signal" diagonal */}
        <line
          x1="55"
          y1="22"
          x2="105"
          y2="92"
          stroke="var(--sot-alert)"
          strokeWidth="1.5"
          opacity="0.7"
        />
        {/* registration brackets */}
        <path d="M 8 8 L 16 8 L 16 16" fill="none" stroke="var(--sot-construction)" strokeWidth="1.2" />
        <path d="M 152 8 L 144 8 L 144 16" fill="none" stroke="var(--sot-construction)" strokeWidth="1.2" />
        <path d="M 8 92 L 16 92 L 16 84" fill="none" stroke="var(--sot-construction)" strokeWidth="1.2" />
        <path d="M 152 92 L 144 92 L 144 84" fill="none" stroke="var(--sot-construction)" strokeWidth="1.2" />
      </svg>
      <h2 className="sot-h3" style={{ fontSize: 20, letterSpacing: "-0.02em" }}>
        No calls match these filters.
      </h2>
      <p
        className="sot-p"
        style={{ maxWidth: 400, marginBottom: 0, color: "var(--sot-fg-3)", fontSize: 13 }}
      >
        Loosen the date range or clear quality and status filters. If the queue is genuinely empty, the call log is the source of truth.
      </p>
      <Tag label="RESULTS" value="0" tone="warn" />
    </div>
  );
}

/* ============================================================
   PAGINATION
   ============================================================ */
function Pagination({ page, total, perPage, onPage }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  // Build a windowed page list
  const items = [];
  const window = 2;
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - window && i <= page + window)) {
      items.push(i);
    } else if (items[items.length - 1] !== "…") {
      items.push("…");
    }
  }

  return (
    <div
      className="sot-card"
      style={{
        marginTop: "var(--sot-s-3)",
        padding: "12px var(--sot-s-5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--sot-s-3)",
        flexWrap: "wrap",
      }}
    >
      <span className="sot-mono" style={{ fontSize: 11, color: "var(--sot-fg-3)" }}>
        SHOWING {start.toLocaleString()}–{end.toLocaleString()} OF {total.toLocaleString()} RESULTS
      </span>
      <div style={{ display: "flex", gap: 4 }}>
        <button
          className="sot-btn ghost"
          style={{ height: 30, padding: "0 10px" }}
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
        >
          <Icon name="chevron-left" size={12} /> Prev
        </button>
        {items.map((p, i) =>
          p === "…" ? (
            <span
              key={"e" + i}
              className="sot-mono"
              style={{ alignSelf: "center", color: "var(--sot-fg-4)", padding: "0 4px" }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={"sot-btn " + (p === page ? "primary" : "ghost")}
              style={{
                height: 30,
                minWidth: 30,
                padding: "0 8px",
                justifyContent: "center",
                fontSize: 11,
              }}
            >
              {p}
            </button>
          )
        )}
        <button
          className="sot-btn ghost"
          style={{ height: 30, padding: "0 10px" }}
          disabled={page === pages}
          onClick={() => onPage(page + 1)}
        >
          Next <Icon name="chevron-right" size={12} />
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   STAT STRIP — under page header
   ============================================================ */
function StatStrip({ rows }) {
  const total = rows.length;
  const qualified = rows.filter((r) => r.status === "qualified").length;
  const pending = rows.filter((r) => r.status === "pending").length;
  const rejected = rows.filter((r) => r.status === "rejected").length;
  const avgDur =
    total === 0
      ? 0
      : Math.round(rows.reduce((s, r) => s + r.duration, 0) / total);
  const avgQ =
    total === 0
      ? 0
      : (rows.reduce((s, r) => s + r.quality, 0) / total).toFixed(1);

  const stats = [
    { label: "TOTAL_CALLS", value: total, icon: "phone" },
    { label: "QUALIFIED", value: qualified, icon: "check-circle-2", tone: "verify" },
    { label: "PENDING", value: pending, icon: "clock", tone: "warn" },
    { label: "REJECTED", value: rejected, icon: "x-circle", tone: "alert" },
    { label: "AVG_DURATION", value: fmtDuration(avgDur), icon: "timer", mono: true },
    { label: "AVG_QUALITY", value: avgQ + "/10", icon: "target", mono: true },
  ];

  const toneColor = (t) =>
    t === "verify"
      ? "var(--sot-verify)"
      : t === "warn"
      ? "var(--sot-warn)"
      : t === "alert"
      ? "var(--sot-alert)"
      : "var(--sot-fg-1)";

  return (
    <div
      className="sot-card"
      style={{
        padding: 0,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        marginBottom: "var(--sot-s-4)",
      }}
    >
      {stats.map((s, i, arr) => (
        <div
          key={s.label}
          style={{
            padding: "14px 18px",
            borderRight:
              i === arr.length - 1 ? "none" : "1px solid var(--sot-line)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name={s.icon} size={12} color={toneColor(s.tone)} />
            <span className="sot-tag" style={{ fontSize: 9 }}>
              {s.label}
            </span>
          </div>
          <span
            style={{
              fontFamily: s.mono ? "var(--sot-font-mono)" : "var(--sot-font-sans)",
              fontSize: s.mono ? 18 : 22,
              fontWeight: 800,
              color: toneColor(s.tone),
              letterSpacing: "-0.01em",
              lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {s.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   ROOT
   ============================================================ */
function CallHistoryPage() {
  const [filters, setFilters] = useState({
    search: "",
    from: "2026-05-01",
    to: "2026-05-24",
    minQuality: 0,
    statuses: { qualified: true, pending: true, rejected: true },
    intent: "All",
    sortBy: "recent",
  });
  const [filterOpen, setFilterOpen] = useState(true);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState("CALL_01001"); // default open the first one to show off
  const [sortKey, setSortKey] = useState("time");
  const [sortDir, setSortDir] = useState("desc");
  const [loading, setLoading] = useState(false);
  const PER_PAGE = 20;

  /* Sort handler — clicking a header also drives the sort */
  const onSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "time" ? "desc" : "desc");
    }
  };

  /* Keep header sort and the filter "sort by" segmented control in sync */
  useEffect(() => {
    const map = { recent: "time", quality: "quality", duration: "duration" };
    setSortKey(map[filters.sortBy]);
    setSortDir("desc");
    setPage(1);
  }, [filters.sortBy]);

  /* Apply filters */
  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const fromD = new Date(filters.from);
    const toD = new Date(filters.to);
    toD.setHours(23, 59, 59, 999);

    return ALL_CALLS.filter((c) => {
      if (q) {
        const hay = `${c.phone} ${c.name} ${c.company} ${c.email}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (c.time < fromD || c.time > toD) return false;
      if (c.quality < filters.minQuality) return false;
      if (!filters.statuses[c.status]) return false;
      if (filters.intent !== "All" && c.intent !== filters.intent) return false;
      return true;
    });
  }, [filters]);

  /* Sort */
  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      let av, bv;
      if (sortKey === "time") {
        av = a.time.getTime();
        bv = b.time.getTime();
      } else if (sortKey === "quality") {
        av = a.quality;
        bv = b.quality;
      } else if (sortKey === "duration") {
        av = a.duration;
        bv = b.duration;
      } else {
        av = a.time.getTime();
        bv = b.time.getTime();
      }
      return (av - bv) * dir;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  /* Paginate */
  useEffect(() => {
    setPage(1);
  }, [filters.search, filters.from, filters.to, filters.minQuality, filters.intent, filters.statuses]);

  const total = sorted.length;
  const pagedRows = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  /* Refresh — simulate brief loading */
  const refresh = useCallback(() => {
    setLoading(true);
    setExpandedId(null);
    setTimeout(() => setLoading(false), 900);
  }, []);

  return (
    <div className="sot sot-grid" style={{ minHeight: "100vh", paddingBottom: 48 }}>
      <PageHeader onRefresh={refresh} refreshing={loading} />

      <main
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: "var(--sot-s-6) var(--sot-s-6) 0",
        }}
      >
        {/* Title row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "var(--sot-s-6)",
            marginBottom: "var(--sot-s-5)",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 8,
              }}
            >
              <Tag label="LOG" value="CALL_HISTORY" tone="verify" />
              <Tag label="RANGE" value={`${filters.from} → ${filters.to}`} />
              <Tag label="SOURCE_OF_TRUTH" value="CONFIRMED" tone="verify" />
            </div>
            <h1
              className="sot-h2"
              style={{ fontSize: 32, letterSpacing: "-0.02em" }}
            >
              Call history.
            </h1>
            <p
              className="sot-p"
              style={{
                fontSize: 13,
                color: "var(--sot-fg-3)",
                marginTop: 4,
                marginBottom: 0,
                maxWidth: 600,
              }}
            >
              Every inbound call, with transcript, sentiment, and qualification verdict. Filter and audit.
            </p>
          </div>
        </div>

        <StatStrip rows={filtered} />

        <FilterBar
          filters={filters}
          setFilters={setFilters}
          open={filterOpen}
          setOpen={setFilterOpen}
          total={ALL_CALLS.length}
          resultCount={total}
        />

        <HistoryTable
          rows={pagedRows}
          loading={loading}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={onSort}
          expandedId={expandedId}
          onExpand={setExpandedId}
        />

        {!loading && total > 0 && (
          <Pagination
            page={page}
            total={total}
            perPage={PER_PAGE}
            onPage={setPage}
          />
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: "var(--sot-s-6)",
            paddingTop: "var(--sot-s-4)",
            borderTop: "1px solid var(--sot-line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "var(--sot-fg-4)",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <span className="sot-mono" style={{ fontSize: 11 }}>
            VOICE_AI_AGENT // CALL_HISTORY // v2.4.1
          </span>
          <div style={{ display: "flex", gap: 14 }}>
            <Tag label="RETENTION" value="180_DAYS" />
            <Tag label="ENCRYPTION" value="AT_REST" tone="verify" />
            <Tag label="LATENCY" value="184MS" tone="verify" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default CallHistoryPage;
