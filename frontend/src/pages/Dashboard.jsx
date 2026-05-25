import React, { useState, useEffect, useRef, useMemo } from 'react';
/* ============================================================
   VoiceAIDashboard — SOT design system
   Engineering-chic translation of the brief. Monochrome dark,
   bracket-tag callouts, Lucide line icons. No gradients,
   no emoji, no startup-card pastels.
   ============================================================ */


/* ---------- Lucide helper (renders to inline SVG via lucide-static) ---------- */
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
        // Limit replacement to this subtree
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

/* ---------- Bracket tag primitive ---------- */
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

/* ---------- Live pulsing dot ---------- */
function PulseDot({ color = "var(--sot-alert)", size = 8 }) {
  return (
    <span
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "inline-block",
        flex: "none",
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: 0,
          background: color,
          borderRadius: 999,
        }}
      />
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

/* ---------- Format helpers ---------- */
const fmtClock = (totalSec) => {
  const m = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSec % 60)
    .toString()
    .padStart(2, "0");
  return `00:${m}:${s}`;
};
const fmtMS = (totalSec) => {
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

/* ---------- Animated counter ---------- */
function useCounter(target, duration = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

/* ============================================================
   HEADER
   ============================================================ */
function Header({ activeCalls }) {
  return (
    <header
      style={{
        height: 64,
        background: "var(--sot-surface-1)",
        borderBottom: "1px solid var(--sot-line)",
        display: "flex",
        alignItems: "center",
        padding: "0 var(--sot-s-6)",
        gap: "var(--sot-s-4)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sot-s-3)", flexShrink: 0 }}>
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

      {/* Nav tabs */}
      <nav style={{ display: "flex", gap: 4, marginLeft: 8 }}>
        {[
          { label: "DASHBOARD",    href: "/",           active: true },
          { label: "CALL_HISTORY", href: "/calls" },
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

      {/* Live status pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--sot-s-3)",
          padding: "8px 14px",
          border: "1px solid var(--sot-line-strong)",
          background: "var(--sot-ink)",
          flexShrink: 0,
        }}
      >
        <PulseDot color="var(--sot-alert)" />
        <span
          className="sot-mono"
          style={{
            color: "var(--sot-fg-1)",
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "var(--sot-tracking-tag)",
            fontWeight: 600,
          }}
        >
          {activeCalls} ACTIVE CALLS
        </span>
        <span style={{ width: 1, height: 14, background: "var(--sot-line-strong)" }} />
        <Tag label="UPTIME" value="99.97%" tone="verify" />
      </div>

      {/* Actions + user */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--sot-s-3)",
          flexShrink: 0,
        }}
      >
        <button
          className="sot-btn ghost"
          style={{ height: 36, padding: "0 10px" }}
          aria-label="Search"
        >
          <Icon name="search" size={14} />
        </button>
        <button
          className="sot-btn ghost"
          style={{ height: 36, padding: "0 10px" }}
          aria-label="Notifications"
        >
          <Icon name="bell" size={14} />
        </button>
        <a
          href="/settings"
          className="sot-btn ghost"
          style={{ height: 36, padding: "0 10px", display: "inline-flex", alignItems: "center" }}
          aria-label="Settings"
        >
          <Icon name="settings" size={14} />
        </a>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "4px 10px 4px 4px",
            border: "1px solid var(--sot-line-strong)",
            background: "var(--sot-surface-2)",
            cursor: "pointer",
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
              letterSpacing: 0,
            }}
          >
            MJ
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span style={{ fontSize: 12, color: "var(--sot-fg-1)", fontWeight: 600 }}>
              M. Johnston
            </span>
            <span className="sot-tag" style={{ fontSize: 9 }}>
              OPERATOR
            </span>
          </div>
          <Icon name="chevron-down" size={12} color="var(--sot-fg-3)" />
        </div>
      </div>
    </header>
  );
}

/* ============================================================
   METRIC CARD — SOT-styled
   ============================================================ */
