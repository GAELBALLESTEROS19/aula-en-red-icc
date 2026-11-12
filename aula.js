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

  cards.forEach((card) => {
    const title = card.querySelector("h3")?.textContent.trim() ?? "Herramienta";
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
      card.style.setProperty("--tilt-y", `${((x - .5) * 4).toFixed(2)}deg`);
      card.style.setProperty("--tilt-x", `${((.5 - y) * 3).toFixed(2)}deg`);
    });
    card.addEventListener("pointerleave", () => {
      card.style.removeProperty("--pointer-x");
      card.style.removeProperty("--pointer-y");
      card.style.removeProperty("--tilt-x");
      card.style.removeProperty("--tilt-y");
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
    const cardImage = card.querySelector(".card-visual img");
    const dialogImage = dialog.querySelector("#dialog-visual");

    dialog.querySelector("#dialog-category").textContent = category;
    dialog.querySelector("#dialog-title").textContent = title;
    dialog.querySelector("#dialog-definition").textContent = definition;
    dialog.querySelector("#dialog-example-label").textContent = exampleLabel;
    dialog.querySelector("#dialog-example").textContent = example;
    dialog.querySelector("#dialog-practice").textContent = practice;
    dialog.querySelector("#dialog-cite").textContent = cite;
    if (cardImage && dialogImage) {
      dialogImage.src = cardImage.currentSrc || cardImage.src;
      dialogImage.alt = cardImage.alt;
      dialogImage.hidden = false;
    }
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
