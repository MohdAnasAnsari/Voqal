import React, { useState, useEffect, useRef, useMemo } from 'react';
/* ============================================================
   CRMIntegrationSettingsPage — SOT design system
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
        <span
          className="sot-tag"
          style={{ color: "var(--sot-fg-1)", fontSize: 11, fontWeight: 600 }}
        >
          {title}
        </span>
        <span style={{ flex: 1 }} />
        {action}
      </div>
      <div style={padded ? { padding: "var(--sot-s-5)" } : { padding: 0 }}>{children}</div>
    </div>
  );
}

/* ---------- Toggle switch (sharp, SOT-style) ---------- */
function Toggle({ checked, onChange, size = "md" }) {
  const w = size === "lg" ? 44 : 36;
  const h = size === "lg" ? 22 : 20;
  const knob = h - 6;
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: w,
        height: h,
        background: checked ? "var(--sot-verify)" : "var(--sot-ink)",
        border: `1px solid ${checked ? "var(--sot-verify)" : "var(--sot-line-strong)"}`,
        padding: 0,
        position: "relative",
        cursor: "pointer",
        transition: "background var(--sot-dur-base) var(--sot-ease), border-color var(--sot-dur-base) var(--sot-ease)",
        flex: "none",
      }}
      role="switch"
      aria-checked={checked}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? w - knob - 3 : 2,
          width: knob,
          height: knob,
          background: checked ? "var(--sot-white)" : "var(--sot-fg-3)",
          transition: "left var(--sot-dur-base) var(--sot-ease), background var(--sot-dur-base) var(--sot-ease)",
        }}
      />
    </button>
  );
}

