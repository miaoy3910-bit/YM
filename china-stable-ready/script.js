const searchInput = document.querySelector("#searchInput");
const searchSummary = document.querySelector("#searchSummary");
const searchableBlocks = document.querySelectorAll("[data-searchable]");
const searchableTexts = document.querySelectorAll(".searchable-text");
const detailBlocks = document.querySelectorAll("details.library-card");
const expandAllBtn = document.querySelector("#expandAllBtn");
const collapseAllBtn = document.querySelector("#collapseAllBtn");
const resetFiltersBtn = document.querySelector("#resetFiltersBtn");
const printBtn = document.querySelector("#printBtn");
const topbar = document.querySelector(".topbar");
const revealTargets = document.querySelectorAll("[data-reveal]");
const filterButtons = document.querySelectorAll(".filter-chip");
const tiltTargets = document.querySelectorAll("[data-tilt]");
const lightbox = document.querySelector("#imageLightbox");
const lightboxImage = document.querySelector("#lightboxImage");
const lightboxCaption = document.querySelector("#lightboxCaption");
const lightboxClosers = document.querySelectorAll("[data-lightbox-close]");

const originalTextMap = new WeakMap();
const state = {
  version: "all",
  type: "all",
  keyword: "",
};

let printState = [];
let lastLightboxTrigger = null;

searchableTexts.forEach((node) => {
  originalTextMap.set(node, node.innerHTML);
});

function assignRevealProfile(selector, config) {
  const {
    x = 0,
    y = 28,
    scale = 0.985,
    rotateX = 8,
    rotateY = 0,
    blur = 18,
    step = 38,
    maxDelay = 320,
    start = 0,
  } = config;

  document.querySelectorAll(selector).forEach((node, index) => {
    const offsetIndex = config.groupModulo ? index % config.groupModulo : index;
    const delay = Math.min(start + offsetIndex * step, maxDelay);
    node.style.setProperty("--reveal-delay", `${delay}ms`);
    node.style.setProperty("--reveal-x", `${typeof x === "function" ? x(index) : x}px`);
    node.style.setProperty("--reveal-y", `${typeof y === "function" ? y(index) : y}px`);
    node.style.setProperty("--reveal-scale", `${typeof scale === "function" ? scale(index) : scale}`);
    node.style.setProperty("--reveal-rotate-x", `${typeof rotateX === "function" ? rotateX(index) : rotateX}deg`);
    node.style.setProperty("--reveal-rotate-y", `${typeof rotateY === "function" ? rotateY(index) : rotateY}deg`);
    node.style.setProperty("--reveal-blur", `${typeof blur === "function" ? blur(index) : blur}px`);
  });
}

assignRevealProfile(".hero-copy", {
  x: -34,
  y: 14,
  scale: 0.978,
  rotateX: 0,
  rotateY: -10,
  blur: 24,
  step: 0,
  start: 40,
});

assignRevealProfile(".hero-panel", {
  x: 42,
  y: 18,
  scale: 0.968,
  rotateX: 2,
  rotateY: 10,
  blur: 24,
  step: 0,
  start: 110,
});

assignRevealProfile(".hero-wordmark-stage", {
  x: 26,
  y: 22,
  scale: 0.97,
  rotateX: 4,
  rotateY: 8,
  blur: 20,
  step: 0,
  start: 170,
});

assignRevealProfile(".hero-floating-pill", {
  x: (index) => (index === 1 ? 16 : -16),
  y: 20,
  scale: 0.99,
  rotateX: 4,
  rotateY: (index) => (index % 2 === 0 ? -6 : 6),
  blur: 12,
  step: 55,
  start: 220,
  maxDelay: 320,
});

assignRevealProfile(".section-heading, .toolbar-card", {
  x: 0,
  y: 34,
  scale: 0.986,
  rotateX: 8,
  rotateY: 0,
  blur: 18,
  step: 45,
  start: 40,
});

assignRevealProfile(".stat-card", {
  x: (index) => (index % 2 === 0 ? -10 : 10),
  y: 26,
  scale: 0.988,
  rotateX: 10,
  rotateY: (index) => (index % 2 === 0 ? -6 : 6),
  blur: 16,
  step: 55,
  start: 40,
});

assignRevealProfile(".quick-chip", {
  x: 0,
  y: 20,
  scale: 0.992,
  rotateX: 9,
  rotateY: (index) => (index % 3 === 0 ? -5 : 5),
  blur: 14,
  step: 34,
  start: 30,
  maxDelay: 260,
});

assignRevealProfile(".library-card", {
  x: (index) => (index % 2 === 0 ? -18 : 18),
  y: 36,
  scale: 0.985,
  rotateX: 10,
  rotateY: (index) => (index % 2 === 0 ? -8 : 8),
  blur: 18,
  step: 56,
  start: 50,
});

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  revealTargets.forEach((node) => {
    revealObserver.observe(node);
  });
} else {
  revealTargets.forEach((node) => {
    node.classList.add("is-visible");
  });
}

