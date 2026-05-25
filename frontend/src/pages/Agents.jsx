import React, { useState, useEffect, useRef, useCallback } from 'react';
/* ============================================================
   AgentsPage — SOT design system
   Manage AI call agent personas: create, configure, activate.
   ============================================================ */

const API_BASE = "http://localhost:8000/api/v1";

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
      {value != null && (<>: <span className="v">{value}</span></>)}
    </span>
  );
}

/* ---------- Status badge ---------- */
const STATUS_STYLE = {
  active:   { color: "var(--sot-verify)", bg: "var(--sot-verify-soft)", label: "ACTIVE" },
  inactive: { color: "var(--sot-fg-3)",   bg: "rgba(184,184,191,.1)",   label: "INACTIVE" },
  draft:    { color: "var(--sot-warn)",    bg: "var(--sot-warn-soft)",   label: "DRAFT" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.draft;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px",
      background: s.bg,
      border: `1px solid ${s.color}`,
      color: s.color,
      fontFamily: "var(--sot-font-mono)",
      fontSize: 10,
      letterSpacing: "var(--sot-tracking-tag)",
      fontWeight: 600,
      whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, background: s.color, borderRadius: 999 }} />
      {s.label}
    </span>
  );
}

/* ---------- Stat chip ---------- */
function StatChip({ icon, label, value, tone }) {
  const color = tone === "verify" ? "var(--sot-verify)"
    : tone === "warn" ? "var(--sot-warn)"
    : tone === "alert" ? "var(--sot-alert)"
    : "var(--sot-fg-2)";
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 4,
      padding: "12px 16px",
      background: "var(--sot-ink)",
      border: "1px solid var(--sot-line-strong)",
      minWidth: 130,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name={icon} size={12} color="var(--sot-fg-3)" />
        <span className="sot-tag" style={{ fontSize: 10, color: "var(--sot-fg-3)" }}>{label}</span>
      </div>
      <span style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "var(--sot-font-mono)", lineHeight: 1 }}>
        {value}
      </span>
    </div>
  );
}

/* ---------- Performance bar ---------- */
function PerfBar({ value, max = 100, color = "var(--sot-verify)" }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
      <div style={{ flex: 1, height: 4, background: "var(--sot-line-strong)", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: color }} />
      </div>
      <span className="sot-mono" style={{ fontSize: 10, color: "var(--sot-fg-3)", minWidth: 28 }}>
        {pct}%
      </span>
    </div>
  );
}

/* ============================================================
   HEADER
   ============================================================ */
function PageHeader() {
  return (
    <header style={{
      height: 64,
      background: "var(--sot-surface-1)",
      borderBottom: "1px solid var(--sot-line)",
      display: "flex", alignItems: "center",
      padding: "0 var(--sot-s-6)", gap: "var(--sot-s-5)",
      position: "sticky", top: 0, zIndex: 10,
    }}>
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sot-s-3)", flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32,
          border: "1px solid var(--sot-line-strong)", background: "var(--sot-ink)",
          display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
        }}>
          <Icon name="audio-waveform" size={18} color="var(--sot-fg-1)" />
          <span style={{ position: "absolute", top: -1, right: -1, width: 6, height: 6, background: "var(--sot-construction)" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
          <span style={{ fontFamily: "var(--sot-font-sans)", fontWeight: 800, fontSize: 15, letterSpacing: "-0.01em", color: "var(--sot-fg-1)" }}>
            Voice AI Agent
          </span>
          <span className="sot-tag" style={{ fontSize: 10 }}>CONSOLE · v2.4</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", gap: 4, marginLeft: 20 }}>
        {[
          { label: "DASHBOARD",    href: "/" },
          { label: "CALL_HISTORY", href: "/calls" },
          { label: "LEADS",        href: "/leads" },
          { label: "AGENTS",       href: "/agents", active: true },
          { label: "ANALYTICS",    href: "/analytics" },
          { label: "SETTINGS",     href: "/settings" },
        ].map((l) =>
          l.active ? (
            <span key={l.label} className="sot-tag" style={{
              padding: "8px 12px", fontSize: 11,
              color: "var(--sot-fg-1)", background: "var(--sot-ink)",
              border: "1px solid var(--sot-line-strong)", fontWeight: 600,
            }}>{l.label}</span>
          ) : (
            <a key={l.label} href={l.href} className="sot-tag" style={{
              padding: "8px 12px", fontSize: 11,
              color: "var(--sot-fg-3)", textDecoration: "none",
            }}>{l.label}</a>
          )
        )}
      </nav>

      <span style={{ flex: 1 }} />

      {/* User */}
      <button className="sot-btn ghost" style={{ height: 36 }}>
        <Icon name="bell" size={13} />
      </button>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "4px 10px 4px 4px",
        border: "1px solid var(--sot-line-strong)", background: "var(--sot-surface-2)",
      }}>
        <div style={{
          width: 28, height: 28, background: "var(--sot-surface-3)",
          border: "1px solid var(--sot-line-strong)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--sot-font-mono)", fontSize: 11, color: "var(--sot-fg-1)", fontWeight: 600,
        }}>MJ</div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
          <span style={{ fontSize: 12, color: "var(--sot-fg-1)", fontWeight: 600 }}>M. Johnston</span>
          <span className="sot-tag" style={{ fontSize: 9 }}>OPERATOR</span>
        </div>
      </div>
    </header>
  );
}

