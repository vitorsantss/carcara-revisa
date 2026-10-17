# SPEC-006: Privacidade e uso de IA

- Status: Implementada (texto provisório, a validar com a escola)
- Rota: `/#/aluno/privacidade`
- Papel: aluno

## Objetivo

O aluno descobre em poucos segundos quem vê a redação, o que é feito com a foto e o texto, por quanto tempo ficam guardados e o que pode ou não fazer com IA.

## Regras

1. Acesso pelo menu do aluno ("Privacidade e uso de IA") e pelo link "Saiba mais" no rodapé do envio.
2. Seções curtas, em linguagem simples: quem vê, o que fazemos, por quanto tempo, uso de IA e menores de 18 anos.
3. O texto não promete o que o produto não faz. Nesta versão, os dados ficam só na aba aberta.

## Critérios de aceite

- Dado o link do rodapé do envio, então a página abre com as seções de IA e de quem vê. → `05` "política de privacidade e de uso de IA"

## data-testid principais

`privacidade-page`, `privacidade-<secao>`, `nav-aluno-privacidade`, `envio-link-privacidade`.

## Fora do escopo

Termo de consentimento do responsável, exclusão a pedido, prazo de guarda configurável.
