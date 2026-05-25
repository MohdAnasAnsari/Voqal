import React, { useState, useEffect, useRef, useMemo } from 'react';
/* ============================================================
   LeadDetailsPage — SOT design system
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

/* ---------- Tag ---------- */
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

/* ---------- Status palette ---------- */
const STATUS = {
  new:       { color: "var(--sot-warn)",   soft: "var(--sot-warn-soft)",   label: "NEW" },
  qualified: { color: "var(--sot-verify)", soft: "var(--sot-verify-soft)", label: "QUALIFIED" },
  contacted: { color: "var(--sot-fg-2)",   soft: "rgba(184,184,191,.12)",  label: "CONTACTED" },
  converted: { color: "var(--sot-verify)", soft: "var(--sot-verify-soft)", label: "CONVERTED" },
  lost:      { color: "var(--sot-alert)",  soft: "var(--sot-alert-soft)",  label: "LOST" },
};

function StatusPill({ status, size = "sm" }) {
  const s = STATUS[status];
  const big = size === "lg";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: big ? 8 : 6,
        padding: big ? "5px 12px" : "3px 8px",
        background: s.soft,
        border: `1px solid ${s.color}`,
        color: s.color,
        fontFamily: "var(--sot-font-mono)",
        fontSize: big ? 12 : 10,
        letterSpacing: "var(--sot-tracking-tag)",
        borderRadius: "var(--sot-r-pill)",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: big ? 7 : 5,
          height: big ? 7 : 5,
          background: s.color,
          borderRadius: 999,
        }}
      />
      {s.label}
    </span>
  );
}

/* ---------- Quality bars (10-stop, large) ---------- */
function QualityBars({ score, size = "md" }) {
  const w = size === "lg" ? 8 : 5;
  const h = size === "lg" ? 18 : 12;
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
          fontSize: size === "lg" ? 14 : 11,
          color: "var(--sot-fg-2)",
          fontVariantNumeric: "tabular-nums",
          fontWeight: 600,
        }}
      >
        {score}/10
      </span>
    </div>
  );
}

/* ---------- Pulse dot ---------- */
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

/* ============================================================
   MOCK DATA
   ============================================================ */
const LEAD = {
  id: "LEAD_04001",
  name: "John Smith",
  title: "VP of Customer Operations",
  email: "john.smith@techcorp.com",
  phone: "+1-555-0100",
  company: "Tech Corp",
  website: "techcorp.com",
  linkedin: "linkedin.com/in/jsmith-techcorp",
  source: "Voice AI",
  dateAdded: "2026-05-22",
  status: "qualified",
  quality: 8,
  scoring: {
    engagement: 8,
    budget: 6,
    timeline: 7,
    fit: 9,
  },
  assignedTo: "M_JOHNSTON",
  assignedDate: "2 days ago",
  estimatedValue: 5000,
  dealStage: "Discovery",
  convProbability: 72,
  crm: {
    provider: "HubSpot",
    crmId: "HS-29481-A",
    lastSync: "30 min ago",
    syncedFields: 14,
    status: "SYNCED",
  },
  totalCalls: 3,
  lastCallAgo: "2 hours ago",
  totalTalkSec: 755,
  whyQualified: "Strong engagement signals across two calls, articulated a clear pain point around inbound voicemail volume (~700/wk), and is the decision maker for a Q3 evaluation.",
  recommendedAction: "Schedule 30-minute solution-engineering demo within 5 days.",
  nextSteps: "Send follow-up email Tuesday with case studies. Confirm Thursday 2pm ET demo. Loop in SE.",
  urgency: "high",
};

const AGENTS = [
  { id: "M_JOHNSTON",  name: "M. Johnston" },
  { id: "K_ALVAREZ",   name: "K. Alvarez" },
  { id: "R_PATEL",     name: "R. Patel" },
  { id: "S_NAKAMURA",  name: "S. Nakamura" },
  { id: "J_OBRIEN",    name: "J. O'Brien" },
];

const CALLS = [
  {
    id: "CALL_01001",
    date: "May 24, 2026 · 2:45 PM",
    relative: "2 hours ago",
    durationSec: 165,
    quality: 8,
    intent: "LEAD_QUALIFY",
    direction: "INBOUND",
    summary: "Discussed inbound-call qualification use case. Confirmed volume (~700/wk). Booked Thursday demo with SE.",
    transcript: [
      { speaker: "AGENT", text: "Hi, this is Aria from the demo team — am I catching you at an OK time?" },
      { speaker: "CALLER", text: "Yeah, I'm calling about the voice-AI product. Saw the demo on your site." },
      { speaker: "AGENT", text: "Great. Quick question — are you evaluating this for inbound qualification, outbound, or both?" },
      { speaker: "CALLER", text: "Mostly inbound. We get a lot of leads at night that just go to voicemail." },
      { speaker: "AGENT", text: "Got it. How many inbound calls roughly per week — rough number is fine." },
      { speaker: "CALLER", text: "Probably 600 to 800 in a busy week." },
      { speaker: "AGENT", text: "Perfect — that puts you in our mid-tier. I'd like to put 20 minutes on the calendar with a solutions engineer. Does Thursday afternoon work?" },
    ],
  },
  {
    id: "CALL_00984",
    date: "May 23, 2026 · 11:18 AM",
    relative: "1 day ago",
    durationSec: 320,
    quality: 7,
    intent: "PRICING",
    direction: "INBOUND",
    summary: "Pricing tier discussion. Sent one-pager. Mid-tier ($1,800/mo) confirmed as fit for ~700 calls/wk.",
    transcript: [
      { speaker: "AGENT", text: "Thanks for calling — I see you spoke with us yesterday. How can I help today?" },
      { speaker: "CALLER", text: "Just want to understand the pricing tiers — saw three on the website but no numbers." },
      { speaker: "AGENT", text: "Sure. Pricing scales by call volume. Mid-tier starts at $1,800/mo for up to 1,000 calls. Want me to email a one-pager?" },
      { speaker: "CALLER", text: "Please." },
    ],
  },
  {
    id: "CALL_00921",
    date: "May 22, 2026 · 4:02 PM",
    relative: "2 days ago",
    durationSec: 270,
    quality: 6,
    intent: "INITIAL_INQUIRY",
    direction: "INBOUND",
    summary: "First contact — general inquiry from website. Captured contact info and use-case (inbound voicemail overflow).",
    transcript: [
      { speaker: "AGENT", text: "Hi, this is Aria. How can I help?" },
      { speaker: "CALLER", text: "Saw your site — want to learn more about the voice AI." },
      { speaker: "AGENT", text: "Sure — what's prompting the search?" },
      { speaker: "CALLER", text: "We're missing leads at night. Just goes to voicemail." },
    ],
  },
];

