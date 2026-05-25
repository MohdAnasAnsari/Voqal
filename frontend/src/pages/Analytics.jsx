import React, { useState, useEffect, useRef, useMemo } from 'react';
/* ============================================================
   AnalyticsReportsPage — SOT design system
   Hand-rolled SVG charts in engineering-chic vocabulary
   ============================================================ */


/* ---------- Lucide helper ---------- */
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

function Section({ title, icon, children, action, padded = true, minHeight }) {
  return (
    <div
      className="sot-card"
      style={{
        padding: 0,
        display: "flex",
        flexDirection: "column",
        minHeight: minHeight || "auto",
      }}
    >
      <div
        style={{
          padding: "var(--sot-s-4) var(--sot-s-5)",
          borderBottom: "1px solid var(--sot-line)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {icon && <Icon name={icon} size={13} color="var(--sot-fg-2)" />}
        <span
          className="sot-tag"
          style={{ color: "var(--sot-fg-1)", fontSize: 11, fontWeight: 600 }}
        >
          {title}
        </span>
        <span style={{ flex: 1 }} />
        {action}
      </div>
      <div style={{ padding: padded ? "var(--sot-s-5)" : 0, flex: 1 }}>{children}</div>
    </div>
  );
}

/* ============================================================
   MOCK DATA
   ============================================================ */
const KPIS = [
  { id: "total_calls",   label: "TOTAL_CALLS",      value: 156,    unit: "",  delta: 12,    trend: "up",   sub: "vs last period",   icon: "phone" },
  { id: "answered",      label: "ANSWERED_CALLS",   value: 142,    unit: "",  delta: 8,     trend: "up",   sub: "91% answer rate",   icon: "phone-incoming", tone: "verify" },
  { id: "qualified",     label: "QUALIFIED_LEADS",  value: 89,     unit: "",  delta: 18,    trend: "up",   sub: "57% qual rate",     icon: "user-check", tone: "verify" },
  { id: "conversions",   label: "CONVERSIONS",      value: 23,     unit: "",  delta: -4,    trend: "down", sub: "26% conv rate",     icon: "check-circle-2" },
  { id: "avg_duration",  label: "AVG_CALL_DURATION", value: "2:15", unit: "", delta: 6,    trend: "up",   sub: "min per call",      icon: "timer", isText: true },
  { id: "revenue",       label: "TOTAL_REVENUE",    value: 15400,  unit: "$", delta: 22,    trend: "up",   sub: "closed-won",        icon: "dollar-sign", tone: "verify" },
];

const TIME_SERIES = [
  { day: "MON", calls: 18, answered: 17, qualified: 11 },
  { day: "TUE", calls: 22, answered: 20, qualified: 13 },
  { day: "WED", calls: 28, answered: 26, qualified: 17 },
  { day: "THU", calls: 24, answered: 23, qualified: 14 },
  { day: "FRI", calls: 31, answered: 28, qualified: 19 },
  { day: "SAT", calls: 14, answered: 12, qualified: 7 },
  { day: "SUN", calls: 19, answered: 16, qualified: 8 },
];

const QUALITY_DIST = [
  { score: 1, count: 3 },
  { score: 2, count: 5 },
  { score: 3, count: 8 },
  { score: 4, count: 11 },
  { score: 5, count: 16 },
  { score: 6, count: 21 },
  { score: 7, count: 28 },
  { score: 8, count: 32 },
  { score: 9, count: 22 },
  { score: 10, count: 10 },
];

const INTENT_BREAKDOWN = [
  { label: "Lead Qualification", value: 62, pct: 40 },
  { label: "Support",            value: 47, pct: 30 },
  { label: "Appointment Booking", value: 31, pct: 20 },
  { label: "Other",              value: 16, pct: 10 },
];

const FUNNEL = [
  { stage: "TOTAL_CALLS",  count: 156, base: 156 },
  { stage: "ANSWERED",     count: 142, base: 156 },
  { stage: "QUALIFIED",    count: 89,  base: 156 },
  { stage: "CONTACTED",    count: 67,  base: 156 },
  { stage: "CONVERTED",    count: 23,  base: 156 },
];

const AGENTS = [
  { id: "M_JOHNSTON", name: "M. Johnston", calls: 38, qualified: 24, conversionRate: 0.34, revenue: 5400 },
  { id: "K_ALVAREZ",  name: "K. Alvarez",  calls: 32, qualified: 19, conversionRate: 0.28, revenue: 3800 },
  { id: "R_PATEL",    name: "R. Patel",    calls: 28, qualified: 16, conversionRate: 0.25, revenue: 2900 },
  { id: "S_NAKAMURA", name: "S. Nakamura", calls: 24, qualified: 13, conversionRate: 0.21, revenue: 1800 },
  { id: "J_OBRIEN",   name: "J. O'Brien",  calls: 21, qualified: 10, conversionRate: 0.19, revenue: 1500 },
  { id: "ARIA_AI",    name: "ARIA · AI Agent", calls: 156, qualified: 89, conversionRate: 0.57, revenue: null, isAI: true },
];

const TOP_INTENTS = [
  { label: "Lead Qualification", count: 62 },
  { label: "Support Request",    count: 47 },
  { label: "Meeting Booking",    count: 31 },
  { label: "Pricing Inquiry",    count: 22 },
  { label: "Cancellation",       count: 8  },
];

const SECONDARY_METRICS = [
  { label: "AVG_RESPONSE_TIME", value: "0.8", unit: "s",   icon: "zap",          tone: "verify" },
  { label: "AI_ACCURACY",       value: "94",  unit: "%",   icon: "shield-check", tone: "verify" },
  { label: "CSAT",              value: "4.2", unit: "/5",  icon: "smile",        tone: "verify" },
  { label: "COST_PER_CALL",     value: "0.15", unit: "$",  icon: "dollar-sign", mono: true },
  { label: "CPQL",              value: "2.64", unit: "$",  icon: "user-check",  mono: true,    sub: "cost per qual lead" },
];

const fmtNum = (n) => (typeof n === "number" ? n.toLocaleString() : n);
const fmtPct = (n) => `${Math.round(n * 100)}%`;

/* ============================================================
   TOP NAV
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
          { label: "LEADS",        href: "/leads" },
          { label: "AGENTS",       href: "/agents" },
          { label: "ANALYTICS",    href: "#", active: true },
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
   PAGE TOOLBAR — date range + compare + export
   ============================================================ */
function Toolbar({ from, to, setFrom, setTo, preset, setPreset, compare, setCompare }) {
  const presets = [
    { id: "7d",  label: "7D" },
    { id: "30d", label: "30D" },
    { id: "90d", label: "90D" },
    { id: "ytd", label: "YTD" },
    { id: "custom", label: "CUSTOM" },
  ];
  return (
    <div
      className="sot-card"
      style={{
        padding: "var(--sot-s-4) var(--sot-s-5)",
        marginBottom: "var(--sot-s-4)",
        display: "flex",
        gap: "var(--sot-s-3)",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      {/* Preset range */}
      <div style={{ display: "flex", border: "1px solid var(--sot-line-strong)" }}>
        {presets.map((p, i, arr) => (
          <button
            key={p.id}
            onClick={() => setPreset(p.id)}
            style={{
              padding: "0 12px",
              height: 34,
              background: preset === p.id ? "var(--sot-surface-3)" : "transparent",
              color: preset === p.id ? "var(--sot-fg-1)" : "var(--sot-fg-3)",
              border: "none",
              borderRight: i === arr.length - 1 ? "none" : "1px solid var(--sot-line)",
              cursor: "pointer",
              fontFamily: "var(--sot-font-mono)",
              fontSize: 10,
              letterSpacing: "var(--sot-tracking-tag)",
              fontWeight: 600,
              transition: "background var(--sot-dur-fast) var(--sot-ease)",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Date range */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name="calendar" size={13} color="var(--sot-fg-3)" />
        <input
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setPreset("custom");
          }}
          className="sot-field"
          style={{ height: 34, fontSize: 12, padding: "0 8px", fontFamily: "var(--sot-font-mono)" }}
        />
        <span style={{ color: "var(--sot-fg-4)" }}>→</span>
        <input
          type="date"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setPreset("custom");
          }}
          className="sot-field"
          style={{ height: 34, fontSize: 12, padding: "0 8px", fontFamily: "var(--sot-font-mono)" }}
        />
      </div>

      {/* Compare */}
      <label
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          padding: "0 12px",
          height: 34,
          border: `1px solid ${compare ? "var(--sot-verify)" : "var(--sot-line-strong)"}`,
          background: compare ? "var(--sot-verify-soft)" : "transparent",
          color: compare ? "var(--sot-verify)" : "var(--sot-fg-3)",
          fontFamily: "var(--sot-font-mono)",
          fontSize: 10,
          letterSpacing: "var(--sot-tracking-tag)",
          fontWeight: 600,
          userSelect: "none",
        }}
      >
        <input
          type="checkbox"
          checked={compare}
          onChange={(e) => setCompare(e.target.checked)}
          style={{ display: "none" }}
        />
        <Icon name={compare ? "check" : "git-compare"} size={12} color={compare ? "var(--sot-verify)" : "var(--sot-fg-3)"} />
        COMPARE_TO_PREVIOUS
      </label>

      <span style={{ flex: 1 }} />

      <button className="sot-btn ghost" style={{ height: 34 }}>
        <Icon name="printer" size={12} /> Print
      </button>
      <button className="sot-btn primary" style={{ height: 34 }}>
        <Icon name="file-output" size={12} color="black" /> Export report
      </button>
    </div>
  );
}

/* ============================================================
   KPI CARD
   ============================================================ */
function KpiCard({ kpi }) {
  const trendColor =
    kpi.trend === "up"
      ? "var(--sot-verify)"
      : kpi.trend === "down"
      ? "var(--sot-alert)"
      : "var(--sot-fg-3)";

  const valueDisplay = kpi.isText
    ? kpi.value
    : kpi.unit === "$"
    ? "$" + kpi.value.toLocaleString()
    : kpi.value.toLocaleString();

  return (
    <div className="sot-card" style={{ padding: "var(--sot-s-5)", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Icon
          name={kpi.icon}
          size={13}
          color={kpi.tone === "verify" ? "var(--sot-verify)" : "var(--sot-fg-3)"}
        />
        <span className="sot-tag" style={{ fontSize: 10 }}>
          {kpi.label}
        </span>
      </div>
      <div
        style={{
          fontFamily: "var(--sot-font-sans)",
          fontSize: 36,
          fontWeight: 800,
          color: kpi.tone === "verify" ? "var(--sot-verify)" : "var(--sot-fg-1)",
          letterSpacing: "-0.025em",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          marginBottom: 8,
        }}
      >
        {valueDisplay}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 11,
        }}
      >
        <span
          className="sot-mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            color: trendColor,
            fontWeight: 600,
          }}
        >
          <Icon
            name={kpi.trend === "up" ? "arrow-up-right" : "arrow-down-right"}
            size={11}
            color={trendColor}
          />
          {Math.abs(kpi.delta)}%
        </span>
        <span className="sot-mono" style={{ color: "var(--sot-fg-3)", fontSize: 11 }}>
          {kpi.sub}
        </span>
      </div>
      {/* corner tick */}
      <span
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 8,
          height: 8,
          borderTop: "1px solid var(--sot-construction)",
          borderRight: "1px solid var(--sot-construction)",
        }}
      />
    </div>
  );
}

