# Impacto Orçamento

Aplicação web para gestão comercial, precificação, materiais e geração de PDF para móveis planejados.

## Visão geral

Este projeto é uma primeira versão funcional de um sistema para:
- cadastrar clientes
- criar orçamentos
- calcular área e preço por metro quadrado
- registrar materiais e composições
- simular preços, descontos e taxas
- gerar PDF comercial
- aprovar propostas e acompanhar histórico

## Stack escolhida

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Persistência: SQLite local com armazenamento persistente em arquivo
- PDF: PDFKit
- Testes: Vitest

A escolha do SQLite como banco local permite persistência confiável sem depender de um serviço externo no início, mantendo a arquitetura pronta para evoluir para PostgreSQL ou outra solução em produção.

## Estrutura proposta

- src/core: regras puras de negócio e cálculos
- src/features: módulos funcionais do sistema
- src/db: acesso ao banco e persistência
- client: interface web
- server: API e geração de PDF
- tests: testes de regra de negócio

## Requisitos

- Node.js 20+
- npm 10+

## Instalação

1. Clone o repositório.
2. Instale as dependências:

```bash
npm install
```

3. Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

## Executar em desenvolvimento

```bash
npm run dev
```

A API ficará em `http://localhost:3001` e o painel em `http://localhost:5173`.

## Build para produção

```bash
npm run build
```

## Testes

```bash
npm test
```

## Publicar no GitHub

1. `git init` (se ainda não tiver)
2. `git add .`
3. `git commit -m "Primeira versão funcional"`
4. `git branch -M main`
5. `git remote add origin <url-do-repositorio>`
6. `git push -u origin main`

## Hospedagem

Para internet, a melhor evolução é:
- frontend em Vercel ou Netlify
- backend/API em Render, Railway ou VPS
- banco SQLite em ambiente dedicado somente para prototipagem

Para produção comercial, aconselha-se migrar para PostgreSQL com ambiente gerenciado.

## Regras de cálculo principais

- Área = largura × altura
- Preço de venda = área × preço por m² × quantidade
- Embarque de materiais = arredondamento para cima da quantidade necessária pelo conteúdo da embalagem
- Desconto e margem devem ser calculados separadamente
- Taxa de cartão: valor bruto = valor líquido ÷ (1 - taxa percentual)

## Observações

Esta é a primeira versão funcional e prioriza o fluxo principal do sistema, com cálculos confiáveis, persistência local e PDF de proposta.
