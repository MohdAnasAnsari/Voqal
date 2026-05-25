import React, { useState, useEffect, useRef, useMemo } from 'react';
/* ============================================================
   ApplicationSettingsPage — SOT design system
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

/* ---------- Toggle ---------- */
function Toggle({ checked, onChange, size = "md" }) {
  const w = size === "lg" ? 44 : 36;
  const h = size === "lg" ? 22 : 20;
  const knob = h - 6;
  return (
    <button
      type="button"
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

/* ---------- Form layout pieces ---------- */
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

function Field({ label, help, hint, children, span = 1 }) {
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 8,
          gap: 12,
        }}
      >
        <span className="sot-tag" style={{ fontSize: 10 }}>
          {label}
        </span>
        {hint && (
          <span
            className="sot-mono"
            style={{ fontSize: 10, color: "var(--sot-fg-4)" }}
          >
            {hint}
          </span>
        )}
      </div>
      {children}
      {help && (
        <span
          style={{
            display: "block",
            marginTop: 6,
            fontSize: 11,
            color: "var(--sot-fg-3)",
            lineHeight: 1.5,
          }}
        >
          {help}
        </span>
      )}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", icon, mono, secret }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "var(--sot-ink)",
        border: "1px solid var(--sot-line-strong)",
        padding: "0 12px",
        height: 38,
      }}
    >
      {icon && <Icon name={icon} size={13} color="var(--sot-fg-3)" />}
      <input
        type={secret && !revealed ? "password" : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          border: "none",
          background: "transparent",
          color: "var(--sot-fg-1)",
          fontFamily: mono ? "var(--sot-font-mono)" : "var(--sot-font-text)",
          fontSize: 13,
          outline: "none",
        }}
      />
      {secret && (
        <button
          onClick={() => setRevealed(!revealed)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--sot-fg-3)",
            padding: 4,
            display: "flex",
          }}
        >
          <Icon name={revealed ? "eye-off" : "eye"} size={13} />
        </button>
      )}
    </div>
  );
}

function NumberInput({ value, onChange, min, max, step = 1, suffix }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "var(--sot-ink)",
        border: "1px solid var(--sot-line-strong)",
        padding: "0 12px",
        height: 38,
      }}
    >
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        style={{
          flex: 1,
          border: "none",
          background: "transparent",
          color: "var(--sot-fg-1)",
          fontFamily: "var(--sot-font-mono)",
          fontSize: 13,
          outline: "none",
          appearance: "textfield",
          MozAppearance: "textfield",
        }}
      />
      {suffix && (
        <span className="sot-mono" style={{ fontSize: 11, color: "var(--sot-fg-4)" }}>
          {suffix}
        </span>
      )}
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
          height: 38,
          fontSize: 13,
          padding: "0 30px 0 12px",
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