/* ============================================================
   CHART HELPERS — chart frame with grid + axes
   ============================================================ */
function ChartFrame({ width, height, padL = 44, padR = 16, padT = 16, padB = 32, ticksY = 4, maxY, formatY = (v) => v, children }) {
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const ticks = [];
  for (let i = 0; i <= ticksY; i++) {
    const v = (maxY / ticksY) * i;
    const y = padT + innerH - (v / maxY) * innerH;
    ticks.push({ v: Math.round(v), y });
  }
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: "100%", height: "100%", display: "block", overflow: "visible" }}
    >
      {/* Y-axis ticks + grid */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={padL}
            x2={width - padR}
            y1={t.y}
            y2={t.y}
            stroke="var(--sot-line)"
            strokeWidth="1"
            strokeDasharray={i === 0 ? "0" : "2 4"}
          />
          <text
            x={padL - 8}
            y={t.y + 3}
            fontFamily="var(--sot-font-mono)"
            fontSize="9"
            fill="var(--sot-fg-4)"
            textAnchor="end"
            letterSpacing="0.06em"
          >
            {formatY(t.v)}
          </text>
        </g>
      ))}
      {/* Children get a transform so they draw inside the inner area */}
      {children({ innerW, innerH, padL, padT, padB, padR })}
    </svg>
  );
}

