# CLAUDE.md — Projeto Pokédex Web

Instruções e contexto permanentes deste projeto. Leia antes de qualquer alteração.

## Visão Geral
Pokédex web responsiva que consulta a [PokeAPI](https://pokeapi.co/api/v2). Enciclopédia
de Pokémon para desktop e celular: lista, busca, filtros, ficha detalhada, evoluções e
variações. O roteiro completo de construção está em `plan.md`.

## Stack
- **HTML + CSS + JavaScript puro (vanilla)**. Sem framework, sem build.
- Site **estático** — abre direto no navegador; hospedável em GitHub Pages / Netlify.
- Sem backend, sem banco de dados, sem chave de API (a PokeAPI é pública e somente-leitura).
- Única dependência externa: a fonte **Fraunces** (Google Fonts, via `<link>`), com
  fallback para serif do sistema se não carregar.

## Estrutura de Pastas
```
pokedex/
├── index.html        # página principal (grade, busca, filtros, modal)
├── historia.html     # página estática "História dos Pokémon" (sem JS)
├── css/style.css     # estilos + responsividade (compartilhado pelas duas páginas)
├── js/api.js         # acesso à PokeAPI (fetch + cache)
├── js/ui.js          # renderização da interface
└── js/app.js         # estado, eventos, orquestração
```
Não há pasta `assets/`: imagens vêm da PokeAPI e ícones de tipo são CSS. `historia.html`
é uma página de conteúdo estático (não usa os scripts JS); acessível pelo link "História"
no canto superior direito do header da página principal.
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
- A `evolution_chain` vem **aninhada** — precisa ser achatada (flatten) em JS. Atenção:
  a resposta de `/evolution-chain` é um envelope `{ id, chain: {...} }`; a árvore de
  evolução está em **`chain.chain`** (não no objeto raiz). Passar o objeto raiz ao
  flatten causa `TypeError` (já corrigido).
- Variações/formas ficam em `pokemon-species.varieties[]`.
- A API **não tem pt-BR**; usar `en` (ou `es`) no flavor text e traduzir os rótulos da UI.

## Identidade Visual (estilo Anthropic)
Paleta e tipografia inspiradas em anthropic.com, definidas em variáveis no `:root` de
`css/style.css`:
- Fundo creme/marfim `--color-bg: #f0eee6`; superfícies (cards) brancas.
- Destaque coral terroso `--color-primary: #d97757`.
- Texto quase-preto `#141413`; textos secundários em bege-cinza.
- Títulos com a serif **Fraunces** (`--font-serif`); corpo/UI em sans-serif do sistema.
- Estética minimalista: bordas sutis em vez de sombras pesadas, cantos contidos
  (`--radius: 10px`), bastante respiro.
- Os **badges de tipo permanecem coloridos** (cor = informação); só a moldura é sóbria.
- Para mudar a aparência, ajustar as variáveis do `:root` (mudança propaga ao site todo).

## Como Rodar / Testar
- Abrir `index.html` no navegador, ou servir localmente:
  `python3 -m http.server 8000` e acessar `http://localhost:8000`.
- Testar **sempre** em largura de celular e de desktop (DevTools → modo responsivo).
- `node --check` valida só a **sintaxe**; não pega erros de lógica/estrutura de dados.
  Para o fluxo real (ex.: clique abre modal), testar de verdade no navegador ou com
  `jsdom` carregando os arquivos reais — foi assim que o bug do modal foi diagnosticado.

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
- [x] Etapa 11 — Deploy (GitHub Pages): repo público `marcelopolarisglobal/pokedex`,
  branch `main`, raiz `/`. Site no ar em https://marcelopolarisglobal.github.io/pokedex/
  Para atualizar: `git add -A && git commit && git push` (o Pages reconstrói sozinho).

## Projeto concluído
Todas as 11 etapas do `plan.md` foram entregues. Para evoluir, ver "Extensões futuras"
no `plan.md` (favoritos, dark mode, comparador, cries, PWA).

## Ajustes pós-lançamento
- [x] **Correção do modal** (`flattenEvolution(chain.chain)`): o modal abria e fechava ao
  clicar em qualquer Pokémon porque o flatten recebia o objeto raiz da evolution-chain;
  o `TypeError` caía no `catch` do `openDetail` e fechava o modal. Ver lembrete da PokeAPI.
- [x] **Disclaimer no rodapé**: aviso de projeto educacional/não oficial, marcas de
  Nintendo/Game Freak/The Pokémon Company, créditos (PokeAPI, imagens) e autoria
  (Marcelo Santos, maio de 2026).
- [x] **Restyle visual (estilo Anthropic)**: ver seção "Identidade Visual".
- [x] **Página "História dos Pokémon"** (`historia.html`): conteúdo estático adaptado da
  Wikipédia (origem, 9 gerações, spin-offs, mídias, impacto, controvérsias). Link
  "História" no canto superior direito do header (`.header__nav`); link de volta para a
  Pokédex e para a Wikipédia. Rodapé de ambas as páginas cita a Wikipédia como fonte
  adicional. Reaproveita `css/style.css` (classes `.page`/`.article`).
