const UI = (() => {
  const grid = document.getElementById("pokemon-grid");
  const status = document.getElementById("status");
  const modal = document.getElementById("detail-modal");
  const modalBody = document.getElementById("modal-body");
  let lastFocused = null;

  const STAT_NAMES = {
    hp: "HP",
    attack: "Ataque",
    defense: "Defesa",
    "special-attack": "Ataque Esp.",
    "special-defense": "Defesa Esp.",
    speed: "Velocidade",
  };

  function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function formatId(id) {
    return "#" + String(id).padStart(3, "0");
  }

  function getArtwork(pokemon) {
    return (
      pokemon.sprites.other["official-artwork"].front_default ||
      pokemon.sprites.front_default ||
      ""
    );
  }

  function formatVariety(varietyName, speciesName) {
    if (varietyName === speciesName) return "Padrão";
    const label = varietyName.startsWith(speciesName + "-")
      ? varietyName.slice(speciesName.length + 1)
      : varietyName;
    return capitalize(label.replace(/-/g, " "));
  }

  function getFlavorText(species) {
    const entry = species.flavor_text_entries.find(
      (e) => e.language.name === "en"
    );
    return entry ? entry.flavor_text.replace(/[\f\n\r]/g, " ") : "";
  }

  function createCard(pokemon) {
    const primaryType = pokemon.types[0].type.name;
    const card = document.createElement("article");
    card.className = `card type-${primaryType}`;
    card.dataset.id = pokemon.id;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", capitalize(pokemon.name));

    const badges = pokemon.types
      .map(
        (t) =>
          `<span class="badge type-${t.type.name}">${capitalize(
            t.type.name
          )}</span>`
      )
      .join("");

    card.innerHTML = `
      <span class="card__id">${formatId(pokemon.id)}</span>
      <div class="card__media">
        <img class="card__img" src="${getArtwork(pokemon)}" alt="${
      pokemon.name
    }" loading="lazy">
      </div>
      <h2 class="card__name">${capitalize(pokemon.name)}</h2>
      <div class="card__types">${badges}</div>
    `;
    return card;
  }

  function renderCards(pokemons) {
    const fragment = document.createDocumentFragment();
    pokemons.forEach((p) => fragment.appendChild(createCard(p)));
    grid.appendChild(fragment);
  }

  function clearGrid() {
    grid.innerHTML = "";
  }

  function showSkeletons(count) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const sk = document.createElement("div");
      sk.className = "card skeleton-card";
      sk.innerHTML =
        '<div class="skeleton skeleton__media"></div>' +
        '<div class="skeleton skeleton__line"></div>' +
        '<div class="skeleton skeleton__line skeleton__line--short"></div>';
      fragment.appendChild(sk);
    }
    grid.appendChild(fragment);
  }

  function clearSkeletons() {
    grid.querySelectorAll(".skeleton-card").forEach((el) => el.remove());
  }

  function showError(message, onRetry) {
    status.innerHTML = `<p>${message}</p><button class="load-more__btn" type="button">Tentar novamente</button>`;
    status.hidden = false;
    status.querySelector("button").addEventListener("click", () => {
      hideStatus();
      onRetry();
    });
  }

  function fillSelect(select, items) {
    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;
      fragment.appendChild(option);
    });
    select.appendChild(fragment);
  }

  function showStatus(message) {
    status.textContent = message;
    status.hidden = false;
  }

  function hideStatus() {
    status.hidden = true;
  }

  function renderDetail(pokemon, species) {
    const primaryType = pokemon.types[0].type.name;

    const badges = pokemon.types
      .map(
        (t) =>
          `<span class="badge type-${t.type.name}">${capitalize(
            t.type.name
          )}</span>`
      )
      .join("");

    const abilities = pokemon.abilities
      .map(
        (a) =>
          `<li>${capitalize(a.ability.name.replace("-", " "))}${
            a.is_hidden ? " <em>(oculta)</em>" : ""
          }</li>`
      )
      .join("");

    const stats = pokemon.stats
      .map((s) => {
        const name = STAT_NAMES[s.stat.name] || s.stat.name;
        const value = s.base_stat;
        const width = Math.min(100, (value / 255) * 100);
        return `
          <div class="stat">
            <span class="stat__label">${name}</span>
            <div class="stat__bar"><div class="stat__fill" style="width:${width}%"></div></div>
            <span class="stat__value">${value}</span>
          </div>`;
      })
      .join("");

    let varietyTabs = "";
    if (species.varieties.length > 1) {
      varietyTabs =
        '<div class="variety-tabs">' +
        species.varieties
          .map((v) => {
            const active = v.pokemon.name === pokemon.name ? " active" : "";
            return `<button class="variety-tab${active}" data-variety="${
              v.pokemon.name
            }">${formatVariety(v.pokemon.name, species.name)}</button>`;
          })
          .join("") +
        "</div>";
    }

    modalBody.className = `modal__body type-${primaryType}`;
    modalBody.innerHTML = `
      ${varietyTabs}
      <div class="detail__header">
        <img class="detail__img" src="${getArtwork(pokemon)}" alt="${
      pokemon.name
    }">
        <span class="detail__id">${formatId(pokemon.id)}</span>
        <h2 id="modal-name" class="detail__name">${capitalize(
          pokemon.name
        )}</h2>
        <div class="detail__types">${badges}</div>
      </div>

      <p class="detail__flavor">${getFlavorText(species)}</p>

      <div class="detail__meta">
        <div><span class="detail__meta-value">${(pokemon.height / 10).toFixed(
          1
        )} m</span><span class="detail__meta-label">Altura</span></div>
        <div><span class="detail__meta-value">${(pokemon.weight / 10).toFixed(
          1
        )} kg</span><span class="detail__meta-label">Peso</span></div>
      </div>

      <section class="detail__section">
        <h3 class="detail__title">Habilidades</h3>
        <ul class="detail__abilities">${abilities}</ul>
      </section>

      <section class="detail__section">
        <h3 class="detail__title">Estatísticas base</h3>
        <div class="detail__stats">${stats}</div>
      </section>
    `;
  }

  function multLabel(m) {
    if (m === 0.25) return "×¼";
    if (m === 0.5) return "×½";
    return "×" + m;
  }

  function renderTypeChart(weak, resist) {
    if (weak.length === 0 && resist.length === 0) return;

    const group = (title, items) => {
      if (items.length === 0) return "";
      const badges = items
        .map(
          (i) =>
            `<span class="badge type-${i.type}">${capitalize(i.type)} ${multLabel(
              i.mult
            )}</span>`
        )
        .join("");
      return `<h4 class="type-chart__subtitle">${title}</h4><div class="type-chart__group">${badges}</div>`;
    };

    const section = document.createElement("section");
    section.className = "detail__section";
    section.innerHTML =
      '<h3 class="detail__title">Vantagens e fraquezas</h3>' +
      group("Fraquezas", weak) +
      group("Resistências", resist);
    modalBody.appendChild(section);
  }

  function renderEvolution(levels, pokemonsById) {
    const isSingle = levels.length === 1 && levels[0].length === 1;

    let inner;
    if (isSingle) {
      inner = '<p class="evolution__empty">Este Pokémon não evolui.</p>';
    } else {
      inner =
        '<div class="evolution">' +
        levels
          .map((level, i) => {
            const arrow = i > 0 ? '<div class="evo-arrow">▸</div>' : "";
            const column =
              '<div class="evo-column">' +
              level
                .map((node) => {
                  const cond = node.condition
                    ? `<span class="evo-cond">${node.condition}</span>`
                    : "";
                  return `
                    <div class="evo-node" data-id="${node.id}" tabindex="0" role="button" aria-label="${capitalize(
                    node.name
                  )}">
                      ${cond}
                      <img class="evo-img" src="${getArtwork(
                        pokemonsById[node.id]
                      )}" alt="${node.name}">
                      <span class="evo-name">${capitalize(node.name)}</span>
                    </div>`;
                })
                .join("") +
              "</div>";
            return arrow + column;
          })
          .join("") +
        "</div>";
    }

    const section = document.createElement("section");
    section.className = "detail__section";
    section.innerHTML = `<h3 class="detail__title">Evoluções</h3>${inner}`;
    modalBody.appendChild(section);
  }

  function openModal() {
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    const closeBtn = modal.querySelector(".modal__close");
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  function setModalLoading() {
    modalBody.className = "modal__body";
    modalBody.innerHTML = '<div class="status">Carregando...</div>';
  }

  modal.querySelectorAll("[data-close]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  return {
    renderCards,
    clearGrid,
    fillSelect,
    showSkeletons,
    clearSkeletons,
    showStatus,
    showError,
    hideStatus,
    renderDetail,
    renderTypeChart,
    renderEvolution,
    openModal,
    closeModal,
    setModalLoading,
    capitalize,
    formatId,
  };
})();
