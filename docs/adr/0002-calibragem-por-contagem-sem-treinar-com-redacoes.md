# ADR-0002: Calibragem por contagem, sem treinar com redações

- **Status:** Aceito
- **Data:** 2026-10-17

## Contexto

Queremos que a correção fique mais rápida com o uso, mas o case exige LGPD, proteção de menores e proíbe treinar com redações sem consentimento. Corpora públicos (Essay-BR, AES ENEM) têm textos de terceiros com uso restrito a pesquisa.

## Decisão

O sistema aprende só com **contagens**: para cada professor, competência e tipo (acerto, atenção, erro), soma casos e concordância (aprovar = 1, editar = 0,5, recusar = 0). Com 30 casos ou mais, 95% de concordância e confiança da marcação de pelo menos 0,8, o tipo chega pré-aprovado. Abaixo de 75%, o prompt da correção pede mais cautela naquele tipo. Recusas também geram regras genéricas em texto, bloqueadas se repetirem 4 palavras seguidas da redação.

## Alternativas consideradas

- Fine-tuning com redações dos alunos: risco jurídico e de privacidade; exige consentimento e volume.
- Few-shot com trechos reais das redações corrigidas: vaza texto de menores para o prompt de outros alunos.

## Consequências

- Positivas: privacidade por construção; métrica simples de explicar ("concordância por tipo"); autonomia conquistada por professor.
- Negativas: aprendizado mais lento e grosseiro que um modelo treinado; limiares (30 e 95%) ainda não validados com dados reais.
- Se revista: medir a concordância contra o conjunto de teste do Essay-BR antes de mudar os limiares.
