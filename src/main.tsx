import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n';

function loadGoogleAnalytics() {
  if (window.gtag) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer?.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', 'G-QCBFGR39WG');

  const script = document.createElement('script');
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-QCBFGR39WG';
  script.async = true;
  document.head.appendChild(script);
}

window.addEventListener('load', () => {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => loadGoogleAnalytics());
  } else {
    window.setTimeout(loadGoogleAnalytics, 1);
  }
});

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
