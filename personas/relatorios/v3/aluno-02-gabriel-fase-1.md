# Gabriel Martins, fase 1

## Em uma frase
"Envia em menos de um segundo, diz quando volta e pega cópia de motivador e nome no rodapé antes de mandar. Só não percebeu que eu mandei o mesmo texto duas vezes."

## O que funcionou
- M1: a foto foi lida em 0,8 s e só três palavras pediram confirmação. Do toque em "Enviar para correção" à confirmação foram 0,6 s, e a confirmação diz o que vem a seguir e quando ("Previsão de devolutiva: até 20/10, 3 dias combinados pela turma").
- M3 e M5: frases copiadas dos motivadores e meu nome no rodapé apareceram antes do envio, com a regra do Enem explicada e o botão "Remover a linha". Depois do envio, a tela mostrou "Pontos que o professor vai conferir".
- M6: achei a política de dados em 2 toques. Diz quem vê, que não treina modelo e qual é a regra sobre IA: pode usar para estudar, a redação tem que ser sua, e a plataforma não acusa ninguém.

## O que travou
- **A-001 (sev. 3)**: minha proposta de intervenção, com agente e meio escritos por mim, foi listada inteira como "igual" ao motivador só porque termina com o trecho dele. Na fase 3 essa frase entrou na conta do zero.

## O que eu não entendi
- Por que reenviar o mesmo texto não gera aviso nenhum (A-002). Em "Minhas redações" ficaram dois itens idênticos, mesma hora, mesmo começo.
- "Por quanto tempo guardamos": a resposta é "segue as regras da escola". Isso não é prazo (A-004).
- Mandei um texto com cara de IA e não houve nenhum sinal. A regra sobre IA só aparece na página de privacidade, não no envio (A-003).

## Eu voltaria a usar?
Sim. É o envio mais rápido e mais transparente que já testei. Mas quero ver a duplicidade e a cópia parcial tratadas direito antes de confiar no "mesmo critério para todos".

*Notas do teste:* emulação do Pixel 5 no Playwright, sem limitação de rede. O app de demonstração entra como "Helena Campos" e não há como usar meu nome. As imagens .jpg eram mockadas, e o leitor de foto ignora o conteúdo: sempre devolve o mesmo texto de exemplo (bom para M2). Por isso M3, M4 e M5 foram feitas por "Colar texto", com textos meus sobre o tema. Tempos e contagens de interação vêm do script, não de leitura humana.
