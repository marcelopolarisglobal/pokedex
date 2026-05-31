const PokeAPI = (() => {
  const BASE_URL = "https://pokeapi.co/api/v2";
  const cache = new Map();

  async function request(url) {
    if (cache.has(url)) {
      return cache.get(url);
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Falha ao buscar dados (${response.status})`);
    }
    const data = await response.json();
    cache.set(url, data);
    return data;
  }

  function getPokemonList(limit = 24, offset = 0) {
    return request(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
  }

  function getPokemon(idOrName) {
    return request(`${BASE_URL}/pokemon/${idOrName}`);
  }

  function getSpecies(idOrName) {
    return request(`${BASE_URL}/pokemon-species/${idOrName}`);
  }

  function getEvolutionChain(id) {
    return request(`${BASE_URL}/evolution-chain/${id}`);
  }

  function getType(idOrName) {
    return request(`${BASE_URL}/type/${idOrName}`);
  }

  function getTypeList() {
    return request(`${BASE_URL}/type`);
  }

  function getGenerationList() {
    return request(`${BASE_URL}/generation`);
  }

  function getGeneration(idOrName) {
    return request(`${BASE_URL}/generation/${idOrName}`);
  }

  function getByUrl(url) {
    return request(url);
  }

  function idFromUrl(url) {
    const parts = url.split("/").filter(Boolean);
    return Number(parts[parts.length - 1]);
  }

  return {
    getPokemonList,
    getPokemon,
    getSpecies,
    getEvolutionChain,
    getType,
    getTypeList,
    getGenerationList,
    getGeneration,
    getByUrl,
    idFromUrl,
  };
})();