function SegmentedControl({ value, onChange, options }) {
  return (
    <div style={{ display: "flex", border: "1px solid var(--sot-line-strong)" }}>
      {options.map((opt, i, arr) => (
        <button
          type="button"
          key={opt.id}
          onClick={() => onChange(opt.id)}
          style={{
            flex: 1,
            padding: "0 14px",
            height: 36,
            background: value === opt.id ? "var(--sot-surface-3)" : "transparent",
            color: value === opt.id ? "var(--sot-fg-1)" : "var(--sot-fg-3)",
            border: "none",
            borderRight: i === arr.length - 1 ? "none" : "1px solid var(--sot-line)",
            cursor: "pointer",
            fontFamily: "var(--sot-font-mono)",
            fontSize: 11,
            letterSpacing: "var(--sot-tracking-tag)",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "background var(--sot-dur-fast) var(--sot-ease)",
          }}
        >
          {opt.icon && <Icon name={opt.icon} size={12} color={value === opt.id ? "var(--sot-verify)" : "var(--sot-fg-3)"} />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange, suffix }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 0",
        borderBottom: "1px dashed var(--sot-line)",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, color: "var(--sot-fg-1)", fontWeight: 600, marginBottom: 2 }}>
          {label}
        </div>
        {desc && (
          <div style={{ fontSize: 12, color: "var(--sot-fg-3)", lineHeight: 1.5 }}>{desc}</div>
        )}
      </div>
      {suffix}
      <Toggle checked={checked} onChange={onChange} size="lg" />
    </div>
  );
}

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
   SETTINGS RAIL
   ============================================================ */
const SECTIONS = [
  { id: "general",       label: "GENERAL",          icon: "settings-2"   },
  { id: "voice",         label: "VOICE",            icon: "audio-waveform" },
  { id: "ai",            label: "AI_MODEL",         icon: "brain-circuit" },
  { id: "phone",         label: "PHONE_CONFIG",     icon: "phone"        },
  { id: "notifications", label: "NOTIFICATIONS",    icon: "bell"         },
  { id: "users",         label: "USER_MANAGEMENT",  icon: "users"        },
  { id: "security",      label: "SECURITY_PRIVACY", icon: "shield-check" },
  { id: "billing",       label: "BILLING_USAGE",    icon: "credit-card"  },
  { id: "help",          label: "HELP_SUPPORT",     icon: "life-buoy"    },
];

function SettingsRail({ active, onSelect }) {
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
        {SECTIONS.map((s) => {
          const isActive = s.id === active;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
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
                name={s.icon}
                size={13}
                color={isActive ? "var(--sot-verify)" : "var(--sot-fg-3)"}
              />
              {s.label}
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
   SECTION 1 — GENERAL
   ============================================================ */
function GeneralSettings({ s, set }) {
  return (
    <Section title="GENERAL_SETTINGS" icon="settings-2">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px 24px",
        }}
      >
        <Field label="APPLICATION_NAME">
          <TextInput
            value={s.appName}
            onChange={(v) => set({ appName: v })}
            icon="tag"
          />
        </Field>
        <Field label="COMPANY_NAME">
          <TextInput
            value={s.companyName}
            onChange={(v) => set({ companyName: v })}
            icon="briefcase"
          />
        </Field>
        <Field label="TIME_ZONE" hint="AUTO_DETECTED">
          <SelectField value={s.timezone} onChange={(v) => set({ timezone: v })}>
            <option value="America/New_York">America/New_York · UTC-4</option>
            <option value="America/Chicago">America/Chicago · UTC-5</option>
            <option value="America/Denver">America/Denver · UTC-6</option>
            <option value="America/Los_Angeles">America/Los_Angeles · UTC-7</option>
            <option value="Europe/London">Europe/London · UTC+1</option>
            <option value="Europe/Berlin">Europe/Berlin · UTC+2</option>
            <option value="Asia/Tokyo">Asia/Tokyo · UTC+9</option>
          </SelectField>
        </Field>
        <Field label="LANGUAGE">
          <SelectField value={s.language} onChange={(v) => set({ language: v })}>
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="es-ES">Español</option>
            <option value="fr-FR">Français</option>
            <option value="de-DE">Deutsch</option>
            <option value="ja-JP">日本語</option>
          </SelectField>
        </Field>
        <Field label="THEME" span={2}>
          <SegmentedControl
            value={s.theme}
            onChange={(v) => set({ theme: v })}
            options={[
              { id: "light", label: "LIGHT", icon: "sun" },
              { id: "dark",  label: "DARK",  icon: "moon" },
              { id: "auto",  label: "AUTO",  icon: "monitor-cog" },
            ]}
          />
        </Field>
      </div>

      <div
        style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: "1px solid var(--sot-line)",
        }}
      >
        <ToggleRow
          label="Enable logging"
          desc="Write activity to the application log. Required for audit trails."
          checked={s.logging}
          onChange={(v) => set({ logging: v })}
        />

        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
          <Field label="LOG_LEVEL">
            <SelectField value={s.logLevel} onChange={(v) => set({ logLevel: v })}>
              <option value="error">ERROR · errors only</option>
              <option value="warn">WARN · errors + warnings</option>
              <option value="info">INFO · standard</option>
              <option value="debug">DEBUG · verbose</option>
            </SelectField>
          </Field>
          <Field label="LOG_RETENTION">
            <SelectField value={s.logRetention} onChange={(v) => set({ logRetention: v })}>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
            </SelectField>
          </Field>
        </div>
      </div>
    </Section>
  );
}

/* ============================================================
   SECTION 2 — VOICE
   ============================================================ */
function VoiceSettings({ s, set }) {
  const providers = [
    { id: "twilio",  name: "Twilio",   short: "TW" },
    { id: "vapi",    name: "VAPI",     short: "VP" },
    { id: "bland",   name: "Bland.ai", short: "BL" },
  ];
  return (
    <Section title="VOICE_SETTINGS" icon="audio-waveform">
      <Field label="VOICE_PROVIDER" help="Choose the telephony layer that runs your inbound + outbound voice." span={2}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
          {providers.map((p) => {
            const active = s.voiceProvider === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => set({ voiceProvider: p.id })}
                style={{
                  padding: "14px",
                  background: active ? "var(--sot-ink)" : "transparent",
                  border: `1px solid ${active ? "var(--sot-verify)" : "var(--sot-line-strong)"}`,
                  color: "var(--sot-fg-1)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
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
                  {p.short}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{p.name}</span>
                {active && <Icon name="check" size={12} color="var(--sot-verify)" />}
              </button>
            );
          })}
        </div>
      </Field>

      <div
        style={{
          marginTop: 24,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px 24px",
        }}
      >
        <Field label="PHONE_NUMBER" help="Inbound number callers will dial.">
          <TextInput
            value={s.phoneNumber}
            onChange={(v) => set({ phoneNumber: v })}
            icon="phone"
            mono
          />
        </Field>
        <Field label="VOICE_ACCENT">
          <SelectField value={s.voiceAccent} onChange={(v) => set({ voiceAccent: v })}>
            <option value="en-US">US English (Neutral)</option>
            <option value="en-US-warm">US English (Warm)</option>
            <option value="en-GB">UK English</option>
            <option value="en-AU">Australian English</option>
            <option value="es-MX">Spanish (Mexico)</option>
            <option value="es-ES">Spanish (Spain)</option>
          </SelectField>
        </Field>
        <Field label="MAX_CALL_DURATION" help="Hard cap before the agent winds down the call." hint="MINUTES">
          <NumberInput
            value={s.maxCallDuration}
            onChange={(v) => set({ maxCallDuration: v })}
            min={1}
            max={60}
            suffix="MIN"
          />
        </Field>
        <Field label="RING_TIMEOUT" hint="SECONDS">
          <NumberInput
            value={s.ringTimeout}
            onChange={(v) => set({ ringTimeout: v })}
            min={5}
            max={120}
            suffix="SEC"
          />
        </Field>
        <Field label="VOICEMAIL_GREETING" help="Played if a call rolls to voicemail." span={2}>
          <textarea
            value={s.voicemailGreeting}
            onChange={(e) => set({ voicemailGreeting: e.target.value })}
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
        </Field>
      </div>
    </Section>
  );
}

/* ============================================================
   SECTION 3 — AI MODEL
   ============================================================ */
function AIModelSettings({ s, set }) {
  const models = [
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B",   speed: 3, quality: 5, cost: "FREE" },
    { id: "llama-3.1-8b-instant",    name: "Llama 3.1 8B",    speed: 5, quality: 3, cost: "FREE" },
    { id: "mixtral-8x7b-32768",      name: "Mixtral 8x7B",    speed: 4, quality: 4, cost: "FREE" },
    { id: "gemma2-9b-it",            name: "Gemma 2 9B",      speed: 4, quality: 3, cost: "FREE" },
  ];

  return (
    <Section title="AI_MODEL_SETTINGS" icon="brain-circuit">
      <Field label="LLM_MODEL" help="Powers the conversation. Sonnet is the default and a good cost/quality tradeoff." span={2}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
          {models.map((m) => {
            const active = s.model === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => set({ model: m.id })}
                style={{
                  padding: "14px",
                  background: active ? "var(--sot-ink)" : "transparent",
                  border: `1px solid ${active ? "var(--sot-verify)" : "var(--sot-line-strong)"}`,
                  color: "var(--sot-fg-1)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon
                    name={active ? "circle-dot" : "circle"}
                    size={13}
                    color={active ? "var(--sot-verify)" : "var(--sot-fg-3)"}
                  />
                  <span style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>{m.name}</span>
                  <span
                    className="sot-mono"
                    style={{
                      fontSize: 11,
                      color: "var(--sot-fg-3)",
                      fontWeight: 600,
                    }}
                  >
                    {m.cost}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 10, fontSize: 10, color: "var(--sot-fg-3)" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span className="sot-tag" style={{ fontSize: 9 }}>SPEED</span>
                    <DotMeter level={m.speed} />
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span className="sot-tag" style={{ fontSize: 9 }}>QUALITY</span>
                    <DotMeter level={m.quality} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </Field>

      <div
        style={{
          marginTop: 24,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px 24px",
        }}
      >
        <Field
          label="TEMPERATURE"
          help="Lower = focused, more deterministic. Higher = creative, varied."
          hint={s.temperature.toFixed(2)}
        >
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={s.temperature}
            onChange={(e) => set({ temperature: Number(e.target.value) })}
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
            <span>0.0 · DETERMINISTIC</span>
            <span>1.0 · CREATIVE</span>
          </div>
        </Field>
        <Field label="MAX_TOKENS" help="Cap on response length per turn." hint="TOKENS">
          <NumberInput
            value={s.maxTokens}
            onChange={(v) => set({ maxTokens: v })}
            min={100}
            max={8000}
            step={100}
            suffix="TOK"
          />
        </Field>
      </div>

      <div style={{ marginTop: 24 }}>
        <Field
          label="SYSTEM_PROMPT"
          help="The personality + objectives of the agent. Edit carefully."
          hint={`${s.systemPrompt.length} CHARS`}
        >
          <textarea
            value={s.systemPrompt}
            onChange={(e) => set({ systemPrompt: e.target.value })}
            className="sot-field"
            style={{
              width: "100%",
              height: 200,
              padding: 14,
              resize: "vertical",
              lineHeight: 1.6,
              fontSize: 13,
              fontFamily: "var(--sot-font-mono)",
            }}
          />
        </Field>
      </div>
    </Section>
  );
}

function DotMeter({ level, max = 5 }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[...Array(max)].map((_, i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            background:
              i < level ? "var(--sot-verify)" : "var(--sot-line-strong)",
          }}
        />
      ))}
    </span>
  );
}

/* ============================================================
   SECTION 4 — PHONE CONFIGURATION
   ============================================================ */
function PhoneConfig({ s, set }) {
  return (
    <Section title="PHONE_CONFIGURATION" icon="phone">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px 24px",
        }}
      >
        <Field label="INBOUND_ROUTING">
          <SelectField value={s.inboundRouting} onChange={(v) => set({ inboundRouting: v })}>
            <option value="ai-first">AI agent first, then human</option>
            <option value="human-first">Human first, then AI</option>
            <option value="ai-only">AI agent only</option>
            <option value="round-robin">Round-robin team</option>
          </SelectField>
        </Field>
        <Field label="VOICEMAIL_AFTER" hint="SECONDS">
          <NumberInput
            value={s.voicemailAfter}
            onChange={(v) => set({ voicemailAfter: v })}
            min={5}
            max={60}
            suffix="SEC"
          />
        </Field>
        <Field label="CALL_GREETING" help="First line the agent speaks on every call." span={2}>
          <TextInput
            value={s.callGreeting}
            onChange={(v) => set({ callGreeting: v })}
            icon="message-square"
          />
        </Field>
        <Field label="HOLD_MUSIC" help="Played during transfers and pauses." span={2}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 12,
              background: "var(--sot-ink)",
              border: "1px solid var(--sot-line-strong)",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                background: "var(--sot-surface-2)",
                border: "1px solid var(--sot-line-strong)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="music" size={14} color="var(--sot-verify)" />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: "var(--sot-font-mono)",
                  fontSize: 12,
                  color: "var(--sot-fg-1)",
                }}
              >
                {s.holdMusic}
              </div>
              <div
                className="sot-mono"
                style={{ fontSize: 10, color: "var(--sot-fg-4)" }}
              >
                184 KB · MP3 · 32 SEC LOOP
              </div>
            </div>
            <button className="sot-btn ghost" style={{ height: 32, fontSize: 10 }}>
              <Icon name="play" size={11} /> Preview
            </button>
            <button className="sot-btn ghost" style={{ height: 32, fontSize: 10 }}>
              <Icon name="upload" size={11} /> Replace
            </button>
          </div>
        </Field>
      </div>

      <div
        style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: "1px solid var(--sot-line)",
        }}
      >
        <span className="sot-tag" style={{ fontSize: 10, display: "block", marginBottom: 12 }}>
          TRANSFER_RULES
        </span>
        <ToggleRow
          label="Transfer on user request"
          desc="If the caller asks for a human, escalate immediately."
          checked={s.transferOnRequest}
          onChange={(v) => set({ transferOnRequest: v })}
        />
        <ToggleRow
          label="Transfer on negative sentiment"
          desc="Auto-escalate if sentiment trips below the threshold for 2+ consecutive turns."
          checked={s.transferOnSentiment}
          onChange={(v) => set({ transferOnSentiment: v })}
        />
        <ToggleRow
          label="Transfer on high-value lead"
          desc="If the AI detects a deal > $10k, route to a senior closer."
          checked={s.transferOnValue}
          onChange={(v) => set({ transferOnValue: v })}
        />
      </div>
    </Section>
  );
}

