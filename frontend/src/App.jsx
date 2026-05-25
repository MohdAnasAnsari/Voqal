import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const CallHistory = lazy(() => import('./pages/CallHistory.jsx'));
const LeadsManagement = lazy(() => import('./pages/LeadsManagement.jsx'));
const LeadDetails = lazy(() => import('./pages/LeadDetails.jsx'));
const Analytics = lazy(() => import('./pages/Analytics.jsx'));
const CRMSettings = lazy(() => import('./pages/CRMSettings.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const Agents = lazy(() => import('./pages/Agents.jsx'));

function Loading() {
  return (
    <div style={{ padding: 16, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' }}>
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />

          <Route path="/calls" element={<CallHistory />} />

          <Route path="/leads" element={<LeadsManagement />} />
          <Route path="/leads/:leadId" element={<LeadDetails />} />

          <Route path="/analytics" element={<Analytics />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/crm" element={<CRMSettings />} />
          <Route path="/settings" element={<Settings />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