function MetricCard({ label, value, unit, delta, trend, sparkline, iconName, tone }) {
  const animated = useCounter(value);
  const display =
    typeof value === "number"
      ? unit === "$"
        ? "$" + Math.round(animated).toLocaleString()
        : unit === "%"
        ? Math.round(animated) + "%"
        : Math.round(animated).toLocaleString()
      : value;

  const trendColor =
    trend === "up"
      ? "var(--sot-verify)"
      : trend === "down"
      ? "var(--sot-alert)"
      : "var(--sot-fg-3)";

  return (
    <div
      className="sot-card"
      style={{
        padding: "var(--sot-s-5)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name={iconName} size={14} color="var(--sot-fg-3)" />
          <span className="sot-tag" style={{ fontSize: 10 }}>
            {label}
          </span>
        </div>
        <span
          className="sot-mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            color: trendColor,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          <Icon
            name={trend === "up" ? "arrow-up-right" : "arrow-down-right"}
            size={11}
            color={trendColor}
          />
          {delta}
        </span>
      </div>

      <div
        style={{
          fontFamily: "var(--sot-font-sans)",
          fontWeight: 800,
          fontSize: 38,
          letterSpacing: "-0.025em",
          color: "var(--sot-fg-1)",
          lineHeight: 1,
          marginBottom: 12,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {display}
      </div>

      {/* mini sparkline */}
      <svg
        viewBox="0 0 120 24"
        preserveAspectRatio="none"
        style={{ width: "100%", height: 24, display: "block" }}
      >
        <polyline
          points={sparkline
            .map((v, i) => {
              const x = (i / (sparkline.length - 1)) * 120;
              const min = Math.min(...sparkline);
              const max = Math.max(...sparkline);
              const y = 22 - ((v - min) / (max - min || 1)) * 20;
              return `${x},${y}`;
            })
            .join(" ")}
          fill="none"
          stroke={tone === "verify" ? "var(--sot-verify)" : "var(--sot-fg-2)"}
          strokeWidth="1.25"
        />
      </svg>

      {/* corner registration tick */}
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
   ACTIVE CALL ROW
   ============================================================ */
function ActiveCallRow({ call, selected, onSelect, tick }) {
  const dur = call.startSec + tick;
  return (
    <button
      onClick={onSelect}
      style={{
        width: "100%",
        textAlign: "left",
        background: selected ? "var(--sot-surface-2)" : "transparent",
        border: "1px solid",
        borderColor: selected ? "var(--sot-verify)" : "var(--sot-line)",
        padding: "12px 14px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        transition: "all var(--sot-dur-fast) var(--sot-ease)",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <PulseDot color="var(--sot-alert)" size={7} />
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--sot-fg-1)",
            flex: 1,
            letterSpacing: "-0.005em",
          }}
        >
          {call.name}
        </span>
        <span
          className="sot-mono"
          style={{ color: "var(--sot-fg-2)", fontSize: 11, fontVariantNumeric: "tabular-nums" }}
        >
          {fmtClock(dur)}
        </span>
      </div>
      <div
        className="sot-mono"
        style={{ color: "var(--sot-fg-3)", fontSize: 11, letterSpacing: "0.02em" }}
      >
        {call.phone}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              style={{
                width: 12,
                height: 4,
                background:
                  i < Math.round(call.score / 2)
                    ? "var(--sot-verify)"
                    : "var(--sot-line-strong)",
              }}
            />
          ))}
          <span
            className="sot-mono"
            style={{ marginLeft: 6, color: "var(--sot-fg-2)", fontSize: 11 }}
          >
            {call.score}/10
          </span>
        </div>
        <Tag label={call.intent.toUpperCase().replace(/ /g, "_")} />
      </div>
    </button>
  );
}

/* ============================================================
   TRANSCRIPT
   ============================================================ */
function Transcript({ messages, scrollKey }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [messages.length, scrollKey]);

  return (
    <div
      ref={ref}
      style={{
        background: "var(--sot-ink)",
        border: "1px solid var(--sot-line)",
        padding: "var(--sot-s-4)",
        height: 240,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        fontFamily: "var(--sot-font-text)",
        scrollBehavior: "smooth",
      }}
    >
      {messages.map((m, i) => {
        const isAI = m.speaker === "AI";
        return (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              opacity: i === messages.length - 1 ? 1 : 0.92,
            }}
          >
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
              {isAI ? "AGENT" : "CALLER"}
              <span style={{ color: "var(--sot-fg-4)" }}>· {m.time}</span>
            </div>
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.5,
                color: "var(--sot-fg-1)",
                paddingLeft: 14,
                borderLeft: `1px solid ${isAI ? "var(--sot-verify)" : "var(--sot-line-strong)"}`,
              }}
            >
              {m.text}
            </div>
          </div>
        );
      })}
      {/* live typing indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          paddingLeft: 14,
          color: "var(--sot-fg-3)",
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            background: "var(--sot-fg-3)",
            borderRadius: 999,
            animation: "sotTyping 1.2s infinite ease-in-out",
          }}
        />
        <span
          style={{
            width: 5,
            height: 5,
            background: "var(--sot-fg-3)",
            borderRadius: 999,
            animation: "sotTyping 1.2s infinite ease-in-out .15s",
          }}
        />
        <span
          style={{
            width: 5,
            height: 5,
            background: "var(--sot-fg-3)",
            borderRadius: 999,
            animation: "sotTyping 1.2s infinite ease-in-out .3s",
          }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   WAVEFORM (decorative — sits above transcript when live)
   ============================================================ */
function Waveform({ active }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        height: 28,
        padding: "0 var(--sot-s-3)",
        background: "var(--sot-ink)",
        border: "1px solid var(--sot-line)",
      }}
    >
      {Array.from({ length: 64 }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 2,
            height: `${20 + Math.sin(i * 0.6) * 8 + (active ? Math.random() * 8 : 0)}%`,
            background: active && i % 7 !== 0 ? "var(--sot-verify)" : "var(--sot-line-strong)",
            animation: active ? `sotWave 1.4s ${i * 0.04}s ease-in-out infinite` : "none",
          }}
        />
      ))}
    </div>
  );
}

/* ============================================================
   CALL HISTORY TABLE
   ============================================================ */