const COMMUNICATIONS = [
  { type: "call", date: "May 24 · 2:45 PM", relative: "2 hours ago", title: "Inbound call — Lead qualify",
    body: "3-minute call. Booked Thursday demo. AI confidence 94%.", actor: "ARIA_AGENT" },
  { type: "email", date: "May 24 · 10:12 AM", relative: "8 hours ago", title: "Re: Pricing one-pager",
    body: "Thanks for the document. Quick question — does mid-tier include the Spanish language model, or is that an add-on?", actor: "INBOUND" },
  { type: "email", date: "May 23 · 11:32 AM", relative: "1 day ago", title: "Voice AI — mid-tier pricing one-pager",
    body: "Hi John, attached is the one-pager we discussed. Happy to walk through any of it on a call.", actor: "M_JOHNSTON" },
  { type: "call", date: "May 23 · 11:18 AM", relative: "1 day ago", title: "Inbound call — Pricing",
    body: "5-minute call. Discussed mid-tier pricing. Requested one-pager.", actor: "ARIA_AGENT" },
  { type: "sms", date: "May 22 · 4:30 PM", relative: "2 days ago", title: "Confirmation",
    body: "Hi John, confirming your contact info for the demo follow-up — reply Y to confirm.", actor: "SYSTEM" },
  { type: "call", date: "May 22 · 4:02 PM", relative: "2 days ago", title: "Inbound call — Initial inquiry",
    body: "4.5-minute call. First contact. Captured use-case and contact info.", actor: "ARIA_AGENT" },
];

const NOTES_INITIAL = [
  {
    id: 1,
    author: "M. Johnston",
    date: "May 24, 2026 · 3:01 PM",
    relative: "1 hour ago",
    body: "John mentioned they evaluated Voicelane last quarter and rejected on price + lack of Spanish. We're priced lower on the mid-tier and Spanish is GA — strong angle for the demo.",
  },
  {
    id: 2,
    author: "K. Alvarez",
    date: "May 23, 2026 · 12:40 PM",
    relative: "1 day ago",
    body: "Decision maker confirmed. Reports to CRO; budget approval not required for sub-$5k/mo line items. Q3 timeline is firm.",
  },
  {
    id: 3,
    author: "M. Johnston",
    date: "May 22, 2026 · 4:18 PM",
    relative: "2 days ago",
    body: "Initial qualification looks strong. Adding to qualified queue. Will assign to myself for the demo cycle.",
  },
];

const SYNC_LOG = [
  { time: "May 24 · 3:30 PM", relative: "30 min ago", action: "FIELDS_UPDATED", detail: "status, quality, last_call_at — 3 fields", status: "OK" },
  { time: "May 24 · 2:48 PM", relative: "1 hr ago", action: "CALL_LOGGED", detail: "CALL_01001 → HS activity", status: "OK" },
  { time: "May 23 · 11:33 AM", relative: "1 day ago", action: "EMAIL_LOGGED", detail: "Pricing one-pager → HS activity", status: "OK" },
  { time: "May 22 · 4:18 PM", relative: "2 days ago", action: "CONTACT_CREATED", detail: "New contact + company in HubSpot", status: "OK" },
  { time: "May 22 · 4:02 PM", relative: "2 days ago", action: "LEAD_INGESTED", detail: "Source: Voice AI · CALL_00921", status: "OK" },
];

