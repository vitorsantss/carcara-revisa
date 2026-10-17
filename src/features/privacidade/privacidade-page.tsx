import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SECOES: Array<{ id: string; titulo: string; itens: string[] }> = [
  {
    id: "quem-ve",
    titulo: "Quem vê sua redação",
    itens: [
      "Só você e o seu professor veem a foto, o texto e a correção.",
      "A coordenação da escola vê números gerais da turma, sem o seu texto.",
      "A equipe do Carcará Revisa não lê redações de alunos.",
    ],
  },
  {
    id: "o-que-fazemos",
    titulo: "O que fazemos com sua foto e seu texto",
    itens: [
      "A foto é usada só para ler o seu texto. Você confere a leitura antes de enviar.",
      "Linhas com nome, assinatura, e-mail ou telefone são apontadas antes do envio para você remover.",
      "Sua redação não é usada para treinar modelos de inteligência artificial.",
      "O que o sistema aprende com as decisões do professor vira regra geral, sem nenhum trecho do seu texto.",
    ],
  },
  {
    id: "guarda",
    titulo: "Por quanto tempo guardamos",
    itens: [
      "Nesta versão de demonstração, nada sai do seu aparelho: as redações ficam só nesta aba e somem quando ela é fechada.",
      "Na versão para escolas, o prazo de guarda e a exclusão a pedido seguem as regras definidas pela escola e a LGPD.",
    ],
  },
  {
    id: "ia",
    titulo: "Pode usar inteligência artificial?",
    itens: [
      "Pode usar IA para estudar: entender o tema, buscar repertório e revisar o que você já escreveu.",
      "A redação precisa ser escrita por você. No Enem não há IA, e é isso que você está treinando.",
      "A plataforma não acusa ninguém de usar IA. Quem avalia é o seu professor, que conhece a sua escrita.",
      "A correção automática só faz a primeira leitura. A nota que vale é sempre a do professor.",
    ],
  },
  {
    id: "menores",
    titulo: "Menores de 18 anos",
    itens: [
      "Quem tem menos de 18 anos precisa do consentimento de um responsável. Na versão para escolas, isso entra no cadastro da turma, e você pode começar a usar e completar depois.",
    ],
  },
];

export function PrivacidadePage() {
  return (
    <div className="mx-auto grid max-w-2xl gap-4" data-testid="privacidade-page">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight">Privacidade e uso de IA</h2>
        <p className="text-sm text-muted-foreground">O que acontece com a sua redação, em poucas linhas.</p>
      </div>
      {SECOES.map((s) => (
        <Card key={s.id} data-testid={`privacidade-${s.id}`}>
          <CardHeader><CardTitle>{s.titulo}</CardTitle></CardHeader>
          <CardContent>
            <ul className="grid list-disc gap-1.5 pl-5 text-sm">
              {s.itens.map((i) => <li key={i}>{i}</li>)}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