function CallHistory({ rows, page, total, onPage }) {
  return (
    <div className="sot-card" style={{ padding: 0, overflow: "hidden" }}>
      <div
        style={{
          padding: "var(--sot-s-5) var(--sot-s-6)",
          borderBottom: "1px solid var(--sot-line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--sot-s-4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Icon name="history" size={16} color="var(--sot-fg-2)" />
          <h3
            className="sot-h4"
            style={{ fontSize: 15, fontFamily: "var(--sot-font-sans)" }}
          >
            Recent calls
          </h3>
          <Tag label="LAST_10" />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="sot-btn ghost" style={{ height: 32, fontSize: 10 }}>
            <Icon name="filter" size={12} /> Filter
          </button>
          <button className="sot-btn ghost" style={{ height: 32, fontSize: 10 }}>
            <Icon name="download" size={12} /> Export
          </button>
        </div>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: "var(--sot-font-text)",
        }}
      >
        <thead>
          <tr
            style={{
              background: "var(--sot-ink)",
              borderBottom: "1px solid var(--sot-line)",
            }}
          >
            {[
              "Time",
              "Phone",
              "Duration",
              "Quality",
              "Intent",
              "Status",
              "",
            ].map((h, i) => (
              <th
                key={i}
                className="sot-tag"
                style={{
                  textAlign: i === 6 ? "right" : "left",
                  padding: "10px 16px",
                  fontSize: 10,
                  color: "var(--sot-fg-3)",
                  fontWeight: 600,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              style={{
                borderBottom:
                  i === rows.length - 1 ? "none" : "1px solid var(--sot-line)",
                cursor: "pointer",
                transition: "background var(--sot-dur-fast) var(--sot-ease)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--sot-surface-2)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <td
                style={{
                  padding: "14px 16px",
                  fontFamily: "var(--sot-font-mono)",
                  fontSize: 12,
                  color: "var(--sot-fg-2)",
                }}
              >
                {r.time}
              </td>
              <td
                style={{
                  padding: "14px 16px",
                  fontFamily: "var(--sot-font-mono)",
                  fontSize: 12,
                  color: "var(--sot-fg-1)",
                }}
              >
                {r.phone}
              </td>
              <td
                style={{
                  padding: "14px 16px",
                  fontFamily: "var(--sot-font-mono)",
                  fontSize: 12,
                  color: "var(--sot-fg-2)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {r.duration}
              </td>
              <td style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ display: "flex", gap: 2 }}>
                    {[...Array(5)].map((_, j) => (
                      <span
                        key={j}
                        style={{
                          width: 8,
                          height: 3,
                          background:
                            j < Math.round(r.quality / 2)
                              ? "var(--sot-verify)"
                              : "var(--sot-line-strong)",
                        }}
                      />
                    ))}
                  </div>
                  <span
                    className="sot-mono"
                    style={{ fontSize: 11, color: "var(--sot-fg-2)" }}
                  >
                    {r.quality}/10
                  </span>
                </div>
              </td>
              <td style={{ padding: "14px 16px" }}>
                <span
                  className="sot-tag"
                  style={{ fontSize: 10, color: "var(--sot-fg-2)" }}
                >
                  {r.intent}
                </span>
              </td>
              <td style={{ padding: "14px 16px" }}>
                <StatusPill status={r.status} />
              </td>
              <td style={{ padding: "14px 16px", textAlign: "right" }}>
                <Icon name="chevron-right" size={14} color="var(--sot-fg-3)" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div
        style={{
          padding: "12px var(--sot-s-6)",
          borderTop: "1px solid var(--sot-line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span className="sot-mono" style={{ fontSize: 11, color: "var(--sot-fg-3)" }}>
          SHOWING {(page - 1) * 10 + 1}–{Math.min(page * 10, total)} OF{" "}
          {total.toLocaleString()}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="sot-btn ghost"
            style={{ height: 30, padding: "0 10px" }}
            disabled={page === 1}
            onClick={() => onPage(page - 1)}
          >
            <Icon name="chevron-left" size={12} />
          </button>
          {[1, 2, 3, 4].map((p) => (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={"sot-btn " + (p === page ? "primary" : "ghost")}
              style={{
                height: 30,
                width: 30,
                padding: 0,
                justifyContent: "center",
                fontSize: 11,
              }}
            >
              {p}
            </button>
          ))}
          <span
            className="sot-mono"
            style={{ alignSelf: "center", color: "var(--sot-fg-4)", fontSize: 11 }}
          >
            …
          </span>
          <button
            className="sot-btn ghost"
            style={{ height: 30, padding: "0 10px" }}
            onClick={() => onPage(page + 1)}
          >
            <Icon name="chevron-right" size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TOAST NOTIFICATION
   ============================================================ */
function ToastContainer({ toasts }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 16px",
          background: "var(--sot-surface-1)",
          border: `1px solid ${t.tone === "verify" ? "var(--sot-verify)" : t.tone === "alert" ? "var(--sot-alert)" : t.tone === "warn" ? "var(--sot-warn)" : "var(--sot-line-strong)"}`,
          color: "var(--sot-fg-1)",
          fontFamily: "var(--sot-font-mono)",
          fontSize: 12,
          minWidth: 240,
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
          animation: "sotFadeIn .15s ease",
          pointerEvents: "auto",
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: 999, flexShrink: 0,
            background: t.tone === "verify" ? "var(--sot-verify)" : t.tone === "alert" ? "var(--sot-alert)" : t.tone === "warn" ? "var(--sot-warn)" : "var(--sot-fg-3)",
          }} />
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   TRANSFER TO HUMAN MODAL
   ============================================================ */
function TransferModal({ callerName, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        width: 400,
        background: "var(--sot-surface-1)",
        border: "1px solid var(--sot-alert)",
        padding: 24, display: "flex", flexDirection: "column", gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="user-round" size={18} color="var(--sot-alert)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--sot-fg-1)" }}>Transfer to Human Agent</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--sot-fg-2)", lineHeight: 1.5 }}>
          Transfer <strong style={{ color: "var(--sot-fg-1)" }}>{callerName || "this caller"}</strong> to a human agent?
          The AI will hand off the call and stop responding.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="sot-btn ghost" style={{ height: 36 }} onClick={onCancel}>Cancel</button>
          <button
            className="sot-btn"
            style={{ height: 36, background: "var(--sot-alert-soft)", border: "1px solid var(--sot-alert)", color: "var(--sot-alert)" }}
            onClick={onConfirm}
          >
            <Icon name="user-round" size={13} color="var(--sot-alert)" /> Confirm Transfer
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    qualified: { color: "var(--sot-verify)", soft: "var(--sot-verify-soft)", label: "QUALIFIED" },
    pending: { color: "var(--sot-warn)", soft: "var(--sot-warn-soft)", label: "PENDING" },
    rejected: { color: "var(--sot-alert)", soft: "var(--sot-alert-soft)", label: "REJECTED" },
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
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          background: s.color,
          borderRadius: 999,
        }}
      />
      {s.label}
    </span>
  );
}

/* ============================================================
   ROOT DASHBOARD
   ============================================================ */

/* ---------- API helpers (imported at module level when bundled) ---------- */
const _api = (() => {
  // Works both in Vite (import.meta.env) and CDN (window) contexts
  const BASE =
    (typeof import.meta !== "undefined" ? import.meta?.env?.VITE_API_URL : null) ||
    (typeof window !== "undefined" && window._VOQAL_API_URL) ||
    "http://localhost:8000";

  const get = async (path) => {
    const r = await fetch(`${BASE}/api/v1${path}`);
    if (!r.ok) throw new Error(`API ${r.status}`);
    return r.json();
  };
  return {
    getActiveCalls:     () => get("/calls/active"),
    getDashboardMetrics:() => get("/analytics/dashboard"),
    getCallHistory:     (limit = 20) => get(`/calls/history?limit=${limit}`),
  };
})();

/* ---------- Fallback mock data shown while loading or on API error ---------- */
const MOCK_CALLS = [
  { id: 1, call_id: "mock-1", phone_number: "+1-555-0100", caller_name: "John Smith",   startSec: 165, score: 8, intent: "Lead Qualify", company: "Tech Corp",   email: "john@example.com" },
  { id: 2, call_id: "mock-2", phone_number: "+1-555-0142", caller_name: "Sara Lee",     startSec: 47,  score: 6, intent: "Support",      company: "Northwind",   email: "sara.lee@northwind.io" },
  { id: 3, call_id: "mock-3", phone_number: "+1-555-0188", caller_name: "D. Rivera",    startSec: 322, score: 9, intent: "Book Demo",    company: "Helios Mfg.", email: "d.rivera@helios.com" },
];
const MOCK_METRICS = [
  { label: "CALLS_TODAY",     value: 24,   delta: "+18%",   trend: "up", iconName: "phone",       tone: "verify", sparkline: [4,6,5,9,11,8,12,14,13,18,17,24] },
  { label: "QUALIFIED_LEADS", value: 14,   delta: "+12%",   trend: "up", iconName: "user-check",  tone: "verify", sparkline: [2,3,3,5,4,7,8,7,9,11,12,14] },
  { label: "CONVERSION_RATE", value: 58, unit: "%", delta: "+4.2pt", trend: "up", iconName: "trending-up", sparkline: [42,45,48,46,50,53,52,55,54,56,57,58] },
  { label: "REVENUE_IMPACT",  value: 2100, unit: "$", delta: "+$420", trend: "up", iconName: "dollar-sign", sparkline: [400,600,550,900,1100,980,1300,1450,1600,1800,1900,2100] },
];
const MOCK_HISTORY = [
  { time: "2:45 PM", phone: "+1-555-0100", duration: "2:45", quality: 8, intent: "QUALIFY",  status: "qualified" },
  { time: "2:30 PM", phone: "+1-555-0101", duration: "1:20", quality: 6, intent: "SUPPORT",  status: "pending" },
  { time: "2:15 PM", phone: "+1-555-0102", duration: "3:10", quality: 9, intent: "BOOK",     status: "qualified" },
  { time: "1:58 PM", phone: "+1-555-0103", duration: "0:42", quality: 3, intent: "SPAM",     status: "rejected" },
  { time: "1:42 PM", phone: "+1-555-0104", duration: "4:18", quality: 7, intent: "QUALIFY",  status: "qualified" },
  { time: "1:27 PM", phone: "+1-555-0105", duration: "2:02", quality: 5, intent: "SUPPORT",  status: "pending" },
  { time: "1:14 PM", phone: "+1-555-0106", duration: "1:47", quality: 8, intent: "BOOK",     status: "qualified" },
  { time: "12:58 PM",phone: "+1-555-0107", duration: "0:31", quality: 2, intent: "SPAM",     status: "rejected" },
  { time: "12:44 PM",phone: "+1-555-0108", duration: "3:33", quality: 9, intent: "QUALIFY",  status: "qualified" },
  { time: "12:30 PM",phone: "+1-555-0109", duration: "2:11", quality: 6, intent: "SUPPORT",  status: "pending" },
];

const DEMO_MODE =
  (typeof import.meta !== "undefined"
    ? (import.meta?.env?.VITE_DEMO_MODE ?? "true") === "true"
    : true) || (typeof window !== "undefined" && window._VOQAL_DEMO_MODE === true);

/* ---------- Map API response → display shape ---------- */
function normaliseCalls(apiCalls) {
  if (DEMO_MODE) return MOCK_CALLS;
  if (!Array.isArray(apiCalls) || apiCalls.length === 0) return MOCK_CALLS;
  return apiCalls.map((c, i) => ({
    id: c.call_id || i + 1,
    call_id: c.call_id,
    phone_number: c.phone_number,
    caller_name: c.caller_name || c.phone_number,
    startSec: c.duration_so_far || 0,
    score: Math.round((c.lead_quality_score || 0.5) * 10),
    intent: c.intent || "Unknown",
    company: "",
    email: "",
  }));
}
function normaliseMetrics(apiMetrics, callsToday, qualifiedToday) {
  if (DEMO_MODE) return MOCK_METRICS;
  if (!apiMetrics) return MOCK_METRICS;
  const cr = apiMetrics.conversion_rate?.value ?? 0;
  const rv = apiMetrics.revenue?.value ?? 0;
  const ql = apiMetrics.qualified_leads?.value ?? qualifiedToday ?? 0;
  if ((callsToday ?? 0) === 0 && (qualifiedToday ?? 0) === 0 && cr === 0 && rv === 0) return MOCK_METRICS;
  return [
    { label: "CALLS_TODAY",     value: callsToday ?? 0,          delta: "", trend: "up", iconName: "phone",       tone: "verify", sparkline: [] },
    { label: "QUALIFIED_LEADS", value: Math.round(ql),            delta: `${apiMetrics.qualified_leads?.change_percent > 0 ? "+" : ""}${apiMetrics.qualified_leads?.change_percent ?? 0}%`, trend: apiMetrics.qualified_leads?.trend ?? "flat", iconName: "user-check", tone: "verify", sparkline: [] },
    { label: "CONVERSION_RATE", value: Math.round(cr * 100), unit: "%", delta: "", trend: apiMetrics.conversion_rate?.trend ?? "flat", iconName: "trending-up",  sparkline: [] },
    { label: "REVENUE_IMPACT",  value: Math.round(rv), unit: "$",  delta: "", trend: apiMetrics.revenue?.trend ?? "flat",        iconName: "dollar-sign", sparkline: [] },
  ];
}
function normaliseHistory(apiHistory) {
  if (DEMO_MODE) return MOCK_HISTORY;
  const items = apiHistory?.calls || apiHistory?.items || [];
  if (!items.length) return MOCK_HISTORY;
  return items.map((c) => ({
    time: c.start_time ? new Date(c.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
    phone: c.phone_number,
    duration: c.call_duration_seconds ? fmtMS(c.call_duration_seconds) : "—",
    quality: Math.round((c.lead_quality_score || 0) * 10),
    intent: (c.intent || "unknown").toUpperCase().slice(0, 7),
    status: c.call_status === "completed" && (c.lead_quality_score || 0) >= 0.5 ? "qualified" : c.call_status || "pending",
  }));
}

function TodayPipelineCard({ callsToday, qualifiedToday }) {
  const inbound = Math.max(0, Number(callsToday || 0));
  const qualified = Math.max(0, Number(qualifiedToday || 0));
  const answered = Math.max(0, Math.min(inbound, Math.round(inbound * 0.92)));
  const demosBooked = Math.max(0, Math.min(qualified, Math.round(qualified * 0.43)));
  const rows = [
    { label: "INBOUND", count: inbound, pct: inbound ? 100 : 0 },
    { label: "ANSWERED", count: answered, pct: inbound ? Math.round((answered / inbound) * 100) : 0, tone: "verify" },
    { label: "QUALIFIED", count: qualified, pct: inbound ? Math.round((qualified / inbound) * 100) : 0, tone: "verify" },
    { label: "DEMOS_BOOKED", count: demosBooked, pct: inbound ? Math.round((demosBooked / inbound) * 100) : 0, tone: "verify" },
  ];

  return (
    <div className="sot-card" style={{ padding: "var(--sot-s-5)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <Icon name="git-branch" size={14} color="var(--sot-fg-2)" />
        <span
          className="sot-tag"
          style={{ color: "var(--sot-fg-1)", fontSize: 11, fontWeight: 600 }}
        >
          TODAY · PIPELINE
        </span>
      </div>
      {rows.map((row) => (
        <div key={row.label} style={{ marginBottom: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <span className="sot-tag" style={{ fontSize: 10 }}>
              {row.label}
            </span>
            <span
              className="sot-mono"
              style={{
                fontSize: 12,
                color: "var(--sot-fg-1)",
                fontWeight: 600,
              }}
            >
              {row.count}{" "}
              <span style={{ color: "var(--sot-fg-4)", fontWeight: 400 }}>
                · {row.pct}%
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
                width: `${row.pct}%`,
                background:
                  row.tone === "verify"
                    ? "var(--sot-verify)"
                    : "var(--sot-fg-2)",
                transition: "width var(--sot-dur-slow) var(--sot-ease)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function VoiceAIDashboard() {
  /* live ticker */
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  /* ── API state ─────────────────────────────────────────────── */
  const [calls,   setCalls]   = useState(MOCK_CALLS);
  const [metrics, setMetrics] = useState(MOCK_METRICS);
  const [history, setHistory] = useState(MOCK_HISTORY);
  const [apiError, setApiError] = useState(null);
  const callsTodayMetric = metrics.find((m) => m.label === "CALLS_TODAY");
  const qualifiedTodayMetric = metrics.find((m) => m.label === "QUALIFIED_LEADS");
  const callsTodayValue = Number(callsTodayMetric?.value || 0);
  const qualifiedTodayValue = Number(qualifiedTodayMetric?.value || 0);

  /* Fetch on mount and every 10 s */
  useEffect(() => {
    let alive = true;
    async function fetchAll() {
      try {
        const [activeRes, metricsRes, historyRes] = await Promise.allSettled([
          _api.getActiveCalls(),
          _api.getDashboardMetrics(),
          _api.getCallHistory(10),
        ]);
        if (!alive) return;

        if (activeRes.status === "fulfilled") {
          const nextCalls = normaliseCalls(activeRes.value?.active_calls);
          setCalls(nextCalls.length === 0 && DEMO_MODE ? MOCK_CALLS : nextCalls);
        }

        if (metricsRes.status === "fulfilled") {
          const m = metricsRes.value;
          const nextMetrics = normaliseMetrics(m, m?.calls_today, m?.qualified_today);
          setMetrics(nextMetrics.length === 0 && DEMO_MODE ? MOCK_METRICS : nextMetrics);
        }

        if (historyRes.status === "fulfilled") {
          const nextHistory = normaliseHistory(historyRes.value);
          setHistory(nextHistory.length === 0 && DEMO_MODE ? MOCK_HISTORY : nextHistory);
        }

        // Clear any previous error if at least one succeeded
        if ([activeRes, metricsRes, historyRes].some((r) => r.status === "fulfilled"))
          setApiError(null);
        else setApiError("API unavailable");
      } catch (err) {
        if (alive) setApiError(err?.message || "API unavailable");
      }
    }
    fetchAll();
    const id = setInterval(fetchAll, 10_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const [selectedId, setSelectedId] = useState(null);
  const selected =
    calls.find((c) => c.id === selectedId) ||
    calls[0] || {
      id: "__none__",
      name: "—",
      email: "—",
      phone: "—",
      company: "—",
      intent: "unknown",
      startSec: 0,
      score: 0,
    };

  const selectedName = typeof selected?.name === "string" ? selected.name : "";
  const selectedInitials =
    selectedName.trim().length > 0
      ? selectedName
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map((s) => s[0])
          .join("")
      : "—";
  const selectedIntent = typeof selected?.intent === "string" ? selected.intent : "unknown";
  const selectedCompany = typeof selected?.company === "string" ? selected.company : "—";
  const selectedEmail = typeof selected?.email === "string" ? selected.email : "—";
  const selectedPhone = typeof selected?.phone === "string" ? selected.phone : "—";
  const selectedScore = typeof selected?.score === "number" ? selected.score : 0;

  /* ── inline transcript animation (visual demo, not from API) ── */
  const baseTranscript = [
    { speaker: "AGENT", text: "Hi, this is Aria from the demo team — am I catching you at an OK time?", time: "00:00:02" },
    { speaker: "CALLER", text: "Yeah, I'm calling about the voice-AI product. Saw the demo on your site.", time: "00:00:07" },
    { speaker: "AGENT", text: "Great. Quick question — are you evaluating this for inbound qualification, outbound, or both?", time: "00:00:15" },
    { speaker: "CALLER", text: "Mostly inbound. We get a lot of leads at night that just go to voicemail.", time: "00:00:24" },
    { speaker: "AGENT", text: "Got it. How many inbound calls roughly per week — rough number is fine.", time: "00:00:32" },
    { speaker: "CALLER", text: "Probably 600 to 800 in a busy week.", time: "00:00:41" },
    { speaker: "AGENT", text: "Perfect — that puts you in our mid-tier. I'd like to put 20 minutes on the calendar with a solutions engineer. Does Thursday afternoon work?", time: "00:00:55" },
    { speaker: "CALLER", text: "Thursday after 2pm Eastern is fine.", time: "00:01:08" },
    { speaker: "AGENT", text: "Booked. You'll get a confirmation email in the next minute.", time: "00:01:18" },
    { speaker: "CALLER", text: "Quick question — does it handle Spanish?", time: "00:01:28" },
    { speaker: "AGENT", text: "Yes — Spanish, French, and German are GA. We can have the SE walk through the language model behavior on Thursday.", time: "00:01:42" },
  ];
  const visibleMessageCount = Math.min(
    baseTranscript.length,
    4 + Math.floor(tick / 5)
  );
  const transcript = baseTranscript.slice(0, visibleMessageCount);

  /* call history — populated from API state above */
  const [page, setPage] = useState(1);

  /* notes */
  const [notes, setNotes] = useState("");

  /* ── action state ───────────────────────────────────────────── */
  const [listening,     setListening]     = useState(false);
  const [flagged,       setFlagged]       = useState(false);
  const [transferModal, setTransferModal] = useState(false);
  const [qualifying,    setQualifying]    = useState(false);
  const [leadStatus,    setLeadStatus]    = useState({});
  const [toasts,        setToasts]        = useState([]);

  const toast = (message, tone = "default") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  };

  const handleListenLive = () => {
    setListening((v) => {
      const next = !v;
      toast(next ? "Monitoring call — audio stream active" : "Audio stream stopped", next ? "verify" : "default");
      return next;
    });
  };

  const handleCopyTranscript = () => {
    const text = transcript.map((m) => `[${m.time}] ${m.speaker}: ${m.text}`).join("\n");
    navigator.clipboard?.writeText(text).then(
      () => toast("Transcript copied to clipboard", "verify"),
      () => toast("Clipboard unavailable — copy failed", "alert"),
    );
  };

  const handleFlag = () => {
    setFlagged((v) => {
      const next = !v;
      toast(next ? `Call flagged for review — ${selectedName}` : "Flag removed", next ? "warn" : "default");
      return next;
    });
  };

  const handleTransferConfirm = () => {
    setTransferModal(false);
    toast(`Transferred ${selectedName} to human agent`, "warn");
  };

  const handleQualify = async () => {
    setQualifying(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setLeadStatus((s) => ({ ...s, [selected.id]: "qualified" }));
      toast(`Lead qualified — ${selectedName} committed to CRM`, "verify");
    } finally {
      setQualifying(false);
    }
  };

  const handleReject = () => {
    setLeadStatus((s) => ({ ...s, [selected.id]: "rejected" }));
    toast(`Lead rejected — ${selectedName}`, "alert");
  };

  const handleManualReview = () => {
    setLeadStatus((s) => ({ ...s, [selected.id]: "review" }));
    toast(`Flagged for manual review — ${selectedName}`, "warn");
  };

  return (
    <div className="sot sot-grid" style={{ minHeight: "100vh", paddingBottom: 48 }}>
      <Header activeCalls={calls.length} />

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
              <Tag label="OPS_CONSOLE" tone="verify" value="LIVE" />
              <Tag label="SHIFT" value="14:00–22:00" />
              <Tag label="OPERATOR" value="M_JOHNSTON" />
            </div>
            <h1
              className="sot-h2"
              style={{ fontSize: 32, letterSpacing: "-0.02em" }}
            >
              Operations dashboard.
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
              Real-time monitoring of inbound voice agents. Verified leads are
              committed to the source of truth.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span className="sot-mono" style={{ color: "var(--sot-fg-3)", fontSize: 11 }}>
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              })}
              {" LOCAL"}
            </span>
            <button className="sot-btn verify" style={{ height: 36 }}>
              <Icon name="phone-incoming" size={13} />
              Initiate call
            </button>
          </div>
        </div>

        {(DEMO_MODE || apiError) && (
          <div style={{ marginTop: "var(--sot-s-4)" }}>
            <Tag
              label="DATA_SOURCE"
              value={DEMO_MODE ? "DEMO_STATIC" : `API_ERROR:${String(apiError).slice(0, 24)}`}
              tone={DEMO_MODE ? "verify" : "default"}
            />
          </div>
        )}

        {/* Main grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(280px, 1fr) minmax(0, 1.6fr) minmax(300px, 1fr)",
            gap: "var(--sot-s-4)",
            alignItems: "start",
          }}
          className="dash-grid"
        >
          {/* LEFT: metrics + active calls */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sot-s-4)" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--sot-s-3)",
              }}
            >
              {metrics.map((m) => (
                <MetricCard key={m.label} {...m} />
              ))}
            </div>

            <div className="sot-card" style={{ padding: 0 }}>
              <div
                style={{
                  padding: "var(--sot-s-4) var(--sot-s-5)",
                  borderBottom: "1px solid var(--sot-line)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <PulseDot color="var(--sot-alert)" />
                  <span
                    className="sot-tag"
                    style={{ color: "var(--sot-fg-1)", fontSize: 11, fontWeight: 600 }}
                  >
                    ACTIVE CALLS · {calls.length}
                  </span>
                </div>
                <Icon name="more-horizontal" size={14} color="var(--sot-fg-3)" />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: "var(--sot-s-4)",
                  maxHeight: 360,
                  overflowY: "auto",
                }}
              >
                {calls.map((c) => (
                  <ActiveCallRow
                    key={c.id}
                    call={c}
                    selected={c.id === selectedId}
                    onSelect={() => setSelectedId(c.id)}
                    tick={tick}
                  />
                ))}
              </div>
            </div>

            <TodayPipelineCard callsToday={callsTodayValue} qualifiedToday={qualifiedTodayValue} />
          </div>

          {/* CENTER: current call */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sot-s-4)" }}>
            {/* Current call card */}
            <div
              className="sot-card sot-brackets verify"
              style={{ padding: 0, overflow: "hidden" }}
            >
              <span className="b tl" />
              <span className="b tr" />
              <span className="b bl" />
              <span className="b br" />

              <div
                style={{
                  padding: "var(--sot-s-5) var(--sot-s-6)",
                  borderBottom: "1px solid var(--sot-line)",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "var(--sot-s-4)",
                }}
              >
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      background: "var(--sot-ink)",
                      border: "1px solid var(--sot-line-strong)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--sot-font-mono)",
                      fontSize: 16,
                      color: "var(--sot-fg-1)",
                      fontWeight: 600,
                    }}
                  >
                    {selectedInitials}
                  </div>
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 4,
                      }}
                    >
                      <h2
                        className="sot-h3"
                        style={{ fontSize: 22, letterSpacing: "-0.02em" }}
                      >
                        {selectedName || "—"}
                      </h2>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "3px 8px",
                          background: "var(--sot-alert-soft)",
                          border: "1px solid var(--sot-alert)",
                          color: "var(--sot-alert)",
                          fontFamily: "var(--sot-font-mono)",
                          fontSize: 10,
                          letterSpacing: "var(--sot-tracking-tag)",
                          fontWeight: 600,
                          borderRadius: "var(--sot-r-pill)",
                        }}
                      >
                        <PulseDot color="var(--sot-alert)" size={6} />
                        LIVE CALL
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 16,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        className="sot-mono"
                        style={{ color: "var(--sot-fg-2)", fontSize: 12 }}
                      >
                        {selectedPhone}
                      </span>
                      <Tag label="COMPANY" value={selectedCompany} />
                      <Tag
                        label="INTENT"
                        value={selectedIntent.toUpperCase().replace(/ /g, "_")}
                        tone="verify"
                      />
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    textAlign: "right",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <span
                    className="sot-tag"
                    style={{ fontSize: 10 }}
                  >
                    DURATION
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--sot-font-mono)",
                      fontSize: 32,
                      color: "var(--sot-fg-1)",
                      fontWeight: 600,
                      letterSpacing: 0,
                      fontVariantNumeric: "tabular-nums",
                      lineHeight: 1,
                    }}
                  >
                    {fmtClock(selected.startSec + tick)}
                  </span>
                </div>
              </div>

              {/* waveform */}
              <div style={{ padding: "var(--sot-s-4) var(--sot-s-6) 0" }}>
                <Waveform active />
              </div>

              {/* transcript */}
              <div style={{ padding: "var(--sot-s-4) var(--sot-s-6)" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <Icon name="file-text" size={14} color="var(--sot-fg-2)" />
                  <span
                    className="sot-tag"
                    style={{ fontSize: 11, color: "var(--sot-fg-1)", fontWeight: 600 }}
                  >
                    TRANSCRIPT · LIVE
                  </span>
                  <span style={{ flex: 1 }} />
                  <Tag label="LANG" value="EN_US" />
                  <Tag label="MODEL" value="ARIA_3.1" />
                </div>
                <Transcript messages={transcript} scrollKey={tick} />
              </div>

              {/* actions */}
              <div
                style={{
                  padding: "var(--sot-s-4) var(--sot-s-6)",
                  borderTop: "1px solid var(--sot-line)",
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="sot-btn"
                  onClick={handleListenLive}
                  style={listening ? { background: "var(--sot-verify-soft)", borderColor: "var(--sot-verify)", color: "var(--sot-verify)" } : {}}
                >
                  <Icon name="headphones" size={13} color={listening ? "var(--sot-verify)" : "currentColor"} />
                  {listening ? "Stop listening" : "Listen live"}
                </button>
                <button className="sot-btn" onClick={handleCopyTranscript}>
                  <Icon name="copy" size={13} /> Copy transcript
                </button>
                <button
                  className="sot-btn"
                  onClick={handleFlag}
                  style={flagged ? { background: "var(--sot-warn-soft)", borderColor: "var(--sot-warn)", color: "var(--sot-warn)" } : {}}
                >
                  <Icon name="flag" size={13} color={flagged ? "var(--sot-warn)" : "currentColor"} />
                  {flagged ? "Unflag" : "Flag"}
                </button>
                <span style={{ flex: 1 }} />
                <button
                  className="sot-btn"
                  style={{
                    background: "var(--sot-alert-soft)",
                    borderColor: "var(--sot-alert)",
                    color: "var(--sot-alert)",
                  }}
                  onClick={() => setTransferModal(true)}
                >
                  <Icon name="user-round" size={13} /> Transfer to human
                </button>
              </div>
            </div>

            {/* Real-time metrics bar */}
            <div
              className="sot-card"
              style={{
                padding: 0,
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
              }}
            >
              {[
                { label: "RESPONSE_TIME", value: "184", unit: "ms", icon: "zap", tone: "verify" },
                { label: "AI_CONFIDENCE", value: "94", unit: "%", icon: "shield-check", tone: "verify" },
                { label: "INTENT", value: "LEAD_QUALIFY", icon: "target", tone: "default" },
                { label: "SENTIMENT", value: "POSITIVE", icon: "smile", tone: "verify" },
              ].map((m, i, arr) => (
                <div
                  key={m.label}
                  style={{
                    padding: "16px 18px",
                    borderRight:
                      i === arr.length - 1 ? "none" : "1px solid var(--sot-line)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon
                      name={m.icon}
                      size={12}
                      color={
                        m.tone === "verify" ? "var(--sot-verify)" : "var(--sot-fg-3)"
                      }
                    />
                    <span className="sot-tag" style={{ fontSize: 9 }}>
                      {m.label}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily:
                        m.unit || /^[A-Z_]+$/.test(m.value)
                          ? "var(--sot-font-mono)"
                          : "var(--sot-font-sans)",
                      fontSize: m.unit ? 22 : 14,
                      fontWeight: m.unit ? 700 : 600,
                      color:
                        m.tone === "verify" ? "var(--sot-verify)" : "var(--sot-fg-1)",
                      lineHeight: 1,
                      letterSpacing: m.unit ? "-0.01em" : "0.04em",
                    }}
                  >
                    {m.unit && (m.value.startsWith("<") ? "" : "")}{m.value}
                    {m.unit && (
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--sot-fg-3)",
                          marginLeft: 3,
                          fontWeight: 500,
                        }}
                      >
                        {m.unit}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: lead qualification */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sot-s-4)" }}>
            <div className="sot-card" style={{ padding: 0 }}>
              <div
                style={{
                  padding: "var(--sot-s-4) var(--sot-s-5)",
                  borderBottom: "1px solid var(--sot-line)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Icon name="target" size={14} color="var(--sot-fg-2)" />
                <span
                  className="sot-tag"
                  style={{ color: "var(--sot-fg-1)", fontSize: 11, fontWeight: 600 }}
                >
                  LEAD QUALITY SCORE
                </span>
              </div>

              {/* Score gauge */}
              <div
                style={{
                  padding: "var(--sot-s-5)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 14,
                  borderBottom: "1px solid var(--sot-line)",
                }}
              >
                <ScoreGauge score={selectedScore} />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span className="sot-check">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span
                    className="sot-mono"
                    style={{
                      color: "var(--sot-verify)",
                      fontSize: 12,
                      letterSpacing: "var(--sot-tracking-tag)",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    HIGH INTENT · QUALIFIES
                  </span>
                </div>
              </div>

              {/* Lead info */}
              <div style={{ padding: "var(--sot-s-5)" }}>
                {[
                  { label: "NAME", value: selectedName || "—", mono: false },
                  { label: "EMAIL", value: selectedEmail, mono: true },
                  { label: "COMPANY", value: selectedCompany, mono: false },
                  { label: "INTENT", value: selectedIntent, mono: false },
                  { label: "SOURCE", value: "INBOUND_DIRECT", mono: true },
                ].map((row, i, arr) => (
                  <div
                    key={row.label}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "84px 1fr",
                      gap: 12,
                      padding: "10px 0",
                      borderBottom:
                        i === arr.length - 1 ? "none" : "1px dashed var(--sot-line)",
                      alignItems: "baseline",
                    }}
                  >
                    <span className="sot-tag" style={{ fontSize: 10 }}>
                      {row.label}
                    </span>
                    <span
                      style={{
                        fontFamily: row.mono
                          ? "var(--sot-font-mono)"
                          : "var(--sot-font-text)",
                        fontSize: 13,
                        color: "var(--sot-fg-1)",
                        wordBreak: "break-word",
                      }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Quick notes */}
              <div
                style={{
                  padding: "0 var(--sot-s-5) var(--sot-s-5)",
                }}
              >
                <span
                  className="sot-tag"
                  style={{ fontSize: 10, display: "block", marginBottom: 6 }}
                >
                  QUICK_NOTES
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Caller is evaluating for inbound qualification. ~700 calls/wk. Demo booked Thu 2pm ET. Asked about Spanish — confirmed GA…"
                  className="sot-field"
                  style={{
                    width: "100%",
                    height: 88,
                    padding: "10px 12px",
                    resize: "none",
                    lineHeight: 1.5,
                    fontSize: 13,
                  }}
                />
              </div>

              {/* Actions */}
              <div
                style={{
                  padding: "var(--sot-s-4) var(--sot-s-5)",
                  borderTop: "1px solid var(--sot-line)",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                <button
                  className="sot-btn verify"
                  style={{ justifyContent: "center", gridColumn: "1 / -1", opacity: qualifying ? 0.6 : 1 }}
                  onClick={handleQualify}
                  disabled={qualifying || leadStatus[selected?.id] === "qualified"}
                >
                  <Icon name="check" size={13} color="white" />
                  {qualifying ? "Qualifying…" : leadStatus[selected?.id] === "qualified" ? "Qualified ✓" : "Qualify lead"}
                </button>
                <button
                  className="sot-btn ghost"
                  style={{ justifyContent: "center" }}
                  onClick={handleReject}
                  disabled={leadStatus[selected?.id] === "rejected"}
                >
                  <Icon name="x" size={13} />
                  {leadStatus[selected?.id] === "rejected" ? "Rejected" : "Reject"}
                </button>
                <button
                  className="sot-btn ghost"
                  style={{ justifyContent: "center" }}
                  onClick={handleManualReview}
                  disabled={leadStatus[selected?.id] === "review"}
                >
                  <Icon name="help-circle" size={13} />
                  {leadStatus[selected?.id] === "review" ? "In review" : "Manual review"}
                </button>
              </div>
            </div>

            {/*
            <div className="sot-card" style={{ padding: "var(--sot-s-5)" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <Icon name="git-branch" size={14} color="var(--sot-fg-2)" />
                <span
                  className="sot-tag"
                  style={{ color: "var(--sot-fg-1)", fontSize: 11, fontWeight: 600 }}
                >
                  TODAY · PIPELINE
                </span>
              </div>
              {[
                { label: "INBOUND", count: 24, pct: 100 },
                { label: "ANSWERED", count: 22, pct: 92, tone: "verify" },
                { label: "QUALIFIED", count: 14, pct: 58, tone: "verify" },
                { label: "DEMOS_BOOKED", count: 6, pct: 25, tone: "verify" },
              ].map((row) => (
                <div key={row.label} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span className="sot-tag" style={{ fontSize: 10 }}>
                      {row.label}
                    </span>
                    <span
                      className="sot-mono"
                      style={{
                        fontSize: 12,
                        color: "var(--sot-fg-1)",
                        fontWeight: 600,
                      }}
                    >
                      {row.count}{" "}
                      <span style={{ color: "var(--sot-fg-4)", fontWeight: 400 }}>
                        · {row.pct}%
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
                        width: `${row.pct}%`,
                        background:
                          row.tone === "verify"
                            ? "var(--sot-verify)"
                            : "var(--sot-fg-2)",
                        transition: "width var(--sot-dur-slow) var(--sot-ease)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            */}
          </div>
        </div>

        {/* Bottom: call history full width */}
        <div style={{ marginTop: "var(--sot-s-4)" }}>
          <CallHistory rows={history} page={page} total={156} onPage={setPage} />
        </div>

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
          }}
        >
          <span className="sot-mono" style={{ fontSize: 11 }}>
            VOICE_AI_AGENT // v2.4.1 // BUILD 2026.05.24
          </span>
          <div style={{ display: "flex", gap: 14 }}>
            <Tag label="REGION" value="US_EAST" />
            <Tag label="LATENCY" value="184MS" tone="verify" />
            <Tag label="SOURCE_OF_TRUTH" value="CONFIRMED" tone="verify" />
          </div>
        </div>
      </main>

      <ToastContainer toasts={toasts} />

      {transferModal && (
        <TransferModal
          callerName={selectedName}
          onConfirm={handleTransferConfirm}
          onCancel={() => setTransferModal(false)}
        />
      )}
    </div>
  );
}

/* ---------- Score gauge ---------- */
function ScoreGauge({ score }) {
  const pct = score / 10;
  const r = 56;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 140, height: 140 }}>
      <svg viewBox="0 0 140 140" style={{ width: "100%", height: "100%" }}>
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="var(--sot-line-strong)"
          strokeWidth="3"
        />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="var(--sot-verify)"
          strokeWidth="3"
          strokeLinecap="butt"
          strokeDasharray={`${c * pct} ${c}`}
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dasharray var(--sot-dur-slow) var(--sot-ease)" }}
        />
        {/* tick marks */}
        {Array.from({ length: 10 }).map((_, i) => {
          const angle = (i / 10) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const x1 = 70 + Math.cos(rad) * (r + 6);
          const y1 = 70 + Math.sin(rad) * (r + 6);
          const x2 = 70 + Math.cos(rad) * (r + 10);
          const y2 = 70 + Math.sin(rad) * (r + 10);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={i < score ? "var(--sot-verify)" : "var(--sot-fg-4)"}
              strokeWidth="1.5"
            />
          );
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--sot-font-sans)",
            fontSize: 44,
            fontWeight: 800,
            color: "var(--sot-fg-1)",
            letterSpacing: "-0.04em",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {score}
          <span style={{ color: "var(--sot-fg-3)", fontSize: 22, fontWeight: 500 }}>
            /10
          </span>
        </span>
        <span
          className="sot-tag"
          style={{ fontSize: 9, marginTop: 4 }}
        >
          LEAD_SCORE
        </span>
      </div>
    </div>
  );
}

/* ---------- Export for React Router ---------- */
export default VoiceAIDashboard;