function resetHighlights() {
  searchableTexts.forEach((node) => {
    node.innerHTML = originalTextMap.get(node);
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightKeyword(keyword) {
  if (!keyword) {
    return;
  }

  const pattern = new RegExp(`(${escapeRegExp(keyword)})`, "gi");

  searchableTexts.forEach((node) => {
    node.innerHTML = originalTextMap.get(node).replace(pattern, "<mark>$1</mark>");
  });
}

function updateFilterButtons() {
  filterButtons.forEach((button) => {
    const group = button.dataset.filterGroup;
    const value = button.dataset.filterValue;
    button.classList.toggle("is-active", state[group] === value);
  });
}

function updateSearchSummary(visibleCount, drinkCount) {
  if (!state.keyword && state.version === "all" && state.type === "all") {
    searchSummary.textContent = "当前显示全部内容。";
    return;
  }

  if (visibleCount === 0) {
    searchSummary.textContent = "当前筛选条件下没有找到匹配内容。";
    return;
  }

  searchSummary.textContent = `已显示 ${visibleCount} 个模块，其中包含 ${drinkCount} 个饮品配方。`;
}

function updateSearch() {
  const keyword = state.keyword.trim().toLowerCase();

  resetHighlights();

  let visibleCount = 0;
  let drinkCount = 0;

  searchableBlocks.forEach((block) => {
    const matchesVersion = state.version === "all" || block.dataset.version === state.version;
    const matchesType = state.type === "all" || block.dataset.type === state.type;
    const haystack = `${block.dataset.name || ""} ${block.textContent}`.toLowerCase();
    const matchesKeyword = !keyword || haystack.includes(keyword);
    const isMatch = matchesVersion && matchesType && matchesKeyword;

    block.classList.toggle("is-filtered-out", !isMatch);

    if (isMatch) {
      visibleCount += 1;

      if (block.dataset.type === "drink") {
        drinkCount += 1;
      }

      if (keyword && block.tagName === "DETAILS") {
        block.open = true;
      }
    }
  });

  if (keyword) {
    highlightKeyword(state.keyword.trim());
  }

  updateSearchSummary(visibleCount, drinkCount);
}

function openLightbox(trigger) {
  if (!lightbox || !lightboxImage || !lightboxCaption) {
    return;
  }

  lastLightboxTrigger = trigger;
  lightboxImage.src = trigger.dataset.lightboxSrc || "";
  lightboxImage.alt = trigger.dataset.lightboxAlt || "";
  lightboxCaption.textContent = trigger.dataset.lightboxCaption || "配方原图";
  lightbox.classList.add("is-active");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("has-lightbox-open");
}

function closeLightbox() {
  if (!lightbox || !lightbox.classList.contains("is-active")) {
    return;
  }

  lightbox.classList.remove("is-active");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("has-lightbox-open");

  window.setTimeout(() => {
    lightboxImage.src = "";
    lightboxImage.alt = "";

    if (lastLightboxTrigger) {
      lastLightboxTrigger.focus();
    }
  }, 260);
}

searchInput.addEventListener("input", () => {
  state.keyword = searchInput.value;
  updateSearch();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state[button.dataset.filterGroup] = button.dataset.filterValue;
    updateFilterButtons();
    updateSearch();
  });
});

expandAllBtn.addEventListener("click", () => {
  detailBlocks.forEach((block) => {
    if (!block.classList.contains("is-filtered-out")) {
      block.open = true;
    }
  });
});

collapseAllBtn.addEventListener("click", () => {
  detailBlocks.forEach((block) => {
    if (!block.classList.contains("is-filtered-out")) {
      block.open = false;
    }
  });
});

resetFiltersBtn.addEventListener("click", () => {
  state.version = "all";
  state.type = "all";
  state.keyword = "";
  searchInput.value = "";
  updateFilterButtons();
  updateSearch();
});

printBtn.addEventListener("click", () => {
  window.print();
});

window.addEventListener("beforeprint", () => {
  printState = Array.from(detailBlocks, (block) => ({
    block,
    open: block.open,
  }));

  detailBlocks.forEach((block) => {
    block.open = true;
  });
});

window.addEventListener("afterprint", () => {
  printState.forEach(({ block, open }) => {
    block.open = open;
  });
});

window.addEventListener(
  "scroll",
  () => {
    topbar.classList.toggle("is-compact", window.scrollY > 20);
  },
  { passive: true }
);

if (window.matchMedia("(pointer: fine)").matches) {
  tiltTargets.forEach((node) => {
    node.addEventListener("mousemove", (event) => {
      const rect = node.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rotateY = (px - 0.5) * 10;
      const rotateX = (0.5 - py) * 10;
      const depth = Number(node.dataset.tiltDepth || 12);

      node.classList.add("is-tilting");
      node.style.setProperty("--tilt-x", `${rotateX}deg`);
      node.style.setProperty("--tilt-y", `${rotateY}deg`);
      node.style.setProperty("--lift-z", `${depth}px`);
    });

    node.addEventListener("mouseleave", () => {
      node.classList.remove("is-tilting");
      node.style.setProperty("--tilt-x", "0deg");
      node.style.setProperty("--tilt-y", "0deg");
      node.style.setProperty("--lift-z", "0px");
    });
  });
}

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-lightbox-src]");

  if (!trigger) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  openLightbox(trigger);
});

lightboxClosers.forEach((closer) => {
  closer.addEventListener("click", closeLightbox);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeLightbox();
  }
});

updateFilterButtons();
updateSearch();
