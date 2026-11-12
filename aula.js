(() => {
  const root = document.documentElement;
  const cards = [...document.querySelectorAll(".tool-card")];
  const filters = [...document.querySelectorAll(".filter")];
  const search = document.querySelector("#tool-search");
  const status = document.querySelector("#filter-status");
  const dialog = document.querySelector("#tool-dialog");
  const menuToggle = document.querySelector("#menu-toggle");
  const nav = document.querySelector("#site-nav");
  const progress = document.querySelector("#reading-progress");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let currentFilter = "all";

  root.classList.add("js-enabled");

  const icons = {
    "Correo electrónico": '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="m4.5 7 7.5 5.8L19.5 7"/></svg>',
    "Mensajería instantánea": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5h10.5a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H9l-4 3v-3.6a3 3 0 0 1-2-2.8v-4.6a3 3 0 0 1 2-3Z"/><path d="M8 10h7M8 13h4"/></svg>',
    Videollamadas: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5.5" width="13" height="13" rx="2"/><path d="m16 10 5-3v10l-5-3z"/><path d="M7 9h5"/></svg>',
    "Redes sociales": '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="7" r="2.5"/><circle cx="12" cy="17" r="2.5"/><path d="m9 8.5 2 5.8M15 8.5l-2 5.8M9.5 7h5"/></svg>',
    Blogs: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h9l4 4V20a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2Z"/><path d="M14.5 3.8V8h4M8 12h8M8 15.5h8M8 8.8h2"/></svg>',
    "Páginas personales": '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3"/><path d="M5 20a7 7 0 0 1 14 0M4 4v4M2 6h4M18 4v4M16 6h4"/></svg>'
  };

  cards.forEach((card) => {
    const title = card.querySelector("h3")?.textContent.trim() ?? "Herramienta";
    const icon = document.createElement("span");
    icon.className = "card-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = icons[title] ?? "";
    card.insertBefore(icon, card.querySelector("h3"));

    const detailButton = document.createElement("button");
    detailButton.className = "detail-button";
    detailButton.type = "button";
    detailButton.setAttribute("aria-label", `Ver detalle de ${title}`);
    detailButton.append(document.createTextNode("Ver detalle "));
    const arrow = document.createElement("span");
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";
    detailButton.append(arrow);
    detailButton.addEventListener("click", () => openDetails(card));
    card.insertBefore(detailButton, card.querySelector(".card-cite"));

    card.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse" || reducedMotion.matches) return;
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      card.style.setProperty("--pointer-x", `${Math.round(x * 100)}%`);
      card.style.setProperty("--pointer-y", `${Math.round(y * 100)}%`);
    });
    card.addEventListener("pointerleave", () => {
      card.style.removeProperty("--pointer-x");
      card.style.removeProperty("--pointer-y");
    });
  });

  function openDetails(card) {
    if (!dialog) return;
    const title = card.querySelector("h3").textContent.trim();
    const category = card.querySelector(".card-tag").textContent.trim();
    const definition = card.querySelector(".definition").textContent.trim();
    const exampleLabel = card.querySelector(".example-label").textContent.trim();
    const example = card.querySelector(".example p:last-child").textContent.trim();
    const practice = card.querySelector(".good-practice").textContent.trim();
    const cite = card.querySelector(".card-cite").textContent.trim();

    dialog.querySelector("#dialog-category").textContent = category;
    dialog.querySelector("#dialog-title").textContent = title;
    dialog.querySelector("#dialog-definition").textContent = definition;
    dialog.querySelector("#dialog-example-label").textContent = exampleLabel;
    dialog.querySelector("#dialog-example").textContent = example;
    dialog.querySelector("#dialog-practice").textContent = practice;
    dialog.querySelector("#dialog-cite").textContent = cite;
    dialog.showModal();
  }

  function updateCards() {
    const query = search?.value.trim().toLocaleLowerCase("es") ?? "";
    let visible = 0;
    cards.forEach((card) => {
      const categoryMatches = currentFilter === "all" || card.dataset.category === currentFilter;
      const textMatches = !query || card.textContent.toLocaleLowerCase("es").includes(query);
      const show = categoryMatches && textMatches;
      card.hidden = !show;
      if (show && (currentFilter !== "all" || query)) card.classList.add("is-visible");
      if (show) visible += 1;
    });
    const label = visible === 1 ? "herramienta" : "herramientas";
    if (status) status.textContent = `Mostrando ${visible} de ${cards.length} ${label}.`;
    let empty = document.querySelector("#empty-state");
    if (!empty) {
      empty = document.createElement("p");
      empty.id = "empty-state";
      empty.className = "empty-state";
      empty.textContent = "No encontré coincidencias. Prueba otra búsqueda o cambia el filtro.";
      empty.hidden = true;
      document.querySelector("#tarjetas")?.append(empty);
    }
    empty.hidden = visible !== 0;
  }

  filters.forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter ?? "all";
      filters.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      updateCards();
    });
  });
  search?.addEventListener("input", updateCards);

  if (dialog) {
    dialog.querySelector(".dialog-close")?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => {
      const title = dialog.querySelector("#dialog-title")?.textContent;
      const trigger = cards.find((card) => card.querySelector("h3")?.textContent.trim() === title)
        ?.querySelector(".detail-button");
      trigger?.focus();
    });
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const open = menuToggle.getAttribute("aria-expanded") !== "true";
      menuToggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    });
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    }));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        menuToggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
        menuToggle.focus();
      }
    });
  }

  const scrollLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
  const sections = scrollLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        scrollLinks.forEach((link) => {
          if (link.getAttribute("href") === `#${entry.target.id}`) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-18% 0px -65% 0px", threshold: 0 });
    sections.forEach((section) => navObserver.observe(section));

    if (!reducedMotion.matches) {
      root.classList.add("js-motion");
      const revealTargets = document.querySelectorAll(".intro, .tool-card, .reflection, .references, .author-strip");
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { threshold: .12, rootMargin: "0px 0px -3% 0px" });
      revealTargets.forEach((target) => {
        target.classList.add("reveal");
        revealObserver.observe(target);
      });
    }
  }

  let scrollScheduled = false;
  const updateProgress = () => {
    if (!progress) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
    progress.style.transform = `scaleX(${ratio})`;
    scrollScheduled = false;
  };
  window.addEventListener("scroll", () => {
    if (scrollScheduled) return;
    scrollScheduled = true;
    window.requestAnimationFrame(updateProgress);
  }, { passive: true });
  window.addEventListener("resize", updateProgress, { passive: true });
  updateProgress();
  updateCards();
})();
