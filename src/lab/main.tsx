import React from 'react';
import ReactDOM from 'react-dom/client';
import '../index.css';
import './lab.css';
import './i18n';
import { scheduleGtagScriptLoad } from '../lib/analytics.mjs';
import LabPage from './LabPage';

scheduleGtagScriptLoad();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LabPage />
  </React.StrictMode>,
);