/* ============================================================
   SECTION 5 — NOTIFICATIONS
   ============================================================ */
function Notifications({ s, set }) {
  return (
    <Section title="NOTIFICATIONS" icon="bell">
      <span className="sot-tag" style={{ fontSize: 10, display: "block", marginBottom: 12 }}>
        EMAIL · {s.emailEnabled ? "ON" : "OFF"}
      </span>
      <ToggleRow
        label="Email notifications"
        desc="Master switch for all email alerts."
        checked={s.emailEnabled}
        onChange={(v) => set({ emailEnabled: v })}
      />
      {s.emailEnabled && (
        <div style={{ paddingLeft: 24, paddingTop: 8 }}>
          <CheckRow
            label="On new qualified lead"
            checked={s.emailOnLead}
            onChange={(v) => set({ emailOnLead: v })}
          />
          <CheckRow
            label="On call failed"
            checked={s.emailOnFailed}
            onChange={(v) => set({ emailOnFailed: v })}
          />
          <CheckRow
            label="Daily summary"
            checked={s.emailDaily}
            onChange={(v) => set({ emailDaily: v })}
          />
          <CheckRow
            label="Weekly report"
            checked={s.emailWeekly}
            onChange={(v) => set({ emailWeekly: v })}
          />
        </div>
      )}

      <div
        style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: "1px solid var(--sot-line)",
        }}
      >
        <span className="sot-tag" style={{ fontSize: 10, display: "block", marginBottom: 12 }}>
          SMS · {s.smsEnabled ? "ON" : "OFF"}
        </span>
        <ToggleRow
          label="SMS alerts"
          desc="Real-time text messages for critical events."
          checked={s.smsEnabled}
          onChange={(v) => set({ smsEnabled: v })}
        />
        {s.smsEnabled && (
          <div style={{ marginTop: 12, maxWidth: 320 }}>
            <Field label="SMS_PHONE_NUMBER">
              <TextInput
                value={s.smsPhone}
                onChange={(v) => set({ smsPhone: v })}
                icon="smartphone"
                mono
              />
            </Field>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: "1px solid var(--sot-line)",
        }}
      >
        <span className="sot-tag" style={{ fontSize: 10, display: "block", marginBottom: 12 }}>
          SLACK · {s.slackEnabled ? "ON" : "OFF"}
        </span>
        <ToggleRow
          label="Slack integration"
          desc="Post lead and call events to a Slack channel via webhook."
          checked={s.slackEnabled}
          onChange={(v) => set({ slackEnabled: v })}
        />
        {s.slackEnabled && (
          <div style={{ marginTop: 12 }}>
            <Field label="WEBHOOK_URL">
              <TextInput
                value={s.slackWebhook}
                onChange={(v) => set({ slackWebhook: v })}
                icon="link-2"
                mono
              />
            </Field>
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <Tag label="CHANNEL" value="#voice-ai-alerts" tone="verify" />
              <Tag label="EVENTS" value="LEAD,FAIL" />
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

function CheckRow({ label, checked, onChange }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 0",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <Checkbox checked={checked} onChange={onChange} />
      <span style={{ fontSize: 13, color: "var(--sot-fg-1)" }}>{label}</span>
    </label>
  );
}

/* ============================================================
   SECTION 6 — USER MANAGEMENT
   ============================================================ */
const USERS_INITIAL = [
  { id: 1, name: "M. Johnston",  email: "m.johnston@voiceai.example.com",  role: "ADMIN",  lastActive: "Active now",  avatar: "MJ" },
  { id: 2, name: "K. Alvarez",   email: "k.alvarez@voiceai.example.com",   role: "AGENT",  lastActive: "12 min ago",  avatar: "KA" },
  { id: 3, name: "R. Patel",     email: "r.patel@voiceai.example.com",     role: "AGENT",  lastActive: "1 hour ago",  avatar: "RP" },
  { id: 4, name: "S. Nakamura",  email: "s.nakamura@voiceai.example.com",  role: "AGENT",  lastActive: "2 hours ago", avatar: "SN" },
  { id: 5, name: "J. O'Brien",   email: "j.obrien@voiceai.example.com",    role: "AGENT",  lastActive: "Yesterday",   avatar: "JO" },
  { id: 6, name: "L. Chen",      email: "l.chen@voiceai.example.com",      role: "VIEWER", lastActive: "3 days ago",  avatar: "LC" },
];
const ROLE_COLOR = {
  ADMIN:  "var(--sot-verify)",
  AGENT:  "var(--sot-fg-2)",
  VIEWER: "var(--sot-fg-3)",
};

function UserManagement() {
  const [users, setUsers] = useState(USERS_INITIAL);
  const [adding, setAdding] = useState(false);

  const removeUser = (id) => {
    if (window.confirm("Remove this user?")) {
      setUsers((us) => us.filter((u) => u.id !== id));
    }
  };
  const changeRole = (id, role) => {
    setUsers((us) => us.map((u) => (u.id === id ? { ...u, role } : u)));
  };

  return (
    <Section
      title="USER_MANAGEMENT"
      icon="users"
      action={
        <button
          className="sot-btn primary"
          style={{ height: 32, fontSize: 10 }}
          onClick={() => setAdding(true)}
        >
          <Icon name="plus" size={12} color="black" /> Add user
        </button>
      }
      padded={false}
    >
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
          <thead>
            <tr style={{ background: "var(--sot-ink)", borderBottom: "1px solid var(--sot-line)" }}>
              {["MEMBER", "EMAIL", "ROLE", "LAST_ACTIVE", ""].map((h, i, arr) => (
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
            {users.map((u, i) => (
              <tr
                key={u.id}
                style={{
                  background: i % 2 === 1 ? "rgba(255,255,255,.012)" : "transparent",
                  borderBottom: "1px solid var(--sot-line)",
                }}
              >
                <td style={{ padding: "12px 16px" }}>
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
                        position: "relative",
                      }}
                    >
                      {u.avatar}
                      {u.lastActive === "Active now" && (
                        <span
                          style={{
                            position: "absolute",
                            bottom: -2,
                            right: -2,
                            width: 8,
                            height: 8,
                            background: "var(--sot-verify)",
                            border: "1px solid var(--sot-surface-1)",
                            borderRadius: 999,
                          }}
                        />
                      )}
                    </div>
                    <span style={{ fontSize: 13, color: "var(--sot-fg-1)", fontWeight: 600 }}>
                      {u.name}
                    </span>
                  </div>
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    fontFamily: "var(--sot-font-mono)",
                    fontSize: 12,
                    color: "var(--sot-fg-2)",
                  }}
                >
                  {u.email}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    style={{
                      background: "transparent",
                      border: `1px solid ${ROLE_COLOR[u.role]}`,
                      color: ROLE_COLOR[u.role],
                      fontFamily: "var(--sot-font-mono)",
                      fontSize: 10,
                      letterSpacing: "var(--sot-tracking-tag)",
                      fontWeight: 600,
                      padding: "4px 8px",
                      cursor: "pointer",
                      borderRadius: 999,
                    }}
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="AGENT">AGENT</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    fontFamily: "var(--sot-font-mono)",
                    fontSize: 12,
                    color: u.lastActive === "Active now" ? "var(--sot-verify)" : "var(--sot-fg-3)",
                  }}
                >
                  {u.lastActive}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <div style={{ display: "inline-flex", gap: 4 }}>
                    <button
                      className="sot-btn ghost"
                      style={{ height: 26, width: 26, padding: 0, justifyContent: "center" }}
                      title="Edit"
                    >
                      <Icon name="pencil" size={11} />
                    </button>
                    <button
                      className="sot-btn ghost"
                      style={{
                        height: 26,
                        width: 26,
                        padding: 0,
                        justifyContent: "center",
                        color: "var(--sot-fg-3)",
                      }}
                      title="Remove"
                      onClick={() => removeUser(u.id)}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--sot-alert)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--sot-fg-3)")}
                    >
                      <Icon name="trash-2" size={11} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {adding && (
        <div
          style={{
            padding: 16,
            background: "var(--sot-ink)",
            borderTop: "1px solid var(--sot-verify)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Icon name="user-plus" size={13} color="var(--sot-verify)" />
            <span
              className="sot-tag"
              style={{ color: "var(--sot-verify)", fontSize: 11, fontWeight: 600 }}
            >
              INVITE_NEW_USER
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 10 }}>
            <TextInput placeholder="Full name" value="" onChange={() => {}} icon="user" />
            <TextInput placeholder="email@company.com" value="" onChange={() => {}} icon="mail" />
            <SelectField value="AGENT" onChange={() => {}}>
              <option value="ADMIN">ADMIN</option>
              <option value="AGENT">AGENT</option>
              <option value="VIEWER">VIEWER</option>
            </SelectField>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="sot-btn ghost" onClick={() => setAdding(false)}>
                Cancel
              </button>
              <button className="sot-btn verify">
                <Icon name="mail" size={12} color="white" /> Send invite
              </button>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}

/* ============================================================
   SECTION 7 — SECURITY & PRIVACY
   ============================================================ */
function Security({ s, set }) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [apiKey, setApiKey] = useState("vai_live_sk_2hN1qBxYW3vKL9ZcPjMnE4RuQ8tFsAdGxK");

  const regenerate = () => {
    if (
      window.confirm(
        "Regenerating will invalidate the current key immediately. Any integrations using the old key will fail. Continue?"
      )
    ) {
      setRegenerating(true);
      setTimeout(() => {
        const chars = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNPQRSTUVWXYZ";
        let k = "vai_live_sk_";
        for (let i = 0; i < 32; i++) k += chars[Math.floor(Math.random() * chars.length)];
        setApiKey(k);
        setRegenerating(false);
      }, 1000);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sot-s-4)" }}>
      <Section title="API_KEY_MANAGEMENT" icon="key-round">
        <div
          style={{
            padding: 14,
            background: "var(--sot-warn-soft)",
            border: "1px solid var(--sot-warn)",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Icon name="alert-triangle" size={14} color="var(--sot-warn)" />
          <span style={{ fontSize: 12, color: "var(--sot-warn)", lineHeight: 1.5 }}>
            Treat your API key like a password. Never commit it to source control. Rotate every 90 days.
          </span>
        </div>

        <Field label="LIVE_API_KEY" hint={`LAST_USED: 2_MIN_AGO`}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--sot-ink)",
              border: "1px solid var(--sot-line-strong)",
              padding: "0 12px",
              height: 42,
            }}
          >
            <Icon name="key-round" size={13} color="var(--sot-verify)" />
            <span
              style={{
                flex: 1,
                fontFamily: "var(--sot-font-mono)",
                fontSize: 13,
                color: "var(--sot-fg-1)",
                letterSpacing: "0.04em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {apiKey.slice(0, 14)}
              <span style={{ color: "var(--sot-fg-4)" }}>•••••••••••••••</span>
              {apiKey.slice(-6)}
            </span>
            <button
              className="sot-btn ghost"
              style={{ height: 30, fontSize: 10 }}
              onClick={() => {
                navigator.clipboard?.writeText(apiKey);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              <Icon name={copied ? "check" : "copy"} size={11} />
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              className="sot-btn ghost"
              style={{
                height: 30,
                fontSize: 10,
                color: "var(--sot-alert)",
                borderColor: "var(--sot-alert)",
              }}
              onClick={regenerate}
              disabled={regenerating}
            >
              <Icon
                name="refresh-cw"
                size={11}
                color="var(--sot-alert)"
                style={regenerating ? { animation: "sotSpin 1s linear infinite" } : undefined}
              />
              {regenerating ? "Rotating…" : "Regenerate"}
            </button>
          </div>
        </Field>
      </Section>

      <Section title="DATA_PROTECTION" icon="shield-check">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px 24px",
            marginBottom: 16,
          }}
        >
          <Field label="DATA_RETENTION" help="How long to keep call recordings and transcripts.">
            <SelectField value={s.dataRetention} onChange={(v) => set({ dataRetention: v })}>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
              <option value="365">1 year</option>
              <option value="forever">Forever</option>
            </SelectField>
          </Field>
          <Field label="PASSWORD_POLICY">
            <SelectField value={s.passwordPolicy} onChange={(v) => set({ passwordPolicy: v })}>
              <option value="basic">BASIC · 8+ chars</option>
              <option value="medium">MEDIUM · 10+ chars, mixed case, number</option>
              <option value="strong">STRONG · 12+ chars, mixed, number, symbol</option>
            </SelectField>
          </Field>
        </div>
        <ToggleRow
          label="Encryption at rest"
          desc="AES-256 encryption for all stored call data and transcripts."
          checked={s.encryption}
          onChange={(v) => set({ encryption: v })}
        />
        <ToggleRow
          label="Two-factor authentication"
          desc="Require 2FA for all admin sign-ins. Recommended."
          checked={s.twoFactor}
          onChange={(v) => set({ twoFactor: v })}
        />
        <ToggleRow
          label="Audit log"
          desc="Record every settings change and access event."
          checked={s.auditLog}
          onChange={(v) => set({ auditLog: v })}
        />
      </Section>
    </div>
  );
}

/* ============================================================
   SECTION 8 — BILLING & USAGE
   ============================================================ */
function Billing() {
  const usage = [
    { label: "VOICE_CALLS",   used: 156,   cap: 1000,  unit: "calls" },
    { label: "API_CALLS",     used: 1234,  cap: 10000, unit: "requests" },
    { label: "STORAGE",       used: 2.3,   cap: 100,   unit: "GB", mono: true },
    { label: "TRANSCRIPTION", used: 412,   cap: 2000,  unit: "minutes" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sot-s-4)" }}>
      <Section title="CURRENT_PLAN" icon="credit-card" padded={false}>
        <div
          style={{
            padding: "var(--sot-s-5)",
            display: "flex",
            alignItems: "center",
            gap: "var(--sot-s-5)",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              background: "var(--sot-ink)",
              border: "1px solid var(--sot-verify)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--sot-font-mono)",
              fontSize: 13,
              color: "var(--sot-verify)",
              fontWeight: 700,
            }}
          >
            PRO
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--sot-fg-1)", letterSpacing: "-0.01em" }}>
                Professional
              </span>
              <Tag label="STATUS" value="ACTIVE" tone="verify" />
            </div>
            <div style={{ fontSize: 13, color: "var(--sot-fg-3)" }}>
              <span style={{ fontFamily: "var(--sot-font-mono)", color: "var(--sot-fg-1)", fontWeight: 700, fontSize: 16 }}>
                $99
              </span>{" "}
              / month · Renews June 15, 2026
            </div>
          </div>
          <button className="sot-btn primary">
            <Icon name="arrow-up-right" size={13} color="black" /> Upgrade plan
          </button>
        </div>
      </Section>

      <Section title="USAGE_THIS_MONTH" icon="activity">
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {usage.map((u) => {
            const pct = (u.used / u.cap) * 100;
            const color = pct > 80 ? "var(--sot-warn)" : "var(--sot-verify)";
            return (
              <div key={u.label}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span className="sot-tag" style={{ fontSize: 10 }}>
                    {u.label}
                  </span>
                  <span
                    className="sot-mono"
                    style={{
                      fontSize: 13,
                      color: "var(--sot-fg-1)",
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {u.used.toLocaleString()}
                    <span style={{ color: "var(--sot-fg-3)", fontWeight: 400 }}>
                      {" "}/ {u.cap.toLocaleString()} {u.unit.toUpperCase()}
                    </span>
                    <span style={{ color: color, marginLeft: 8 }}>{Math.round(pct)}%</span>
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
                      width: pct + "%",
                      background: color,
                      transition: "width var(--sot-dur-slow) var(--sot-ease)",
                    }}
                  />
                  {/* 80% threshold marker */}
                  <div
                    style={{
                      position: "absolute",
                      left: "80%",
                      top: -2,
                      bottom: -2,
                      width: 1,
                      background: "var(--sot-warn)",
                      opacity: 0.6,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="PAYMENT_METHOD" icon="credit-card">
        <div
          style={{
            padding: 14,
            background: "var(--sot-ink)",
            border: "1px solid var(--sot-line-strong)",
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 30,
              background: "var(--sot-surface-2)",
              border: "1px solid var(--sot-line-strong)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--sot-font-mono)",
              fontSize: 9,
              color: "var(--sot-fg-1)",
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            VISA
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: "var(--sot-font-mono)",
                fontSize: 14,
                color: "var(--sot-fg-1)",
                fontWeight: 600,
                letterSpacing: "0.06em",
              }}
            >
              •••• •••• •••• 4242
            </div>
            <div className="sot-mono" style={{ fontSize: 10, color: "var(--sot-fg-4)" }}>
              EXPIRES 04/28 · DEFAULT
            </div>
          </div>
          <button className="sot-btn ghost">
            <Icon name="pencil" size={12} /> Update
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="sot-btn ghost"
            style={{ textDecoration: "none", height: 32 }}
          >
            <Icon name="file-text" size={12} /> View invoices
          </a>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="sot-btn ghost"
            style={{ textDecoration: "none", height: 32 }}
          >
            <Icon name="download" size={12} /> Download billing history
          </a>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="sot-btn ghost"
            style={{ textDecoration: "none", height: 32 }}
          >
            <Icon name="building-2" size={12} /> Tax & business info
          </a>
        </div>
      </Section>
    </div>
  );
}

/* ============================================================
   SECTION 9 — HELP & SUPPORT
   ============================================================ */
function HelpSupport() {
  const [openIdx, setOpenIdx] = useState(0);
  const faqs = [
    {
      q: "How do I switch the AI model mid-call?",
      a: "Model is set at the start of the call and cannot be hot-swapped mid-conversation — context would be lost. Change the default in AI Model Settings; new calls pick up the new model.",
    },
    {
      q: "Why aren't my calls being qualified?",
      a: "Check the Minimum Quality Score in CRM Integration. The default is 5+ — calls below threshold are held in queue rather than synced.",
    },
    {
      q: "Can I customize the agent's voice?",
      a: "Yes, under Voice Settings → Voice Accent. Custom voice cloning requires a Professional or Enterprise plan and 60 seconds of clean source audio.",
    },
    {
      q: "How is my data protected?",
      a: "All call data is encrypted at rest (AES-256) and in transit (TLS 1.3). Recordings are retained per your Data Retention setting. You can purge any single call at any time from Call Details.",
    },
  ];

  const tutorials = [
    { title: "Getting started in 5 minutes", duration: "5:14", icon: "play-circle" },
    { title: "Connecting your CRM",          duration: "3:42", icon: "play-circle" },
    { title: "Tuning the AI for your team",  duration: "8:21", icon: "play-circle" },
    { title: "Reading the analytics report", duration: "4:55", icon: "play-circle" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sot-s-4)" }}>
      <Section
        title="GET_HELP"
        icon="life-buoy"
        action={<Tag label="SLA" value="<4_HRS" tone="verify" />}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 10,
          }}
        >
          {[
            { icon: "book-open",       label: "Documentation",     desc: "Full reference + guides" },
            { icon: "message-circle",  label: "Contact support",   desc: "Reply within 4 hrs" },
            { icon: "users",           label: "Community forum",   desc: "Search past discussions" },
            { icon: "video",           label: "Live training",     desc: "Book a 30-min session" },
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

      <Section title="FAQ" icon="help-circle">
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
      </Section>

      <Section title="VIDEO_TUTORIALS" icon="video">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 10,
          }}
        >
          {tutorials.map((t) => (
            <a
              key={t.title}
              href="#"
              onClick={(e) => e.preventDefault()}
              style={{
                textDecoration: "none",
                padding: 14,
                background: "var(--sot-ink)",
                border: "1px solid var(--sot-line)",
                display: "flex",
                alignItems: "center",
                gap: 12,
                transition: "border-color var(--sot-dur-fast) var(--sot-ease)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "var(--sot-verify)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "var(--sot-line)")
              }
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: "var(--sot-surface-2)",
                  border: "1px solid var(--sot-line-strong)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="play" size={13} color="var(--sot-verify)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--sot-fg-1)" }}>
                  {t.title}
                </div>
                <div
                  className="sot-mono"
                  style={{ fontSize: 10, color: "var(--sot-fg-4)" }}
                >
                  {t.duration}
                </div>
              </div>
            </a>
          ))}
        </div>
      </Section>

      <Section title="FEEDBACK" icon="message-square">
        <Field label="MESSAGE" help="We read every one. Response within 1 business day.">
          <textarea
            placeholder="Tell us what's broken, what's missing, or what's great…"
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
        </Field>
        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <button className="sot-btn primary">
            <Icon name="send" size={12} color="black" /> Send feedback
          </button>
        </div>
      </Section>
    </div>
  );
}

/* ============================================================
   SAVE BAR (sticky bottom)
   ============================================================ */
function SaveBar({ dirty, onSave, onCancel, onReset, status }) {
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
        {status === "saving" && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "var(--sot-fg-2)",
              fontFamily: "var(--sot-font-mono)",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <Icon name="loader" size={12} style={{ animation: "sotSpin 1s linear infinite" }} />
            SAVING…
          </span>
        )}
        {status === "saved" && (
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
            ALL CHANGES SAVED
          </span>
        )}
        {status === "error" && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "var(--sot-alert)",
              fontFamily: "var(--sot-font-mono)",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <Icon name="alert-circle" size={12} color="var(--sot-alert)" />
            SAVE FAILED · RETRY
          </span>
        )}
        {!status && dirty && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "var(--sot-warn)",
              fontFamily: "var(--sot-font-mono)",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                background: "var(--sot-warn)",
                borderRadius: 999,
              }}
            />
            UNSAVED_CHANGES
          </span>
        )}
        {!status && !dirty && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "var(--sot-fg-3)",
              fontFamily: "var(--sot-font-mono)",
              fontSize: 11,
            }}
          >
            <Icon name="check" size={11} color="var(--sot-fg-3)" />
            NO_CHANGES
          </span>
        )}
        <span style={{ flex: 1 }} />
        <button
          className="sot-btn ghost"
          style={{ color: "var(--sot-alert)", borderColor: "var(--sot-alert)" }}
          onClick={onReset}
        >
          <Icon name="rotate-ccw" size={12} color="var(--sot-alert)" /> Reset to default
        </button>
        <button className="sot-btn ghost" onClick={onCancel} disabled={!dirty}>
          <Icon name="x" size={12} /> Cancel
        </button>
        <button
          className="sot-btn primary"
          onClick={onSave}
          disabled={!dirty || status === "saving"}
        >
          <Icon name="check" size={13} color="black" /> Save settings
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   ROOT
   ============================================================ */
