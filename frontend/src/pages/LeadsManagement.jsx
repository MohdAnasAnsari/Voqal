import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
/* ============================================================
   LeadsManagementPage — SOT design system
   ============================================================ */


/* ---------- Lucide icon helper ---------- */
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

/* ---------- Bracket tag ---------- */
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

/* ---------- Lead status mapping ---------- */
const STATUS = {
  new:       { color: "var(--sot-warn)",   soft: "var(--sot-warn-soft)",   label: "NEW" },
  qualified: { color: "var(--sot-verify)", soft: "var(--sot-verify-soft)", label: "QUALIFIED" },
  contacted: { color: "var(--sot-fg-2)",   soft: "rgba(184,184,191,.12)",  label: "CONTACTED" },
  converted: { color: "var(--sot-verify)", soft: "var(--sot-verify-soft)", label: "CONVERTED" },
  lost:      { color: "var(--sot-alert)",  soft: "var(--sot-alert-soft)",  label: "LOST" },
};

function StatusPill({ status }) {
  const s = STATUS[status];
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

/* ---------- Quality bars ---------- */
function QualityBars({ score }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <div style={{ display: "flex", gap: 2 }}>
        {[...Array(10)].map((_, i) => (
          <span
            key={i}
            style={{
              width: 5,
              height: 12,
              background:
                i < score
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
          fontSize: 11,
          color: "var(--sot-fg-2)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {score}
      </span>
    </div>
  );
}

/* ============================================================
   MOCK DATA — 60 leads
   ============================================================ */
const FIRST = ["John", "Sara", "Daniel", "Maya", "Hiro", "Aisha", "Liam", "Priya", "Marcus", "Elena",
               "Theo", "Nina", "Owen", "Yui", "Carlos", "Zara", "Ben", "Anika", "Jonas", "Mira",
               "Asha", "Caleb", "Riya", "Dmitri", "Lena"];
const LAST = ["Smith", "Lee", "Rivera", "Patel", "Tanaka", "Khan", "Park", "Johansson", "Foster", "Walker",
              "Ng", "Diaz", "Cohen", "Murphy", "Becker", "Vasquez", "Sato", "Cole", "Hassan", "Reid"];
const COMPANIES = ["Tech Corp", "Northwind", "Helios Mfg.", "Arcadia Labs", "Cascade Energy", "Ferro Logistics",
                   "Polaris Health", "Quill & Co.", "Vector Studio", "Greenfield Power", "Atlas Freight",
                   "Beacon Insurance", "Cinder & Co.", "Drift Capital"];
const SOURCES = ["Voice AI", "Web Form", "Import"];
const AGENTS = [
  { id: "M_JOHNSTON",  name: "M. Johnston",  conv: 14 },
  { id: "K_ALVAREZ",   name: "K. Alvarez",   conv: 11 },
  { id: "R_PATEL",     name: "R. Patel",     conv: 9  },
  { id: "S_NAKAMURA",  name: "S. Nakamura",  conv: 7  },
  { id: "J_OBRIEN",    name: "J. O'Brien",   conv: 5  },
];

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
function generateLeads(n = 60) {
  const r = rng(1337);
  const now = new Date(2026, 4, 24, 16, 30);
  return Array.from({ length: n }).map((_, i) => {
    const fn = FIRST[Math.floor(r() * FIRST.length)];
    const ln = LAST[Math.floor(r() * LAST.length)];
    const company = COMPANIES[Math.floor(r() * COMPANIES.length)];
    const source = SOURCES[Math.floor(r() * SOURCES.length)];
    const quality = Math.floor(r() * 8) + 3;
    const statusRoll = r();
    const status =
      i === 0
        ? "qualified"
        : quality >= 8 && statusRoll > 0.6
        ? "converted"
        : quality < 4
        ? "lost"
        : statusRoll > 0.7
        ? "contacted"
        : statusRoll > 0.3
        ? "qualified"
        : "new";
    const value =
      status === "converted"
        ? Math.floor(r() * 18000) + 6000
        : Math.floor(r() * 9000) + 1500;
    const daysAgo = Math.floor(r() * 21);
    const lastContact = new Date(now.getTime() - daysAgo * 86400000);
    const assigned =
      r() > 0.12 ? AGENTS[Math.floor(r() * AGENTS.length)].id : null;
    return {
      id: `LEAD_${String(i + 4001).padStart(5, "0")}`,
      name: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@${company
        .toLowerCase()
        .replace(/[^a-z]/g, "")}.com`,
      phone: "+1-555-" + String(1000 + i * 7 + Math.floor(r() * 9)).padStart(4, "0").slice(-4),
      company,
      quality,
      status,
      source,
      value,
      assigned,
      lastContact,
    };
  });
}

const ALL_LEADS = generateLeads(60);

/* ---------- Format helpers ---------- */
const fmtRelDate = (d) => {
  const now = new Date(2026, 4, 24, 16, 30);
  const days = Math.floor((now - d) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
const fmtCurrency = (n) => "$" + n.toLocaleString();

/* ============================================================
   HEADER  (top nav)
   ============================================================ */
function PageHeader() {
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
          { label: "CALL_HISTORY", href: "/calls" },
          { label: "LEADS",        href: "#", active: true },
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

      <button className="sot-btn ghost" style={{ height: 36 }}>
        <Icon name="bell" size={13} />
      </button>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "4px 10px 4px 4px",
          border: "1px solid var(--sot-line-strong)",
          background: "var(--sot-surface-2)",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            background: "var(--sot-surface-3)",
            border: "1px solid var(--sot-line-strong)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--sot-font-mono)",
            fontSize: 11,
            color: "var(--sot-fg-1)",
            fontWeight: 600,
          }}
        >
          MJ
        </div>
        <span style={{ fontSize: 12, color: "var(--sot-fg-1)", fontWeight: 600 }}>
          M. Johnston
        </span>
      </div>
    </header>
  );
}

/* ============================================================
   KPI STRIP
   ============================================================ */
function KpiStrip({ leads }) {
  const total = leads.length;
  const qualified = leads.filter((l) => ["qualified", "contacted", "converted"].includes(l.status)).length;
  const contacted = leads.filter((l) => ["contacted", "converted"].includes(l.status)).length;
  const converted = leads.filter((l) => l.status === "converted").length;
  const revenue = leads
    .filter((l) => l.status === "converted")
    .reduce((s, l) => s + l.value, 0);

  const kpis = [
    { label: "TOTAL_LEADS", value: total, sub: "in pipeline", icon: "users" },
    { label: "QUALIFIED", value: qualified, sub: pct(qualified, total) + "%", icon: "user-check", tone: "verify", bar: pct(qualified, total) },
    { label: "CONTACTED", value: contacted, sub: pct(contacted, total) + "%", icon: "phone-call", bar: pct(contacted, total) },
    { label: "CONVERTED", value: converted, sub: pct(converted, total) + "%", icon: "check-circle-2", tone: "verify", bar: pct(converted, total) },
    { label: "PIPELINE_VALUE", value: fmtCurrency(revenue), sub: "closed-won", icon: "dollar-sign", isText: true },
  ];

  return (
    <div
      className="sot-card"
      style={{
        padding: 0,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        marginBottom: "var(--sot-s-4)",
      }}
    >
      {kpis.map((k, i, arr) => (
        <div
          key={k.label}
          style={{
            padding: "16px 20px",
            borderRight: i === arr.length - 1 ? "none" : "1px solid var(--sot-line)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon
              name={k.icon}
              size={13}
              color={k.tone === "verify" ? "var(--sot-verify)" : "var(--sot-fg-3)"}
            />
            <span className="sot-tag" style={{ fontSize: 10 }}>
              {k.label}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
            }}
          >
            <span
              style={{
                fontFamily: k.isText ? "var(--sot-font-mono)" : "var(--sot-font-sans)",
                fontSize: k.isText ? 22 : 30,
                fontWeight: 800,
                color: k.tone === "verify" ? "var(--sot-verify)" : "var(--sot-fg-1)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {typeof k.value === "number" ? k.value.toLocaleString() : k.value}
            </span>
            <span
              className="sot-mono"
              style={{
                fontSize: 11,
                color: "var(--sot-fg-3)",
              }}
            >
              {k.sub}
            </span>
          </div>
          {typeof k.bar === "number" && (
            <div
              style={{
                height: 3,
                background: "var(--sot-ink)",
                border: "1px solid var(--sot-line)",
                marginTop: 4,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${k.bar}%`,
                  background: k.tone === "verify" ? "var(--sot-verify)" : "var(--sot-fg-2)",
                  transition: "width var(--sot-dur-slow) var(--sot-ease)",
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
const pct = (a, b) => (b === 0 ? 0 : Math.round((a / b) * 100));

/* ============================================================
   FILTER BAR
   ============================================================ */
function FilterBar({ filters, setFilters, view, setView, total, resultCount }) {
  const update = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const reset = () =>
    setFilters({
      search: "",
      status: "all",
      qMin: 0,
      qMax: 10,
      source: "all",
      assigned: "all",
      from: "2026-04-01",
      to: "2026-05-24",
    });

  const statuses = ["all", "new", "qualified", "contacted", "converted", "lost"];

  return (
    <div className="sot-card" style={{ padding: 0, marginBottom: "var(--sot-s-4)" }}>
      {/* Row 1: search + status tabs + view toggle */}
      <div
        style={{
          padding: "var(--sot-s-4) var(--sot-s-5)",
          borderBottom: "1px solid var(--sot-line)",
          display: "flex",
          gap: "var(--sot-s-3)",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--sot-ink)",
            border: "1px solid var(--sot-line-strong)",
            padding: "0 12px",
            height: 36,
            flex: "1 1 240px",
            minWidth: 220,
            maxWidth: 360,
          }}
        >
          <Icon name="search" size={13} color="var(--sot-fg-3)" />
          <input
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
            placeholder="Search name, email, phone, company…"
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

        {/* Status tabs */}
        <div
          style={{
            display: "flex",
            border: "1px solid var(--sot-line-strong)",
            overflow: "hidden",
          }}
        >
          {statuses.map((s, i) => {
            const active = filters.status === s;
            const count = s === "all" ? ALL_LEADS.length : ALL_LEADS.filter((l) => l.status === s).length;
            return (
              <button
                key={s}
                onClick={() => update("status", s)}
                style={{
                  padding: "0 12px",
                  height: 34,
                  background: active ? "var(--sot-surface-3)" : "transparent",
                  color: active ? "var(--sot-fg-1)" : "var(--sot-fg-3)",
                  border: "none",
                  borderRight: i === statuses.length - 1 ? "none" : "1px solid var(--sot-line)",
                  cursor: "pointer",
                  fontFamily: "var(--sot-font-mono)",
                  fontSize: 10,
                  letterSpacing: "var(--sot-tracking-tag)",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "background var(--sot-dur-fast) var(--sot-ease)",
                }}
              >
                {s === "all" ? "ALL" : STATUS[s].label}
                <span
                  style={{
                    color: active ? "var(--sot-fg-3)" : "var(--sot-fg-4)",
                    fontSize: 10,
                  }}
                >
                  · {count}
                </span>
              </button>
            );
          })}
        </div>

        <span style={{ flex: 1 }} />

        <span className="sot-mono" style={{ fontSize: 11, color: "var(--sot-fg-3)" }}>
          {resultCount} / {total}
        </span>

        {/* View toggle */}
        <div style={{ display: "flex", border: "1px solid var(--sot-line-strong)" }}>
          {[
            { id: "table", icon: "rows-3", label: "Table" },
            { id: "card", icon: "layout-grid", label: "Cards" },
          ].map((v, i, arr) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              style={{
                padding: "0 12px",
                height: 34,
                background: view === v.id ? "var(--sot-surface-3)" : "transparent",
                color: view === v.id ? "var(--sot-fg-1)" : "var(--sot-fg-3)",
                border: "none",
                borderRight: i === arr.length - 1 ? "none" : "1px solid var(--sot-line)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "var(--sot-font-mono)",
                fontSize: 10,
                letterSpacing: "var(--sot-tracking-tag)",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              <Icon name={v.icon} size={12} />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: secondary filters */}
      <div
        style={{
          padding: "var(--sot-s-4) var(--sot-s-5)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "var(--sot-s-4)",
          alignItems: "end",
        }}
      >
        {/* Quality range */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span className="sot-tag" style={{ fontSize: 10 }}>
              QUALITY_RANGE
            </span>
            <span
              className="sot-mono"
              style={{ fontSize: 11, color: "var(--sot-fg-1)", fontWeight: 600 }}
            >
              {filters.qMin}–{filters.qMax}
            </span>
          </div>
          <DualRange
            min={0}
            max={10}
            valMin={filters.qMin}
            valMax={filters.qMax}
            onChange={(lo, hi) => setFilters((f) => ({ ...f, qMin: lo, qMax: hi }))}
          />
        </div>

        {/* Source */}
        <div>
          <span className="sot-tag" style={{ fontSize: 10, display: "block", marginBottom: 8 }}>
            SOURCE
          </span>
          <SelectField value={filters.source} onChange={(v) => update("source", v)}>
            <option value="all">All sources</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </SelectField>
        </div>

        {/* Assigned */}
        <div>
          <span className="sot-tag" style={{ fontSize: 10, display: "block", marginBottom: 8 }}>
            ASSIGNED_TO
          </span>
          <SelectField value={filters.assigned} onChange={(v) => update("assigned", v)}>
            <option value="all">All agents</option>
            <option value="unassigned">Unassigned</option>
            {AGENTS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </SelectField>
        </div>

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

        {/* Clear */}
        <div>
          <button
            className="sot-btn ghost"
            onClick={reset}
            style={{ height: 34, fontSize: 10 }}
          >
            <Icon name="x" size={12} /> Clear filters
          </button>
        </div>
      </div>
    </div>
  );
}

function SelectField({ value, onChange, children }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sot-field"
        style={{
          height: 34,
          fontSize: 12,
          padding: "0 30px 0 10px",
          appearance: "none",
          WebkitAppearance: "none",
          cursor: "pointer",
        }}
      >
        {children}
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
  );
}

/* ---------- Dual-handle range slider ---------- */
function DualRange({ min, max, valMin, valMax, onChange }) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(null);

  const pctOf = (v) => ((v - min) / (max - min)) * 100;

  useEffect(() => {
    if (!dragging) return;
    const move = (e) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const raw = Math.round(min + p * (max - min));
      if (dragging === "min") {
        onChange(Math.min(raw, valMax), valMax);
      } else {
        onChange(valMin, Math.max(raw, valMin));
      }
    };
    const up = () => setDragging(null);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, [dragging, valMin, valMax, min, max, onChange]);

  return (
    <div style={{ padding: "10px 0 4px" }}>
      <div
        ref={trackRef}
        style={{
          position: "relative",
          height: 4,
          background: "var(--sot-ink)",
          border: "1px solid var(--sot-line-strong)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: pctOf(valMin) + "%",
            right: 100 - pctOf(valMax) + "%",
            top: 0,
            bottom: 0,
            background: "var(--sot-verify)",
          }}
        />
        <Handle pos={pctOf(valMin)} onDown={() => setDragging("min")} />
        <Handle pos={pctOf(valMax)} onDown={() => setDragging("max")} />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 6,
          fontFamily: "var(--sot-font-mono)",
          fontSize: 9,
          color: "var(--sot-fg-4)",
          letterSpacing: "var(--sot-tracking-tag)",
        }}
      >
        <span>{min}</span>
        <span>5</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
function Handle({ pos, onDown }) {
  return (
    <span
      onMouseDown={onDown}
      onTouchStart={onDown}
      style={{
        position: "absolute",
        left: pos + "%",
        top: "50%",
        width: 14,
        height: 14,
        background: "var(--sot-fg-1)",
        border: "1px solid var(--sot-verify)",
        transform: "translate(-50%, -50%)",
        cursor: "grab",
        zIndex: 2,
      }}
    />
  );
}

/* ============================================================
   BULK ACTION BAR
   ============================================================ */
function BulkActionBar({ selected, onAssign, onSetStatus, onClear }) {
  if (selected.length === 0) return null;
  return (
    <div
      style={{
        position: "sticky",
        top: 64,
        zIndex: 5,
        background: "var(--sot-ink)",
        border: "1px solid var(--sot-verify)",
        padding: "10px 16px",
        marginBottom: "var(--sot-s-3)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        boxShadow: "var(--sot-glow-verify)",
      }}
    >
      <span
        className="sot-mono"
        style={{
          color: "var(--sot-verify)",
          fontSize: 12,
          letterSpacing: "var(--sot-tracking-tag)",
          textTransform: "uppercase",
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Icon name="check-circle-2" size={13} color="var(--sot-verify)" />
        {selected.length} SELECTED
      </span>
      <span style={{ width: 1, height: 18, background: "var(--sot-line-strong)" }} />

      <span className="sot-tag" style={{ fontSize: 10 }}>
        STATUS →
      </span>
      {["contacted", "converted", "lost"].map((s) => (
        <button
          key={s}
          onClick={() => onSetStatus(s)}
          className="sot-btn ghost"
          style={{
            height: 28,
            padding: "0 10px",
            borderColor: STATUS[s].color,
            color: STATUS[s].color,
          }}
        >
          {STATUS[s].label}
        </button>
      ))}

      <span style={{ width: 1, height: 18, background: "var(--sot-line-strong)" }} />

      <SelectField value="" onChange={onAssign}>
        <option value="">Assign to…</option>
        {AGENTS.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </SelectField>

      <span style={{ flex: 1 }} />

      <button className="sot-btn ghost" style={{ height: 28 }}>
        <Icon name="download" size={12} /> Export
      </button>
      <button
        className="sot-btn ghost"
        style={{ height: 28, color: "var(--sot-alert)", borderColor: "var(--sot-alert)" }}
      >
        <Icon name="trash-2" size={12} /> Delete
      </button>
      <button
        onClick={onClear}
        className="sot-btn ghost"
        style={{ height: 28, padding: "0 10px" }}
        title="Clear selection"
      >
        <Icon name="x" size={12} />
      </button>
    </div>
  );
}

/* ============================================================
   TABLE VIEW
   ============================================================ */
function LeadsTable({ rows, selected, setSelected, onChangeStatus }) {
  const allChecked = rows.length > 0 && rows.every((r) => selected.includes(r.id));
  const toggleAll = () => {
    if (allChecked) setSelected(selected.filter((id) => !rows.find((r) => r.id === id)));
    else setSelected([...new Set([...selected, ...rows.map((r) => r.id)])]);
  };
  const toggleOne = (id) => {
    if (selected.includes(id)) setSelected(selected.filter((s) => s !== id));
    else setSelected([...selected, id]);
  };

  return (
    <div className="sot-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            minWidth: 1100,
            borderCollapse: "collapse",
            fontFamily: "var(--sot-font-text)",
          }}
        >
          <thead>
            <tr style={{ background: "var(--sot-ink)", borderBottom: "1px solid var(--sot-line)" }}>
              <th style={{ width: 40, padding: "10px 16px" }}>
                <Checkbox checked={allChecked} onChange={toggleAll} />
              </th>
              {["Lead", "Contact", "Quality", "Status", "Value", "Assigned", "Last Contact", ""].map((h, i, arr) => (
                <th
                  key={i}
                  className="sot-tag"
                  style={{
                    textAlign: i === arr.length - 1 ? "right" : "left",
                    padding: "10px 16px",
                    fontSize: 10,
                    color: "var(--sot-fg-3)",
                    fontWeight: 600,
                  }}
                >
                  {h.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <LeadRow
                key={r.id}
                row={r}
                zebra={i % 2 === 1}
                checked={selected.includes(r.id)}
                onToggle={() => toggleOne(r.id)}
                onChangeStatus={(s) => onChangeStatus(r.id, s)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Checkbox({ checked, onChange }) {
  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      style={{
        width: 16,
        height: 16,
        border: `1px solid ${checked ? "var(--sot-verify)" : "var(--sot-line-strong)"}`,
        background: checked ? "var(--sot-verify)" : "transparent",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all var(--sot-dur-fast) var(--sot-ease)",
        verticalAlign: "middle",
      }}
    >
      {checked && (
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" style={{ width: 11, height: 11 }}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </span>
  );
}

function LeadRow({ row, zebra, checked, onToggle, onChangeStatus }) {
  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef(null);
  useEffect(() => {
    if (!statusOpen) return;
    const handler = (e) => {
      if (statusRef.current && !statusRef.current.contains(e.target))
        setStatusOpen(false);
    };
    setTimeout(() => window.addEventListener("click", handler), 0);
    return () => window.removeEventListener("click", handler);
  }, [statusOpen]);

  const agent = AGENTS.find((a) => a.id === row.assigned);

  return (
    <tr
      style={{
        background: checked
          ? "var(--sot-verify-soft)"
          : zebra
          ? "rgba(255,255,255,.012)"
          : "transparent",
        borderBottom: "1px solid var(--sot-line)",
        cursor: "pointer",
        transition: "background var(--sot-dur-fast) var(--sot-ease)",
      }}
      onMouseEnter={(e) => {
        if (!checked) e.currentTarget.style.background = "var(--sot-surface-2)";
      }}
      onMouseLeave={(e) => {
        if (!checked)
          e.currentTarget.style.background = zebra
            ? "rgba(255,255,255,.012)"
            : "transparent";
      }}
    >
      <td style={{ padding: "14px 16px" }}>
        <Checkbox checked={checked} onChange={onToggle} />
      </td>
      <td style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: "var(--sot-ink)",
              border: "1px solid var(--sot-line-strong)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--sot-font-mono)",
              fontSize: 11,
              color: "var(--sot-fg-1)",
              fontWeight: 600,
            }}
          >
            {row.name.split(" ").map((s) => s[0]).join("")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <span style={{ fontSize: 13, color: "var(--sot-fg-1)", fontWeight: 600 }}>
              {row.name}
            </span>
            <span
              className="sot-mono"
              style={{ fontSize: 10, color: "var(--sot-fg-4)", marginTop: 2 }}
            >
              {row.company.toUpperCase()} · {row.source.toUpperCase().replace(" ", "_")}
            </span>
          </div>
        </div>
      </td>
      <td style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
          <span
            style={{
              fontFamily: "var(--sot-font-mono)",
              fontSize: 12,
              color: "var(--sot-fg-1)",
            }}
          >
            {row.email}
          </span>
          <span
            style={{
              fontFamily: "var(--sot-font-mono)",
              fontSize: 11,
              color: "var(--sot-fg-3)",
            }}
          >
            {row.phone}
          </span>
        </div>
      </td>
      <td style={{ padding: "14px 16px" }}>
        <QualityBars score={row.quality} />
      </td>
      <td style={{ padding: "14px 16px", position: "relative" }} ref={statusRef}>
        <span
          onClick={(e) => {
            e.stopPropagation();
            setStatusOpen(!statusOpen);
          }}
          style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          <StatusPill status={row.status} />
          <Icon name="chevron-down" size={11} color="var(--sot-fg-3)" />
        </span>
        {statusOpen && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 16,
              marginTop: 4,
              zIndex: 20,
              background: "var(--sot-surface-2)",
              border: "1px solid var(--sot-line-strong)",
              padding: 4,
              minWidth: 140,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {Object.keys(STATUS).map((s) => (
              <button
                key={s}
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeStatus(s);
                  setStatusOpen(false);
                }}
                style={{
                  padding: "6px 10px",
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  color: "var(--sot-fg-1)",
                  fontSize: 12,
                  fontFamily: "var(--sot-font-mono)",
                  letterSpacing: "var(--sot-tracking-tag)",
                  textTransform: "uppercase",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sot-surface-3)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 6,
                    height: 6,
                    background: STATUS[s].color,
                    borderRadius: 999,
                    marginRight: 6,
                    verticalAlign: "middle",
                  }}
                />
                {STATUS[s].label}
              </button>
            ))}
          </div>
        )}
      </td>
      <td
        style={{
          padding: "14px 16px",
          fontFamily: "var(--sot-font-mono)",
          fontSize: 13,
          color: row.status === "converted" ? "var(--sot-verify)" : "var(--sot-fg-1)",
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {fmtCurrency(row.value)}
      </td>
      <td style={{ padding: "14px 16px" }}>
        {agent ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 22,
                height: 22,
                background: "var(--sot-surface-3)",
                border: "1px solid var(--sot-line-strong)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--sot-font-mono)",
                fontSize: 9,
                color: "var(--sot-fg-1)",
                fontWeight: 600,
              }}
            >
              {agent.name.split(" ").map((s) => s[0]).join("")}
            </div>
            <span style={{ fontSize: 12, color: "var(--sot-fg-2)" }}>{agent.name}</span>
          </div>
        ) : (
          <span
            className="sot-mono"
            style={{ fontSize: 10, color: "var(--sot-fg-4)", letterSpacing: "var(--sot-tracking-tag)" }}
          >
            UNASSIGNED
          </span>
        )}
      </td>
      <td
        style={{
          padding: "14px 16px",
          fontFamily: "var(--sot-font-mono)",
          fontSize: 12,
          color: "var(--sot-fg-3)",
        }}
      >
        {fmtRelDate(row.lastContact)}
      </td>
      <td
        style={{ padding: "14px 16px", textAlign: "right" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "inline-flex", gap: 4 }}>
          <IconBtn name="phone" title="Call" />
          <IconBtn name="mail" title="Email" />
          <IconBtn name="pencil" title="Edit" />
          <IconBtn name="trash-2" title="Delete" danger />
        </div>
      </td>
    </tr>
  );
}

function IconBtn({ name, title, danger }) {
  return (
    <button
      className="sot-btn ghost"
      title={title}
      style={{
        height: 28,
        width: 28,
        padding: 0,
        justifyContent: "center",
        color: danger ? "var(--sot-fg-3)" : "var(--sot-fg-2)",
      }}
      onMouseEnter={(e) => {
        if (danger) e.currentTarget.style.color = "var(--sot-alert)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = danger ? "var(--sot-fg-3)" : "var(--sot-fg-2)";
      }}
    >
      <Icon name={name} size={12} />
    </button>
  );
}

/* ============================================================
   CARD VIEW
   ============================================================ */
function LeadsCards({ rows, selected, setSelected, onChangeStatus }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "var(--sot-s-3)",
      }}
    >
      {rows.map((r) => (
        <LeadCard
          key={r.id}
          row={r}
          checked={selected.includes(r.id)}
          onToggle={() =>
            setSelected(
              selected.includes(r.id)
                ? selected.filter((s) => s !== r.id)
                : [...selected, r.id]
            )
          }
          onChangeStatus={(s) => onChangeStatus(r.id, s)}
        />
      ))}
    </div>
  );
}

function LeadCard({ row, checked, onToggle, onChangeStatus }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    setTimeout(() => window.addEventListener("click", handler), 0);
    return () => window.removeEventListener("click", handler);
  }, [menuOpen]);
  const agent = AGENTS.find((a) => a.id === row.assigned);

  return (
    <div
      className="sot-card"
      style={{
        padding: 0,
        background: checked ? "var(--sot-surface-2)" : "var(--sot-surface-1)",
        borderColor: checked ? "var(--sot-verify)" : "var(--sot-line)",
        position: "relative",
        transition: "all var(--sot-dur-fast) var(--sot-ease)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top: checkbox + status + menu */}
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid var(--sot-line)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Checkbox checked={checked} onChange={onToggle} />
        <StatusPill status={row.status} />
        <span style={{ flex: 1 }} />
        <span
          className="sot-mono"
          style={{ fontSize: 9, color: "var(--sot-fg-4)" }}
        >
          {row.id}
        </span>
        <span ref={menuRef} style={{ position: "relative" }}>
          <button
            className="sot-btn ghost"
            style={{ height: 26, width: 26, padding: 0, justifyContent: "center" }}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
          >
            <Icon name="more-vertical" size={12} />
          </button>
          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 4,
                zIndex: 10,
                background: "var(--sot-surface-2)",
                border: "1px solid var(--sot-line-strong)",
                padding: 4,
                minWidth: 160,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {[
                { label: "Call", icon: "phone" },
                { label: "Email", icon: "mail" },
                { label: "Edit", icon: "pencil" },
                { label: "Delete", icon: "trash-2", danger: true },
              ].map((m) => (
                <button
                  key={m.label}
                  style={{
                    padding: "6px 10px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: m.danger ? "var(--sot-alert)" : "var(--sot-fg-1)",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--sot-surface-3)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <Icon name={m.icon} size={12} /> {m.label}
                </button>
              ))}
            </div>
          )}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              background: "var(--sot-ink)",
              border: "1px solid var(--sot-line-strong)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--sot-font-mono)",
              fontSize: 13,
              color: "var(--sot-fg-1)",
              fontWeight: 600,
            }}
          >
            {row.name.split(" ").map((s) => s[0]).join("")}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--sot-fg-1)",
                letterSpacing: "-0.005em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {row.name}
            </div>
            <div
              className="sot-mono"
              style={{ fontSize: 10, color: "var(--sot-fg-3)", letterSpacing: "var(--sot-tracking-tag)", textTransform: "uppercase" }}
            >
              {row.company}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{
              fontFamily: "var(--sot-font-mono)",
              fontSize: 11,
              color: "var(--sot-fg-2)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="mail" size={11} color="var(--sot-fg-4)" /> {row.email}
          </span>
          <span
            style={{
              fontFamily: "var(--sot-font-mono)",
              fontSize: 11,
              color: "var(--sot-fg-2)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="phone" size={11} color="var(--sot-fg-4)" /> {row.phone}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <div>
            <span className="sot-tag" style={{ fontSize: 9, display: "block", marginBottom: 4 }}>
              QUALITY
            </span>
            <QualityBars score={row.quality} />
          </div>
          <div style={{ textAlign: "right" }}>
            <span className="sot-tag" style={{ fontSize: 9, display: "block", marginBottom: 4 }}>
              LEAD_VALUE
            </span>
            <span
              style={{
                fontFamily: "var(--sot-font-mono)",
                fontSize: 16,
                fontWeight: 700,
                color: row.status === "converted" ? "var(--sot-verify)" : "var(--sot-fg-1)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {fmtCurrency(row.value)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "10px 14px",
          background: "var(--sot-ink)",
          borderTop: "1px solid var(--sot-line)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 11,
        }}
      >
        {agent ? (
          <>
            <div
              style={{
                width: 20,
                height: 20,
                background: "var(--sot-surface-3)",
                border: "1px solid var(--sot-line-strong)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--sot-font-mono)",
                fontSize: 9,
                color: "var(--sot-fg-1)",
                fontWeight: 600,
              }}
            >
              {agent.name.split(" ").map((s) => s[0]).join("")}
            </div>
            <span style={{ fontSize: 11, color: "var(--sot-fg-2)" }}>{agent.name}</span>
          </>
        ) : (
          <span
            className="sot-mono"
            style={{ fontSize: 10, color: "var(--sot-fg-4)" }}
          >
            UNASSIGNED
          </span>
        )}
        <span style={{ flex: 1 }} />
        <span className="sot-mono" style={{ fontSize: 10, color: "var(--sot-fg-3)" }}>
          {fmtRelDate(row.lastContact)}
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   SIDEBAR — breakdowns
   ============================================================ */
function Sidebar({ leads, collapsed, setCollapsed }) {
  const bySource = SOURCES.map((s) => ({
    label: s,
    count: leads.filter((l) => l.source === s).length,
  }));
  const byStatus = Object.keys(STATUS).map((k) => ({
    label: STATUS[k].label,
    color: STATUS[k].color,
    count: leads.filter((l) => l.status === k).length,
  }));
  const topAgents = AGENTS.map((a) => ({
    ...a,
    leads: leads.filter((l) => l.assigned === a.id).length,
  }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 5);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="sot-btn ghost"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 30,
          height: 40,
        }}
      >
        <Icon name="bar-chart-3" size={13} /> Breakdowns
      </button>
    );
  }

  return (
    <aside style={{ display: "flex", flexDirection: "column", gap: "var(--sot-s-3)" }}>
      {/* Source breakdown */}
      <div className="sot-card" style={{ padding: "var(--sot-s-5)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="git-merge" size={13} color="var(--sot-fg-2)" />
            <span
              className="sot-tag"
              style={{ color: "var(--sot-fg-1)", fontSize: 11, fontWeight: 600 }}
            >
              LEAD_SOURCE
            </span>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="sot-btn ghost"
            style={{ height: 24, width: 24, padding: 0, justifyContent: "center" }}
            title="Collapse"
          >
            <Icon name="x" size={11} />
          </button>
        </div>

        <SegmentBar segments={bySource} colors={["var(--sot-verify)", "var(--sot-fg-2)", "var(--sot-construction)"]} />
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          {bySource.map((s, i) => {
            const colors = ["var(--sot-verify)", "var(--sot-fg-2)", "var(--sot-construction)"];
            return (
              <div
                key={s.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                }}
              >
                <span style={{ width: 8, height: 8, background: colors[i] }} />
                <span style={{ flex: 1, color: "var(--sot-fg-2)" }}>{s.label}</span>
                <span
                  className="sot-mono"
                  style={{
                    color: "var(--sot-fg-1)",
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {s.count}
                </span>
                <span className="sot-mono" style={{ color: "var(--sot-fg-4)", width: 40, textAlign: "right" }}>
                  {pct(s.count, leads.length)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status breakdown */}
      <div className="sot-card" style={{ padding: "var(--sot-s-5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Icon name="git-branch" size={13} color="var(--sot-fg-2)" />
          <span
            className="sot-tag"
            style={{ color: "var(--sot-fg-1)", fontSize: 11, fontWeight: 600 }}
          >
            STATUS · BREAKDOWN
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {byStatus.map((s) => (
            <div key={s.label}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span
                  className="sot-tag"
                  style={{ fontSize: 10, color: s.color }}
                >
                  {s.label}
                </span>
                <span
                  className="sot-mono"
                  style={{
                    fontSize: 11,
                    color: "var(--sot-fg-1)",
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {s.count}
                  <span style={{ color: "var(--sot-fg-4)", fontWeight: 400 }}>
                    {" "}
                    · {pct(s.count, leads.length)}%
                  </span>
                </span>
              </div>
              <div
                style={{
                  height: 4,
                  background: "var(--sot-ink)",
                  border: "1px solid var(--sot-line)",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: pct(s.count, leads.length) + "%",
                    background: s.color,
                    transition: "width var(--sot-dur-slow) var(--sot-ease)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top agents */}
      <div className="sot-card" style={{ padding: "var(--sot-s-5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Icon name="trophy" size={13} color="var(--sot-fg-2)" />
          <span
            className="sot-tag"
            style={{ color: "var(--sot-fg-1)", fontSize: 11, fontWeight: 600 }}
          >
            TOP_AGENTS · BY_CONVERSIONS
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {topAgents.map((a, i) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                className="sot-mono"
                style={{
                  fontSize: 10,
                  color: i === 0 ? "var(--sot-verify)" : "var(--sot-fg-4)",
                  width: 18,
                  fontWeight: 600,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div
                style={{
                  width: 26,
                  height: 26,
                  background: "var(--sot-surface-3)",
                  border: "1px solid var(--sot-line-strong)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--sot-font-mono)",
                  fontSize: 10,
                  color: "var(--sot-fg-1)",
                  fontWeight: 600,
                }}
              >
                {a.name.split(" ").map((s) => s[0]).join("")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "var(--sot-fg-1)", fontWeight: 500 }}>
                  {a.name}
                </div>
                <div
                  className="sot-mono"
                  style={{ fontSize: 10, color: "var(--sot-fg-4)" }}
                >
                  {a.leads} ASSIGNED
                </div>
              </div>
              <Tag label="CONV" value={String(a.conv)} tone="verify" />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function SegmentBar({ segments, colors }) {
  const total = segments.reduce((s, x) => s + x.count, 0) || 1;
  return (
    <div
      style={{
        display: "flex",
        height: 10,
        background: "var(--sot-ink)",
        border: "1px solid var(--sot-line)",
        overflow: "hidden",
      }}
    >
      {segments.map((s, i) => (
        <div
          key={s.label}
          title={`${s.label}: ${s.count}`}
          style={{
            width: (s.count / total) * 100 + "%",
            background: colors[i % colors.length],
            transition: "width var(--sot-dur-slow) var(--sot-ease)",
          }}
        />
      ))}
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
  const items = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) items.push(i);
    else if (items[items.length - 1] !== "…") items.push("…");
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
        SHOWING {start}–{end} OF {total} LEADS
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
   ROOT
   ============================================================ */
function LeadsManagementPage() {
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    qMin: 0,
    qMax: 10,
    source: "all",
    assigned: "all",
    from: "2026-04-01",
    to: "2026-05-24",
  });
  const [view, setView] = useState("table");
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [leads, setLeads] = useState(ALL_LEADS);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const PER_PAGE = 20;

  /* Apply filters */
  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const fromD = new Date(filters.from);
    const toD = new Date(filters.to);
    toD.setHours(23, 59, 59, 999);
    return leads.filter((l) => {
      if (q) {
        const hay = `${l.name} ${l.email} ${l.phone} ${l.company}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.status !== "all" && l.status !== filters.status) return false;
      if (l.quality < filters.qMin || l.quality > filters.qMax) return false;
      if (filters.source !== "all" && l.source !== filters.source) return false;
      if (filters.assigned === "unassigned" && l.assigned !== null) return false;
      if (
        filters.assigned !== "all" &&
        filters.assigned !== "unassigned" &&
        l.assigned !== filters.assigned
      )
        return false;
      if (l.lastContact < fromD || l.lastContact > toD) return false;
      return true;
    });
  }, [leads, filters]);

  useEffect(() => {
    setPage(1);
  }, [
    filters.search,
    filters.status,
    filters.qMin,
    filters.qMax,
    filters.source,
    filters.assigned,
    filters.from,
    filters.to,
  ]);

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleChangeStatus = (id, newStatus) => {
    setLeads((ls) =>
      ls.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    );
  };
  const handleBulkStatus = (newStatus) => {
    setLeads((ls) =>
      ls.map((l) => (selected.includes(l.id) ? { ...l, status: newStatus } : l))
    );
    setSelected([]);
  };
  const handleBulkAssign = (agentId) => {
    if (!agentId) return;
    setLeads((ls) =>
      ls.map((l) => (selected.includes(l.id) ? { ...l, assigned: agentId } : l))
    );
    setSelected([]);
  };

  return (
    <div className="sot sot-grid" style={{ minHeight: "100vh", paddingBottom: 48 }}>
      <PageHeader />

      <main
        style={{
          maxWidth: 1600,
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
                flexWrap: "wrap",
              }}
            >
              <Tag label="MODULE" value="LEAD_OPS" tone="verify" />
              <Tag label="CRM" value="CONNECTED" tone="verify" />
              <Tag label="LAST_SYNC" value="2_MIN_AGO" />
            </div>
            <h1
              className="sot-h2"
              style={{ fontSize: 32, letterSpacing: "-0.02em" }}
            >
              Qualified leads.
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
              Every qualified lead, owner-assigned and tracked through to conversion. The source of truth for the pipeline.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="sot-btn ghost" style={{ height: 36 }}>
              <Icon name="upload" size={13} /> Import leads
            </button>
            <button className="sot-btn ghost" style={{ height: 36 }}>
              <Icon name="download" size={13} /> Export CSV
            </button>
            <button className="sot-btn primary" style={{ height: 36 }}>
              <Icon name="refresh-cw" size={13} color="black" /> Sync to CRM
            </button>
          </div>
        </div>

        <KpiStrip leads={leads} />

        {/* Main grid: content + sidebar */}
        <div
          className="leads-grid"
          style={{
            display: "grid",
            gridTemplateColumns: sidebarCollapsed ? "1fr" : "minmax(0,1fr) 320px",
            gap: "var(--sot-s-4)",
            alignItems: "start",
          }}
        >
          <div>
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              view={view}
              setView={setView}
              total={leads.length}
              resultCount={filtered.length}
            />

            <BulkActionBar
              selected={selected}
              onSetStatus={handleBulkStatus}
              onAssign={handleBulkAssign}
              onClear={() => setSelected([])}
            />

            {view === "table" ? (
              <LeadsTable
                rows={paged}
                selected={selected}
                setSelected={setSelected}
                onChangeStatus={handleChangeStatus}
              />
            ) : (
              <LeadsCards
                rows={paged}
                selected={selected}
                setSelected={setSelected}
                onChangeStatus={handleChangeStatus}
              />
            )}

            <Pagination
              page={page}
              total={filtered.length}
              perPage={PER_PAGE}
              onPage={setPage}
            />
          </div>

          {!sidebarCollapsed && (
            <Sidebar
              leads={leads}
              collapsed={sidebarCollapsed}
              setCollapsed={setSidebarCollapsed}
            />
          )}
        </div>

        {sidebarCollapsed && (
          <Sidebar
            leads={leads}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
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
            VOICE_AI_AGENT // LEADS // v2.4.1
          </span>
          <div style={{ display: "flex", gap: 14 }}>
            <Tag label="OWNER" value="REVOPS_TEAM" />
            <Tag label="RETENTION" value="180_DAYS" />
            <Tag label="SOURCE_OF_TRUTH" value="CONFIRMED" tone="verify" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default LeadsManagementPage;
