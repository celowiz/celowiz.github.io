# Opções de favicon (design, não publicadas)

Arquivos de design. Ficam fora de `public/` e `src/`, então não entram no build do site (`dist/`).
Estilo: quadrado 64×64 arredondado (#0b0d10, borda #2a2f36), cores #f4f1ea, teal #2dd4bf e cinza #71717a, igual aos favicons do portfólio (mw) e do Monitor B3.
`options.png` compara cada opção em 128px e em 32/16px em abas escuras e claras. `gen.py` gera os SVGs e o PNG.

## quant-notebooks/
- A: livro aberto com linha de preço
- B: caderno espiral com gráfico
- C: livro fechado com candles na capa
- D: monograma "qn"
- E: livro aberto em teal sólido
- F: página de notebook (células)

## rrg/
- A: quadrantes com rastro curvo e seta
- B: quadrantes coloridos (4 tons)
- C: setas circulares de rotação
- D: ponto com rastro esmaecendo
- E: órbita em espiral
- F: monograma "rrg"

## hmm-regimes/
- A: barras nas cores dos regimes (estresse, intermediário, calmo) (temporária no app, substituída pela D)
- B: linha de preço colorida por regime
- C: três estados ligados (cadeia de Markov)
- D: faixas de probabilidade empilhadas (escolhida)
- E: onda com volatilidade crescente
- F: monograma "H"

## pairs-trading/
- A: duas linhas entrelaçadas que se cruzam (teal e creme)
- B: spread oscilando entre bandas ±2σ tracejadas
- C: duas setas opostas convergindo para a média
- D: dois pontos ligados por um elástico (mola)
- E: monograma "PT" (P creme, T teal)
- F: z-score — ponto fora da banda voltando à média

## Escolhas (2026-10-16)
- quant-notebooks: **opção A** (livro aberto com linha de preço)
- rrg: **opção C** (setas circulares de rotação)
- hmm-regimes: **opção D** (faixas de probabilidade empilhadas)