/* ============================================================
   CHART 1 — Multi-series line (Calls over time)
   ============================================================ */
function CallsOverTimeChart({ data }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const width = 720;
  const height = 260;
  const maxY = Math.ceil(Math.max(...data.map((d) => d.calls)) / 5) * 5 + 5;

  const series = [
    { key: "calls",     label: "TOTAL_CALLS",      color: "var(--sot-fg-2)",   width: 2 },
    { key: "answered",  label: "ANSWERED",         color: "var(--sot-verify)", width: 2 },
    { key: "qualified", label: "QUALIFIED",        color: "var(--sot-construction)", width: 2, dashed: true },
  ];

  const padL = 44, padR = 24, padT = 16, padB = 36;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const xAt = (i) => padL + (i / (data.length - 1)) * innerW;
  const yAt = (v) => padT + innerH - (v / maxY) * innerH;

  return (
    <div>
      <div style={{ position: "relative", height: 280 }}>
        <ChartFrame
          width={width}
          height={height}
          padL={padL}
          padR={padR}
          padT={padT}
          padB={padB}
          maxY={maxY}
          ticksY={4}
        >
          {() => (
            <>
              {/* X-axis labels */}
              {data.map((d, i) => (
                <text
                  key={i}
                  x={xAt(i)}
                  y={height - padB + 16}
                  fontFamily="var(--sot-font-mono)"
                  fontSize="10"
                  fill="var(--sot-fg-3)"
                  textAnchor="middle"
                  letterSpacing="0.08em"
                  fontWeight="600"
                >
                  {d.day}
                </text>
              ))}

              {/* Series lines */}
              {series.map((s) => {
                const points = data.map((d, i) => `${xAt(i)},${yAt(d[s.key])}`).join(" ");
                return (
                  <polyline
                    key={s.key}
                    points={points}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={s.width}
                    strokeDasharray={s.dashed ? "4 4" : "0"}
                  />
                );
              })}

              {/* Hover overlay & dots */}
              {data.map((d, i) => (
                <g key={i}>
                  <rect
                    x={xAt(i) - innerW / data.length / 2}
                    y={padT}
                    width={innerW / data.length}
                    height={innerH}
                    fill="transparent"
                    onMouseEnter={() => setHoverIdx(i)}
                    onMouseLeave={() => setHoverIdx(null)}
                    style={{ cursor: "crosshair" }}
                  />
                  {hoverIdx === i && (
                    <line
                      x1={xAt(i)}
                      x2={xAt(i)}
                      y1={padT}
                      y2={padT + innerH}
                      stroke="var(--sot-verify)"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )}
                  {series.map((s) => (
                    <circle
                      key={s.key}
                      cx={xAt(i)}
                      cy={yAt(d[s.key])}
                      r={hoverIdx === i ? 4 : 0}
                      fill="var(--sot-black)"
                      stroke={s.color}
                      strokeWidth="2"
                      style={{ transition: "r var(--sot-dur-fast) var(--sot-ease)" }}
                    />
                  ))}
                </g>
              ))}
            </>
          )}
        </ChartFrame>

        {/* Tooltip */}
        {hoverIdx != null && (
          <div
            style={{
              position: "absolute",
              left: `${(xAt(hoverIdx) / width) * 100}%`,
              top: 8,
              transform:
                hoverIdx > data.length / 2 ? "translateX(-105%)" : "translateX(5%)",
              background: "var(--sot-surface-2)",
              border: "1px solid var(--sot-line-strong)",
              padding: "10px 12px",
              fontFamily: "var(--sot-font-mono)",
              fontSize: 11,
              pointerEvents: "none",
              minWidth: 130,
            }}
          >
            <div
              className="sot-tag"
              style={{ fontSize: 10, color: "var(--sot-fg-1)", marginBottom: 6, fontWeight: 600 }}
            >
              {data[hoverIdx].day}
            </div>
            {series.map((s) => (
              <div
                key={s.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 3,
                  color: "var(--sot-fg-2)",
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 2,
                    background: s.color,
                  }}
                />
                <span style={{ flex: 1, fontSize: 10, letterSpacing: "var(--sot-tracking-tag)" }}>
                  {s.label}
                </span>
                <span style={{ color: "var(--sot-fg-1)", fontWeight: 600 }}>
                  {data[hoverIdx][s.key]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid var(--sot-line)",
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
          fontFamily: "var(--sot-font-mono)",
          fontSize: 10,
          letterSpacing: "var(--sot-tracking-tag)",
        }}
      >
        {series.map((s) => (
          <span
            key={s.key}
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <span
              style={{
                width: 14,
                height: 2,
                background: s.color,
                borderStyle: s.dashed ? "dashed" : "solid",
              }}
            />
            <span style={{ color: "var(--sot-fg-2)", fontWeight: 600 }}>{s.label}</span>
            <span style={{ color: "var(--sot-fg-4)" }}>
              · {data.reduce((sum, d) => sum + d[s.key], 0)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   CHART 2 — Quality distribution bars
   ============================================================ */
function QualityDistChart({ data }) {
  const width = 720;
  const height = 240;
  const padL = 44, padR = 24, padT = 16, padB = 36;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const maxY = Math.ceil(Math.max(...data.map((d) => d.count)) / 5) * 5 + 5;
  const barW = innerW / data.length - 6;

  const colorFor = (score) =>
    score >= 7
      ? "var(--sot-verify)"
      : score >= 4
      ? "var(--sot-warn)"
      : "var(--sot-alert)";

  return (
    <div style={{ height: 260 }}>
      <ChartFrame width={width} height={height} padL={padL} padR={padR} padT={padT} padB={padB} maxY={maxY} ticksY={4}>
        {() => (
          <>
            {data.map((d, i) => {
              const x = padL + (i / data.length) * innerW + 3;
              const y = padT + innerH - (d.count / maxY) * innerH;
              const h = (d.count / maxY) * innerH;
              return (
                <g key={d.score}>
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={h}
                    fill={colorFor(d.score)}
                    opacity={0.18}
                  />
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={2}
                    fill={colorFor(d.score)}
                  />
                  <text
                    x={x + barW / 2}
                    y={y - 6}
                    fontFamily="var(--sot-font-mono)"
                    fontSize="10"
                    fill={colorFor(d.score)}
                    textAnchor="middle"
                    fontWeight="700"
                  >
                    {d.count}
                  </text>
                  <text
                    x={x + barW / 2}
                    y={height - padB + 16}
                    fontFamily="var(--sot-font-mono)"
                    fontSize="10"
                    fill="var(--sot-fg-3)"
                    textAnchor="middle"
                    letterSpacing="0.06em"
                    fontWeight="600"
                  >
                    {d.score}
                  </text>
                </g>
              );
            })}
            {/* x-axis label */}
            <text
              x={padL + innerW / 2}
              y={height - 4}
              fontFamily="var(--sot-font-mono)"
              fontSize="9"
              fill="var(--sot-fg-4)"
              textAnchor="middle"
              letterSpacing="0.12em"
            >
              QUALITY_SCORE →
            </text>
          </>
        )}
      </ChartFrame>
    </div>
  );
}

/* ============================================================
   CHART 3 — Donut / pie (Call intent breakdown)
   ============================================================ */
function IntentDonut({ data, selected, onSelect }) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 88;
  const rIn = 56;
  const total = data.reduce((s, d) => s + d.value, 0);

  const colors = [
    "var(--sot-verify)",
    "var(--sot-fg-2)",
    "var(--sot-construction)",
    "var(--sot-fg-3)",
  ];

  const arcs = useMemo(() => {
    let cum = 0;
    return data.map((d, i) => {
      const start = (cum / total) * Math.PI * 2 - Math.PI / 2;
      cum += d.value;
      const end = (cum / total) * Math.PI * 2 - Math.PI / 2;
      const isLarge = end - start > Math.PI ? 1 : 0;
      const x1 = cx + Math.cos(start) * r;
      const y1 = cy + Math.sin(start) * r;
      const x2 = cx + Math.cos(end) * r;
      const y2 = cy + Math.sin(end) * r;
      const x3 = cx + Math.cos(end) * rIn;
      const y3 = cy + Math.sin(end) * rIn;
      const x4 = cx + Math.cos(start) * rIn;
      const y4 = cy + Math.sin(start) * rIn;
      const path = `M ${x1} ${y1} A ${r} ${r} 0 ${isLarge} 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 ${isLarge} 0 ${x4} ${y4} Z`;
      return { path, color: colors[i % colors.length], ...d };
    });
  }, [data]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 24, alignItems: "center" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", height: "100%" }}>
          {arcs.map((a, i) => (
            <path
              key={i}
              d={a.path}
              fill={a.color}
              opacity={selected != null && selected !== i ? 0.25 : 1}
              stroke="var(--sot-black)"
              strokeWidth="2"
              style={{
                cursor: "pointer",
                transition: "opacity var(--sot-dur-fast) var(--sot-ease)",
              }}
              onClick={() => onSelect(selected === i ? null : i)}
            />
          ))}
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <span className="sot-tag" style={{ fontSize: 9, color: "var(--sot-fg-4)" }}>
            TOTAL_INTENTS
          </span>
          <span
            style={{
              fontFamily: "var(--sot-font-sans)",
              fontSize: 32,
              fontWeight: 800,
              color: "var(--sot-fg-1)",
              letterSpacing: "-0.02em",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
              marginTop: 4,
            }}
          >
            {total}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {arcs.map((a, i) => (
          <button
            key={i}
            onClick={() => onSelect(selected === i ? null : i)}
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto auto",
              gap: 10,
              alignItems: "center",
              padding: "10px 0",
              borderBottom: "1px dashed var(--sot-line)",
              cursor: "pointer",
              background: "transparent",
              border: "none",
              textAlign: "left",
              borderTop: "none",
              opacity: selected != null && selected !== i ? 0.4 : 1,
              transition: "opacity var(--sot-dur-fast) var(--sot-ease)",
            }}
          >
            <span style={{ width: 10, height: 10, background: a.color }} />
            <span style={{ fontSize: 13, color: "var(--sot-fg-1)", fontWeight: 500 }}>
              {a.label}
            </span>
            <span
              className="sot-mono"
              style={{
                fontSize: 13,
                color: "var(--sot-fg-1)",
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {a.value}
            </span>
            <span
              className="sot-mono"
              style={{ fontSize: 11, color: "var(--sot-fg-3)", width: 40, textAlign: "right" }}
            >
              {a.pct}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   CHART 4 — Conversion funnel
   ============================================================ */
function FunnelChart({ data }) {
  const max = data[0].count;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {data.map((s, i) => {
        const widthPct = (s.count / max) * 100;
        const prev = i === 0 ? null : data[i - 1];
        const dropoff = prev ? prev.count - s.count : 0;
        const dropoffPct = prev ? (dropoff / prev.count) * 100 : 0;
        const conversionFromTop = (s.count / max) * 100;
        return (
          <div key={s.stage}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
              <span
                className="sot-mono"
                style={{
                  fontSize: 10,
                  color: "var(--sot-fg-4)",
                  letterSpacing: "var(--sot-tracking-tag)",
                  fontWeight: 700,
                  width: 28,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="sot-tag" style={{ fontSize: 11, color: "var(--sot-fg-1)", fontWeight: 600 }}>
                {s.stage}
              </span>
              <span style={{ flex: 1 }} />
              <span
                className="sot-mono"
                style={{
                  fontSize: 13,
                  color: "var(--sot-fg-1)",
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {s.count}
              </span>
              <span
                className="sot-mono"
                style={{
                  fontSize: 11,
                  color: "var(--sot-verify)",
                  width: 56,
                  textAlign: "right",
                  fontWeight: 600,
                }}
              >
                {conversionFromTop.toFixed(1)}%
              </span>
            </div>
            <div
              style={{
                position: "relative",
                height: 24,
                background: "var(--sot-ink)",
                border: "1px solid var(--sot-line)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: widthPct + "%",
                  background: i === data.length - 1 ? "var(--sot-verify)" : "var(--sot-fg-2)",
                  opacity: i === data.length - 1 ? 1 : 0.35,
                  transition: "width var(--sot-dur-slow) var(--sot-ease)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: 0,
                  width: widthPct + "%",
                  height: 2,
                  background: i === data.length - 1 ? "var(--sot-verify)" : "var(--sot-fg-2)",
                }}
              />
            </div>
            {/* Drop-off label */}
            {prev && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 6,
                  marginTop: 4,
                  marginBottom: 8,
                  paddingRight: 4,
                }}
              >
                <Icon name="arrow-down-right" size={11} color="var(--sot-alert)" />
                <span
                  className="sot-mono"
                  style={{
                    fontSize: 10,
                    color: "var(--sot-alert)",
                    fontWeight: 600,
                    letterSpacing: "var(--sot-tracking-mono)",
                  }}
                >
                  DROPPED {dropoff} ({dropoffPct.toFixed(0)}%)
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   CHART 5 — Agent performance table
   ============================================================ */
function AgentTable({ agents }) {
  const [sortKey, setSortKey] = useState("conversionRate");
  const [sortDir, setSortDir] = useState("desc");
  const sorted = useMemo(() => {
    const arr = [...agents];
    arr.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      let av = a[sortKey], bv = b[sortKey];
      if (av == null) av = -1;
      if (bv == null) bv = -1;
      if (typeof av === "string") return av.localeCompare(bv) * dir;
      return (av - bv) * dir;
    });
    return arr;
  }, [agents, sortKey, sortDir]);
  const onSort = (k) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  };

  const cols = [
    { id: "name",            label: "AGENT",        sortable: false, align: "left" },
    { id: "calls",           label: "CALLS",        sortable: true,  align: "right" },
    { id: "qualified",       label: "QUALIFIED",    sortable: true,  align: "right" },
    { id: "conversionRate",  label: "CONV_RATE",    sortable: true,  align: "right" },
    { id: "revenue",         label: "REVENUE",      sortable: true,  align: "right" },
  ];

  const maxCalls = Math.max(...agents.map((a) => a.calls));

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 540 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--sot-line)" }}>
            {cols.map((c) => (
              <th
                key={c.id}
                onClick={() => c.sortable && onSort(c.id)}
                style={{
                  textAlign: c.align,
                  padding: "10px 12px",
                  cursor: c.sortable ? "pointer" : "default",
                  userSelect: "none",
                }}
              >
                <span
                  className="sot-tag"
                  style={{
                    fontSize: 10,
                    color: sortKey === c.id ? "var(--sot-fg-1)" : "var(--sot-fg-3)",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {c.label}
                  {c.sortable && (
                    <Icon
                      name={
                        sortKey !== c.id
                          ? "chevrons-up-down"
                          : sortDir === "asc"
                          ? "chevron-up"
                          : "chevron-down"
                      }
                      size={10}
                      color={sortKey === c.id ? "var(--sot-verify)" : "var(--sot-fg-4)"}
                    />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((a, i) => (
            <tr
              key={a.id}
              style={{
                borderBottom: i === sorted.length - 1 ? "none" : "1px solid var(--sot-line)",
                background: i % 2 === 1 ? "rgba(255,255,255,.012)" : "transparent",
              }}
            >
              <td style={{ padding: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    className="sot-mono"
                    style={{
                      fontSize: 10,
                      color: i === 0 ? "var(--sot-verify)" : "var(--sot-fg-4)",
                      width: 18,
                      fontWeight: 700,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      background: a.isAI ? "var(--sot-verify-soft)" : "var(--sot-surface-3)",
                      border: `1px solid ${a.isAI ? "var(--sot-verify)" : "var(--sot-line-strong)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--sot-font-mono)",
                      fontSize: 10,
                      color: a.isAI ? "var(--sot-verify)" : "var(--sot-fg-1)",
                      fontWeight: 700,
                    }}
                  >
                    {a.isAI ? "AI" : a.name.split(" ").map((s) => s[0]).join("")}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "var(--sot-fg-1)", fontWeight: 600 }}>
                      {a.name}
                    </div>
                  </div>
                </div>
              </td>
              <td style={{ padding: "12px", textAlign: "right" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    width: 110,
                  }}
                >
                  <span
                    style={{
                      height: 4,
                      background: "var(--sot-ink)",
                      border: "1px solid var(--sot-line)",
                      flex: 1,
                      position: "relative",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: (a.calls / maxCalls) * 100 + "%",
                        background: a.isAI ? "var(--sot-verify)" : "var(--sot-fg-2)",
                      }}
                    />
                  </span>
                  <span
                    className="sot-mono"
                    style={{
                      fontSize: 12,
                      color: "var(--sot-fg-1)",
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                      width: 28,
                      textAlign: "right",
                    }}
                  >
                    {a.calls}
                  </span>
                </div>
              </td>
              <td
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontFamily: "var(--sot-font-mono)",
                  fontSize: 12,
                  color: "var(--sot-fg-1)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {a.qualified}
              </td>
              <td style={{ padding: "12px", textAlign: "right" }}>
                <span
                  style={{
                    fontFamily: "var(--sot-font-mono)",
                    fontSize: 13,
                    color: a.conversionRate >= 0.3 ? "var(--sot-verify)" : "var(--sot-fg-1)",
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {fmtPct(a.conversionRate)}
                </span>
              </td>
              <td
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontFamily: "var(--sot-font-mono)",
                  fontSize: 12,
                  color: a.revenue ? "var(--sot-fg-1)" : "var(--sot-fg-4)",
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {a.revenue ? "$" + a.revenue.toLocaleString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================
   CHART 6 — Horizontal bars (top intents)
   ============================================================ */
function TopIntentsChart({ data }) {
  const max = Math.max(...data.map((d) => d.count));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {data.map((d, i) => (
        <div key={d.label}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <span
              className="sot-mono"
              style={{
                fontSize: 10,
                color: i === 0 ? "var(--sot-verify)" : "var(--sot-fg-4)",
                fontWeight: 700,
                width: 18,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span style={{ fontSize: 13, color: "var(--sot-fg-1)", flex: 1 }}>
              {d.label}
            </span>
            <span
              className="sot-mono"
              style={{
                fontSize: 13,
                color: "var(--sot-fg-1)",
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {d.count}
            </span>
          </div>
          <div
            style={{
              height: 6,
              background: "var(--sot-ink)",
              border: "1px solid var(--sot-line)",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: (d.count / max) * 100 + "%",
                background: i === 0 ? "var(--sot-verify)" : "var(--sot-fg-2)",
                transition: "width var(--sot-dur-slow) var(--sot-ease)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   SECONDARY METRICS
   ============================================================ */
function SecondaryMetricsRow({ metrics }) {
  return (
    <div
      className="sot-card"
      style={{
        padding: 0,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      }}
    >
      {metrics.map((m, i, arr) => (
        <div
          key={m.label}
          style={{
            padding: "16px 20px",
            borderRight: i === arr.length - 1 ? "none" : "1px solid var(--sot-line)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icon
              name={m.icon}
              size={12}
              color={m.tone === "verify" ? "var(--sot-verify)" : "var(--sot-fg-3)"}
            />
            <span className="sot-tag" style={{ fontSize: 9 }}>
              {m.label}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 4,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <span
              style={{
                fontFamily: m.mono ? "var(--sot-font-mono)" : "var(--sot-font-sans)",
                fontSize: 26,
                fontWeight: 800,
                color: m.tone === "verify" ? "var(--sot-verify)" : "var(--sot-fg-1)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {m.unit === "$" ? "$" : ""}{m.value}
            </span>
            <span
              className="sot-mono"
              style={{
                fontSize: 12,
                color: "var(--sot-fg-3)",
                fontWeight: 500,
              }}
            >
              {m.unit !== "$" ? m.unit : ""}
            </span>
          </div>
          {m.sub && (
            <span
              className="sot-mono"
              style={{ fontSize: 9, color: "var(--sot-fg-4)", letterSpacing: "var(--sot-tracking-tag)" }}
            >
              {m.sub.toUpperCase().replace(/ /g, "_")}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   EXPORT OPTIONS
   ============================================================ */
function ExportOptions() {
  return (
    <Section
      title="EXPORT_OPTIONS"
      icon="file-output"
      action={
        <span className="sot-mono" style={{ fontSize: 10, color: "var(--sot-fg-3)" }}>
          GENERATED {new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}
        </span>
      }
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
        }}
      >
        {[
          { icon: "file-text",       label: "PDF Report",     desc: "Print-ready PDF" },
          { icon: "sheet",           label: "Excel Export",   desc: "Raw data .xlsx" },
          { icon: "mail",            label: "Email Report",   desc: "Send to stakeholders" },
          { icon: "calendar-clock",  label: "Schedule Report", desc: "Recurring delivery" },
        ].map((b) => (
          <button
            key={b.label}
            className="sot-btn ghost"
            style={{
              height: "auto",
              padding: "14px 14px",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 4,
              textAlign: "left",
              textTransform: "none",
              letterSpacing: 0,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--sot-fg-1)",
                fontFamily: "var(--sot-font-sans)",
              }}
            >
              <Icon name={b.icon} size={14} color="var(--sot-fg-2)" />
              {b.label}
            </span>
            <span
              style={{
                fontSize: 11,
                color: "var(--sot-fg-3)",
                fontFamily: "var(--sot-font-text)",
              }}
            >
              {b.desc}
            </span>
          </button>
        ))}
      </div>
    </Section>
  );
}

/* ============================================================
   ROOT
   ============================================================ */
function AnalyticsReportsPage() {
  const [from, setFrom] = useState("2026-05-18");
  const [to, setTo] = useState("2026-05-24");
  const [preset, setPreset] = useState("7d");
  const [compare, setCompare] = useState(true);
  const [intentSelected, setIntentSelected] = useState(null);

  return (
    <div className="sot sot-grid" style={{ minHeight: "100vh", paddingBottom: 48 }}>
      <PageHeader />
      <main
        style={{
          maxWidth: 1500,
          margin: "0 auto",
          padding: "var(--sot-s-6) var(--sot-s-6) 0",
        }}
      >
        {/* Title */}
        <div style={{ marginBottom: "var(--sot-s-5)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
              flexWrap: "wrap",
            }}
          >
            <Tag label="ANALYTICS" value="V2.4" tone="verify" />
            <Tag label="PERIOD" value={`${from} → ${to}`} />
            <Tag label="REFRESHED" value="2_MIN_AGO" />
          </div>
          <h1 className="sot-h2" style={{ fontSize: 32, letterSpacing: "-0.02em" }}>
            Analytics &amp; reports.
          </h1>
          <p
            className="sot-p"
            style={{
              fontSize: 13,
              color: "var(--sot-fg-3)",
              marginTop: 4,
              marginBottom: 0,
              maxWidth: 640,
            }}
          >
            Every metric, traced to the source. The data shown here is committed to the source of truth and verifiable end-to-end.
          </p>
        </div>

        <Toolbar
          from={from}
          to={to}
          setFrom={setFrom}
          setTo={setTo}
          preset={preset}
          setPreset={setPreset}
          compare={compare}
          setCompare={setCompare}
        />

        {/* KPI grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "var(--sot-s-3)",
            marginBottom: "var(--sot-s-4)",
          }}
        >
          {KPIS.map((k) => (
            <KpiCard key={k.id} kpi={k} />
          ))}
        </div>

        {/* Chart grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
            gap: "var(--sot-s-4)",
            marginBottom: "var(--sot-s-4)",
          }}
          className="chart-grid"
        >
          <Section
            title="CALLS_OVER_TIME"
            icon="line-chart"
            action={<Tag label="GRANULARITY" value="DAILY" />}
          >
            <CallsOverTimeChart data={TIME_SERIES} />
          </Section>

          <Section
            title="INTENT_BREAKDOWN"
            icon="pie-chart"
            action={
              <Tag
                label="TOTAL"
                value={String(INTENT_BREAKDOWN.reduce((s, d) => s + d.value, 0))}
              />
            }
          >
            <IntentDonut
              data={INTENT_BREAKDOWN}
              selected={intentSelected}
              onSelect={setIntentSelected}
            />
          </Section>

          <Section title="QUALITY_DISTRIBUTION" icon="bar-chart-3">
            <QualityDistChart data={QUALITY_DIST} />
          </Section>

          <Section title="CONVERSION_FUNNEL" icon="filter">
            <FunnelChart data={FUNNEL} />
          </Section>

          <Section
            title="AGENT_PERFORMANCE"
            icon="users"
            action={
              <Tag label="RANKED_BY" value="CONV_RATE" />
            }
            padded={false}
          >
            <div style={{ padding: "var(--sot-s-4) var(--sot-s-5)" }}>
              <AgentTable agents={AGENTS} />
            </div>
          </Section>

          <Section title="TOP_INTENTS" icon="trending-up">
            <TopIntentsChart data={TOP_INTENTS} />
          </Section>
        </div>

        {/* Secondary metrics */}
        <div style={{ marginBottom: "var(--sot-s-4)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span
              className="sot-tag"
              style={{ color: "var(--sot-fg-1)", fontSize: 11, fontWeight: 600 }}
            >
              OPERATIONAL_METRICS
            </span>
            <span style={{ flex: 1, height: 1, background: "var(--sot-line)" }} />
          </div>
          <SecondaryMetricsRow metrics={SECONDARY_METRICS} />
        </div>

        {/* Export options */}
        <ExportOptions />

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
            VOICE_AI_AGENT // ANALYTICS // {from} → {to}
          </span>
          <div style={{ display: "flex", gap: 14 }}>
            <Tag label="DATA_LAG" value="<2_MIN" tone="verify" />
            <Tag label="COVERAGE" value="100%" tone="verify" />
            <Tag label="SOURCE_OF_TRUTH" value="CONFIRMED" tone="verify" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default AnalyticsReportsPage;
