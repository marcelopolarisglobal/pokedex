const App = (() => {
  const PAGE_SIZE = 24;

  let mode = "api";
  let offset = 0;
  let isLoading = false;
  let candidates = [];
  let localIndex = 0;
  let filterType = "";
  let filterGen = "";
  let searchTerm = "";
  let allPokemon = null;
  let currentSpecies = null;
  let searchTimer = null;

  const loadMoreBtn = document.getElementById("load-more-btn");
  const grid = document.getElementById("pokemon-grid");
  const modalBody = document.getElementById("modal-body");
  const searchInput = document.getElementById("search-input");
  const typeFilter = document.getElementById("type-filter");
  const genFilter = document.getElementById("generation-filter");

  function formatCondition(details) {
    if (!details) return "";
    if (details.min_level) return `Nível ${details.min_level}`;
    if (details.item)
      return `Usar ${UI.capitalize(details.item.name.replace(/-/g, " "))}`;
    if (details.trigger && details.trigger.name === "trade") return "Troca";
    if (details.min_happiness) return "Amizade";
    if (details.trigger)
      return UI.capitalize(details.trigger.name.replace(/-/g, " "));
    return "";
  }

  function flattenEvolution(chain) {
    const levels = [];
    let current = [{ node: chain, condition: "" }];
    while (current.length) {
      levels.push(
        current.map((c) => ({
          name: c.node.species.name,
          id: PokeAPI.idFromUrl(c.node.species.url),
          condition: c.condition,
        }))
      );
      const next = [];
      current.forEach((c) => {
        c.node.evolves_to.forEach((child) => {
          next.push({
            node: child,
            condition: formatCondition(child.evolution_details[0]),
          });
        });
      });
      current = next;
    }
    return levels;
  }

  async function loadEvolution(species) {
    const chain = await PokeAPI.getByUrl(species.evolution_chain.url);
    const levels = flattenEvolution(chain);
    const ids = levels.flat().map((n) => n.id);
    const pokemonsById = {};
    await Promise.all(
      ids.map(async (id) => {
        pokemonsById[id] = await PokeAPI.getPokemon(id);
      })
    );
    UI.renderEvolution(levels, pokemonsById);
  }

  function computeEffectiveness(typeDataList) {
    const mult = {};
    typeDataList.forEach((t) => {
      const r = t.damage_relations;
      r.double_damage_from.forEach((x) => {
        mult[x.name] = (mult[x.name] ?? 1) * 2;
      });
      r.half_damage_from.forEach((x) => {
        mult[x.name] = (mult[x.name] ?? 1) * 0.5;
      });
      r.no_damage_from.forEach((x) => {
        mult[x.name] = (mult[x.name] ?? 1) * 0;
      });
    });
    return mult;
  }

  async function loadTypeEffectiveness(pokemon) {
    const typeData = await Promise.all(
      pokemon.types.map((t) => PokeAPI.getType(t.type.name))
    );
    const mult = computeEffectiveness(typeData);
    const weak = [];
    const resist = [];
    Object.entries(mult).forEach(([type, m]) => {
      if (m > 1) weak.push({ type, mult: m });
      else if (m < 1) resist.push({ type, mult: m });
    });
    weak.sort((a, b) => b.mult - a.mult);
    resist.sort((a, b) => a.mult - b.mult);
    UI.renderTypeChart(weak, resist);
  }

  async function openDetail(id) {
    UI.openModal();
    UI.setModalLoading();
    try {
      const pokemon = await PokeAPI.getPokemon(id);
      const species = await PokeAPI.getByUrl(pokemon.species.url);
      currentSpecies = species;
      UI.renderDetail(pokemon, species);
      await loadTypeEffectiveness(pokemon);
      await loadEvolution(species);
    } catch (error) {
      UI.closeModal();
    }
  }

  async function selectVariety(name) {
    try {
      const pokemon = await PokeAPI.getPokemon(name);
      UI.renderDetail(pokemon, currentSpecies);
      await loadTypeEffectiveness(pokemon);
      await loadEvolution(currentSpecies);
    } catch (error) {
      UI.closeModal();
    }
  }

  function handleGridClick(event) {
    const card = event.target.closest(".card");
    if (!card || card.classList.contains("skeleton-card")) return;
    openDetail(card.dataset.id);
  }

  function handleGridKey(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    const card = event.target.closest(".card");
    if (!card || card.classList.contains("skeleton-card")) return;
    event.preventDefault();
    openDetail(card.dataset.id);
  }

  function handleModalClick(event) {
    const tab = event.target.closest(".variety-tab");
    if (tab) {
      selectVariety(tab.dataset.variety);
      return;
    }
    const node = event.target.closest(".evo-node");
    if (node) {
      openDetail(node.dataset.id);
    }
  }

  function handleModalKey(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    const node = event.target.closest(".evo-node");
    if (!node) return;
    event.preventDefault();
    openDetail(node.dataset.id);
  }

  async function loadApiPage() {
    if (isLoading) return;
    isLoading = true;
    loadMoreBtn.hidden = true;
    UI.hideStatus();
    UI.showSkeletons(PAGE_SIZE);
    try {
      const list = await PokeAPI.getPokemonList(PAGE_SIZE, offset);
      const pokemons = await Promise.all(
        list.results.map((i) => PokeAPI.getByUrl(i.url))
      );
      UI.clearSkeletons();
      UI.renderCards(pokemons);
      offset += PAGE_SIZE;
      loadMoreBtn.hidden = !list.next;
    } catch (error) {
      UI.clearSkeletons();
      UI.showError("Erro ao carregar Pokémon.", loadApiPage);
    } finally {
      isLoading = false;
    }
  }

  async function loadFilteredPage() {
    if (isLoading) return;
    isLoading = true;
    loadMoreBtn.hidden = true;
    UI.showSkeletons(Math.min(PAGE_SIZE, candidates.length - localIndex));
    try {
      const slice = candidates.slice(localIndex, localIndex + PAGE_SIZE);
      const pokemons = await Promise.all(
        slice.map((c) => PokeAPI.getPokemon(c.name))
      );
      UI.clearSkeletons();
      UI.renderCards(pokemons);
      localIndex += PAGE_SIZE;
      loadMoreBtn.hidden = localIndex >= candidates.length;
    } catch (error) {
      UI.clearSkeletons();
      UI.showError("Erro ao carregar Pokémon.", loadFilteredPage);
    } finally {
      isLoading = false;
    }
  }

  function loadMore() {
    if (mode === "api") loadApiPage();
    else loadFilteredPage();
  }

  async function getAllPokemon() {
    if (allPokemon) return allPokemon;
    const data = await PokeAPI.getPokemonList(100000, 0);
    allPokemon = data.results.map((r) => ({
      name: r.name,
      id: PokeAPI.idFromUrl(r.url),
    }));
    return allPokemon;
  }

  async function buildCandidates() {
    let list = null;
    if (filterType) {
      const t = await PokeAPI.getType(filterType);
      list = t.pokemon.map((p) => ({
        name: p.pokemon.name,
        id: PokeAPI.idFromUrl(p.pokemon.url),
      }));
    }
    if (filterGen) {
      const g = await PokeAPI.getGeneration(filterGen);
      const genList = g.pokemon_species.map((s) => ({
        name: s.name,
        id: PokeAPI.idFromUrl(s.url),
      }));
      if (list) {
        const genNames = new Set(genList.map((x) => x.name));
        list = list.filter((x) => genNames.has(x.name));
      } else {
        list = genList;
      }
    }
    if (!list) {
      list = await getAllPokemon();
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (x) => x.name.includes(term) || String(x.id) === term
      );
    }
    return list.slice().sort((a, b) => a.id - b.id);
  }

  async function applyFilters() {
    UI.clearGrid();
    UI.hideStatus();
    if (!filterType && !filterGen && !searchTerm) {
      mode = "api";
      offset = 0;
      loadApiPage();
      return;
    }
    mode = "filtered";
    loadMoreBtn.hidden = true;
    UI.showSkeletons(PAGE_SIZE);
    try {
      candidates = await buildCandidates();
      localIndex = 0;
      UI.clearSkeletons();
      if (candidates.length === 0) {
        UI.showStatus("Nenhum Pokémon encontrado.");
        return;
      }
      loadFilteredPage();
    } catch (error) {
      UI.clearSkeletons();
      UI.showError("Erro ao aplicar filtros.", applyFilters);
    }
  }

  async function populateFilters() {
    const types = await PokeAPI.getTypeList();
    const typeItems = types.results
      .filter((t) => t.name !== "unknown" && t.name !== "shadow")
      .map((t) => ({ value: t.name, label: UI.capitalize(t.name) }));
    UI.fillSelect(typeFilter, typeItems);

    const gens = await PokeAPI.getGenerationList();
    const genItems = gens.results.map((g) => ({
      value: PokeAPI.idFromUrl(g.url),
      label: "Geração " + g.name.split("-")[1].toUpperCase(),
    }));
    UI.fillSelect(genFilter, genItems);
  }

  function handleSearch() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchTerm = searchInput.value.trim();
      applyFilters();
    }, 400);
  }

  function init() {
    loadMoreBtn.addEventListener("click", loadMore);
    grid.addEventListener("click", handleGridClick);
    grid.addEventListener("keydown", handleGridKey);
    modalBody.addEventListener("click", handleModalClick);
    modalBody.addEventListener("keydown", handleModalKey);
    searchInput.addEventListener("input", handleSearch);
    typeFilter.addEventListener("change", () => {
      filterType = typeFilter.value;
      applyFilters();
    });
    genFilter.addEventListener("change", () => {
      filterGen = genFilter.value;
      applyFilters();
    });
    populateFilters();
    loadApiPage();
  }

  document.addEventListener("DOMContentLoaded", init);

  return { loadMore };
})();
