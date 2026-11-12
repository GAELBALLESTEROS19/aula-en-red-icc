/* Aula en Red · navegación e interacciones. Sin dependencias externas. */
(() => {
  "use strict";

  const root = document.documentElement;
  const home = document.getElementById("home-view");
  const pages = [...document.querySelectorAll(".topic-page[data-route]")];
  const routes = new Map(pages.map(page => [page.dataset.route, page]));
  const homeAnchors = new Set(["inicio", "herramientas", "reflexion", "referencias", "autor"]);
  const topicAnchors = new Set(["idea", "funciones", "icc", "cuidados"]);
  const baseTitle = document.title;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const menuToggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("site-nav");
  const progress = document.getElementById("reading-progress");
  const scenes = [...document.querySelectorAll(".object-scene")];
  const motionButtons = [...document.querySelectorAll(".motion-toggle")];
  let previousView = null;
  let routeFrame = 0;
  let userPaused = false;
  let revealObserver = null;

  root.classList.add("js-ready", "js-enabled");

  // El menú conserva su estado accesible y se cierra al elegir un destino.
  function closeMenu(returnFocus = false) {
    if (!menuToggle || !nav) return;
    const wasOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
    if (returnFocus && wasOpen) menuToggle.focus();
  }

  menuToggle?.addEventListener("click", () => {
    if (!nav) return;
    const isOpen = menuToggle.getAttribute("aria-expanded") !== "true";
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    nav.classList.toggle("is-open", isOpen);
  });
  nav?.addEventListener("click", event => {
    if (event.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMenu(true);
  });
  document.addEventListener("click", event => {
    if (!nav || !menuToggle || menuToggle.getAttribute("aria-expanded") !== "true") return;
    if (!nav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
  });

  // El contenido es visible aunque el navegador no disponga de observadores.
  function observeReveals(scope = document) {
    const items = [...scope.querySelectorAll(".reveal")];
    if (scope instanceof Element && scope.matches(".reveal")) items.unshift(scope);
    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      root.classList.remove("js-motion");
      items.forEach(item => item.classList.add("is-visible"));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });
    }
    root.classList.add("js-motion");
    items.forEach(item => {
      if (!item.classList.contains("is-visible")) revealObserver.observe(item);
    });
  }

  function decodeHash() {
    try { return decodeURIComponent(location.hash.slice(1)).trim(); }
    catch { return "inicio"; }
  }

  function focusHeading(target) {
    if (!target) return;
    const heading = target.matches("h1,h2,h3") ? target : target.querySelector("h1,h2,h3");
    if (!heading) return;
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  }

  function markCurrentLinks(hash) {
    document.querySelectorAll("#site-nav a, .topic-subnav a, .topic-index a").forEach(link => {
      const href = link.getAttribute("href");
      if (href === `#${hash}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  // Una sola dirección por tema: los hashes permiten compartir y usar Atrás/Adelante.
  function renderRoute(initial = false) {
    const hash = decodeHash() || "inicio";
    const [slug, requestedAnchor] = hash.split("/");
    const topic = routes.get(slug);
    const viewName = topic ? slug : "home";
    const viewChanged = viewName !== previousView;
    if (home) home.hidden = Boolean(topic);
    pages.forEach(page => { page.hidden = page !== topic; });
    root.dataset.view = viewName;
    closeMenu();
    markCurrentLinks(hash);
    document.title = topic
      ? `${topic.querySelector("h1")?.textContent.trim() || "Herramientas"} — Aula en Red | ICC`
      : baseTitle;

    cancelAnimationFrame(routeFrame);
    routeFrame = requestAnimationFrame(() => {
      const anchor = topicAnchors.has(requestedAnchor) ? requestedAnchor : null;
      const homeId = homeAnchors.has(slug) ? slug : "inicio";
      const destination = topic
        ? (anchor ? document.getElementById(`${slug}-${anchor}`) : topic)
        : document.getElementById(homeId);
      const smooth = !viewChanged && !initial && !reduceMotion.matches && !userPaused;
      if (!topic && homeId === "inicio") {
        // El encabezado fijo no es un destino fiable para scrollIntoView.
        window.scrollTo({ top: 0, behavior: "instant" });
        if (!initial) focusHeading(home);
      } else if (topic && !anchor) {
        window.scrollTo({ top: 0, behavior: "instant" });
        focusHeading(topic);
      } else if (destination) {
        destination.scrollIntoView({ block: "start", behavior: smooth ? "smooth" : "instant" });
        if (!initial) focusHeading(destination);
      } else {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
      observeReveals(topic || home || document);
      updateProgress();
    });
    previousView = viewName;
  }

  window.addEventListener("hashchange", () => renderRoute(false));
  document.addEventListener("click", event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    // Repetir un enlace al mismo hash también debe volver a su punto de inicio.
    if (link.getAttribute("href") === location.hash) {
      event.preventDefault();
      renderRoute(false);
    }
  });

  // Búsqueda y categorías combinadas, con comparación insensible a los acentos.
  const tiles = [...document.querySelectorAll(".topic-tile[data-category]")];
  const filters = [...document.querySelectorAll(".filter[data-filter]")];
  const search = document.getElementById("tool-search");
  const filterStatus = document.getElementById("filter-status");
  const emptyState = document.getElementById("empty-state");
  const normalize = text => String(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();
  let selectedFilter = filters.find(button => button.getAttribute("aria-pressed") === "true")?.dataset.filter || "all";

  function updateTools() {
    const words = normalize(search?.value || "").split(/\s+/).filter(Boolean);
    let count = 0;
    tiles.forEach(tile => {
      const text = normalize(`${tile.textContent} ${tile.dataset.search || ""}`);
      const matchesCategory = selectedFilter === "all" || tile.dataset.category === selectedFilter;
      const visible = matchesCategory && words.every(word => text.includes(word));
      tile.hidden = !visible;
      if (visible) {
        count += 1;
        tile.classList.add("is-visible");
      }
    });
    if (filterStatus) filterStatus.textContent = `Mostrando ${count} de ${tiles.length} herramientas.`;
    if (emptyState) emptyState.hidden = count !== 0;
    scheduleProgress();
  }
  filters.forEach(button => button.addEventListener("click", () => {
    selectedFilter = button.dataset.filter || "all";
    filters.forEach(filter => filter.setAttribute("aria-pressed", String(filter === button)));
    updateTools();
  }));
  search?.addEventListener("input", updateTools);

  // El selector recomienda un canal a partir del propósito indicado por el visitante.
  const purposeChoices = [...document.querySelectorAll(".purpose-choice[data-recommend]")];
  const recommendations = [...document.querySelectorAll(".recommendation[data-slug]")];
  function choosePurpose(slug) {
    if (!recommendations.some(panel => panel.dataset.slug === slug)) return;
    purposeChoices.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.recommend === slug)));
    recommendations.forEach(panel => { panel.hidden = panel.dataset.slug !== slug; });
    scheduleProgress();
  }
  purposeChoices.forEach(button => button.addEventListener("click", () => choosePurpose(button.dataset.recommend)));

  // Pausa global y preferencia del sistema; nunca se fuerza movimiento reducido.
  function syncMotion() {
    const effectivePause = userPaused || reduceMotion.matches;
    root.classList.toggle("paused-motion", effectivePause);
    motionButtons.forEach(button => {
      button.setAttribute("aria-pressed", String(effectivePause));
      button.disabled = reduceMotion.matches;
      const label = reduceMotion.matches ? "Movimiento reducido" : userPaused ? "Activar animación" : "Pausar animación";
      const labelNode = button.querySelector("[data-motion-label]");
      if (labelNode) labelNode.textContent = label;
      else button.textContent = label;
    });
    if (effectivePause) scenes.forEach(scene => {
      scene.style.removeProperty("--rx");
      scene.style.removeProperty("--ry");
    });
    if (reduceMotion.matches) {
      revealObserver?.disconnect();
      revealObserver = null;
      root.classList.remove("js-motion");
      document.querySelectorAll(".reveal").forEach(item => item.classList.add("is-visible"));
    } else observeReveals();
  }
  motionButtons.forEach(button => button.addEventListener("click", () => {
    if (reduceMotion.matches) return;
    userPaused = !userPaused;
    syncMotion();
  }));
  if (typeof reduceMotion.addEventListener === "function") reduceMotion.addEventListener("change", syncMotion);
  else reduceMotion.addListener(syncMotion);

  scenes.forEach(scene => {
    let frame = 0;
    let pointer = null;
    scene.addEventListener("pointermove", event => {
      if (event.pointerType !== "mouse" || reduceMotion.matches || userPaused) return;
      pointer = { x: event.clientX, y: event.clientY };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!pointer || reduceMotion.matches || userPaused) return;
        const box = scene.getBoundingClientRect();
        if (!box.width || !box.height) return;
        const x = Math.min(1, Math.max(0, (pointer.x - box.left) / box.width));
        const y = Math.min(1, Math.max(0, (pointer.y - box.top) / box.height));
        scene.style.setProperty("--rx", `${((0.5 - y) * 12).toFixed(2)}deg`);
        scene.style.setProperty("--ry", `${((x - 0.5) * 12).toFixed(2)}deg`);
      });
    });
    scene.addEventListener("pointerleave", () => {
      pointer = null;
      cancelAnimationFrame(frame);
      frame = 0;
      scene.style.removeProperty("--rx");
      scene.style.removeProperty("--ry");
    });
  });

  // El indicador de lectura se calcula sobre la página interna que esté visible.
  let progressFrame = 0;
  function updateProgress() {
    progressFrame = 0;
    if (!progress) return;
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
    progress.style.transform = `scaleX(${ratio})`;
  }
  function scheduleProgress() {
    if (!progressFrame) progressFrame = requestAnimationFrame(updateProgress);
  }
  window.addEventListener("scroll", scheduleProgress, { passive: true });
  window.addEventListener("resize", scheduleProgress, { passive: true });
  window.addEventListener("load", scheduleProgress, { once: true });

  syncMotion();
  updateTools();
  const initialPurpose = purposeChoices.find(button => button.getAttribute("aria-pressed") === "true") || purposeChoices[0];
  if (initialPurpose) choosePurpose(initialPurpose.dataset.recommend);
  renderRoute(true);
})();
