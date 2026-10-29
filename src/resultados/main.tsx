import React from "react";
import ReactDOM from "react-dom/client";
import i18n from "i18next";
import "../index.css";
import "../i18n";
import { scheduleGtagScriptLoad } from "../lib/analytics.mjs";
import { en, pt } from "./strings";
import ResultadosPage from "./ResultadosPage";

// Textos desta página entram só aqui (não pesam no bundle do portfólio).
i18n.addResourceBundle("pt", "translation", { resultados: pt }, true, true);
i18n.addResourceBundle("en", "translation", { resultados: en }, true, true);

scheduleGtagScriptLoad();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ResultadosPage />
  </React.StrictMode>,
);
