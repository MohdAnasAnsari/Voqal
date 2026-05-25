/**
 * Voqal API service layer
 *
 * Single Axios instance wired to the backend.
 * Every exported function is async, returns the response data directly,
 * and throws a normalised ApiError on failure.
 *
 * Usage:
 *   import { getActiveCalls, getDashboardMetrics } from '../services/api';
 *   const calls = await getActiveCalls();
 */

import axios from 'axios';

// ── Config ────────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TIMEOUT  = Number(import.meta.env.VITE_API_TIMEOUT) || 10_000;

// ── Axios instance ────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach auth token if present ────────────────────────

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('voqal_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor — normalise errors ───────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error_message ||
      error.response?.data?.detail ||
      error.message ||
      'Unknown error';
    const code =
      error.response?.data?.error_code ||
      `HTTP_${error.response?.status || 'NETWORK'}`;

    console.error(`[API] ${code}: ${message}`);
    return Promise.reject({ code, message, status: error.response?.status });
  }
);

// ── Cancellable request helper ────────────────────────────────────────────────

/**
 * Returns { promise, cancel }.
 * Call cancel() to abort the in-flight request without triggering an error.
 */
export function cancellable(requestFn) {
  const controller = new AbortController();
  const promise = requestFn(controller.signal);
  return { promise, cancel: () => controller.abort() };
}

// ══════════════════════════════════════════════════════════════════════════════
// CALLS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Paginated call history with optional filters.
 * @param {number} limit
 * @param {number} offset
 * @param {Object} filters  date_from, date_to, quality_score_min, intent, status
 */
export async function getCallHistory(limit = 20, offset = 0, filters = {}) {
  const params = { limit, offset, ...filters };
  const res = await api.get('/calls/history', { params });
  return res.data;
}

/**
 * Full detail for a single call.
 * @param {string} callId
 */
export async function getCallDetails(callId) {
  const res = await api.get(`/calls/${callId}`);
  return res.data;
}

/**
 * All calls currently in progress.
 */
export async function getActiveCalls() {
  const res = await api.get('/calls/active');
  return res.data;
}

/**
 * Partially update a call record.
 * @param {string} callId
 * @param {Object} data  { call_status, notes, tags, agent_transferred_to }
 */
export async function updateCall(callId, data) {
  const res = await api.patch(`/calls/${callId}`, data);
  return res.data;
}

/**
 * Finalise a completed call and trigger the AI pipeline.
 * @param {string} callId
 * @param {{ duration: number, final_transcript: string, recording_url?: string }} data
 */
export async function endCall(callId, data) {
  const res = await api.post(`/calls/${callId}/end`, data);
  return res.data;
}

// ══════════════════════════════════════════════════════════════════════════════
// LEADS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Paginated lead list with optional filters.
 * @param {Object} filters  status, quality_score_min, search, limit, offset
 */
export async function getLeads(filters = {}) {
  const { limit = 20, offset = 0, ...rest } = filters;
  const res = await api.get('/leads', { params: { limit, offset, ...rest } });
  return res.data;
}

/**
 * Full detail for a single lead.
 * @param {string} leadId
 */
export async function getLeadDetails(leadId) {
  const res = await api.get(`/leads/${leadId}`);
  return res.data;
}

/**
 * Create or update a lead from a call result.
 * @param {string} callId
 * @param {Object} leadData
 */
export async function qualifyLead(callId, leadData) {
  const res = await api.post('/leads/qualify', { call_id: callId, ...leadData });
  return res.data;
}

/**
 * Update a lead's status, assignment, notes, or tags.
 * @param {string} leadId
 * @param {Object} data  { status, assigned_to, notes, tags }
 */
export async function updateLead(leadId, data) {
  const res = await api.put(`/leads/${leadId}`, data);
  return res.data;
}

/**
 * All leads above the qualification threshold, sorted by last contact.
 * @param {number} limit
 * @param {number} offset
 */
export async function getQualifiedLeads(limit = 50, offset = 0) {
  const res = await api.get('/leads/qualified', { params: { limit, offset } });
  return res.data;
}

// ══════════════════════════════════════════════════════════════════════════════
// CRM
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Connection status for all configured CRM integrations.
 * @param {string} [crmType]  Optional filter to a single CRM
 */
export async function getCRMStatus(crmType) {
  const params = crmType ? { crm_type: crmType } : {};
  const res = await api.get('/crm/status', { params });
  return res.data;
}

/**
 * Save or replace a CRM integration configuration.
 * @param {{ crm_type: string, api_key: string, webhook_url?: string, auto_sync_enabled?: boolean }} config
 */
export async function setCRMConfig(config) {
  const res = await api.post('/crm/config', config);
  return res.data;
}

/**
 * Manually push a lead to the CRM.
 * @param {string} leadId
 * @param {string} [crmType='hubspot']
 * @param {boolean} [force=false]
 */
export async function syncLead(leadId, crmType = 'hubspot', force = false) {
  const res = await api.post(`/crm/sync/${leadId}`, null, {
    params: { crm_type: crmType, force },
  });
  return res.data;
}

// ══════════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Live dashboard metrics: today's counts, 7-day trends, sparkline data.
 */
export async function getDashboardMetrics() {
  const res = await api.get('/analytics/dashboard');
  return res.data;
}

/**
 * Detailed analytics report for an arbitrary date range.
 * @param {string} dateFrom  YYYY-MM-DD
 * @param {string} dateTo    YYYY-MM-DD
 */
export async function getReport(dateFrom, dateTo) {
  const res = await api.get('/analytics/report', {
    params: { date_from: dateFrom, date_to: dateTo },
  });
  return res.data;
}

/**
 * Per-day call summaries for the last N days.
 * @param {number} days
 */
export async function getDailySummary(days = 30) {
  const res = await api.get('/analytics/daily', { params: { days } });
  return res.data;
}

/**
 * Top intent labels by frequency.
 * @param {number} limit
 * @param {number} days
 */
export async function getTopIntents(limit = 10, days = 30) {
  const res = await api.get('/analytics/top-intents', { params: { limit, days } });
  return res.data;
}

/**
 * Lead funnel stage counts.
 */
export async function getLeadFunnel() {
  const res = await api.get('/analytics/lead-funnel');
  return res.data;
}

export default api;
