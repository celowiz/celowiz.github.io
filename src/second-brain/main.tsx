import React from 'react';
import ReactDOM from 'react-dom/client';
import '../index.css';
import '../i18n';
import { scheduleGtagScriptLoad } from '../lib/analytics.mjs';
import SecondBrainPage from './SecondBrainPage';

scheduleGtagScriptLoad();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SecondBrainPage />
  </React.StrictMode>,
);