const fmtDuration = (sec) => {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}m ${s}s`;
};
const fmtCurrency = (n) => "$" + n.toLocaleString();

/* ============================================================
   HEADER (top nav)
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
          { label: "LEADS",        href: "/leads", active: true },
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
   LEAD HEADER — breadcrumb + name + status + actions
   ============================================================ */
function LeadHeader({ lead, onStatusChange, onConvert }) {
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
          href="/leads"
          style={{
            color: "var(--sot-fg-3)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Icon name="arrow-left" size={11} /> LEADS
        </a>
        <Icon name="chevron-right" size={10} color="var(--sot-fg-4)" />
        <span style={{ color: "var(--sot-fg-1)" }}>{lead.id}</span>
      </div>

      {/* Main header row */}
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
            {lead.name.split(" ").map((s) => s[0]).join("")}
            <span
              style={{
                position: "absolute",
                top: -1,
                right: -1,
                width: 8,
                height: 8,
                background: "var(--sot-construction)",
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
              <Tag label="LEAD_ID" value={lead.id} />
              <Tag label="SOURCE" value={lead.source.toUpperCase().replace(" ", "_")} />
              <StatusPill status={lead.status} />
            </div>
            <h1
              className="sot-h2"
              style={{ fontSize: 36, letterSpacing: "-0.025em", marginBottom: 6 }}
            >
              {lead.name}
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
              <span>{lead.title}</span>
              <span style={{ color: "var(--sot-fg-4)" }}>·</span>
              <span style={{ color: "var(--sot-fg-2)" }}>{lead.company}</span>
              <span style={{ color: "var(--sot-fg-4)" }}>·</span>
              <QualityBars score={lead.quality} size="md" />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="sot-btn">
            <Icon name="phone-call" size={13} /> Call now
          </button>
          <button className="sot-btn">
            <Icon name="mail" size={13} /> Send email
          </button>
          <button
            className="sot-btn primary"
            onClick={onConvert}
            disabled={lead.status === "converted"}
          >
            <Icon name="check-circle-2" size={13} color="black" />
            {lead.status === "converted" ? "Converted" : "Mark as converted"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TAB BAR
   ============================================================ */
const TABS = [
  { id: "overview",      label: "Overview",      icon: "layout-dashboard" },
  { id: "calls",         label: "Calls",         icon: "phone", count: CALLS.length },
  { id: "communication", label: "Communication", icon: "message-square", count: COMMUNICATIONS.length },
  { id: "notes",         label: "Notes",         icon: "file-text" },
  { id: "crm",           label: "CRM sync",      icon: "git-branch" },
];

function TabBar({ active, onSelect }) {
  return (
    <div
      style={{
        display: "flex",
        borderBottom: "1px solid var(--sot-line-strong)",
        marginBottom: "var(--sot-s-5)",
        gap: 2,
        overflowX: "auto",
      }}
    >
      {TABS.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            style={{
              padding: "12px 18px",
              background: isActive ? "var(--sot-surface-2)" : "transparent",
              border: "none",
              borderBottom: `2px solid ${isActive ? "var(--sot-verify)" : "transparent"}`,
              marginBottom: -1,
              color: isActive ? "var(--sot-fg-1)" : "var(--sot-fg-3)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "var(--sot-font-mono)",
              fontSize: 11,
              letterSpacing: "var(--sot-tracking-tag)",
              textTransform: "uppercase",
              fontWeight: 600,
              transition: "all var(--sot-dur-fast) var(--sot-ease)",
              whiteSpace: "nowrap",
            }}
          >
            <Icon
              name={t.icon}
              size={13}
              color={isActive ? "var(--sot-verify)" : "var(--sot-fg-3)"}
            />
            {t.label}
            {t.count != null && (
              <span
                style={{
                  background: isActive ? "var(--sot-verify-soft)" : "var(--sot-ink)",
                  border: `1px solid ${
                    isActive ? "var(--sot-verify)" : "var(--sot-line-strong)"
                  }`,
                  padding: "1px 6px",
                  fontSize: 10,
                  color: isActive ? "var(--sot-verify)" : "var(--sot-fg-3)",
                  borderRadius: "var(--sot-r-pill)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
   COMMON: section card + info row
   ============================================================ */
function Section({ title, icon, children, action }) {
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
        <span
          className="sot-tag"
          style={{ color: "var(--sot-fg-1)", fontSize: 11, fontWeight: 600 }}
        >
          {title}
        </span>
        <span style={{ flex: 1 }} />
        {action}
      </div>
      <div style={{ padding: "var(--sot-s-5)" }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, children, mono, last }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "120px 1fr",
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
   OVERVIEW TAB
   ============================================================ */
function OverviewTab({ lead, onAgentChange }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.5fr) minmax(280px, 1fr)",
        gap: "var(--sot-s-4)",
        alignItems: "start",
      }}
      className="overview-grid"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sot-s-4)" }}>
        {/* Contact info */}
        <Section title="CONTACT_INFORMATION" icon="user">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
            <div>
              <InfoRow label="NAME">{lead.name}</InfoRow>
              <InfoRow label="TITLE">{lead.title}</InfoRow>
              <InfoRow label="COMPANY">
                <a href="#" style={{ color: "var(--sot-fg-1)", textDecoration: "none", borderBottom: "1px dashed var(--sot-line-strong)" }} onClick={(e) => e.preventDefault()}>
                  {lead.company}
                </a>
              </InfoRow>
              <InfoRow label="WEBSITE" mono last>
                <a
                  href={`https://${lead.website}`}
                  onClick={(e) => e.preventDefault()}
                  style={{
                    color: "var(--sot-verify)",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {lead.website}
                  <Icon name="arrow-up-right" size={11} color="var(--sot-verify)" />
                </a>
              </InfoRow>
            </div>
            <div>
              <InfoRow label="EMAIL" mono>
                {lead.email}
              </InfoRow>
              <InfoRow label="PHONE" mono>
                {lead.phone}
              </InfoRow>
              <InfoRow label="LINKEDIN" mono>
                <a
                  href={`https://${lead.linkedin}`}
                  onClick={(e) => e.preventDefault()}
                  style={{
                    color: "var(--sot-verify)",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  /in/jsmith-techcorp
                  <Icon name="arrow-up-right" size={11} color="var(--sot-verify)" />
                </a>
              </InfoRow>
              <InfoRow label="ADDED" mono last>
                {lead.dateAdded}
              </InfoRow>
            </div>
          </div>
        </Section>

        {/* Lead scoring */}
        <Section
          title="LEAD_SCORING"
          icon="target"
          action={
            <Tag
              label="OVERALL"
              value={`${lead.quality}/10`}
              tone="verify"
            />
          }
        >
          {/* Big bars */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span className="sot-tag" style={{ fontSize: 11, color: "var(--sot-fg-2)" }}>
                OVERALL_SCORE
              </span>
              <QualityBars score={lead.quality} size="lg" />
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--sot-fg-3)",
                lineHeight: 1.6,
              }}
            >
              Aggregate signal across all qualification dimensions. Anything ≥ 7 is auto-qualified.
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "ENGAGEMENT", val: lead.scoring.engagement, note: "Multi-touch · responsive" },
              { label: "BUDGET",     val: lead.scoring.budget,     note: "Confirmed range · mid-tier fit" },
              { label: "TIMELINE",   val: lead.scoring.timeline,   note: "Q3 evaluation · 6-week target" },
              { label: "FIT",        val: lead.scoring.fit,        note: "ICP match · inbound-volume usecase" },
            ].map((row) => (
              <div key={row.label}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span className="sot-tag" style={{ fontSize: 10 }}>
                    {row.label}
                  </span>
                  <span
                    className="sot-mono"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color:
                        row.val >= 7
                          ? "var(--sot-verify)"
                          : row.val >= 4
                          ? "var(--sot-warn)"
                          : "var(--sot-alert)",
                    }}
                  >
                    {row.val}/10
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
                      width: (row.val / 10) * 100 + "%",
                      background:
                        row.val >= 7
                          ? "var(--sot-verify)"
                          : row.val >= 4
                          ? "var(--sot-warn)"
                          : "var(--sot-alert)",
                      transition: "width var(--sot-dur-slow) var(--sot-ease)",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--sot-fg-3)",
                    display: "block",
                    marginTop: 4,
                  }}
                >
                  {row.note}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* Lead assessment */}
        <Section title="LEAD_ASSESSMENT" icon="clipboard-check">
          <Assessment label="WHY_QUALIFIED" tone="verify">
            {lead.whyQualified}
          </Assessment>
          <Assessment label="RECOMMENDED_ACTION" tone="default">
            {lead.recommendedAction}
          </Assessment>
          <Assessment label="NEXT_STEPS" tone="default" last>
            {lead.nextSteps}
          </Assessment>
        </Section>
      </div>

      {/* Right column */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sot-s-4)" }}>
        {/* Quick stats */}
        <Section title="QUICK_STATS" icon="activity">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <StatItem icon="phone" label="TOTAL_CALLS" value={lead.totalCalls} />
            <StatItem icon="clock" label="LAST_CALL" value={lead.lastCallAgo} small />
            <StatItem icon="timer" label="TOTAL_TALK_TIME" value={fmtDuration(lead.totalTalkSec)} mono />
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span className="sot-tag" style={{ fontSize: 10 }}>
                  CONVERSION_PROBABILITY
                </span>
                <span
                  className="sot-mono"
                  style={{
                    fontSize: 18,
                    color: "var(--sot-verify)",
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {lead.convProbability}%
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
                    width: lead.convProbability + "%",
                    background: "var(--sot-verify)",
                  }}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Assignment */}
        <Section title="ASSIGNMENT" icon="user-round">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <span className="sot-tag" style={{ fontSize: 10, display: "block", marginBottom: 6 }}>
                ASSIGNED_TO
              </span>
              <div style={{ position: "relative" }}>
                <select
                  value={lead.assignedTo}
                  onChange={(e) => onAgentChange(e.target.value)}
                  className="sot-field"
                  style={{
                    height: 36,
                    fontSize: 12,
                    padding: "0 30px 0 36px",
                    appearance: "none",
                    WebkitAppearance: "none",
                    cursor: "pointer",
                  }}
                >
                  {AGENTS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <div
                  style={{
                    position: "absolute",
                    left: 6,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    width: 24,
                    height: 24,
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
                  {AGENTS.find((a) => a.id === lead.assignedTo)?.name.split(" ").map((s) => s[0]).join("")}
                </div>
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
            <InfoRow label="ASSIGNED" mono last>
              {lead.assignedDate}
            </InfoRow>
          </div>
        </Section>

        {/* Lead value */}
        <Section title="LEAD_VALUE" icon="dollar-sign">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <span className="sot-tag" style={{ fontSize: 10, display: "block", marginBottom: 6 }}>
                ESTIMATED_VALUE
              </span>
              <div
                style={{
                  fontFamily: "var(--sot-font-sans)",
                  fontSize: 32,
                  fontWeight: 800,
                  color: "var(--sot-fg-1)",
                  letterSpacing: "-0.025em",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {fmtCurrency(lead.estimatedValue)}
                <span
                  style={{
                    fontSize: 13,
                    color: "var(--sot-fg-3)",
                    fontWeight: 500,
                    marginLeft: 6,
                    fontFamily: "var(--sot-font-mono)",
                  }}
                >
                  /yr
                </span>
              </div>
            </div>
            <InfoRow label="DEAL_STAGE" last>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "3px 8px",
                  background: "var(--sot-warn-soft)",
                  border: "1px solid var(--sot-warn)",
                  color: "var(--sot-warn)",
                  fontFamily: "var(--sot-font-mono)",
                  fontSize: 10,
                  letterSpacing: "var(--sot-tracking-tag)",
                  textTransform: "uppercase",
                  borderRadius: "var(--sot-r-pill)",
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    background: "var(--sot-warn)",
                    borderRadius: 999,
                  }}
                />
                {lead.dealStage.toUpperCase()}
              </span>
            </InfoRow>
          </div>
        </Section>

        {/* CRM status */}
        <Section
          title="CRM_STATUS"
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
              {lead.crm.status}
            </span>
          }
        >
          <InfoRow label="PROVIDER">
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icon name="link-2" size={11} color="var(--sot-verify)" />
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{
                  color: "var(--sot-verify)",
                  textDecoration: "none",
                }}
              >
                {lead.crm.provider}
              </a>
            </span>
          </InfoRow>
          <InfoRow label="CRM_ID" mono>
            {lead.crm.crmId}
          </InfoRow>
          <InfoRow label="LAST_SYNC" mono>
            {lead.crm.lastSync}
          </InfoRow>
          <InfoRow label="FIELDS_SYNCED" mono last>
            {lead.crm.syncedFields}
          </InfoRow>
        </Section>
      </div>
    </div>
  );
}