const DEFAULT_SETTINGS = {
  // General
  appName: "Voice AI Agent",
  companyName: "Our World Energy",
  timezone: "America/New_York",
  language: "en-US",
  theme: "dark",
  logging: true,
  logLevel: "info",
  logRetention: "30",

  // Voice
  voiceProvider: "twilio",
  phoneNumber: "+1-555-0100",
  voicemailGreeting: "You've reached the Voice AI demo team. We're sorry we missed you. Please leave a message after the tone and we'll be back within one business day.",
  maxCallDuration: 5,
  ringTimeout: 30,
  voiceAccent: "en-US",

  // AI
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: `You are Aria, an inbound qualification agent for Voice AI.

Your job is to:
1. Understand why the caller is reaching out.
2. Capture enough context to qualify them (name, company, use case, volume).
3. If they're a fit, book a 20-minute demo with a solutions engineer.
4. If they're not a fit, route to the appropriate team kindly.

Voice: warm but efficient. Don't waste their time. Don't oversell.
Never make claims about pricing without checking. If you don't know, say so.`,

  // Phone
  inboundRouting: "ai-first",
  callGreeting: "Hi, this is Aria from the demo team — am I catching you at an OK time?",
  voicemailAfter: 30,
  holdMusic: "default-ambient-loop.mp3",
  transferOnRequest: true,
  transferOnSentiment: true,
  transferOnValue: false,

  // Notifications
  emailEnabled: true,
  emailOnLead: true,
  emailOnFailed: true,
  emailDaily: true,
  emailWeekly: false,
  smsEnabled: false,
  smsPhone: "+1-555-0188",
  slackEnabled: true,
  slackWebhook: "https://hooks.slack.com/services/T01.../B02.../xxxx",

  // Security
  dataRetention: "180",
  passwordPolicy: "strong",
  encryption: true,
  twoFactor: true,
  auditLog: true,
};

