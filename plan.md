# Plano de Desenvolvimento — Pokédex Web

> Enciclopédia digital de Pokémon, responsiva (desktop + celular), consumindo a [PokeAPI](https://pokeapi.co/).
> Inspirada na Pokédex original do Professor Carvalho (Oak): registrar e consultar dados de cada Pokémon.

---

## 1. Objetivo

Construir um site **HTML/CSS/JavaScript puro** (sem framework, sem build) que permita:

- Listar e navegar por todos os Pokémon (paginação / scroll infinito).
- Buscar por nome ou número (ID da Pokédex).
- Filtrar por tipo (fogo, água, grama, etc.) e por geração.
- Abrir a ficha detalhada de cada Pokémon: imagem, tipos, altura, peso, habilidades, estatísticas (stats) e descrição da Pokédex.
- Visualizar a **cadeia de evolução** (evolution chain) com as condições de evolução.
- Visualizar **variações/formas** (formas regionais como Alola/Galar, mega evoluções, formas alternativas).
- Funcionar bem em tela de **computador e de celular** (layout responsivo).

### Por que HTML/CSS/JS puro?
A PokeAPI é uma API REST pública e somente-leitura. Não precisamos de servidor próprio, banco de dados ou autenticação. Um site estático (só arquivos abertos no navegador) é mais simples, mais rápido de carregar e pode ser hospedado de graça (GitHub Pages, Netlify). É como montar uma vitrine que apenas consulta um catálogo já existente — não precisamos do estoque, só da consulta.

---

## 2. A API — PokeAPI (https://pokeapi.co/api/v2)

REST, sem chave de autenticação, com limite de uso "justo" (recomendam cache local). Endpoints que vamos usar:

| Recurso | Endpoint | Para quê |
|---|---|---|
| Lista | `/pokemon?limit=20&offset=0` | Paginação da lista principal |
| Pokémon | `/pokemon/{id ou nome}` | Tipos, stats, altura, peso, habilidades, sprites |
| Espécie | `/pokemon-species/{id}` | Descrição (flavor text), geração, cor, link para evolução e variedades |
| Evolução | `/evolution-chain/{id}` | Cadeia de evolução e condições (nível, item, troca, etc.) |
| Tipo | `/type/{nome}` | Filtrar Pokémon por tipo; relações de dano (fraquezas/resistências) |
| Geração | `/generation/{id}` | Filtrar por geração |
| Forma | `/pokemon-form/{id}` | Formas alternativas (regionais, mega, gigamax) |

### Detalhes importantes da API
- **Imagens (sprites):** o caminho `sprites.other['official-artwork'].front_default` traz a arte oficial em alta qualidade. Há também `sprites.front_default` (sprite pixelado clássico) e `sprites.other.home`/`showdown` para animações.
- **Encadeamento de chamadas:** dados de um Pokémon estão espalhados. Para a tela de detalhe, o fluxo é:
  1. `/pokemon/{id}` → dados básicos + URL da espécie.
  2. `/pokemon-species/{id}` → descrição, geração e URL da `evolution_chain` + lista de `varieties` (variações).
  3. `/evolution-chain/{id}` → árvore de evolução (estrutura aninhada que precisa ser "achatada" em JS).
     ⚠️ A resposta é um envelope `{ id, chain: {...} }`; a árvore fica em **`chain.chain`**,
     não no objeto raiz. Passar o objeto errado ao flatten gera `TypeError`.
- **Descrições em português:** o campo `flavor_text_entries` traz textos em vários idiomas; filtramos por `language.name === 'es'` ou `'en'` (a API **não tem pt-BR**; usaremos inglês ou espanhol como fallback e traduziremos os rótulos da interface).
- **Variedades:** `pokemon-species.varieties[]` lista todas as formas (a padrão + regionais/megas), cada uma com sua própria URL `/pokemon/`.

---

## 3. Arquitetura de Arquivos

```
pokedex/
├── index.html          # Página principal: cabeçalho, busca, filtros, grade, modal, rodapé
├── historia.html       # Página estática "História dos Pokémon" (sem JS)
├── css/
│   └── style.css       # Estilos + responsividade (mobile-first) + identidade visual
├── js/
│   ├── api.js          # Camada de acesso à PokeAPI (fetch + cache)
│   ├── ui.js           # Renderização (cards, modal, evoluções, variações)
│   └── app.js          # Orquestração: estado, eventos, paginação, filtros
├── plan.md
└── claude.md
```
> Não há pasta `assets/`: as imagens vêm direto da PokeAPI (sprites/artwork) e os
> ícones de tipo são feitos com CSS (cores em `--type-color`). A fonte dos títulos
> (Fraunces) é carregada via Google Fonts no `<head>` do `index.html`.

### Por que separar em camadas (api / ui / app)?
- **api.js** só sabe *buscar dados* (não mexe na tela).
- **ui.js** só sabe *desenhar na tela* (não busca dados).
- **app.js** é o maestro que conecta os dois e guarda o estado (página atual, filtro ativo).

Essa separação (semelhante ao padrão MVC) facilita achar e corrigir problemas: se a imagem não aparece, o erro está na ui; se os dados vêm errados, está na api. Cada arquivo tem uma única responsabilidade.

---

## 4. Funcionalidades e Telas

### 4.1. Tela principal — Grade (grid) de Pokémon
- Cards com: número (#001), nome, imagem (artwork oficial), badges de tipo coloridos.
- Cor de fundo do card baseada no tipo primário.
- **Scroll infinito** ou botão "Carregar mais" (offset += 20).

### 4.2. Busca e filtros
- Campo de busca por nome ou número (com debounce para não disparar a cada tecla).
- Filtro por tipo (chips clicáveis).
- Filtro por geração (dropdown).

### 4.3. Modal/Página de detalhe
Ao clicar num card, abre a ficha com:
- Imagem grande + número + nome + tipos.
- Descrição da Pokédex (flavor text).
- Dados físicos: altura, peso.
- Habilidades (abilities).
- **Stats** (HP, Ataque, Defesa, etc.) em barras de progresso.
- **Fraquezas/resistências** calculadas a partir de `/type` (damage relations).

### 4.4. Cadeia de evolução
- Linha visual: Pokémon base → evolução 1 → evolução 2.
- Mostrar a **condição** de cada evolução (ex.: "Nível 16", "Pedra da Água", "Troca").
- Cada estágio é clicável (abre a ficha daquele Pokémon).

### 4.5. Variações / Formas
- Abas ou miniaturas para alternar entre formas (padrão, Alola, Galar, Mega, etc.).
- Trocar a forma atualiza imagem, tipos e stats.

---

## 5. Estratégias Técnicas

### 5.1. Cache local
A PokeAPI pede que façamos cache. Usaremos `localStorage` (ou um objeto `Map` em memória) para guardar respostas já buscadas. Assim, reabrir um Pokémon não dispara nova requisição. É como anotar num caderno o que já pesquisamos, em vez de procurar de novo na enciclopédia toda vez.

### 5.2. Estados de carregamento e erro
- **Loading:** esqueletos (skeleton cards) ou spinner enquanto a API responde.
- **Erro:** mensagem amigável + botão "tentar de novo" se a rede falhar.
- **Vazio:** mensagem quando a busca não encontra nada.

### 5.3. Responsividade (mobile-first)
- CSS escrito primeiro para celular; `media queries` ampliam o layout em telas maiores.
- Grade fluida com `CSS Grid` / `flexbox` e `minmax()` para os cards se reorganizarem sozinhos.
- Modal vira tela cheia no celular e janela centralizada no desktop.
- Toque e clique tratados igualmente.

### 5.4. Performance
- `Promise.all` para chamadas paralelas (ex.: buscar 20 Pokémon de uma página ao mesmo tempo).
- `IntersectionObserver` para scroll infinito e *lazy loading* de imagens.
- Debounce na busca.

---

## 6. Etapas de Desenvolvimento (ordem sugerida)

1. **Esqueleto** — `index.html` + `style.css` base + cabeçalho com logo.
2. **Camada de API** — `api.js`: funções `getPokemonList`, `getPokemon`, `getSpecies`, `getEvolutionChain`, com cache.
3. **Grade principal** — renderizar cards e a paginação "Carregar mais".
4. **Responsividade** — ajustar a grade para celular e desktop.
5. **Modal de detalhe** — stats, habilidades, descrição.
6. **Evoluções** — buscar e achatar a evolution-chain, renderizar a linha clicável.
7. **Variações/formas** — abas para alternar entre as variedades.
8. **Busca e filtros** — por nome, número, tipo e geração.
9. **Fraquezas/resistências** — cálculo via damage relations dos tipos.
10. **Polimento** — loading skeletons, tratamento de erro, animações, acessibilidade.
11. **Deploy** — hospedar no GitHub Pages / Netlify.

---

## 7. Critérios de Conclusão (Definition of Done) — ✅ TODOS ATENDIDOS

- [x] Lista todos os Pokémon com paginação funcional.
- [x] Busca por nome e por número funciona.
- [x] Filtros por tipo e geração funcionam.
- [x] Ficha de detalhe completa (imagem, tipos, stats, habilidades, descrição).
- [x] Cadeia de evolução exibida com condições e estágios clicáveis.
- [x] Variações/formas alternáveis.
- [x] Layout testado e funcional em celular e desktop.
- [x] Cache evita requisições repetidas.
- [x] Estados de loading e erro tratados.

**Projeto no ar:** https://marcelopolarisglobal.github.io/pokedex/ (GitHub Pages).

---

## 8. Identidade Visual (estilo Anthropic)

Após a entrega, a aparência foi alinhada ao padrão visual de [anthropic.com](https://www.anthropic.com/):
fundo creme/marfim (`#f0eee6`), destaque coral terroso (`#d97757`), texto quase-preto,
títulos em serif (**Fraunces**), bordas sutis no lugar de sombras pesadas e cantos
contidos. Os badges de tipo seguem coloridos (cor = informação). Tudo controlado por
variáveis no `:root` de `css/style.css` — mudar a paleta é editar o `:root`.

---

## 9. Página "História dos Pokémon" (`historia.html`)

Página estática complementar, **sem JavaScript**, que conta a história da franquia
(origem, as 9 gerações de jogos, spin-offs, outras mídias, impacto e controvérsias).
Conteúdo adaptado da [Wikipédia](https://pt.wikipedia.org/wiki/Pok%C3%A9mon).

- **Acesso:** link "História" no canto superior direito do header da página principal.
- **Navegação:** link de volta para a Pokédex (no header e ao fim do texto) e link
  externo para a Wikipédia (no topo do conteúdo e no rodapé).
- **Estilo:** reaproveita `css/style.css` (classes `.page` e `.article`), mantendo a
  identidade visual — títulos serif, fundo creme, tabelas com bordas sutis.
- O rodapé das duas páginas passou a citar a **Wikipédia** como fonte adicional.

---

## 10. Possíveis Extensões Futuras (fora do escopo inicial)

- Favoritos salvos em `localStorage`.
- Modo escuro (dark mode).
- Comparador de dois Pokémon lado a lado.
- Sons (cries) dos Pokémon (a API tem `cries.latest`).
- PWA (instalável no celular, funciona offline).
