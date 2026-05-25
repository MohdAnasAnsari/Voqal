import React, { useState, useEffect, useRef, useMemo } from 'react';
/* ============================================================
   CallDetailsPage — SOT design system
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

function PulseDot({ color = "var(--sot-verify)", size = 7 }) {
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

function QualityBars({ score, size = "md" }) {
  const w = size === "lg" ? 9 : 6;
  const h = size === "lg" ? 20 : 14;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", gap: 2 }}>
        {[...Array(10)].map((_, i) => (
          <span
            key={i}
            style={{
              width: w,
              height: h,
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
          fontSize: size === "lg" ? 16 : 12,
          color: "var(--sot-fg-1)",
          fontVariantNumeric: "tabular-nums",
          fontWeight: 700,
        }}
      >
        {score}/10
      </span>
    </div>
  );
}

function Section({ title, icon, children, action, padded = true }) {
  return (
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
        {icon && <Icon name={icon} size={13} color="var(--sot-fg-2)" />}
        <span className="sot-tag" style={{ color: "var(--sot-fg-1)", fontSize: 11, fontWeight: 600 }}>
          {title}
        </span>
        <span style={{ flex: 1 }} />
        {action}
      </div>
      <div style={padded ? { padding: "var(--sot-s-5)" } : { padding: 0 }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, children, mono, last }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "140px 1fr",
        gap: 14,
        padding: "10px 0",
        borderBottom: last ? "none" : "1px dashed var(--sot-line)",
        alignItems: "baseline",
      }}
    >
      <span className="sot-tag" style={{ fontSize: 10 }}>
        {label}
      </span>
      <span
        style={{
          fontFamily: mono ? "var(--sot-font-mono)" : "var(--sot-font-text)",
          fontSize: 13,
          color: "var(--sot-fg-1)",
          wordBreak: "break-word",
        }}
      >
        {children}
      </span>
    </div>
  );
}

/* ============================================================
   MOCK DATA
   ============================================================ */
const CALL = {
  id: "CALL_01001",
  caller: {
    name: "John Smith",
    phone: "+1-555-0100",
  },
  date: "May 24, 2026 · 2:45 PM",
  iso: "2026-05-24T14:45:00-04:00",
  durationSec: 165,
  status: "COMPLETED",
  direction: "INBOUND",
  aiConfidence: 94,
  model: "ARIA_3.1",
  language: "EN_US",
  intent: "Lead Qualification",
  sentiment: "POSITIVE",
  qualification: {
    score: 8,
    status: "QUALIFIED",
    nextAction: "Schedule 30-min solution-engineering demo within 5 days.",
  },
  extracted: {
    name: "John Smith",
    email: "john.smith@techcorp.com",
    company: "Tech Corp",
    title: "VP of Customer Operations",
    budget: null,
    timeline: "Q3 (next quarter)",
    callVolume: "600–800 / week",
    geo: "US East",
  },
  crm: {
    status: "SYNCED",
    provider: "HubSpot",
    crmId: "HS-29481-A",
    lastSync: "2 hours ago",
  },
  keyPoints: [
    "Decision maker — VP-level, owns the buying decision for sub-$5k/mo line items.",
    "Use case: inbound voicemail overflow at night. Approximately 700 calls/week.",
    "Specifically asked about Spanish language support — confirmed GA in mid-tier.",
    "Demo booked for Thursday 2pm ET with a solutions engineer.",
    "No competitor mentioned by name; previous tool was 'voicemail-only'.",
  ],
  entities: [
    { type: "PERSON",  value: "John Smith" },
    { type: "ORG",     value: "Tech Corp" },
    { type: "EMAIL",   value: "john.smith@techcorp.com" },
    { type: "PHONE",   value: "+1-555-0100" },
    { type: "TIME",    value: "Thursday after 2pm Eastern" },
    { type: "VOLUME",  value: "600 to 800 calls/week" },
    { type: "LANG",    value: "Spanish" },
  ],
  processing: {
    processedAt: "2026-05-24 · 2:47:55 PM",
    processingMs: 1200,
    apiCalls: 3,
    cost: 0.05,
    region: "us-east-1",
  },
  transcript: [
    { time: "00:00:02", speaker: "AGENT",  text: "Hi, this is Aria from the demo team — am I catching you at an OK time?" },
    { time: "00:00:07", speaker: "CALLER", text: "Yeah, I'm calling about the voice-AI product. Saw the demo on your site." },
    { time: "00:00:15", speaker: "AGENT",  text: "Great. Quick question — are you evaluating this for inbound qualification, outbound, or both?" },
    { time: "00:00:24", speaker: "CALLER", text: "Mostly inbound. We get a lot of leads at night that just go to voicemail." },
    { time: "00:00:32", speaker: "AGENT",  text: "Got it. How many inbound calls roughly per week — rough number is fine." },
    { time: "00:00:41", speaker: "CALLER", text: "Probably 600 to 800 in a busy week." },
    { time: "00:00:55", speaker: "AGENT",  text: "Perfect — that puts you in our mid-tier. I'd like to put 20 minutes on the calendar with a solutions engineer. Does Thursday afternoon work?" },
    { time: "00:01:08", speaker: "CALLER", text: "Thursday after 2pm Eastern is fine." },
    { time: "00:01:18", speaker: "AGENT",  text: "Booked. You'll get a confirmation email in the next minute." },
    { time: "00:01:28", speaker: "CALLER", text: "Quick question — does it handle Spanish?" },
    { time: "00:01:42", speaker: "AGENT",  text: "Yes — Spanish, French, and German are GA. We can have the SE walk through the language model behavior on Thursday." },
    { time: "00:02:01", speaker: "CALLER", text: "Great, thanks. Talk Thursday." },
    { time: "00:02:08", speaker: "AGENT",  text: "Thanks, John. Talk soon." },
  ],
};