function ApplicationSettingsPage() {
  const [section, setSection] = useState("general");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState(DEFAULT_SETTINGS);
  const [status, setStatus] = useState(null);

  const dirty = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(savedSettings);
  }, [settings, savedSettings]);

  const set = (patch) => setSettings((s) => ({ ...s, ...patch }));

  const save = () => {
    setStatus("saving");
    setTimeout(() => {
      setSavedSettings(settings);
      setStatus("saved");
      setTimeout(() => setStatus(null), 2500);
    }, 700);
  };

  const cancel = () => setSettings(savedSettings);

  const reset = () => {
    if (window.confirm("Reset ALL settings to factory defaults? This cannot be undone.")) {
      setSettings(DEFAULT_SETTINGS);
      setSavedSettings(DEFAULT_SETTINGS);
    }
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
            <Tag label="SETTINGS" value="APPLICATION" tone="verify" />
            <Tag label="MODULE" value="ADMIN" />
            <Tag label="VERSION" value="V2.4.1" />
          </div>
          <h1 className="sot-h2" style={{ fontSize: 32, letterSpacing: "-0.02em" }}>
            Application settings.
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
            Configure the voice agent, AI model, integrations, team access, and security policies. Changes apply to all calls going forward.
          </p>
        </div>

        {/* Rail + content */}
        <div
          className="settings-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "240px minmax(0, 1fr)",
            gap: "var(--sot-s-4)",
            alignItems: "start",
            marginBottom: "var(--sot-s-4)",
          }}
        >
          <SettingsRail active={section} onSelect={setSection} />

          <div
            style={{ display: "flex", flexDirection: "column", gap: "var(--sot-s-4)" }}
            key={section}
          >
            <div style={{ animation: "sotFade var(--sot-dur-base) var(--sot-ease)" }}>
              {section === "general"       && <GeneralSettings s={settings} set={set} />}
              {section === "voice"         && <VoiceSettings    s={settings} set={set} />}
              {section === "ai"            && <AIModelSettings  s={settings} set={set} />}
              {section === "phone"         && <PhoneConfig      s={settings} set={set} />}
              {section === "notifications" && <Notifications    s={settings} set={set} />}
              {section === "users"         && <UserManagement />}
              {section === "security"      && <Security         s={settings} set={set} />}
              {section === "billing"       && <Billing />}
              {section === "help"          && <HelpSupport />}
            </div>

            <SaveBar
              dirty={dirty}
              onSave={save}
              onCancel={cancel}
              onReset={reset}
              status={status}
            />
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
            VOICE_AI_AGENT // SETTINGS // {section.toUpperCase()}
          </span>
          <div style={{ display: "flex", gap: 14 }}>
            <Tag label="ENV" value="PRODUCTION" />
            <Tag label="ENCRYPTION" value="AES_256" tone="verify" />
            <Tag label="SOURCE_OF_TRUTH" value="CONFIRMED" tone="verify" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default ApplicationSettingsPage;
