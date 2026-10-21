import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n';
import { scheduleGtagScriptLoad } from './lib/analytics.mjs';

// Links no formato de rota com hash (/#/second-brain) levam à página real.
const hashRoute = window.location.hash.match(/^#\/?second-brain\/?(.*)$/);
if (hashRoute) {
  const rest = hashRoute[1];
  window.location.replace(`/second-brain/${rest ? (rest.startsWith('?') ? rest : `#${rest}`) : ''}`);
}
// Mesmo para o Lab (/#/lab → /lab/).
const labRoute = window.location.hash.match(/^#\/?lab\/?(.*)$/);
if (labRoute) {
  const rest = labRoute[1];
  window.location.replace(`/lab/${rest ? (rest.startsWith('?') ? rest : `#${rest}`) : ''}`);
}

scheduleGtagScriptLoad();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline cache is optional; ignore registration failures.
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