/* ============================================================
   AGENT FORM (create / edit)
   ============================================================ */
const DEFAULT_FORM = {
  name: "",
  description: "",
  status: "draft",
  llm_model: "llama-3.3-70b-versatile",
  temperature: 0.7,
  max_tokens: 500,
  system_prompt: "You are a professional sales AI agent handling inbound calls. Your job is to qualify leads, extract key information, and determine caller intent. Be professional, friendly, and concise.",
  voice_id: "",
  assigned_phone_number: "",
};

const MODELS = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", note: "Best quality" },
  { id: "llama-3.1-8b-instant",    label: "Llama 3.1 8B",  note: "Fastest" },
  { id: "mixtral-8x7b-32768",      label: "Mixtral 8x7B",  note: "Long context" },
  { id: "gemma2-9b-it",            label: "Gemma 2 9B",    note: "Efficient" },
];

function AgentForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || DEFAULT_FORM);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Name + Status */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label className="sot-tag" style={{ fontSize: 10, color: "var(--sot-fg-3)" }}>AGENT_NAME *</label>
          <input
            className="sot-field"
            required
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="e.g. Aria — Inbound Sales"
            style={{ padding: "10px 12px", fontSize: 13 }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label className="sot-tag" style={{ fontSize: 10, color: "var(--sot-fg-3)" }}>STATUS</label>
          <select
            className="sot-field"
            value={form.status}
            onChange={(e) => set({ status: e.target.value })}
            style={{ padding: "10px 12px", fontSize: 13, minWidth: 120 }}
          >
            <option value="draft">DRAFT</option>
            <option value="active">ACTIVE</option>
            <option value="inactive">INACTIVE</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label className="sot-tag" style={{ fontSize: 10, color: "var(--sot-fg-3)" }}>DESCRIPTION</label>
        <input
          className="sot-field"
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="Brief description of this agent's role"
          style={{ padding: "10px 12px", fontSize: 13 }}
        />
      </div>

      {/* LLM Model */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label className="sot-tag" style={{ fontSize: 10, color: "var(--sot-fg-3)" }}>LLM_MODEL</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {MODELS.map((m) => {
            const active = form.llm_model === m.id;
            return (
              <button key={m.id} type="button" onClick={() => set({ llm_model: m.id })} style={{
                padding: "10px 12px", textAlign: "left",
                background: active ? "var(--sot-ink)" : "transparent",
                border: `1px solid ${active ? "var(--sot-verify)" : "var(--sot-line-strong)"}`,
                color: "var(--sot-fg-1)", cursor: "pointer",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <Icon name={active ? "circle-dot" : "circle"} size={12}
                    color={active ? "var(--sot-verify)" : "var(--sot-fg-4)"} />
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{m.label}</span>
                </div>
                <span style={{ fontSize: 10, color: "var(--sot-fg-3)", fontFamily: "var(--sot-font-mono)" }}>{m.note}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Temperature + Max Tokens */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label className="sot-tag" style={{ fontSize: 10, color: "var(--sot-fg-3)" }}>
            TEMPERATURE <span style={{ color: "var(--sot-fg-2)" }}>{form.temperature.toFixed(2)}</span>
          </label>
          <input type="range" min={0} max={1} step={0.05}
            value={form.temperature}
            onChange={(e) => set({ temperature: Number(e.target.value) })}
            style={{ width: "100%", accentColor: "var(--sot-verify)" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--sot-fg-4)", fontFamily: "var(--sot-font-mono)" }}>
            <span>0.0 · PRECISE</span><span>1.0 · CREATIVE</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label className="sot-tag" style={{ fontSize: 10, color: "var(--sot-fg-3)" }}>MAX_TOKENS</label>
          <input type="number" className="sot-field" min={50} max={8000} step={50}
            value={form.max_tokens}
            onChange={(e) => set({ max_tokens: Number(e.target.value) })}
            style={{ padding: "10px 12px", fontSize: 13 }}
          />
        </div>
      </div>

      {/* Phone + Voice */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label className="sot-tag" style={{ fontSize: 10, color: "var(--sot-fg-3)" }}>ASSIGNED_PHONE</label>
          <input className="sot-field"
            value={form.assigned_phone_number}
            onChange={(e) => set({ assigned_phone_number: e.target.value })}
            placeholder="+15551234567"
            style={{ padding: "10px 12px", fontSize: 13 }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label className="sot-tag" style={{ fontSize: 10, color: "var(--sot-fg-3)" }}>VOICE_ID</label>
          <input className="sot-field"
            value={form.voice_id}
            onChange={(e) => set({ voice_id: e.target.value })}
            placeholder="e.g. aria-en-us"
            style={{ padding: "10px 12px", fontSize: 13 }}
          />
        </div>
      </div>

      {/* System prompt */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label className="sot-tag" style={{ fontSize: 10, color: "var(--sot-fg-3)" }}>
          SYSTEM_PROMPT <span style={{ color: "var(--sot-fg-4)" }}>{form.system_prompt.length} CHARS</span>
        </label>
        <textarea className="sot-field"
          value={form.system_prompt}
          onChange={(e) => set({ system_prompt: e.target.value })}
          rows={6}
          style={{ padding: "12px", fontSize: 12, fontFamily: "var(--sot-font-mono)", lineHeight: 1.6, resize: "vertical" }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid var(--sot-line)" }}>
        <button type="button" className="sot-btn ghost" style={{ height: 36 }} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="sot-btn primary" style={{ height: 36 }} disabled={saving}>
          <Icon name={saving ? "loader" : "check"} size={13}
            style={saving ? { animation: "sotSpin 1s linear infinite" } : undefined} />
          {saving ? "Saving…" : (initial ? "Save Changes" : "Create Agent")}
        </button>
      </div>
    </form>
  );
}

/* ============================================================
   AGENT CARD
   ============================================================ */
function AgentCard({ agent, onEdit, onDelete, onToggle, toggling }) {
  const callsMax = 500;
  const leadsMax = 200;

  return (
    <div style={{
      background: "var(--sot-surface-1)",
      border: "1px solid var(--sot-line-strong)",
      display: "flex", flexDirection: "column",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Active indicator strip */}
      {agent.status === "active" && (
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "var(--sot-verify)" }} />
      )}

      {/* Header row */}
      <div style={{ padding: "16px 16px 12px 20px", borderBottom: "1px solid var(--sot-line)", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 36, height: 36, flex: "none",
          background: "var(--sot-ink)", border: "1px solid var(--sot-line-strong)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="bot" size={18} color={agent.status === "active" ? "var(--sot-verify)" : "var(--sot-fg-3)"} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--sot-fg-1)", fontFamily: "var(--sot-font-sans)" }}>
              {agent.name}
            </span>
            <StatusBadge status={agent.status} />
          </div>
          {agent.description && (
            <p style={{ fontSize: 12, color: "var(--sot-fg-3)", margin: 0, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {agent.description}
            </p>
          )}
        </div>
      </div>

      {/* Config tags */}
      <div style={{ padding: "10px 16px 10px 20px", display: "flex", flexWrap: "wrap", gap: 6, borderBottom: "1px solid var(--sot-line)" }}>
        <Tag label="MODEL" value={agent.llm_model.split("-").slice(0, 3).join("-")} />
        <Tag label="TEMP" value={agent.temperature.toFixed(1)} />
        <Tag label="TOKENS" value={agent.max_tokens} />
        {agent.assigned_phone_number && <Tag label="PHONE" value={agent.assigned_phone_number} tone="verify" />}
        {agent.voice_id && <Tag label="VOICE" value={agent.voice_id} />}
      </div>

      {/* Performance stats */}
      <div style={{ padding: "12px 16px 12px 20px", display: "flex", flexDirection: "column", gap: 10, borderBottom: "1px solid var(--sot-line)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <div>
            <div className="sot-tag" style={{ fontSize: 9, color: "var(--sot-fg-4)", marginBottom: 3 }}>CALLS</div>
            <span style={{ fontSize: 18, fontWeight: 800, color: "var(--sot-fg-1)", fontFamily: "var(--sot-font-mono)" }}>
              {agent.total_calls.toLocaleString()}
            </span>
          </div>
          <div>
            <div className="sot-tag" style={{ fontSize: 9, color: "var(--sot-fg-4)", marginBottom: 3 }}>LEADS</div>
            <span style={{ fontSize: 18, fontWeight: 800, color: "var(--sot-verify)", fontFamily: "var(--sot-font-mono)" }}>
              {agent.qualified_leads.toLocaleString()}
            </span>
          </div>
          <div>
            <div className="sot-tag" style={{ fontSize: 9, color: "var(--sot-fg-4)", marginBottom: 3 }}>CONV.</div>
            <span style={{ fontSize: 18, fontWeight: 800, color: agent.conversion_rate >= 0.3 ? "var(--sot-verify)" : "var(--sot-warn)", fontFamily: "var(--sot-font-mono)" }}>
              {(agent.conversion_rate * 100).toFixed(1)}%
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="sot-tag" style={{ fontSize: 9, color: "var(--sot-fg-4)", width: 40 }}>CALLS</span>
            <PerfBar value={agent.total_calls} max={callsMax} color="var(--sot-fg-3)" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="sot-tag" style={{ fontSize: 9, color: "var(--sot-fg-4)", width: 40 }}>LEADS</span>
            <PerfBar value={agent.qualified_leads} max={leadsMax} color="var(--sot-verify)" />
          </div>
        </div>
        {agent.avg_call_duration > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="clock" size={11} color="var(--sot-fg-4)" />
            <span style={{ fontSize: 11, color: "var(--sot-fg-3)", fontFamily: "var(--sot-font-mono)" }}>
              avg {Math.floor(agent.avg_call_duration / 60)}m {Math.round(agent.avg_call_duration % 60)}s / call
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: "10px 16px 10px 20px", display: "flex", alignItems: "center", gap: 8 }}>
        <button className="sot-btn ghost" style={{ height: 32, fontSize: 12 }} onClick={() => onEdit(agent)}>
          <Icon name="pencil" size={12} /> Edit
        </button>
        {agent.status === "active" ? (
          <button className="sot-btn ghost" style={{ height: 32, fontSize: 12 }} onClick={() => onToggle(agent)} disabled={toggling === agent.id}>
            <Icon name="pause" size={12} color="var(--sot-warn)" /> Deactivate
          </button>
        ) : (
          <button className="sot-btn ghost" style={{ height: 32, fontSize: 12 }} onClick={() => onToggle(agent)} disabled={toggling === agent.id}>
            <Icon name="play" size={12} color="var(--sot-verify)" /> Activate
          </button>
        )}
        <span style={{ flex: 1 }} />
        <button className="sot-btn ghost" style={{ height: 32, fontSize: 12, color: "var(--sot-alert)" }} onClick={() => onDelete(agent)}>
          <Icon name="trash-2" size={12} color="var(--sot-alert)" />
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   EMPTY STATE
   ============================================================ */
function EmptyState({ onCreate }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "80px 40px", gap: 20,
      border: "1px dashed var(--sot-line-strong)",
      background: "var(--sot-ink)",
    }}>
      <div style={{
        width: 64, height: 64,
        border: "1px solid var(--sot-line-strong)", background: "var(--sot-surface-2)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name="bot" size={28} color="var(--sot-fg-4)" />
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--sot-fg-1)", marginBottom: 8 }}>
          No agents configured
        </div>
        <p style={{ fontSize: 13, color: "var(--sot-fg-3)", margin: 0, maxWidth: 360, lineHeight: 1.5 }}>
          Create your first AI call agent. Each agent has its own persona, voice, and LLM settings
          and handles inbound calls independently.
        </p>
      </div>
      <button className="sot-btn primary" style={{ height: 38 }} onClick={onCreate}>
        <Icon name="plus" size={14} /> Create First Agent
      </button>
    </div>
  );
}

/* ============================================================
   SLIDE-OUT PANEL
   ============================================================ */
function SlidePanel({ open, title, onClose, children }) {
  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }}
        />
      )}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: 540,
        background: "var(--sot-surface-1)",
        borderLeft: "1px solid var(--sot-line-strong)",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.2s ease",
        zIndex: 50,
        display: "flex", flexDirection: "column",
        overflowY: "auto",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid var(--sot-line)",
          position: "sticky", top: 0,
          background: "var(--sot-surface-1)",
          zIndex: 1,
        }}>
          <span className="sot-tag" style={{ fontSize: 12, color: "var(--sot-fg-1)", fontWeight: 700 }}>{title}</span>
          <button className="sot-btn ghost" style={{ height: 32, padding: "0 8px" }} onClick={onClose}>
            <Icon name="x" size={14} />
          </button>
        </div>
        <div style={{ padding: 20, flex: 1 }}>
          {children}
        </div>
      </div>
    </>
  );
}

/* ============================================================
   DELETE CONFIRM MODAL
   ============================================================ */
function DeleteModal({ agent, onConfirm, onCancel, deleting }) {
  if (!agent) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        width: 420,
        background: "var(--sot-surface-1)",
        border: "1px solid var(--sot-alert)",
        padding: 24, display: "flex", flexDirection: "column", gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="triangle-alert" size={18} color="var(--sot-alert)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--sot-fg-1)" }}>Delete Agent</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--sot-fg-2)", lineHeight: 1.5 }}>
          Permanently delete <strong style={{ color: "var(--sot-fg-1)" }}>{agent.name}</strong>?
          This cannot be undone and all performance data for this agent will be lost.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="sot-btn ghost" style={{ height: 36 }} onClick={onCancel}>Cancel</button>
          <button
            className="sot-btn"
            style={{ height: 36, background: "var(--sot-alert)", border: "1px solid var(--sot-alert)", color: "#fff" }}
            onClick={onConfirm}
            disabled={deleting}
          >
            <Icon name={deleting ? "loader" : "trash-2"} size={13}
              style={deleting ? { animation: "sotSpin 1s linear infinite" } : undefined} />
            {deleting ? "Deleting…" : "Delete Agent"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ROOT PAGE
   ============================================================ */
export default function AgentsPage() {
  const [agents, setAgents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Panel state
  const [panelOpen, setPanelOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create, obj = edit
  const [saving, setSaving]       = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  // Toggle loading
  const [toggling, setToggling]   = useState(null);

  // ── API helpers ─────────────────────────────────────────────────────────────

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = statusFilter !== "all"
        ? `${API_BASE}/agents/?status=${statusFilter}`
        : `${API_BASE}/agents/`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAgents(data.agents || []);
    } catch (err) {
      setError(err.message);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      const isEdit = !!editTarget;
      const url = isEdit ? `${API_BASE}/agents/${editTarget.id}` : `${API_BASE}/agents/`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          voice_id: form.voice_id || null,
          assigned_phone_number: form.assigned_phone_number || null,
          description: form.description || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      setPanelOpen(false);
      setEditTarget(null);
      await fetchAgents();
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/agents/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
      setDeleteTarget(null);
      await fetchAgents();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async (agent) => {
    setToggling(agent.id);
    try {
      const action = agent.status === "active" ? "deactivate" : "activate";
      const res = await fetch(`${API_BASE}/agents/${agent.id}/${action}`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchAgents();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    } finally {
      setToggling(null);
    }
  };

  // ── Derived data ─────────────────────────────────────────────────────────────

  const filtered = agents.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:    agents.length,
    active:   agents.filter((a) => a.status === "active").length,
    calls:    agents.reduce((s, a) => s + a.total_calls, 0),
    leads:    agents.reduce((s, a) => s + a.qualified_leads, 0),
  };

  const now = new Date();
  const dateLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="sot sot-grid" style={{ minHeight: "100vh" }}>
      <PageHeader />

      {/* Page banner */}
      <div style={{ padding: "12px var(--sot-s-6)", borderBottom: "1px solid var(--sot-line)", display: "flex", alignItems: "center", gap: 10 }}>
        <Tag label="AGENTS" value="MANAGER" />
        <Tag label="DATE" value={dateLabel} />
        <Tag label="TOTAL" value={stats.total} />
        {stats.active > 0 && <Tag label="ACTIVE" value={stats.active} tone="verify" />}
      </div>

      <main style={{ padding: "var(--sot-s-6)" }}>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <StatChip icon="bot"          label="TOTAL_AGENTS"  value={stats.total} />
          <StatChip icon="activity"     label="ACTIVE"        value={stats.active}  tone="verify" />
          <StatChip icon="phone-call"   label="CALLS_HANDLED" value={stats.calls.toLocaleString()} />
          <StatChip icon="user-check"   label="LEADS_QUALIFIED" value={stats.leads.toLocaleString()} tone="verify" />
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <Icon name="search" size={13} color="var(--sot-fg-4)" />
            </span>
            <input
              className="sot-field"
              placeholder="Search agents…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 32, paddingRight: 12, height: 36, width: "100%", fontSize: 13 }}
            />
          </div>
          <select
            className="sot-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ height: 36, padding: "0 12px", fontSize: 12, fontFamily: "var(--sot-font-mono)" }}
          >
            <option value="all">ALL STATUS</option>
            <option value="active">ACTIVE</option>
            <option value="inactive">INACTIVE</option>
            <option value="draft">DRAFT</option>
          </select>
          <button className="sot-btn ghost" style={{ height: 36 }} onClick={fetchAgents}>
            <Icon name="refresh-cw" size={13} />
          </button>
          <button className="sot-btn primary" style={{ height: 36 }} onClick={() => { setEditTarget(null); setPanelOpen(true); }}>
            <Icon name="plus" size={14} /> NEW_AGENT
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80, gap: 12, color: "var(--sot-fg-3)" }}>
            <Icon name="loader" size={18} style={{ animation: "sotSpin 1s linear infinite" }} />
            <span className="sot-tag" style={{ fontSize: 12 }}>LOADING AGENTS…</span>
          </div>
        ) : error ? (
          <div style={{
            padding: 24, border: "1px solid var(--sot-alert)",
            background: "var(--sot-alert-soft)",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <Icon name="triangle-alert" size={16} color="var(--sot-alert)" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--sot-fg-1)", marginBottom: 4 }}>
                Failed to load agents
              </div>
              <div style={{ fontSize: 12, color: "var(--sot-fg-3)" }}>
                {error} — is the backend running on port 8000?
              </div>
            </div>
            <button className="sot-btn ghost" style={{ height: 32, marginLeft: "auto" }} onClick={fetchAgents}>
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          agents.length === 0
            ? <EmptyState onCreate={() => { setEditTarget(null); setPanelOpen(true); }} />
            : (
              <div style={{ textAlign: "center", padding: 60, color: "var(--sot-fg-3)" }}>
                <Icon name="search-x" size={24} style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 13 }}>No agents match your search.</div>
              </div>
            )
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 16 }}>
            {filtered.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                toggling={toggling}
                onEdit={(a) => { setEditTarget(a); setPanelOpen(true); }}
                onDelete={(a) => setDeleteTarget(a)}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create / Edit panel */}
      <SlidePanel
        open={panelOpen}
        title={editTarget ? `EDIT_AGENT · ${editTarget.name.toUpperCase()}` : "NEW_AGENT"}
        onClose={() => { setPanelOpen(false); setEditTarget(null); }}
      >
        <AgentForm
          initial={editTarget}
          onSave={handleSave}
          onCancel={() => { setPanelOpen(false); setEditTarget(null); }}
          saving={saving}
        />
      </SlidePanel>

      {/* Delete confirm */}
      <DeleteModal
        agent={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        deleting={deleting}
      />
    </div>
  );
}
