"""Séries oficiais do Banco Central (SGS) para a página Mercado Hoje, via python-bcb.

Grava .cache/bcb-sgs.json, que scripts/sync-mercado-hoje.mjs junta em public/mercado-hoje.json
como o bloco "bcb". Cada série leva a própria data. Se uma série falhar, ela fica de fora deste
arquivo e o script Node mantém o último valor válido publicado (fallback por série).
Nunca derruba o deploy: em erro geral, grava o que tiver e sai com 0.

Séries (códigos do SGS, conferidos no catálogo do BCB):
  432   Taxa de juros - Meta Selic definida pelo Copom (% a.a., diária)
  4389  Taxa de juros - CDI anualizada base 252 (% a.a., diária)
  13522 IPCA - variação acumulada em 12 meses (%, mensal; data = mês de referência)
  1     Taxa de câmbio - Livre - Dólar americano (venda) - diário: PTAX venda (R$/US$)
Uso: python scripts/fetch_bcb.py [.cache/bcb-sgs.json]
"""
import datetime as dt, json, os, sys

SCHEMA = 1
SERIES = {"selic": 432, "cdi": 4389, "ipca12": 13522, "ptax": 1}
SGS_URL = "https://www3.bcb.gov.br/sgspub/"


def today_brt(now=None):
    now = now or dt.datetime.now(dt.timezone.utc)
    return (now - dt.timedelta(hours=3)).date()


def clean(points, today):
    """[(date, value)] ordenado, sem nulos e sem datas futuras (a série 432 vem com dias à frente)."""
    out = sorted((d, float(v)) for d, v in points if v is not None and v == v and d <= today)
    return out


def summarize(key, points):
    """Último valor e, conforme a série, a data de início do valor atual ou a variação do dia."""
    if not points:
        return None
    d, v = points[-1]
    item = {"code": SERIES[key], "value": round(v, 4), "date": d.isoformat()}
    if key == "selic":
        since = d
        for pd_, pv in reversed(points):
            if abs(pv - v) > 1e-9:
                break
            since = pd_
        # só afirma "desde" se a janela baixada começa antes da mudança
        item["since"] = since.isoformat() if since > points[0][0] else None
    if key == "ptax" and len(points) >= 2:
        pd_, pv = points[-2]
        item.update(prev=round(pv, 4), prev_date=pd_.isoformat(), chg=round(v / pv - 1, 5))
    return item


def build(raw, now=None):
    today = today_brt(now)
    series = {}
    for k, pts in raw.items():
        s = summarize(k, clean(pts, today))
        if s:
            series[k] = s
    daily = [s["date"] for k, s in series.items() if k != "ipca12"]
    return {"schema": SCHEMA, "project": "bcb-sgs", "url": SGS_URL, "source": "Banco Central do Brasil (SGS) via python-bcb",
            "as_of": max(daily) if daily else (series.get("ipca12") or {}).get("date"),
            "generated_at": (now or dt.datetime.now(dt.timezone.utc)).strftime("%Y-%m-%dT%H:%M:%SZ"), "series": series}


def fetch(now=None):
    from bcb import sgs  # importado aqui para os testes rodarem sem a dependência
    today = today_brt(now)
    starts = {"selic": today - dt.timedelta(days=730), "cdi": today - dt.timedelta(days=20),
              "ipca12": today - dt.timedelta(days=200), "ptax": today - dt.timedelta(days=20)}
    raw, errors = {}, []
    for k, code in SERIES.items():
        try:
            df = sgs.get({k: code}, start=starts[k].isoformat())
            raw[k] = [(ix.date(), row) for ix, row in df[k].items()]
        except Exception as e:  # noqa: BLE001 - uma série fora não derruba as outras
            errors.append(f"{k} ({code}): {type(e).__name__}: {e}")
    return raw, errors


def main(out):
    raw, errors = fetch()
    payload = build(raw)
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    json.dump(payload, open(out, "w"), ensure_ascii=False, separators=(",", ":"))
    for e in errors:
        print(f"::warning title=fetch_bcb::{e}")
    print(f"{out}: " + ", ".join(f"{k}={v['value']} ({v['date']})" for k, v in payload["series"].items()))


if __name__ == "__main__":
    try:
        main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", ".cache", "bcb-sgs.json"))
    except Exception as e:  # noqa: BLE001
        print(f"::warning title=fetch_bcb::falhou ({type(e).__name__}: {e}); o Mercado Hoje mantém os últimos valores válidos")
