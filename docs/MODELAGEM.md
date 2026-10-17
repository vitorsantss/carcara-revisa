# Modelagem de dados

```mermaid
erDiagram
  INSTITUICAO ||--o{ TURMA : possui
  INSTITUICAO ||--o{ PROFESSOR : emprega
  TURMA ||--o{ ALUNO : matricula
  PROFESSOR }o--o{ TURMA : leciona
  PROPOSTA }o--o{ TURMA : "atribuída a"
  ALUNO ||--o{ REDACAO : escreve
  PROPOSTA ||--o{ REDACAO : recebe
  REDACAO ||--o{ MARCACAO : contem
  PROFESSOR ||--o{ CALIBRAGEM : acumula
  PROFESSOR ||--o{ REGRA_APRENDIDA : gera

  INSTITUICAO { string id string nome string cidade }
  TURMA { string id string nome int anoLetivo string instituicaoId }
  PROFESSOR { string id string nome string email string instituicaoId }
  ALUNO { string id string nome string turmaId date consentimentoResponsavel }
  PROPOSTA { string id string tema date prazo }
  REDACAO {
    string id string alunoId string propostaId text texto int versao
    enum etapa "enviada | em_revisao | devolvida"
    string motivoZero json avaliacaoAutomatica json notasProfessor int duvidasDeTranscricao
  }
  MARCACAO {
    string id int competencia "1..5" enum tipo "acerto | atencao | erro"
    int inicio int fim string comentario string sugestao float confianca
    enum origem "automatica | professor"
    enum status "pendente | pre_aprovada | aprovada | editada | recusada"
  }
  CALIBRAGEM { string professorId int competencia enum tipo int casos float concordancia }
  REGRA_APRENDIDA { string id string professorId int competencia string motivo string regra }
```

## Regras principais

| Regra | Onde |
| --- | --- |
| Marcação automática chega pré-aprovada com ≥ 30 casos, ≥ 95% de concordância e confiança ≥ 0,8 | `domain/regras.ts › preAprovada` |
| Aprovar soma 1, editar soma 0,5, recusar soma 0 na concordância | `store/app-store.tsx › decidir` |
| Trecho citado que não existe no texto é descartado | `domain/regras.ts › localizarTrechos` |
| Aluno só vê marcações aprovadas, editadas, pré-aprovadas ou do professor | `domain/regras.ts › visivelParaAluno` |
| Devolver exige zero pendências automáticas | `features/revisao/revisao.tsx` |
| Discrepância com o limite do Inep: 80 por competência, 100 no total | `domain/regras.ts › LIMITE_INEP` |
| Texto com até 7 linhas recebe nota zero | `domain/regras.ts › checagens` |

## Próximos passos de backend

- `POST /api/redacoes` (upload da imagem) → fila de OCR → `ResultadoTranscricao`
- `POST /api/redacoes/:id/correcao` → `ResultadoCorrecao`
- `PATCH /api/marcacoes/:id` (decisão do professor) → atualiza `CALIBRAGEM`
- Multi-tenant por `instituicaoId`, com perfis aluno, professor e coordenação
