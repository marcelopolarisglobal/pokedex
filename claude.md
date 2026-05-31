# CLAUDE.md — Projeto Pokédex Web

Instruções e contexto permanentes deste projeto. Leia antes de qualquer alteração.

## Visão Geral
Pokédex web responsiva que consulta a [PokeAPI](https://pokeapi.co/api/v2). Enciclopédia
de Pokémon para desktop e celular: lista, busca, filtros, ficha detalhada, evoluções e
variações. O roteiro completo de construção está em `plan.md`.

## Stack
- **HTML + CSS + JavaScript puro (vanilla)**. Sem framework, sem build, sem dependências.
- Site **estático** — abre direto no navegador; hospedável em GitHub Pages / Netlify.
- Sem backend, sem banco de dados, sem chave de API (a PokeAPI é pública e somente-leitura).

## Estrutura de Pastas
```
pokedex/
├── index.html        # estrutura da página
├── css/style.css     # estilos + responsividade
├── js/api.js         # acesso à PokeAPI (fetch + cache)
├── js/ui.js          # renderização da interface
├── js/app.js         # estado, eventos, orquestração
└── assets/           # ícones, logo, imagem de fallback
```
**Regra de separação:** `api.js` só busca dados, `ui.js` só desenha na tela, `app.js`
conecta os dois e guarda o estado. Não misturar responsabilidades.

## Convenções de Código
- Boas práticas: código limpo e seguro, **sem comentários desnecessários**, sem
  funcionalidades além do que foi pedido, sem abstrações ou tratamentos de erro para
  cenários não solicitados.
- Preferir **editar arquivos existentes** a criar novos.
- Nomes de variáveis e funções em **inglês**; textos visíveis ao usuário em **português**.
- CSS **mobile-first**: estilo base para celular, `media queries` ampliam para desktop.
- Usar `async/await` para chamadas à API; `Promise.all` para chamadas paralelas.

## PokeAPI — Lembretes
- Base: `https://pokeapi.co/api/v2`
- Fazer **cache** das respostas (a API pede isso). Usar `Map` em memória e/ou `localStorage`.
- Fluxo da ficha de detalhe: `/pokemon/{id}` → `/pokemon-species/{id}` →
  `/evolution-chain/{id}`.
- Imagem em alta: `sprites.other['official-artwork'].front_default`.
- A `evolution_chain` vem **aninhada** — precisa ser achatada (flatten) em JS.
- Variações/formas ficam em `pokemon-species.varieties[]`.
- A API **não tem pt-BR**; usar `en` (ou `es`) no flavor text e traduzir os rótulos da UI.

## Como Rodar / Testar
- Abrir `index.html` no navegador, ou servir localmente:
  `python3 -m http.server 8000` e acessar `http://localhost:8000`.
- Testar **sempre** em largura de celular e de desktop (DevTools → modo responsivo).

## Comunicação (preferência do usuário)
- Responder **em português**.
- A cada etapa, explicar a **lógica técnica**: o que, por quê e como as partes se conectam.
- Usuário é profissional não técnico que quer entender a programação de verdade — não
  simplificar demais nem usar jargão sem explicar. Analogias do cotidiano são bem-vindas.

## Estado Atual
- [x] `plan.md` e `claude.md` criados.
- [x] Etapa 1 — Esqueleto: `index.html`, `css/style.css` base (mobile-first) e stubs
  dos três arquivos JS (`api.js`, `ui.js`, `app.js`).
- [x] Etapa 2 — Camada de API (`api.js`): objeto `PokeAPI` (IIFE) com `request()`
  central que faz cache em `Map`, mais funções para lista, pokémon, espécie,
  evolução, tipo, geração; helpers `getByUrl` e `idFromUrl`.
- [x] Etapa 3 — Grade principal: `ui.js` (`createCard`, `renderCards`, status) e
  `app.js` (estado de paginação, `loadPage` com `Promise.all`, botão "Carregar mais").
  CSS dos cards + cores dos 18 tipos via variável `--type-color`.
- [x] Etapa 4 — Responsividade: controles `sticky` no topo, nomes longos truncados
  (ellipsis) no card, breakpoint extra em 1100px (cards maiores). Grade fluida
  com `auto-fill`/`minmax` em 3 faixas (mobile / 600px / 1100px).
- [x] Etapa 5 — Modal de detalhe: clique no card (delegação em `grid`) abre o modal;
  `openDetail` busca `/pokemon` + `/pokemon-species` (via `species.url`).
  `UI.renderDetail` monta header colorido, flavor text (en, limpo), altura/peso,
  habilidades e stats em barras (`--type-color`). Fecha por overlay, botão e Esc.
- [x] Etapa 6 — Evoluções: `flattenEvolution` transforma a árvore aninhada em níveis
  (suporta ramificações tipo Eevee); `formatCondition` traduz a condição (Nível X,
  Troca, Amizade, Usar <item>). `loadEvolution` busca sprites em paralelo e
  `UI.renderEvolution` anexa a seção. Estágios clicáveis navegam no modal
  (delegação em `modalBody`). Mostra "não evolui" quando cadeia tem 1 nó.
- [x] Etapa 7 — Variações/formas: quando `species.varieties.length > 1`, `renderDetail`
  desenha abas (`formatVariety` gera o rótulo, ex. "Alola", "Mega"). Estado
  `currentSpecies` no app; `selectVariety` busca a forma e re-renderiza ficha +
  evolução. Clique tratado em `handleModalClick` (aba antes de evo-node).
- [x] Etapa 8 — Busca e filtros: dois modos de listagem — `api` (paginação por offset,
  sem filtro) e `filtered` (lista de candidatos paginada localmente). `buildCandidates`
  combina tipo (`/type`), geração (`/generation`, interseção por nome) e busca textual
  (nome ou número) sobre a lista completa (`getAllPokemon`, cacheada). Selects
  preenchidos por `populateFilters` + `UI.fillSelect`. Busca com debounce de 400ms.
- [x] Etapa 9 — Fraquezas/resistências: `computeEffectiveness` multiplica os
  multiplicadores de cada tipo do Pokémon (×2 / ×½ / ×0) a partir das
  `damage_relations` de `/type`. `loadTypeEffectiveness` separa em fraquezas (>1) e
  resistências (<1) e `UI.renderTypeChart` exibe badges com o multiplicador
  (×4, ×2, ×½, ×¼, ×0). Recalculado ao trocar de forma. Seção entre stats e evoluções.
- [x] Etapa 10 — Polimento: skeleton cards com shimmer (`showSkeletons`/`clearSkeletons`),
  erro com botão "Tentar novamente" (`showError(msg, onRetry)`), animações (fadeInUp
  nos cards, fadeIn/modalIn no modal), acessibilidade (cards e evo-nodes com
  `role=button`/`tabindex`/Enter-Espaço, foco no modal ao abrir e retorno ao fechar,
  `focus-visible`, `prefers-reduced-motion`).
- [ ] Etapa 11 — Deploy (GitHub Pages / Netlify).