/* ---------- Checkbox ---------- */
function Checkbox({ checked, onChange }) {
  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
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
        flex: "none",
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

/* ============================================================
   MOCK DATA
   ============================================================ */
const CRM_OPTIONS = [
  { id: "hubspot",    name: "HubSpot",          short: "HS" },
  { id: "salesforce", name: "Salesforce",       short: "SF" },
  { id: "pipedrive",  name: "Pipedrive",        short: "PD" },
  { id: "zoho",       name: "Zoho CRM",         short: "ZH" },
];

const CRM_FIELDS_BY_PROVIDER = {
  hubspot: [
    "contact.firstname",
    "contact.lastname",
    "contact.email",
    "contact.phone",
    "contact.company",
    "contact.jobtitle",
    "contact.hs_lead_score",
    "contact.hs_lead_status",
    "contact.lifecyclestage",
    "deal.amount",
    "deal.dealstage",
    "deal.hubspot_owner_id",
    "company.name",
  ],
  salesforce: [
    "Lead.FirstName",
    "Lead.LastName",
    "Lead.Email",
    "Lead.Phone",
    "Lead.Company",
    "Lead.Title",
    "Lead.LeadScore__c",
    "Lead.Intent__c",
    "Lead.Status",
    "Opportunity.Amount",
    "Opportunity.StageName",
    "Account.Name",
  ],
  pipedrive: [
    "person.first_name",
    "person.last_name",
    "person.email",
    "person.phone",
    "person.org_name",
    "deal.value",
    "deal.stage_id",
  ],
  zoho: [
    "Contacts.First_Name",
    "Contacts.Last_Name",
    "Contacts.Email",
    "Contacts.Phone",
    "Accounts.Account_Name",
  ],
};

const FIELD_MAPPING_DEFAULT = [
  { sot: "lead.name",         label: "NAME",          crm: "contact.firstname + contact.lastname", required: true },
  { sot: "lead.email",        label: "EMAIL",         crm: "contact.email", required: true },
  { sot: "lead.phone",        label: "PHONE",         crm: "contact.phone" },
  { sot: "lead.company",      label: "COMPANY",       crm: "contact.company" },
  { sot: "lead.title",        label: "TITLE",         crm: "contact.jobtitle" },
  { sot: "lead.quality",      label: "QUALITY_SCORE", crm: "contact.hs_lead_score" },
  { sot: "lead.intent",       label: "INTENT",        crm: "contact.hs_lead_status" },
  { sot: "lead.value",        label: "DEAL_VALUE",    crm: "deal.amount" },
  { sot: "lead.assigned_to",  label: "OWNER",         crm: "deal.hubspot_owner_id" },
];

const SYNC_HISTORY = [
  { time: "May 24 · 2:45 PM", relative: "2 hr ago",  lead: "John Smith",      leadId: "LEAD_04001", status: "success", crmId: "HUB-29481-A", durationMs: 184, error: null },
  { time: "May 24 · 2:30 PM", relative: "2 hr ago",  lead: "Jane Doe",        leadId: "LEAD_04002", status: "success", crmId: "HUB-29481-B", durationMs: 162, error: null },
  { time: "May 24 · 2:15 PM", relative: "3 hr ago",  lead: "Bob Wilson",      leadId: "LEAD_04003", status: "failed",  crmId: null,           durationMs: 420, error: "Field mapping error: contact.hs_lead_score requires numeric value, got 'high'" },
  { time: "May 24 · 1:58 PM", relative: "3 hr ago",  lead: "Maya Patel",      leadId: "LEAD_04004", status: "success", crmId: "HUB-29481-C", durationMs: 198, error: null },
  { time: "May 24 · 1:42 PM", relative: "4 hr ago",  lead: "Hiro Tanaka",     leadId: "LEAD_04005", status: "success", crmId: "HUB-29481-D", durationMs: 145, error: null },
  { time: "May 24 · 1:27 PM", relative: "4 hr ago",  lead: "Aisha Khan",      leadId: "LEAD_04006", status: "pending", crmId: null,           durationMs: null, error: null },
  { time: "May 24 · 1:14 PM", relative: "5 hr ago",  lead: "Liam Park",       leadId: "LEAD_04007", status: "success", crmId: "HUB-29481-E", durationMs: 173, error: null },
  { time: "May 24 · 12:58 PM", relative: "5 hr ago", lead: "Priya Cohen",     leadId: "LEAD_04008", status: "success", crmId: "HUB-29481-F", durationMs: 156, error: null },
  { time: "May 24 · 12:44 PM", relative: "5 hr ago", lead: "Marcus Foster",   leadId: "LEAD_04009", status: "failed",  crmId: null,           durationMs: 612, error: "HTTP 429 — rate limit exceeded. Retry scheduled." },
  { time: "May 24 · 12:30 PM", relative: "6 hr ago", lead: "Elena Walker",    leadId: "LEAD_04010", status: "success", crmId: "HUB-29481-G", durationMs: 188, error: null },
];

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
          { label: "DASHBOARD", href: "/" },
          { label: "CALL_HISTORY", href: "/calls" },
          { label: "LEADS", href: "/leads" },
          { label: "AGENTS", href: "/agents" },
          { label: "ANALYTICS", href: "/analytics" },
          { label: "SETTINGS", href: "#", active: true },
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
   SETTINGS LEFT-RAIL NAV
   ============================================================ */
function SettingsRail({ section, onSelect }) {
  const items = [
    { id: "crm",          label: "CRM_INTEGRATION", icon: "git-branch", active: true },
    { id: "agents",       label: "AGENTS",          icon: "users" },
    { id: "voice",        label: "VOICE_MODEL",     icon: "audio-waveform" },
    { id: "telephony",    label: "TELEPHONY",       icon: "phone" },
    { id: "notifications",label: "NOTIFICATIONS",   icon: "bell" },
    { id: "team",         label: "TEAM_ACCESS",     icon: "user-round" },
    { id: "billing",      label: "BILLING",         icon: "credit-card" },
    { id: "api",          label: "API_KEYS",        icon: "key-round" },
    { id: "audit",        label: "AUDIT_LOG",       icon: "scroll-text" },
  ];

  return (
    <aside
      style={{
        background: "var(--sot-surface-1)",
        border: "1px solid var(--sot-line)",
        position: "sticky",
        top: 88,
      }}
    >
      <div
        style={{
          padding: "var(--sot-s-4) var(--sot-s-5)",
          borderBottom: "1px solid var(--sot-line)",
        }}
      >
        <span
          className="sot-tag"
          style={{ color: "var(--sot-fg-1)", fontSize: 11, fontWeight: 600 }}
        >
          SETTINGS
        </span>
      </div>
      <nav style={{ padding: 8, display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map((it) => {
          const isActive = it.active;
          return (
            <button
              key={it.id}
              onClick={() => onSelect && onSelect(it.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                background: isActive ? "var(--sot-ink)" : "transparent",
                border: `1px solid ${isActive ? "var(--sot-line-strong)" : "transparent"}`,
                color: isActive ? "var(--sot-fg-1)" : "var(--sot-fg-3)",
                cursor: "pointer",
                fontFamily: "var(--sot-font-mono)",
                fontSize: 11,
                letterSpacing: "var(--sot-tracking-tag)",
                fontWeight: isActive ? 700 : 500,
                textAlign: "left",
                transition: "all var(--sot-dur-fast) var(--sot-ease)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = "var(--sot-fg-1)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = "var(--sot-fg-3)";
              }}
            >
              <Icon
                name={it.icon}
                size={13}
                color={isActive ? "var(--sot-verify)" : "var(--sot-fg-3)"}
              />
              {it.label}
              {isActive && (
                <span style={{ marginLeft: "auto" }}>
                  <Icon name="chevron-right" size={11} color="var(--sot-verify)" />
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

/* ============================================================
   CONNECTION STATUS CARD
   ============================================================ */
function ConnectionStatus({ connected, provider, connectedSince, lastSync, onDisconnect, onTestConnection, testing }) {
  return (
    <div
      className={`sot-card${connected ? " sot-brackets verify" : ""}`}
      style={{ padding: 0, position: "relative" }}
    >
      {connected && (
        <>
          <span className="b tl" />
          <span className="b tr" />
          <span className="b bl" />
          <span className="b br" />
        </>
      )}

      <div
        style={{
          padding: "var(--sot-s-5) var(--sot-s-6)",
          display: "flex",
          alignItems: "center",
          gap: "var(--sot-s-5)",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            background: "var(--sot-ink)",
            border: `1px solid ${connected ? "var(--sot-verify)" : "var(--sot-line-strong)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--sot-font-mono)",
            fontSize: 22,
            color: connected ? "var(--sot-verify)" : "var(--sot-fg-3)",
            fontWeight: 700,
            letterSpacing: "-0.01em",
          }}
        >
          {provider ? CRM_OPTIONS.find((c) => c.id === provider)?.short : "—"}
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 6,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 10px",
                background: connected ? "var(--sot-verify-soft)" : "var(--sot-alert-soft)",
                border: `1px solid ${connected ? "var(--sot-verify)" : "var(--sot-alert)"}`,
                color: connected ? "var(--sot-verify)" : "var(--sot-alert)",
                fontFamily: "var(--sot-font-mono)",
                fontSize: 10,
                letterSpacing: "var(--sot-tracking-tag)",
                borderRadius: "var(--sot-r-pill)",
                fontWeight: 700,
              }}
            >
              <PulseDot color={connected ? "var(--sot-verify)" : "var(--sot-alert)"} size={6} />
              {connected ? "CONNECTED" : "NOT_CONNECTED"}
            </span>
            {connected && <Tag label="WEBHOOK" value="ACTIVE" tone="verify" />}
          </div>

          <h2
            className="sot-h3"
            style={{ fontSize: 22, letterSpacing: "-0.015em", marginBottom: 4 }}
          >
            {connected
              ? `Connected to ${CRM_OPTIONS.find((c) => c.id === provider)?.name}`
              : "No CRM connected"}
          </h2>

          {connected ? (
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: "var(--sot-fg-3)" }}>
              <span
                className="sot-mono"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Icon name="calendar" size={11} color="var(--sot-fg-4)" />
                CONNECTED {connectedSince}
              </span>
              <span
                className="sot-mono"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Icon name="refresh-cw" size={11} color="var(--sot-fg-4)" />
                LAST_SYNC {lastSync}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: 13, color: "var(--sot-fg-3)" }}>
              Connect a CRM below to begin syncing qualified leads and call data.
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="sot-btn ghost"
            onClick={onTestConnection}
            disabled={!connected || testing}
            style={{ height: 38 }}
          >
            <Icon
              name="zap"
              size={13}
              style={testing ? { animation: "sotSpin 1s linear infinite" } : undefined}
            />
            {testing ? "Testing…" : "Test connection"}
          </button>
          {connected && (
            <button
              onClick={onDisconnect}
              className="sot-btn ghost"
              style={{
                height: 38,
                color: "var(--sot-alert)",
                borderColor: "var(--sot-alert)",
              }}
            >
              <Icon name="unplug" size={13} color="var(--sot-alert)" /> Disconnect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   INTEGRATION SETUP FORM (not connected)
   ============================================================ */
function IntegrationSetup({ onConnect, onTest, testResult }) {
  const [crm, setCrm] = useState("hubspot");
  const [apiKey, setApiKey] = useState("");
  const [revealKey, setRevealKey] = useState(false);
  const webhookUrl = `https://voiceai.example.com/webhooks/${crm}`;
  const [copied, setCopied] = useState(false);

  return (
    <Section title="INTEGRATION_SETUP" icon="settings-2">
      {/* CRM type */}
      <Field label="CRM_TYPE" help="Choose your platform">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
          {CRM_OPTIONS.map((c) => {
            const active = crm === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCrm(c.id)}
                style={{
                  padding: "12px 14px",
                  background: active ? "var(--sot-ink)" : "transparent",
                  border: `1px solid ${active ? "var(--sot-verify)" : "var(--sot-line-strong)"}`,
                  color: active ? "var(--sot-fg-1)" : "var(--sot-fg-2)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  textAlign: "left",
                  transition: "all var(--sot-dur-fast) var(--sot-ease)",
                }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    background: active ? "var(--sot-verify-soft)" : "var(--sot-surface-2)",
                    border: `1px solid ${active ? "var(--sot-verify)" : "var(--sot-line-strong)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--sot-font-mono)",
                    fontSize: 11,
                    color: active ? "var(--sot-verify)" : "var(--sot-fg-2)",
                    fontWeight: 700,
                  }}
                >
                  {c.short}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                {active && (
                  <Icon
                    name="check"
                    size={12}
                    color="var(--sot-verify)"
                    style={{ marginLeft: "auto" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </Field>

      {/* API key */}
      <Field
        label="API_KEY"
        help={`Find in ${CRM_OPTIONS.find((c) => c.id === crm)?.name} → Settings → Integrations → Private apps`}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--sot-ink)",
            border: "1px solid var(--sot-line-strong)",
            padding: "0 12px",
            height: 40,
          }}
        >
          <Icon name="key-round" size={13} color="var(--sot-fg-3)" />
          <input
            type={revealKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="pat-na1-xxxx-xxxx-xxxx-xxxx-xxxx"
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              color: "var(--sot-fg-1)",
              fontFamily: "var(--sot-font-mono)",
              fontSize: 13,
              outline: "none",
            }}
          />
          <button
            onClick={() => setRevealKey(!revealKey)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--sot-fg-3)",
              padding: 4,
              display: "flex",
            }}
            title={revealKey ? "Hide" : "Show"}
          >
            <Icon name={revealKey ? "eye-off" : "eye"} size={13} />
          </button>
        </div>
      </Field>

      {/* Webhook URL */}
      <Field label="WEBHOOK_URL" help="Auto-generated. Paste into CRM webhook settings.">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--sot-ink)",
            border: "1px solid var(--sot-line-strong)",
            padding: "0 12px",
            height: 40,
          }}
        >
          <Icon name="link-2" size={13} color="var(--sot-fg-3)" />
          <span
            style={{
              flex: 1,
              fontFamily: "var(--sot-font-mono)",
              fontSize: 13,
              color: "var(--sot-fg-1)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {webhookUrl}
          </span>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(webhookUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="sot-btn ghost"
            style={{ height: 28, fontSize: 10, padding: "0 8px" }}
          >
            <Icon name={copied ? "check" : "copy"} size={11} />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </Field>

      {/* Test result */}
      {testResult && (
        <div
          style={{
            padding: "12px 14px",
            background:
              testResult.status === "ok"
                ? "var(--sot-verify-soft)"
                : "var(--sot-alert-soft)",
            border: `1px solid ${
              testResult.status === "ok" ? "var(--sot-verify)" : "var(--sot-alert)"
            }`,
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Icon
            name={testResult.status === "ok" ? "check-circle-2" : "alert-circle"}
            size={14}
            color={testResult.status === "ok" ? "var(--sot-verify)" : "var(--sot-alert)"}
          />
          <span
            style={{
              fontSize: 13,
              color: testResult.status === "ok" ? "var(--sot-verify)" : "var(--sot-alert)",
              fontWeight: 600,
            }}
          >
            {testResult.message}
          </span>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
        <button
          className="sot-btn ghost"
          onClick={() => onTest(crm, apiKey)}
          disabled={!apiKey}
        >
          <Icon name="zap" size={13} /> Test connection
        </button>
        <button
          className="sot-btn verify"
          onClick={() => onConnect(crm)}
          disabled={!apiKey}
        >
          <Icon name="link-2" size={13} color="white" /> Connect
        </button>
      </div>
    </Section>
  );
}

function Field({ label, help, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span className="sot-tag" style={{ fontSize: 10 }}>
          {label}
        </span>
        {help && (
          <span
            className="sot-mono"
            style={{ fontSize: 10, color: "var(--sot-fg-4)" }}
          >
            {help}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/* ============================================================
   SETTINGS FORM (when connected)
   ============================================================ */
function SettingsForm({ provider, settings, setSettings, mapping, setMapping }) {
  const update = (k, v) => setSettings((s) => ({ ...s, [k]: v }));
  const crmFields = CRM_FIELDS_BY_PROVIDER[provider] || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sot-s-4)" }}>
      {/* Auto-sync */}
      <Section title="SYNC_BEHAVIOR" icon="refresh-cw">
        <ToggleRow
          label="Auto-sync"
          desc="Automatically push qualified leads to CRM as soon as they're scored."
          checked={settings.autoSync}
          onChange={(v) => update("autoSync", v)}
        />

        <div
          style={{
            paddingTop: 16,
            marginTop: 16,
            borderTop: "1px solid var(--sot-line)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 14, color: "var(--sot-fg-1)", fontWeight: 600 }}>
              Minimum quality score to sync
            </span>
            <span
              className="sot-mono"
              style={{
                fontSize: 16,
                color: "var(--sot-verify)",
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {settings.syncThreshold}+
            </span>
          </div>
          <span
            style={{ fontSize: 12, color: "var(--sot-fg-3)", display: "block", marginBottom: 10 }}
          >
            Only push leads at or above this score. Below → held in queue.
          </span>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={settings.syncThreshold}
            onChange={(e) => update("syncThreshold", Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--sot-verify)" }}
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
            <span>0 · ALL</span>
            <span>5</span>
            <span>10 · STRICT</span>
          </div>
        </div>
      </Section>

      {/* Field mapping */}
      <Section
        title="FIELD_MAPPING"
        icon="arrow-left-right"
        action={
          <span
            className="sot-mono"
            style={{ fontSize: 10, color: "var(--sot-fg-3)" }}
          >
            VOICE_AI → {CRM_OPTIONS.find((c) => c.id === provider)?.name.toUpperCase()}
          </span>
        }
        padded={false}
      >
        <div>
          {mapping.map((m, i) => (
            <div
              key={m.sot}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 24px 1.4fr",
                gap: 12,
                padding: "14px var(--sot-s-5)",
                borderBottom:
                  i === mapping.length - 1 ? "none" : "1px solid var(--sot-line)",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="sot-tag" style={{ fontSize: 10 }}>
                    {m.label}
                  </span>
                  {m.required && (
                    <span
                      style={{
                        fontFamily: "var(--sot-font-mono)",
                        fontSize: 9,
                        color: "var(--sot-warn)",
                        letterSpacing: "var(--sot-tracking-tag)",
                      }}
                    >
                      REQ
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontFamily: "var(--sot-font-mono)",
                    fontSize: 12,
                    color: "var(--sot-fg-1)",
                  }}
                >
                  {m.sot}
                </span>
              </div>

              <Icon name="arrow-right" size={14} color="var(--sot-fg-4)" />

              <div style={{ position: "relative" }}>
                <select
                  value={m.crm}
                  onChange={(e) => {
                    const next = [...mapping];
                    next[i] = { ...next[i], crm: e.target.value };
                    setMapping(next);
                  }}
                  className="sot-field"
                  style={{
                    height: 38,
                    fontSize: 12,
                    padding: "0 30px 0 10px",
                    fontFamily: "var(--sot-font-mono)",
                    appearance: "none",
                    WebkitAppearance: "none",
                    cursor: "pointer",
                    color: "var(--sot-verify)",
                  }}
                >
                  <option value="">— UNMAPPED —</option>
                  {/* If current value isn't in standard options (computed mapping), show it */}
                  {!crmFields.includes(m.crm) && m.crm && (
                    <option value={m.crm}>{m.crm}</option>
                  )}
                  {crmFields.map((f) => (
                    <option key={f} value={f}>
                      {f}
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
          ))}
        </div>
      </Section>

      {/* Sync settings checkboxes */}
      <Section title="SYNC_SETTINGS" icon="list-checks">
        {[
          { id: "syncTranscripts", label: "Sync call transcripts", desc: "Push full transcript to CRM contact timeline." },
          { id: "syncSentiment",   label: "Sync sentiment analysis", desc: "Add sentiment + confidence as custom properties." },
          { id: "syncQuality",     label: "Sync quality score", desc: "Push numeric lead score to scoring property." },
          { id: "createDeals",     label: "Create deals for qualified leads", desc: "Auto-create deal in pipeline when status = QUALIFIED." },
          { id: "autoAssign",      label: "Auto-assign to agents", desc: "Round-robin assignment based on team availability." },
        ].map((opt) => (
          <CheckRow
            key={opt.id}
            label={opt.label}
            desc={opt.desc}
            checked={settings[opt.id]}
            onChange={(v) => update(opt.id, v)}
          />
        ))}
      </Section>

      {/* Email template */}
      <Section
        title="FOLLOW_UP_EMAIL_TEMPLATE"
        icon="mail"
        action={
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Tag label="VAR" value="LEAD_NAME" />
            <Tag label="VAR" value="COMPANY" />
            <Tag label="VAR" value="NEXT_STEPS" />
          </div>
        }
      >
        <span
          style={{
            fontSize: 12,
            color: "var(--sot-fg-3)",
            display: "block",
            marginBottom: 10,
          }}
        >
          Sent automatically when a qualified lead is converted. Use{" "}
          <code
            style={{
              fontFamily: "var(--sot-font-mono)",
              color: "var(--sot-verify)",
              padding: "1px 4px",
              background: "var(--sot-ink)",
              border: "1px solid var(--sot-line)",
            }}
          >
            {"{{variable}}"}
          </code>{" "}
          for substitutions.
        </span>
        <textarea
          value={settings.emailTemplate}
          onChange={(e) => update("emailTemplate", e.target.value)}
          className="sot-field"
          style={{
            width: "100%",
            height: 180,
            padding: 14,
            resize: "vertical",
            lineHeight: 1.6,
            fontSize: 13,
            fontFamily: "var(--sot-font-mono)",
          }}
        />
      </Section>

      {/* Save bar */}
      <SaveBar />
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, color: "var(--sot-fg-1)", fontWeight: 600, marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 12, color: "var(--sot-fg-3)", lineHeight: 1.5 }}>{desc}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} size="lg" />
    </div>
  );
}

function CheckRow({ label, desc, checked, onChange }) {
  return (
    <label
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: 12,
        padding: "12px 0",
        borderBottom: "1px dashed var(--sot-line)",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <span style={{ paddingTop: 2 }}>
        <Checkbox checked={checked} onChange={onChange} />
      </span>
      <div>
        <div style={{ fontSize: 14, color: "var(--sot-fg-1)", fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--sot-fg-3)", marginTop: 2 }}>{desc}</div>
      </div>
    </label>
  );
}

function SaveBar() {
  const [savedAt, setSavedAt] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const save = () => {
    setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    setTimeout(() => setSavedAt(null), 2500);
  };

  const testSync = () => {
    setTestResult({ status: "loading" });
    setTimeout(() => {
      setTestResult({
        status: "ok",
        message: "Test sync OK — sample lead pushed to HubSpot in 184ms (HUB-29481-Z).",
      });
      setTimeout(() => setTestResult(null), 4000);
    }, 1200);
  };

  return (
    <div
      style={{
        position: "sticky",
        bottom: 16,
        zIndex: 5,
      }}
    >
      <div
        className="sot-card"
        style={{
          padding: "12px var(--sot-s-5)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          background: "var(--sot-surface-2)",
          borderColor: "var(--sot-line-strong)",
        }}
      >
        {testResult && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              background:
                testResult.status === "ok"
                  ? "var(--sot-verify-soft)"
                  : "var(--sot-ink)",
              border: `1px solid ${
                testResult.status === "ok" ? "var(--sot-verify)" : "var(--sot-line-strong)"
              }`,
              color:
                testResult.status === "ok"
                  ? "var(--sot-verify)"
                  : "var(--sot-fg-2)",
              fontFamily: "var(--sot-font-mono)",
              fontSize: 11,
              fontWeight: 600,
              maxWidth: 460,
            }}
          >
            {testResult.status === "loading" ? (
              <>
                <Icon name="loader" size={12} style={{ animation: "sotSpin 1s linear infinite" }} />
                Running test sync…
              </>
            ) : (
              <>
                <Icon name="check-circle-2" size={12} color="var(--sot-verify)" />
                {testResult.message}
              </>
            )}
          </span>
        )}
        {savedAt && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "var(--sot-verify)",
              fontFamily: "var(--sot-font-mono)",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <Icon name="check-circle-2" size={12} color="var(--sot-verify)" />
            SAVED · {savedAt}
          </span>
        )}
        <span style={{ flex: 1 }} />
        <button className="sot-btn ghost" onClick={testSync}>
          <Icon name="zap" size={13} /> Test sync
        </button>
        <button className="sot-btn primary" onClick={save}>
          <Icon name="check" size={13} color="black" /> Save settings
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   SYNC HISTORY TABLE
   ============================================================ */
function SyncHistory({ rows }) {
  const [page, setPage] = useState(1);
  const perPage = 10;
  const paged = rows.slice((page - 1) * perPage, page * perPage);
  const pages = Math.max(1, Math.ceil(rows.length / perPage));

  return (
    <Section
      title="RECENT_SYNCS"
      icon="history"
      action={
        <div style={{ display: "flex", gap: 6 }}>
          <Tag
            label="SUCCESS"
            value={String(rows.filter((r) => r.status === "success").length)}
            tone="verify"
          />
          <Tag
            label="FAILED"
            value={String(rows.filter((r) => r.status === "failed").length)}
            tone="alert"
          />
        </div>
      }
      padded={false}
    >
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
          <thead>
            <tr style={{ background: "var(--sot-ink)", borderBottom: "1px solid var(--sot-line)" }}>
              {["TIMESTAMP", "LEAD", "STATUS", "CRM_ID", "DURATION", "DETAILS", ""].map((h, i, arr) => (
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
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((r, i) => (
              <SyncRow key={i} row={r} zebra={i % 2 === 1} />
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          padding: "10px 16px",
          borderTop: "1px solid var(--sot-line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span className="sot-mono" style={{ fontSize: 11, color: "var(--sot-fg-3)" }}>
          {(page - 1) * perPage + 1}–{Math.min(page * perPage, rows.length)} OF {rows.length}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="sot-btn ghost"
            style={{ height: 28, padding: "0 10px" }}
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            <Icon name="chevron-left" size={11} />
          </button>
          <span
            className="sot-mono"
            style={{
              alignSelf: "center",
              color: "var(--sot-fg-3)",
              fontSize: 11,
              padding: "0 6px",
            }}
          >
            {page} / {pages}
          </span>
          <button
            className="sot-btn ghost"
            style={{ height: 28, padding: "0 10px" }}
            disabled={page === pages}
            onClick={() => setPage(page + 1)}
          >
            <Icon name="chevron-right" size={11} />
          </button>
        </div>
      </div>
    </Section>
  );
}

function SyncRow({ row, zebra }) {
  const [expanded, setExpanded] = useState(false);
  const meta = {
    success: { color: "var(--sot-verify)", soft: "var(--sot-verify-soft)", label: "SUCCESS",  icon: "check-circle-2" },
    failed:  { color: "var(--sot-alert)",  soft: "var(--sot-alert-soft)",  label: "FAILED",   icon: "x-circle" },
    pending: { color: "var(--sot-warn)",   soft: "var(--sot-warn-soft)",   label: "PENDING",  icon: "loader" },
  }[row.status];

  return (
    <>
      <tr
        style={{
          background: zebra ? "rgba(255,255,255,.012)" : "transparent",
          borderBottom: expanded ? "1px solid var(--sot-line)" : "1px solid var(--sot-line)",
          transition: "background var(--sot-dur-fast) var(--sot-ease)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sot-surface-2)")}
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = zebra ? "rgba(255,255,255,.012)" : "transparent")
        }
      >
        <td
          style={{
            padding: "12px 16px",
            fontFamily: "var(--sot-font-mono)",
            fontSize: 12,
            color: "var(--sot-fg-2)",
            whiteSpace: "nowrap",
          }}
        >
          <div>{row.time}</div>
          <div style={{ fontSize: 10, color: "var(--sot-fg-4)" }}>{row.relative}</div>
        </td>
        <td style={{ padding: "12px 16px" }}>
          <div style={{ fontSize: 13, color: "var(--sot-fg-1)", fontWeight: 500 }}>
            {row.lead}
          </div>
          <div
            className="sot-mono"
            style={{ fontSize: 10, color: "var(--sot-fg-4)" }}
          >
            {row.leadId}
          </div>
        </td>
        <td style={{ padding: "12px 16px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 8px",
              background: meta.soft,
              border: `1px solid ${meta.color}`,
              color: meta.color,
              fontFamily: "var(--sot-font-mono)",
              fontSize: 10,
              letterSpacing: "var(--sot-tracking-tag)",
              borderRadius: "var(--sot-r-pill)",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            <Icon
              name={meta.icon}
              size={11}
              color={meta.color}
              style={
                row.status === "pending"
                  ? { animation: "sotSpin 1s linear infinite" }
                  : undefined
              }
            />
            {meta.label}
          </span>
        </td>
        <td
          style={{
            padding: "12px 16px",
            fontFamily: "var(--sot-font-mono)",
            fontSize: 12,
            color: row.crmId ? "var(--sot-fg-1)" : "var(--sot-fg-4)",
          }}
        >
          {row.crmId || "—"}
        </td>
        <td
          style={{
            padding: "12px 16px",
            fontFamily: "var(--sot-font-mono)",
            fontSize: 12,
            color: "var(--sot-fg-2)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {row.durationMs != null ? `${row.durationMs}ms` : "—"}
        </td>
        <td
          style={{
            padding: "12px 16px",
            fontSize: 12,
            color: row.error ? "var(--sot-alert)" : "var(--sot-fg-3)",
            maxWidth: 280,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {row.error || (
            <span
              className="sot-mono"
              style={{ color: "var(--sot-fg-4)", fontSize: 11, letterSpacing: "var(--sot-tracking-tag)" }}
            >
              {row.status === "pending" ? "IN_FLIGHT" : "—"}
            </span>
          )}
        </td>
        <td style={{ padding: "12px 16px", textAlign: "right" }}>
          {row.error ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="sot-btn ghost"
              style={{ height: 26, fontSize: 10 }}
            >
              <Icon
                name={expanded ? "chevron-up" : "chevron-down"}
                size={11}
              />
              {expanded ? "Hide" : "Details"}
            </button>
          ) : (
            <a
              href="Lead Details.html"
              className="sot-btn ghost"
              style={{ height: 26, fontSize: 10, textDecoration: "none" }}
            >
              <Icon name="arrow-up-right" size={11} /> View
            </a>
          )}
        </td>
      </tr>
      {expanded && row.error && (
        <tr style={{ background: "var(--sot-ink)", borderBottom: "1px solid var(--sot-line)" }}>
          <td colSpan={7} style={{ padding: "16px 24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                background: "var(--sot-alert-soft)",
                border: "1px solid var(--sot-alert)",
                padding: 12,
              }}
            >
              <Icon name="alert-triangle" size={14} color="var(--sot-alert)" />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: "var(--sot-font-mono)",
                    fontSize: 10,
                    color: "var(--sot-alert)",
                    letterSpacing: "var(--sot-tracking-tag)",
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  ERROR · {row.lead} · {row.relative.toUpperCase()}
                </div>
                <pre
                  style={{
                    margin: 0,
                    fontFamily: "var(--sot-font-mono)",
                    fontSize: 12,
                    color: "var(--sot-fg-1)",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.5,
                  }}
                >
                  {row.error}
                </pre>
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <button className="sot-btn ghost" style={{ height: 26, fontSize: 10 }}>
                    <Icon name="refresh-cw" size={11} /> Retry sync
                  </button>
                  <button className="sot-btn ghost" style={{ height: 26, fontSize: 10 }}>
                    <Icon name="scroll-text" size={11} /> View logs
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ============================================================
   TROUBLESHOOTING
   ============================================================ */
function Troubleshooting() {
  const [debug, setDebug] = useState(false);
  const [openIdx, setOpenIdx] = useState(null);

  const faqs = [
    {
      q: "Syncs are failing with 'rate limit exceeded'",
      a: "HubSpot's free tier caps you at 100 requests / 10 seconds. Reduce concurrency in Sync Settings → 'Concurrent syncs' or upgrade your HubSpot plan. Failed syncs auto-retry with exponential backoff up to 3 times.",
    },
    {
      q: "Field mapping errors on quality_score",
      a: "The `lead.quality` field is numeric (0-10). If your CRM field is typed as a string or picklist, the sync rejects the row. Either change the CRM field type to Number, or remap to a string-compatible field.",
    },
    {
      q: "Webhook is not firing for new leads",
      a: "Verify the webhook URL is registered in your CRM's webhook settings AND the OAuth scope includes `webhooks`. Re-issue the API key and reconnect if necessary. Last incoming webhook timestamp is visible in Audit Log.",
    },
    {
      q: "Some calls aren't creating leads in the CRM",
      a: "Check your Minimum Quality Score in Sync Behavior. Calls below threshold are held in queue. Also confirm 'Auto-sync' is ON — manual sync requires clicking 'Sync to CRM' on each lead.",
    },
  ];

  return (
    <Section title="TROUBLESHOOTING" icon="life-buoy">
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {faqs.map((f, i) => {
          const open = openIdx === i;
          return (
            <div
              key={i}
              style={{
                border: "1px solid var(--sot-line)",
                background: open ? "var(--sot-ink)" : "transparent",
              }}
            >
              <button
                onClick={() => setOpenIdx(open ? null : i)}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  textAlign: "left",
                  color: "var(--sot-fg-1)",
                }}
              >
                <Icon name="help-circle" size={13} color={open ? "var(--sot-verify)" : "var(--sot-fg-3)"} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{f.q}</span>
                <Icon name={open ? "minus" : "plus"} size={12} color="var(--sot-fg-3)" />
              </button>
              {open && (
                <div
                  style={{
                    padding: "0 14px 14px 42px",
                    fontSize: 13,
                    color: "var(--sot-fg-2)",
                    lineHeight: 1.6,
                  }}
                >
                  {f.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 20,
          paddingTop: 20,
          borderTop: "1px solid var(--sot-line)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        <div
          style={{
            padding: 14,
            background: "var(--sot-ink)",
            border: "1px solid var(--sot-line-strong)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Toggle checked={debug} onChange={setDebug} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--sot-fg-1)" }}>
              Debug mode
            </div>
            <div style={{ fontSize: 11, color: "var(--sot-fg-3)" }}>
              Verbose request/response logging
            </div>
          </div>
        </div>

        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="sot-btn ghost"
          style={{
            justifyContent: "center",
            textDecoration: "none",
            height: 56,
          }}
        >
          <Icon name="scroll-text" size={13} /> View logs
        </a>
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="sot-btn ghost"
          style={{
            justifyContent: "center",
            textDecoration: "none",
            height: 56,
          }}
        >
          <Icon name="life-buoy" size={13} /> Contact support
        </a>
      </div>
    </Section>
  );
}

/* ============================================================
   ROOT
   ============================================================ */
function CRMIntegrationSettingsPage() {
  const [connected, setConnected] = useState(true);
  const [provider, setProvider] = useState("hubspot");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const [settings, setSettings] = useState({
    autoSync: true,
    syncThreshold: 5,
    syncTranscripts: true,
    syncSentiment: true,
    syncQuality: true,
    createDeals: true,
    autoAssign: false,
    emailTemplate: `Hi {{lead_name}},

Thanks for taking the time to talk with us earlier today. As discussed, I'd like to put 20 minutes on the calendar with one of our solutions engineers to walk through {{company}}'s specific use case.

Recommended next steps:
{{next_steps}}

Here's a link to book directly: https://voiceai.example.com/book/{{owner}}

Talk soon,
{{owner_name}}
`,
  });

  const [mapping, setMapping] = useState(FIELD_MAPPING_DEFAULT);

  const handleDisconnect = () => {
    if (window.confirm("Disconnect HubSpot? Sync will stop and queued leads will be paused.")) {
      setConnected(false);
    }
  };
  const handleTestConnection = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
    }, 1300);
  };
  const handleConnect = (crm) => {
    setProvider(crm);
    setConnected(true);
  };
  const handleSetupTest = (crm, apiKey) => {
    setTestResult({ status: "loading" });
    setTimeout(() => {
      setTestResult({
        status: "ok",
        message: `OAuth handshake OK. ${CRM_OPTIONS.find((c) => c.id === crm)?.name} acknowledged the test ping in 240ms.`,
      });
    }, 1200);
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
        {/* Title row */}
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
            <Tag label="SETTINGS" value="CRM_INTEGRATION" tone="verify" />
            <Tag label="MODULE" value="ADMIN" />
            <Tag label="OWNER" value="REVOPS_TEAM" />
          </div>
          <h1
            className="sot-h2"
            style={{ fontSize: 32, letterSpacing: "-0.02em" }}
          >
            CRM integration.
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
            One source of truth between the voice agent and your CRM. Map fields once, then every qualified lead lands where it needs to.
          </p>
        </div>

        {/* Layout: rail + main */}
        <div
          className="settings-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "240px minmax(0, 1fr)",
            gap: "var(--sot-s-4)",
            alignItems: "start",
          }}
        >
          <SettingsRail />

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sot-s-4)" }}>
            <ConnectionStatus
              connected={connected}
              provider={provider}
              connectedSince="March 15, 2026"
              lastSync="30 min ago"
              onDisconnect={handleDisconnect}
              onTestConnection={handleTestConnection}
              testing={testing}
            />

            {connected ? (
              <>
                <SettingsForm
                  provider={provider}
                  settings={settings}
                  setSettings={setSettings}
                  mapping={mapping}
                  setMapping={setMapping}
                />
                <SyncHistory rows={SYNC_HISTORY} />
                <Troubleshooting />
              </>
            ) : (
              <IntegrationSetup
                onConnect={handleConnect}
                onTest={handleSetupTest}
                testResult={testResult}
              />
            )}
          </div>
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
            VOICE_AI_AGENT // SETTINGS // CRM_INTEGRATION
          </span>
          <div style={{ display: "flex", gap: 14 }}>
            <Tag label="ENCRYPTION" value="AT_REST_AND_TRANSIT" tone="verify" />
            <Tag label="OAUTH" value="V2" />
            <Tag label="SOURCE_OF_TRUTH" value="CONFIRMED" tone="verify" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default CRMIntegrationSettingsPage;