function StatItem({ icon, label, value, mono, small }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        paddingBottom: 8,
        borderBottom: "1px dashed var(--sot-line)",
      }}
    >
      <span
        style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        className="sot-tag"
      >
        <Icon name={icon} size={12} color="var(--sot-fg-3)" />
        <span style={{ fontSize: 10 }}>{label}</span>
      </span>
      <span
        style={{
          fontFamily: mono ? "var(--sot-font-mono)" : "var(--sot-font-sans)",
          fontSize: small ? 13 : 18,
          fontWeight: small ? 500 : 700,
          color: "var(--sot-fg-1)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Assessment({ label, tone, children, last }) {
  const color = tone === "verify" ? "var(--sot-verify)" : "var(--sot-fg-2)";
  return (
    <div
      style={{
        paddingBottom: 14,
        marginBottom: 14,
        borderBottom: last ? "none" : "1px dashed var(--sot-line)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span
          style={{
            width: 3,
            height: 14,
            background: color,
          }}
        />
        <span className="sot-tag" style={{ fontSize: 10, color }}>
          {label}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 14, color: "var(--sot-fg-1)", lineHeight: 1.55 }}>
        {children}
      </p>
    </div>
  );
}

/* ============================================================
   CALLS TAB — timeline of calls with expandable transcripts
   ============================================================ */
function CallsTab() {
  const [expandedId, setExpandedId] = useState(CALLS[0].id);
  return (
    <div style={{ position: "relative" }}>
      {/* Vertical timeline rule */}
      <div
        style={{
          position: "absolute",
          left: 16,
          top: 12,
          bottom: 12,
          width: 1,
          background: "var(--sot-line-strong)",
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sot-s-3)" }}>
        {CALLS.map((call, i) => (
          <div key={call.id} style={{ position: "relative", paddingLeft: 48 }}>
            <span
              style={{
                position: "absolute",
                left: 10,
                top: 18,
                width: 13,
                height: 13,
                background: "var(--sot-ink)",
                border: `2px solid ${i === 0 ? "var(--sot-verify)" : "var(--sot-line-strong)"}`,
                borderRadius: 999,
              }}
            />
            <CallEntry
              call={call}
              expanded={expandedId === call.id}
              onToggle={() => setExpandedId(expandedId === call.id ? null : call.id)}
              isLatest={i === 0}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function CallEntry({ call, expanded, onToggle, isLatest }) {
  return (
    <div className="sot-card" style={{ padding: 0 }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          padding: "var(--sot-s-4) var(--sot-s-5)",
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          transition: "background var(--sot-dur-fast) var(--sot-ease)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sot-surface-2)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              className="sot-mono"
              style={{ fontSize: 13, color: "var(--sot-fg-1)", fontWeight: 600 }}
            >
              {call.date}
            </span>
            {isLatest && <Tag label="LATEST" tone="verify" />}
            <Tag label={call.direction} />
            <Tag label="INTENT" value={call.intent} />
          </div>
          <span style={{ fontSize: 12, color: "var(--sot-fg-3)" }}>
            {call.relative} · {fmtDuration(call.durationSec)} talk time
          </span>
        </div>
        <span style={{ flex: 1, minWidth: 0 }} />
        <QualityBars score={call.quality} />
        <span
          style={{
            display: "inline-flex",
            transition: "transform var(--sot-dur-base) var(--sot-ease)",
            transform: expanded ? "rotate(90deg)" : "rotate(0)",
          }}
        >
          <Icon
            name="chevron-right"
            size={14}
            color={expanded ? "var(--sot-verify)" : "var(--sot-fg-3)"}
          />
        </span>
      </button>

      <div
        style={{
          padding: "0 var(--sot-s-5) var(--sot-s-4)",
          borderTop: expanded ? "1px solid var(--sot-line)" : "none",
        }}
      >
        <div
          style={{
            paddingTop: 14,
            fontSize: 13,
            color: "var(--sot-fg-2)",
            lineHeight: 1.55,
          }}
        >
          <span className="sot-tag" style={{ fontSize: 10, marginRight: 8 }}>
            SUMMARY
          </span>
          {call.summary}
        </div>
        {expanded && (
          <>
            <div
              style={{
                marginTop: 14,
                background: "var(--sot-ink)",
                border: "1px solid var(--sot-line)",
                padding: "var(--sot-s-4)",
                maxHeight: 280,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {call.transcript.map((m, i) => {
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
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 14,
                flexWrap: "wrap",
              }}
            >
              <a
                href="/calls"
                className="sot-btn ghost"
                style={{ textDecoration: "none", height: 32 }}
              >
                <Icon name="arrow-up-right" size={12} /> View full transcript
              </a>
              <button className="sot-btn ghost" style={{ height: 32 }}>
                <Icon name="download" size={12} /> Download recording
              </button>
              <button className="sot-btn ghost" style={{ height: 32 }}>
                <Icon name="copy" size={12} /> Copy summary
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   COMMUNICATION TAB
   ============================================================ */
function CommunicationTab() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? COMMUNICATIONS : COMMUNICATIONS.filter((c) => c.type === filter);
  const TYPE_META = {
    call:  { icon: "phone",          label: "CALL",  color: "var(--sot-verify)" },
    email: { icon: "mail",           label: "EMAIL", color: "var(--sot-fg-2)" },
    sms:   { icon: "message-square", label: "SMS",   color: "var(--sot-warn)" },
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: "var(--sot-s-4)",
          alignItems: "center",
        }}
      >
        <span className="sot-tag" style={{ fontSize: 10 }}>
          FILTER
        </span>
        <div style={{ display: "flex", border: "1px solid var(--sot-line-strong)" }}>
          {[
            { id: "all", label: "ALL" },
            { id: "call", label: "CALL" },
            { id: "email", label: "EMAIL" },
            { id: "sms", label: "SMS" },
          ].map((t, i, arr) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              style={{
                padding: "0 14px",
                height: 32,
                background: filter === t.id ? "var(--sot-surface-3)" : "transparent",
                color: filter === t.id ? "var(--sot-fg-1)" : "var(--sot-fg-3)",
                border: "none",
                borderRight: i === arr.length - 1 ? "none" : "1px solid var(--sot-line)",
                cursor: "pointer",
                fontFamily: "var(--sot-font-mono)",
                fontSize: 10,
                letterSpacing: "var(--sot-tracking-tag)",
                fontWeight: 600,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span style={{ flex: 1 }} />
        <span className="sot-mono" style={{ fontSize: 11, color: "var(--sot-fg-3)" }}>
          {filtered.length} EVENTS
        </span>
      </div>

      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: 19,
            top: 12,
            bottom: 12,
            width: 1,
            background: "var(--sot-line-strong)",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((c, i) => {
            const meta = TYPE_META[c.type];
            return (
              <div key={i} style={{ position: "relative", paddingLeft: 52 }}>
                <span
                  style={{
                    position: "absolute",
                    left: 6,
                    top: 12,
                    width: 28,
                    height: 28,
                    background: "var(--sot-ink)",
                    border: `1px solid ${meta.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name={meta.icon} size={13} color={meta.color} />
                </span>
                <div
                  className="sot-card"
                  style={{
                    padding: "var(--sot-s-4) var(--sot-s-5)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <Tag label={meta.label} />
                    <span
                      style={{
                        fontFamily: "var(--sot-font-sans)",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--sot-fg-1)",
                      }}
                    >
                      {c.title}
                    </span>
                    <span style={{ flex: 1 }} />
                    <span
                      className="sot-mono"
                      style={{ fontSize: 11, color: "var(--sot-fg-3)" }}
                    >
                      {c.date}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: "var(--sot-fg-2)",
                      lineHeight: 1.55,
                    }}
                  >
                    {c.body}
                  </p>
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span className="sot-mono" style={{ fontSize: 10, color: "var(--sot-fg-4)" }}>
                      VIA {c.actor} · {c.relative}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   NOTES TAB
   ============================================================ */
function NotesTab() {
  const [notes, setNotes] = useState(NOTES_INITIAL);
  const [draft, setDraft] = useState("");

  const add = () => {
    if (!draft.trim()) return;
    setNotes([
      {
        id: Date.now(),
        author: "M. Johnston",
        date: "Just now",
        relative: "just now",
        body: draft.trim(),
      },
      ...notes,
    ]);
    setDraft("");
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr)",
        gap: "var(--sot-s-4)",
      }}
    >
      {/* New note */}
      <div className="sot-card" style={{ padding: "var(--sot-s-5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <Icon name="pencil" size={13} color="var(--sot-fg-2)" />
          <span
            className="sot-tag"
            style={{ color: "var(--sot-fg-1)", fontSize: 11, fontWeight: 600 }}
          >
            ADD_NOTE
          </span>
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Capture context, decisions, or risks. Markdown-safe."
          className="sot-field"
          style={{
            width: "100%",
            height: 100,
            padding: 12,
            resize: "vertical",
            lineHeight: 1.55,
            fontSize: 13,
            fontFamily: "var(--sot-font-text)",
          }}
        />
        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span className="sot-mono" style={{ fontSize: 10, color: "var(--sot-fg-4)" }}>
            AUTHOR: M_JOHNSTON · {draft.length} CHARS
          </span>
          <span style={{ flex: 1 }} />
          <button className="sot-btn ghost" onClick={() => setDraft("")}>
            <Icon name="x" size={12} /> Cancel
          </button>
          <button
            className="sot-btn primary"
            onClick={add}
            disabled={!draft.trim()}
          >
            <Icon name="check" size={12} color="black" /> Save note
          </button>
        </div>
      </div>

      {/* Notes list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            className="sot-tag"
            style={{ color: "var(--sot-fg-1)", fontSize: 11, fontWeight: 600 }}
          >
            HISTORY · {notes.length} NOTES
          </span>
          <span style={{ flex: 1, height: 1, background: "var(--sot-line)" }} />
        </div>
        {notes.map((n) => (
          <div
            key={n.id}
            className="sot-card"
            style={{ padding: "var(--sot-s-4) var(--sot-s-5)" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 8,
              }}
            >
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
                {n.author.split(" ").map((s) => s[0]).join("")}
              </div>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--sot-fg-1)" }}>
                  {n.author}
                </span>
                <span
                  className="sot-mono"
                  style={{ fontSize: 10, color: "var(--sot-fg-4)" }}
                >
                  {n.date}
                </span>
              </div>
              <span style={{ flex: 1 }} />
              <button
                className="sot-btn ghost"
                style={{ height: 26, width: 26, padding: 0, justifyContent: "center" }}
              >
                <Icon name="more-horizontal" size={12} />
              </button>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                lineHeight: 1.6,
                color: "var(--sot-fg-1)",
                whiteSpace: "pre-wrap",
              }}
            >
              {n.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   CRM TAB
   ============================================================ */
function CrmTab({ lead }) {
  const [syncing, setSyncing] = useState(false);
  const sync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 1400);
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 1fr)",
        gap: "var(--sot-s-4)",
        alignItems: "start",
      }}
      className="crm-grid"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sot-s-4)" }}>
        {/* Connection details */}
        <Section
          title="CONNECTION_DETAILS"
          icon="link-2"
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
              ACTIVE
            </span>
          }
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
            <div
              style={{
                width: 56,
                height: 56,
                background: "var(--sot-ink)",
                border: "1px solid var(--sot-line-strong)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--sot-font-mono)",
                fontSize: 16,
                color: "var(--sot-fg-1)",
                fontWeight: 700,
              }}
            >
              HS
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--sot-fg-1)",
                  letterSpacing: "-0.01em",
                  marginBottom: 4,
                }}
              >
                {lead.crm.provider}
              </div>
              <div
                className="sot-mono"
                style={{ fontSize: 11, color: "var(--sot-fg-3)" }}
              >
                CRM_ID: {lead.crm.crmId}
              </div>
            </div>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="sot-btn ghost"
              style={{ textDecoration: "none" }}
            >
              <Icon name="arrow-up-right" size={12} /> Open in HubSpot
            </a>
          </div>

          <InfoRow label="CONNECTION">
            <span
              style={{
                color: "var(--sot-verify)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icon name="check-circle-2" size={12} color="var(--sot-verify)" /> Bi-directional
            </span>
          </InfoRow>
          <InfoRow label="OAUTH_SCOPE" mono>
            CONTACTS · DEALS · TIMELINE · WEBHOOKS
          </InfoRow>
          <InfoRow label="FIELDS_MAPPED" mono>
            {lead.crm.syncedFields} of 18
          </InfoRow>
          <InfoRow label="WEBHOOK_URL" mono last>
            https://crm.voice-ai/api/sync/{lead.crm.crmId.toLowerCase()}
          </InfoRow>
        </Section>

        {/* Sync log */}
        <Section
          title="SYNC_HISTORY"
          icon="history"
          action={
            <span className="sot-mono" style={{ fontSize: 10, color: "var(--sot-fg-3)" }}>
              LAST {SYNC_LOG.length} EVENTS
            </span>
          }
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            {SYNC_LOG.map((e, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 160px 1fr 80px",
                  gap: 12,
                  padding: "12px 0",
                  borderBottom:
                    i === SYNC_LOG.length - 1
                      ? "none"
                      : "1px solid var(--sot-line)",
                  alignItems: "center",
                }}
              >
                <span
                  className="sot-mono"
                  style={{ fontSize: 11, color: "var(--sot-fg-3)" }}
                >
                  {e.time}
                </span>
                <Tag label={e.action} />
                <span style={{ fontSize: 13, color: "var(--sot-fg-1)" }}>{e.detail}</span>
                <span
                  className="sot-mono"
                  style={{
                    fontSize: 11,
                    color: "var(--sot-verify)",
                    textAlign: "right",
                    fontWeight: 600,
                  }}
                >
                  {e.status}
                </span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sot-s-4)" }}>
        {/* Sync now */}
        <div
          className="sot-card sot-brackets verify"
          style={{
            padding: "var(--sot-s-5)",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <span className="b tl" />
          <span className="b tr" />
          <span className="b bl" />
          <span className="b br" />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="refresh-cw" size={14} color="var(--sot-verify)" />
            <span
              className="sot-tag"
              style={{ color: "var(--sot-fg-1)", fontSize: 11, fontWeight: 600 }}
            >
              MANUAL_SYNC
            </span>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "var(--sot-fg-3)",
              lineHeight: 1.55,
            }}
          >
            Push all unsynced fields to HubSpot now. Auto-sync runs every 5 minutes.
          </p>
          <button
            className="sot-btn verify"
            onClick={sync}
            disabled={syncing}
            style={{ justifyContent: "center", height: 40 }}
          >
            <Icon
              name="refresh-cw"
              size={13}
              color="white"
              style={syncing ? { animation: "sotSpin 1s linear infinite" } : undefined}
            />
            {syncing ? "Syncing…" : "Sync now"}
          </button>
          <InfoRow label="LAST_SYNC" mono last>
            {syncing ? "in progress…" : lead.crm.lastSync}
          </InfoRow>
        </div>

        {/* Field mapping summary */}
        <Section title="FIELD_MAPPING" icon="rows-3">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { sot: "lead.name",        crm: "contact.firstname + lastname" },
              { sot: "lead.email",       crm: "contact.email" },
              { sot: "lead.phone",       crm: "contact.phone" },
              { sot: "lead.company",     crm: "company.name" },
              { sot: "lead.quality",     crm: "contact.hs_lead_score" },
              { sot: "lead.status",      crm: "contact.lifecyclestage" },
              { sot: "lead.value",       crm: "deal.amount" },
              { sot: "lead.assigned_to", crm: "deal.hubspot_owner_id" },
            ].map((row, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: "var(--sot-font-mono)",
                  fontSize: 11,
                  padding: "6px 0",
                  borderBottom: "1px dashed var(--sot-line)",
                }}
              >
                <span style={{ color: "var(--sot-fg-1)", flex: 1 }}>{row.sot}</span>
                <Icon name="arrow-right" size={11} color="var(--sot-fg-4)" />
                <span style={{ color: "var(--sot-verify)", flex: 1, textAlign: "right" }}>
                  {row.crm}
                </span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

/* ============================================================
   RIGHT SIDEBAR — quick actions
   ============================================================ */
function QuickActionsSidebar({ lead, onStatusChange, onUrgencyChange, urgency }) {
  return (
    <aside style={{ display: "flex", flexDirection: "column", gap: "var(--sot-s-4)" }}>
      {/* Status */}
      <Section title="LEAD_STATUS" icon="circle-dot">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {Object.keys(STATUS).map((s) => {
            const meta = STATUS[s];
            const active = lead.status === s;
            return (
              <button
                key={s}
                onClick={() => onStatusChange(s)}
                style={{
                  padding: "10px 12px",
                  background: active ? meta.soft : "transparent",
                  border: `1px solid ${active ? meta.color : "var(--sot-line)"}`,
                  color: active ? meta.color : "var(--sot-fg-2)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontFamily: "var(--sot-font-mono)",
                  fontSize: 11,
                  letterSpacing: "var(--sot-tracking-tag)",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  transition: "all var(--sot-dur-fast) var(--sot-ease)",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    background: meta.color,
                    borderRadius: 999,
                  }}
                />
                {meta.label}
                <span style={{ flex: 1 }} />
                {active && <Icon name="check" size={12} color={meta.color} />}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Urgency */}
      <Section title="URGENCY" icon="alert-triangle">
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { id: "high", label: "HIGH", color: "var(--sot-alert)" },
            { id: "medium", label: "MED", color: "var(--sot-warn)" },
            { id: "low", label: "LOW", color: "var(--sot-fg-2)" },
          ].map((u) => {
            const active = urgency === u.id;
            return (
              <button
                key={u.id}
                onClick={() => onUrgencyChange(u.id)}
                style={{
                  flex: 1,
                  padding: "10px 6px",
                  background: active ? "var(--sot-ink)" : "transparent",
                  border: `1px solid ${active ? u.color : "var(--sot-line)"}`,
                  color: active ? u.color : "var(--sot-fg-3)",
                  cursor: "pointer",
                  fontFamily: "var(--sot-font-mono)",
                  fontSize: 10,
                  letterSpacing: "var(--sot-tracking-tag)",
                  fontWeight: 700,
                  transition: "all var(--sot-dur-fast) var(--sot-ease)",
                }}
              >
                {u.label}
              </button>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 12,
            display: "flex",
            gap: 2,
            height: 6,
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((_, i) => {
            const fillTo =
              urgency === "high" ? 8 : urgency === "medium" ? 5 : 2;
            const color =
              urgency === "high"
                ? "var(--sot-alert)"
                : urgency === "medium"
                ? "var(--sot-warn)"
                : "var(--sot-fg-2)";
            return (
              <span
                key={i}
                style={{
                  flex: 1,
                  background: i < fillTo ? color : "var(--sot-line-strong)",
                }}
              />
            );
          })}
        </div>
      </Section>

      {/* Reminder */}
      <Section title="FOLLOW_UP" icon="bell">
        <button
          className="sot-btn"
          style={{ width: "100%", justifyContent: "center", height: 40 }}
        >
          <Icon name="bell" size={13} /> Set reminder
        </button>
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: "var(--sot-ink)",
            border: "1px solid var(--sot-line)",
            fontSize: 12,
            color: "var(--sot-fg-2)",
            lineHeight: 1.5,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Icon name="clock" size={11} color="var(--sot-warn)" />
            <span className="sot-tag" style={{ fontSize: 9, color: "var(--sot-warn)" }}>
              ACTIVE_REMINDER
            </span>
          </div>
          Send follow-up email · <strong>Tue May 26, 10:00 AM</strong>
        </div>
      </Section>

      {/* Documents */}
      <Section title="DOCUMENTS" icon="paperclip">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { name: "TechCorp_NDA.pdf", size: "184 KB" },
            { name: "Pricing_OnePager.pdf", size: "412 KB" },
            { name: "Q3_Eval_Brief.docx", size: "62 KB" },
          ].map((d) => (
            <div
              key={d.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                background: "var(--sot-ink)",
                border: "1px solid var(--sot-line)",
                cursor: "pointer",
                transition: "border-color var(--sot-dur-fast) var(--sot-ease)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "var(--sot-line-strong)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "var(--sot-line)")
              }
            >
              <Icon name="file-text" size={13} color="var(--sot-fg-3)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--sot-font-mono)",
                    fontSize: 11,
                    color: "var(--sot-fg-1)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {d.name}
                </div>
                <div
                  className="sot-mono"
                  style={{ fontSize: 9, color: "var(--sot-fg-4)" }}
                >
                  {d.size}
                </div>
              </div>
              <Icon name="download" size={11} color="var(--sot-fg-3)" />
            </div>
          ))}
        </div>
        <button
          className="sot-btn ghost"
          style={{ width: "100%", justifyContent: "center", marginTop: 8, height: 32, fontSize: 10 }}
        >
          <Icon name="plus" size={11} /> Attach document
        </button>
      </Section>

      {/* Related deals */}
      <Section title="RELATED_DEALS" icon="briefcase">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { id: "DEAL_8421", name: "Tech Corp — Mid-tier annual", value: 21600, stage: "DISCOVERY" },
            { id: "DEAL_8104", name: "Tech Corp — Pilot project", value: 1800, stage: "CLOSED_LOST" },
          ].map((d) => (
            <a
              key={d.id}
              href="#"
              onClick={(e) => e.preventDefault()}
              style={{
                textDecoration: "none",
                padding: "10px 12px",
                background: "var(--sot-ink)",
                border: "1px solid var(--sot-line)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                transition: "border-color var(--sot-dur-fast) var(--sot-ease)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "var(--sot-verify)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "var(--sot-line)")
              }
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  className="sot-mono"
                  style={{ fontSize: 10, color: "var(--sot-fg-4)" }}
                >
                  {d.id}
                </span>
                <Tag label={d.stage} tone={d.stage === "CLOSED_LOST" ? "alert" : "default"} />
              </div>
              <span
                style={{
                  fontSize: 13,
                  color: "var(--sot-fg-1)",
                  fontWeight: 500,
                }}
              >
                {d.name}
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
                {fmtCurrency(d.value)}
              </span>
            </a>
          ))}
        </div>
      </Section>
    </aside>
  );
}

/* ============================================================
   ROOT
   ============================================================ */
function LeadDetailsPage() {
  const [tab, setTab] = useState("overview");
  const [lead, setLead] = useState(LEAD);
  const [urgency, setUrgency] = useState(LEAD.urgency);

  const handleStatusChange = (status) => setLead({ ...lead, status });
  const handleAgentChange = (assignedTo) => setLead({ ...lead, assignedTo });
  const handleConvert = () => setLead({ ...lead, status: "converted" });

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
        <LeadHeader
          lead={lead}
          onStatusChange={handleStatusChange}
          onConvert={handleConvert}
        />

        <div
          className="detail-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 320px",
            gap: "var(--sot-s-5)",
            alignItems: "start",
          }}
        >
          <div>
            <TabBar active={tab} onSelect={setTab} />
            <div style={{ animation: "sotFade var(--sot-dur-base) var(--sot-ease)" }} key={tab}>
              {tab === "overview" && (
                <OverviewTab lead={lead} onAgentChange={handleAgentChange} />
              )}
              {tab === "calls" && <CallsTab />}
              {tab === "communication" && <CommunicationTab />}
              {tab === "notes" && <NotesTab />}
              {tab === "crm" && <CrmTab lead={lead} />}
            </div>
          </div>

          <QuickActionsSidebar
            lead={lead}
            onStatusChange={handleStatusChange}
            onUrgencyChange={setUrgency}
            urgency={urgency}
          />
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
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <span className="sot-mono" style={{ fontSize: 11 }}>
            VOICE_AI_AGENT // LEADS // {lead.id}
          </span>
          <div style={{ display: "flex", gap: 14 }}>
            <Tag label="OWNER" value={lead.assignedTo} />
            <Tag label="CRM_SYNC" value={lead.crm.lastSync.toUpperCase().replace(/ /g, "_")} tone="verify" />
            <Tag label="SOURCE_OF_TRUTH" value="CONFIRMED" tone="verify" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default LeadDetailsPage;