const fmtClock = (sec) => {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};
const fmtDur = (sec) => `${Math.floor(sec / 60)}m ${(sec % 60).toString().padStart(2, "0")}s`;

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
   CALL HEADER — name, phone, status, close
   ============================================================ */
function CallHeader({ call, onClose }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--sot-s-4)",
        marginBottom: "var(--sot-s-5)",
      }}
    >
      {/* Breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "var(--sot-font-mono)",
          fontSize: 11,
          color: "var(--sot-fg-3)",
          letterSpacing: "var(--sot-tracking-tag)",
          textTransform: "uppercase",
        }}
      >
        <a
          href="/calls"
          style={{
            color: "var(--sot-fg-3)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Icon name="arrow-left" size={11} /> CALL_HISTORY
        </a>
        <Icon name="chevron-right" size={10} color="var(--sot-fg-4)" />
        <span style={{ color: "var(--sot-fg-1)" }}>{call.id}</span>
      </div>

      {/* Main row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "var(--sot-s-5)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: "var(--sot-s-4)", alignItems: "center" }}>
          <div
            style={{
              width: 72,
              height: 72,
              background: "var(--sot-ink)",
              border: "1px solid var(--sot-line-strong)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--sot-font-mono)",
              fontSize: 22,
              color: "var(--sot-fg-1)",
              fontWeight: 600,
              position: "relative",
            }}
          >
            {call.caller.name.split(" ").map((s) => s[0]).join("")}
            <span
              style={{
                position: "absolute",
                top: -1,
                right: -1,
                width: 8,
                height: 8,
                background: "var(--sot-verify)",
              }}
            />
          </div>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 6,
                flexWrap: "wrap",
              }}
            >
              <Tag label="CALL_ID" value={call.id} />
              <Tag label={call.direction} />
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "3px 10px",
                  background: "var(--sot-verify-soft)",
                  border: "1px solid var(--sot-verify)",
                  color: "var(--sot-verify)",
                  fontFamily: "var(--sot-font-mono)",
                  fontSize: 10,
                  letterSpacing: "var(--sot-tracking-tag)",
                  borderRadius: "var(--sot-r-pill)",
                  fontWeight: 600,
                }}
              >
                <Icon name="check" size={11} color="var(--sot-verify)" /> {call.status}
              </span>
            </div>
            <h1
              className="sot-h2"
              style={{ fontSize: 36, letterSpacing: "-0.025em", marginBottom: 6 }}
            >
              {call.caller.name}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: "var(--sot-fg-3)",
                fontSize: 14,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--sot-font-mono)",
                  color: "var(--sot-fg-2)",
                }}
              >
                {call.caller.phone}
              </span>
              <span style={{ color: "var(--sot-fg-4)" }}>·</span>
              <span
                style={{
                  fontFamily: "var(--sot-font-mono)",
                  color: "var(--sot-fg-2)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {fmtDur(call.durationSec)}
              </span>
              <span style={{ color: "var(--sot-fg-4)" }}>·</span>
              <span style={{ fontFamily: "var(--sot-font-mono)", color: "var(--sot-fg-3)" }}>
                {call.date}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <a
            href="Lead Details.html"
            className="sot-btn ghost"
            style={{ height: 36, textDecoration: "none" }}
          >
            <Icon name="user-round" size={13} /> Open lead
          </a>
          <button className="sot-btn ghost" style={{ height: 36 }}>
            <Icon name="printer" size={13} /> Print
          </button>
          <button
            onClick={onClose}
            className="sot-btn ghost"
            style={{ height: 36, width: 36, padding: 0, justifyContent: "center" }}
            title="Close"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   AUDIO PLAYER — fake waveform scrubber
   ============================================================ */
function AudioPlayer({ durationSec }) {
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [volume, setVolume] = useState(0.75);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setPosition((p) => {
        if (p + 1 >= durationSec) {
          setPlaying(false);
          return durationSec;
        }
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [playing, durationSec]);

  // Generate a deterministic waveform
  const bars = useMemo(() => {
    const out = [];
    for (let i = 0; i < 96; i++) {
      const v = 25 + Math.abs(Math.sin(i * 0.42)) * 50 + Math.abs(Math.sin(i * 0.13 + 1)) * 18;
      out.push(Math.min(100, v));
    }
    return out;
  }, []);

  const progress = position / durationSec;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Waveform scrubber */}
      <div
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const p = (e.clientX - rect.left) / rect.width;
          setPosition(Math.max(0, Math.min(durationSec, p * durationSec)));
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          height: 64,
          padding: "0 var(--sot-s-3)",
          background: "var(--sot-ink)",
          border: "1px solid var(--sot-line)",
          cursor: "pointer",
          position: "relative",
        }}
      >
        {bars.map((h, i) => {
          const barP = i / bars.length;
          return (
            <span
              key={i}
              style={{
                width: 2,
                height: `${h}%`,
                background:
                  barP < progress
                    ? "var(--sot-verify)"
                    : barP - progress < 0.012
                    ? "var(--sot-fg-1)"
                    : "var(--sot-line-strong)",
                transition: "background var(--sot-dur-fast) var(--sot-ease)",
              }}
            />
          );
        })}
      </div>

      {/* Controls row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => setPlaying(!playing)}
          className="sot-btn verify"
          style={{
            height: 40,
            width: 40,
            padding: 0,
            justifyContent: "center",
            borderRadius: 999,
          }}
        >
          <Icon
            name={playing ? "pause" : "play"}
            size={14}
            color="white"
          />
        </button>
        <button
          onClick={() => setPosition(Math.max(0, position - 10))}
          className="sot-btn ghost"
          style={{ height: 32, width: 32, padding: 0, justifyContent: "center" }}
          title="Back 10s"
        >
          <Icon name="rewind" size={12} />
        </button>
        <button
          onClick={() => setPosition(Math.min(durationSec, position + 10))}
          className="sot-btn ghost"
          style={{ height: 32, width: 32, padding: 0, justifyContent: "center" }}
          title="Forward 10s"
        >
          <Icon name="fast-forward" size={12} />
        </button>

        <span
          className="sot-mono"
          style={{
            fontSize: 13,
            color: "var(--sot-fg-1)",
            fontVariantNumeric: "tabular-nums",
            fontWeight: 600,
            minWidth: 96,
          }}
        >
          {fmtClock(position)} / {fmtClock(durationSec)}
        </span>

        <span style={{ flex: 1 }} />

        {/* Volume */}
        <Icon name={volume < 0.05 ? "volume-x" : volume < 0.5 ? "volume-1" : "volume-2"} size={13} color="var(--sot-fg-3)" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          style={{ width: 70, accentColor: "var(--sot-verify)" }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="sot-btn ghost" style={{ height: 32, flex: 1, justifyContent: "center" }}>
          <Icon name="download" size={12} /> Download
        </button>
        <button className="sot-btn ghost" style={{ height: 32, flex: 1, justifyContent: "center" }}>
          <Icon name="share-2" size={12} /> Export
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   TRANSCRIPT
   ============================================================ */
function FullTranscript({ messages }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    const text = messages.map((m) => `[${m.time}] ${m.speaker}: ${m.text}`).join("\n");
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Section
      title="FULL_TRANSCRIPT"
      icon="file-text"
      action={
        <div style={{ display: "flex", gap: 6 }}>
          <Tag label="LANG" value={CALL.language} />
          <Tag label="MODEL" value={CALL.model} />
          <button
            onClick={copy}
            className="sot-btn ghost"
            style={{ height: 28, fontSize: 10 }}
          >
            <Icon name={copied ? "check" : "copy"} size={11} />
            {copied ? "Copied" : "Copy all"}
          </button>
          <button className="sot-btn ghost" style={{ height: 28, fontSize: 10 }}>
            <Icon name="download" size={11} /> Download
          </button>
        </div>
      }
      padded={false}
    >
      <div
        style={{
          padding: "var(--sot-s-5)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          maxHeight: 480,
          overflowY: "auto",
        }}
      >
        {messages.map((m, i) => {
          const isAI = m.speaker === "AGENT";
          return (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "70px 1fr",
                gap: 12,
                alignItems: "start",
              }}
            >
              {/* Timestamp gutter */}
              <span
                style={{
                  fontFamily: "var(--sot-font-mono)",
                  fontSize: 10,
                  color: "var(--sot-fg-4)",
                  paddingTop: 2,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "var(--sot-tracking-mono)",
                }}
              >
                {m.time}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: "var(--sot-font-mono)",
                    fontSize: 10,
                    letterSpacing: "var(--sot-tracking-tag)",
                    color: isAI ? "var(--sot-verify)" : "var(--sot-fg-2)",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      background: isAI ? "var(--sot-verify)" : "var(--sot-fg-2)",
                      borderRadius: 999,
                    }}
                  />
                  {isAI ? "AI_AGENT · ARIA" : `CALLER · ${CALL.caller.name.toUpperCase()}`}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    lineHeight: 1.55,
                    color: "var(--sot-fg-1)",
                    paddingLeft: 14,
                    borderLeft: `1px solid ${isAI ? "var(--sot-verify)" : "var(--sot-line-strong)"}`,
                    background: isAI ? "rgba(29,155,240,.04)" : "transparent",
                    padding: "6px 12px",
                  }}
                >
                  {m.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ============================================================
   AI ANALYSIS
   ============================================================ */
function AIAnalysis({ call }) {
  const sentimentColor =
    call.sentiment === "POSITIVE"
      ? "var(--sot-verify)"
      : call.sentiment === "NEGATIVE"
      ? "var(--sot-alert)"
      : "var(--sot-fg-2)";

  return (
    <Section title="AI_ANALYSIS" icon="brain-circuit">
      {/* Top stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 0,
          marginBottom: 20,
          border: "1px solid var(--sot-line)",
        }}
      >
        <StatTile
          label="INTENT"
          value={call.intent.toUpperCase().replace(/ /g, "_")}
          mono
          accent
        />
        <StatTile
          label="SENTIMENT"
          value={call.sentiment}
          color={sentimentColor}
          mono
        />
        <StatTile
          label="AI_CONFIDENCE"
          value={`${call.aiConfidence}%`}
          color="var(--sot-verify)"
          mono
        />
        <StatTile
          label="ENTITIES"
          value={`${call.entities.length}`}
          mono
        />
      </div>

      {/* Entities */}
      <div style={{ marginBottom: 20 }}>
        <span className="sot-tag" style={{ fontSize: 10, display: "block", marginBottom: 10 }}>
          ENTITIES_EXTRACTED
        </span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {call.entities.map((e, i) => (
            <span
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "baseline",
                gap: 6,
                padding: "5px 10px",
                background: "var(--sot-ink)",
                border: "1px solid var(--sot-line-strong)",
                fontFamily: "var(--sot-font-mono)",
                fontSize: 11,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  color: "var(--sot-fg-4)",
                  letterSpacing: "var(--sot-tracking-tag)",
                  fontWeight: 600,
                }}
              >
                {e.type}
              </span>
              <span style={{ color: "var(--sot-fg-1)" }}>{e.value}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Key points */}
      <div>
        <span className="sot-tag" style={{ fontSize: 10, display: "block", marginBottom: 10 }}>
          KEY_POINTS_IDENTIFIED
        </span>
        <ol
          style={{
            margin: 0,
            paddingLeft: 0,
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {call.keyPoints.map((p, i) => (
            <li
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "32px 1fr",
                gap: 12,
                fontSize: 14,
                color: "var(--sot-fg-1)",
                lineHeight: 1.55,
                paddingBottom: 10,
                borderBottom: i === call.keyPoints.length - 1 ? "none" : "1px dashed var(--sot-line)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--sot-font-mono)",
                  fontSize: 11,
                  color: "var(--sot-fg-3)",
                  letterSpacing: "var(--sot-tracking-tag)",
                  fontWeight: 600,
                  paddingTop: 2,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{p}</span>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

function StatTile({ label, value, mono, accent, color }) {
  return (
    <div
      style={{
        padding: "12px 16px",
        borderRight: "1px solid var(--sot-line)",
        background: accent ? "var(--sot-ink)" : "transparent",
      }}
    >
      <div className="sot-tag" style={{ fontSize: 9, marginBottom: 4 }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: mono ? "var(--sot-font-mono)" : "var(--sot-font-sans)",
          fontSize: 14,
          fontWeight: 700,
          color: color || (accent ? "var(--sot-verify)" : "var(--sot-fg-1)"),
          letterSpacing: mono ? "var(--sot-tracking-mono)" : "-0.005em",
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* ============================================================
   CALL INFORMATION (left col, top)
   ============================================================ */
function CallInformation({ call }) {
  return (
    <Section title="CALL_INFORMATION" icon="info">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
        <div>
          <InfoRow label="DATE_TIME" mono>
            {call.date}
          </InfoRow>
          <InfoRow label="DURATION" mono>
            {fmtDur(call.durationSec)}
          </InfoRow>
          <InfoRow label="PHONE" mono last>
            {call.caller.phone}
          </InfoRow>
        </div>
        <div>
          <InfoRow label="DIRECTION">
            <Tag label={call.direction} />
          </InfoRow>
          <InfoRow label="STATUS">
            <span style={{ color: "var(--sot-verify)", fontWeight: 600 }}>
              {call.status}
            </span>
          </InfoRow>
          <InfoRow label="AI_CONFIDENCE" mono last>
            <span style={{ color: "var(--sot-verify)", fontWeight: 700 }}>
              {call.aiConfidence}%
            </span>
            <span
              style={{
                display: "inline-block",
                marginLeft: 8,
                width: 80,
                height: 4,
                background: "var(--sot-line-strong)",
                verticalAlign: "middle",
              }}
            >
              <div
                style={{
                  width: call.aiConfidence + "%",
                  height: "100%",
                  background: "var(--sot-verify)",
                }}
              />
            </span>
          </InfoRow>
        </div>
      </div>
    </Section>
  );
}

/* ============================================================
   QUALIFICATION RESULT (right col, top)
   ============================================================ */
function QualificationResult({ call }) {
  return (
    <div
      className="sot-card sot-brackets verify"
      style={{
        padding: "var(--sot-s-5)",
        position: "relative",
      }}
    >
      <span className="b tl" />
      <span className="b tr" />
      <span className="b bl" />
      <span className="b br" />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <Icon name="target" size={13} color="var(--sot-verify)" />
        <span className="sot-tag" style={{ color: "var(--sot-fg-1)", fontSize: 11, fontWeight: 600 }}>
          QUALIFICATION_RESULT
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <QualityBars score={call.qualification.score} size="lg" />
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            background: "var(--sot-verify-soft)",
            border: "1px solid var(--sot-verify)",
            color: "var(--sot-verify)",
            fontFamily: "var(--sot-font-mono)",
            fontSize: 12,
            letterSpacing: "var(--sot-tracking-tag)",
            borderRadius: "var(--sot-r-pill)",
            fontWeight: 700,
          }}
        >
          <span className="sot-check" style={{ width: "1em", height: "1em", fontSize: 14 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          {call.qualification.status}
        </span>
      </div>

      <div
        style={{
          padding: 12,
          background: "var(--sot-ink)",
          border: "1px solid var(--sot-line)",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ width: 3, height: 12, background: "var(--sot-verify)" }} />
          <span className="sot-tag" style={{ fontSize: 9, color: "var(--sot-verify)" }}>
            RECOMMENDED_NEXT_ACTION
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--sot-fg-1)", lineHeight: 1.55 }}>
          {call.qualification.nextAction}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   EXTRACTED INFORMATION
   ============================================================ */
function ExtractedInformation({ call }) {
  const fields = [
    { label: "NAME",        value: call.extracted.name,        mono: false },
    { label: "EMAIL",       value: call.extracted.email,       mono: true  },
    { label: "COMPANY",     value: call.extracted.company,     mono: false },
    { label: "TITLE",       value: call.extracted.title,       mono: false },
    { label: "BUDGET",      value: call.extracted.budget,      mono: true  },
    { label: "TIMELINE",    value: call.extracted.timeline,    mono: false },
    { label: "CALL_VOLUME", value: call.extracted.callVolume,  mono: true  },
    { label: "GEO",         value: call.extracted.geo,         mono: true  },
  ];
  return (
    <Section title="EXTRACTED_INFORMATION" icon="scan-search">
      {fields.map((f, i) => (
        <InfoRow key={f.label} label={f.label} mono={f.mono} last={i === fields.length - 1}>
          {f.value || (
            <span
              className="sot-mono"
              style={{ color: "var(--sot-fg-4)", fontSize: 11, letterSpacing: "var(--sot-tracking-tag)" }}
            >
              NOT_MENTIONED
            </span>
          )}
        </InfoRow>
      ))}
    </Section>
  );
}

/* ============================================================
   CRM INTEGRATION
   ============================================================ */
function CRMIntegration({ call }) {
  return (
    <Section
      title="CRM_INTEGRATION"
      icon="git-branch"
      action={
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--sot-verify)",
            fontFamily: "var(--sot-font-mono)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "var(--sot-tracking-tag)",
          }}
        >
          <PulseDot color="var(--sot-verify)" size={6} />
          {call.crm.status}
        </span>
      }
    >
      <InfoRow label="PROVIDER">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Icon name="link-2" size={11} color="var(--sot-verify)" />
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            style={{ color: "var(--sot-verify)", textDecoration: "none" }}
          >
            {call.crm.provider}
          </a>
        </span>
      </InfoRow>
      <InfoRow label="LEAD_ID" mono>
        {call.crm.crmId}
      </InfoRow>
      <InfoRow label="LAST_SYNCED" mono last>
        {call.crm.lastSync}
      </InfoRow>
      <a
        href="#"
        onClick={(e) => e.preventDefault()}
        className="sot-btn ghost"
        style={{
          marginTop: 12,
          width: "100%",
          justifyContent: "center",
          textDecoration: "none",
          height: 36,
        }}
      >
        <Icon name="arrow-up-right" size={12} /> View in HubSpot
      </a>
    </Section>
  );
}

/* ============================================================
   ACTIONS
   ============================================================ */
function Actions() {
  return (
    <Section title="ACTIONS" icon="zap">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6,
        }}
      >
        <button className="sot-btn primary" style={{ gridColumn: "1 / -1", justifyContent: "center", height: 38 }}>
          <Icon name="save" size={13} color="black" /> Save lead
        </button>
        <button className="sot-btn verify" style={{ gridColumn: "1 / -1", justifyContent: "center", height: 38 }}>
          <Icon name="refresh-cw" size={13} color="white" /> Sync to CRM
        </button>
        <button className="sot-btn" style={{ justifyContent: "center" }}>
          <Icon name="phone" size={13} /> Call back
        </button>
        <button className="sot-btn" style={{ justifyContent: "center" }}>
          <Icon name="mail" size={13} /> Follow-up
        </button>
        <button className="sot-btn" style={{ justifyContent: "center" }}>
          <Icon name="user-round" size={13} /> Transfer
        </button>
        <button
          className="sot-btn"
          style={{
            justifyContent: "center",
            color: "var(--sot-alert)",
            borderColor: "var(--sot-alert)",
          }}
        >
          <Icon name="ban" size={13} color="var(--sot-alert)" /> Mark spam
        </button>
      </div>
    </Section>
  );
}

/* ============================================================
   RECORDING
   ============================================================ */
function Recording({ call }) {
  return (
    <Section
      title="CALL_RECORDING"
      icon="audio-lines"
      action={
        <Tag label="DUR" value={fmtClock(call.durationSec)} />
      }
    >
      <AudioPlayer durationSec={call.durationSec} />
    </Section>
  );
}

/* ============================================================
   FOOTER — processing metadata
   ============================================================ */
function ProcessingFooter({ call }) {
  return (
    <div
      className="sot-card"
      style={{
        marginTop: "var(--sot-s-5)",
        padding: 0,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      }}
    >
      {[
        { label: "CREATED_BY", value: "ARIA_AGENT", icon: "audio-waveform" },
        { label: "PROCESSED_AT", value: call.processing.processedAt, icon: "clock", mono: true },
        { label: "PROCESSING_TIME", value: `${(call.processing.processingMs / 1000).toFixed(1)}s`, icon: "zap", mono: true },
        { label: "API_CALLS", value: String(call.processing.apiCalls), icon: "git-merge", mono: true },
        { label: "COST", value: `$${call.processing.cost.toFixed(2)}`, icon: "dollar-sign", mono: true, tone: "verify" },
        { label: "REGION", value: call.processing.region.toUpperCase().replace(/-/g, "_"), icon: "globe", mono: true },
      ].map((m, i, arr) => (
        <div
          key={m.label}
          style={{
            padding: "14px 18px",
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
              color={m.tone === "verify" ? "var(--sot-verify)" : "var(--sot-fg-3)"}
            />
            <span className="sot-tag" style={{ fontSize: 9 }}>
              {m.label}
            </span>
          </div>
          <span
            style={{
              fontFamily: m.mono ? "var(--sot-font-mono)" : "var(--sot-font-sans)",
              fontSize: 14,
              fontWeight: 700,
              color: m.tone === "verify" ? "var(--sot-verify)" : "var(--sot-fg-1)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {m.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   ROOT
   ============================================================ */
function CallDetailsPage() {
  const handleClose = () => {
    window.location.href = "/calls";
  };

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
        <CallHeader call={CALL} onClose={handleClose} />

        <div
          className="detail-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.55fr) minmax(320px, 1fr)",
            gap: "var(--sot-s-4)",
            alignItems: "start",
          }}
        >
          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sot-s-4)" }}>
            <CallInformation call={CALL} />
            <FullTranscript messages={CALL.transcript} />
            <AIAnalysis call={CALL} />
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sot-s-4)" }}>
            <QualificationResult call={CALL} />
            <ExtractedInformation call={CALL} />
            <CRMIntegration call={CALL} />
            <Actions />
            <Recording call={CALL} />
          </div>
        </div>

        <ProcessingFooter call={CALL} />

        {/* Doc footer */}
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
            VOICE_AI_AGENT // {CALL.id} // PROCESSED_BY_ARIA
          </span>
          <div style={{ display: "flex", gap: 14 }}>
            <Tag label="MODEL" value={CALL.model} />
            <Tag label="LANG" value={CALL.language} />
            <Tag label="SOURCE_OF_TRUTH" value="CONFIRMED" tone="verify" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default CallDetailsPage;
