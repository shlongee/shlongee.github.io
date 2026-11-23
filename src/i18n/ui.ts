export const LANGUAGE_META = {
  en: { code: "EN", nativeName: "English" },
  ru: { code: "RU", nativeName: "Русский" },
  // To add another language later, just add an entry here:
  // ja: { code: "JA", nativeName: "日本語" },
} as const;

export type Lang = keyof typeof LANGUAGE_META;
export const LANGUAGES = Object.keys(LANGUAGE_META) as Lang[];
export const DEFAULT_LANG: Lang = "en";
export const LANG_STORAGE_KEY = "shlongeeland-lang";

export const ui = {
  en: {
    "site.name": "Shlongeeland",
    "site.author": "Shlongee",
    "site.seoDesc":
      "Technical devlog by Shlongee covering GLSL shaders, Raylib HDR rendering, Three.js WebGL experiments, and Astro engineering.",

    "nav.aria": "Primary navigation",
    "nav.menu": "Menu",
    "nav.home": "Home",
    "nav.blog": "Blog",
    "nav.tags": "Tags",
    "nav.about": "About",

    "controls.themeAria": "Toggle astral / vellum theme",
    "controls.themeTitle": "Toggle theme",
    "controls.crystalAria": "Toggle crystal transparency",
    "controls.crystalTitle": "Toggle crystal glass mode",
    "controls.scaleAria": "Adjust page scale and width",
    "controls.scaleTitle": "Adjust page scale & width",
    "controls.shuffleAria": "Shuffle wormhole colors",
    "controls.shuffleTitle": "Shuffle wormhole colors",
    "controls.langAria": "Change language",
    "controls.langTitle": "Language",
    "controls.langMenuAria": "Select language",

    "scale.label": "Page Scale",
    "scale.narrow": "Narrow",
    "scale.reset": "Reset",
    "scale.wide": "Wide",

    "home.seoTitle": "Shlongeeland — GLSL Shaders, Raylib & WebGL Devlog",
    "home.seoDesc":
      "Technical devlog by Shlongee covering GLSL shaders, Raylib HDR rendering, Three.js WebGL experiments, and Astro engineering.",
    "home.srDesc":
      "Shlongeeland is a technical graphics programming devlog by Shlongee covering GLSL shaders, Raylib HDR bloom and float16 precision, Three.js WebGL wormhole and particle effects, and persistent static sites with Astro.",

    "about.seoTitle": "About Shlongee & This Graphics Blog",
    "about.seoDesc":
      "About Shlongeeland and Shlongee: practical deep dives on Raylib, GLSL shaders, HDR post-processing, Three.js WebGL, and Astro.",

    "blog.seoTitle": "Shader & Graphics Devlog",
    "blog.seoDesc":
      "Practical notes on GLSL shaders, Raylib HDR bloom, Three.js WebGL effects, and graphics bugs turned into clear lessons.",
    "blog.heading": "The Shader Spellbook",
    "blog.lede": "Notes on GLSL shaders, real-time rendering, WebGL, and bug fixes.",
    "blog.updated": "Updated",

    "search.label": "Search posts by word or tag",
    "search.placeholder": "Search words or tags (bloom, raylib, float16)...",
    "search.clear": "Clear",
    "search.filterAria": "Filter by tag",

    "tags.seoTitle": "Topics & Shader Tags",
    "tags.seoDesc":
      "Explore Shlongeeland dev reports by topic: GLSL, HDR bloom, Raylib, Three.js, WebGL shaders, and Astro architecture.",
    "tags.heading": "Topics & Shader Tags",
    "tags.lede": "Pick a topic to browse notes by shader or web cluster.",
    "tags.allTags": "← All tags",
    "tags.detailTitleSuffix": "Articles & Notes",

    "rss.description":
      "GLSL shaders, Raylib HDR rendering, Three.js WebGL experiments, and Astro engineering notes by Shlongee.",
  },
  ru: {
    "site.name": "Shlongeeland",
    "site.author": "Shlongee",
    "site.seoDesc":
      "Технический девлог Shlongee: шейдеры GLSL, HDR-рендеринг в Raylib, WebGL-эксперименты на Three.js и разработка на Astro.",

    "nav.aria": "Основная навигация",
    "nav.menu": "Меню",
    "nav.home": "Главная",
    "nav.blog": "Блог",
    "nav.tags": "Теги",
    "nav.about": "О сайте",

    "controls.themeAria": "Переключить тёмную / светлую тему",
    "controls.themeTitle": "Сменить тему",
    "controls.crystalAria": "Переключить кристальную прозрачность",
    "controls.crystalTitle": "Режим кристального стекла",
    "controls.scaleAria": "Настроить масштаб и ширину страницы",
    "controls.scaleTitle": "Масштаб и ширина страницы",
    "controls.shuffleAria": "Сменить палитру червоточины",
    "controls.shuffleTitle": "Сменить палитру червоточины",
    "controls.langAria": "Сменить язык",
    "controls.langTitle": "Язык",
    "controls.langMenuAria": "Выбрать язык",

    "scale.label": "Масштаб",
    "scale.narrow": "Уже",
    "scale.reset": "Сброс",
    "scale.wide": "Шире",

    "home.seoTitle": "Shlongeeland — Девлог о шейдерах GLSL, Raylib и WebGL",
    "home.seoDesc":
      "Технический девлог Shlongee: шейдеры GLSL, HDR-рендеринг в Raylib, WebGL-эксперименты на Three.js и разработка на Astro.",
    "home.srDesc":
      "Shlongeeland — технический девлог по программированию графики от Shlongee: шейдеры GLSL, HDR-bloom и точность float16 в Raylib, вормхол и частицы на Three.js и WebGL, а также статические сайты с постоянным холстом на Astro.",

    "about.seoTitle": "О Shlongee и этом блоге о графике",
    "about.seoDesc":
      "О проекте Shlongeeland и авторе Shlongee: практические заметки о Raylib, шейдерах GLSL, HDR-постобработке, Three.js, WebGL и Astro.",

    "blog.seoTitle": "Девлог о шейдерах и графике",
    "blog.seoDesc":
      "Практические заметки о шейдерах GLSL, HDR-bloom в Raylib, эффектах WebGL на Three.js и багах графики, превращённых в ясные уроки.",
    "blog.heading": "Гримуар шейдеров",
    "blog.lede": "Заметки о шейдерах GLSL, рендеринге в реальном времени, WebGL и исправлении багов.",
    "blog.updated": "Обновлено",

    "search.label": "Поиск записей по словам и тегам",
    "search.placeholder": "Поиск по словам и тегам (bloom, raylib, float16)...",
    "search.clear": "Сбросить",
    "search.filterAria": "Фильтр по тегам",

    "tags.seoTitle": "Темы и теги шейдеров",
    "tags.seoDesc":
      "Изучайте отчёты Shlongeeland по темам: GLSL, HDR-bloom, Raylib, Three.js, шейдеры WebGL и архитектура Astro.",
    "tags.heading": "Темы и теги шейдеров",
    "tags.lede": "Выберите тему, чтобы отфильтровать заметки по шейдерам и веб-технологиям.",
    "tags.allTags": "← Все теги",
    "tags.detailTitleSuffix": "заметки по тегу",

    "rss.description":
      "Шейдеры GLSL, HDR-рендеринг в Raylib, WebGL-эксперименты на Three.js и заметки об Astro от Shlongee.",
  },
} as const;

export type UIKey = keyof typeof ui.en;

export const TAG_LABELS: Record<Lang, Record<string, string>> = {
  en: {},
  ru: {
    shaders: "шейдеры",
    graphics: "графика",
  },
};

export const TAG_DESCRIPTIONS: Record<Lang, Record<string, string>> = {
  en: {
    glsl: "GLSL fragment and vertex shader math, multi-mip bloom passes, and interactive WebGL visualizers.",
    shaders: "Real-time shader spellcraft: GLSL lighting, HDR bloom chains, seamless noise, and Fresnel rim glow.",
    raylib: "Real-time rendering, custom shader pipelines, post-processing passes, and GPU profiling in Raylib.",
    hdr: "High dynamic range framebuffers, float16 precision, and eliminating 8-bit glow color banding.",
    bloom: "Multi-mip bloom chains, soft-knee thresholds, Jimenez 13-tap blur, and exponential particle glow.",
    webgl: "Custom RawShaderMaterial experiments, seamless polar wormhole tunnels, and GPU-rendered typography.",
    threejs: "Interactive Three.js scenes, instanced buffer geometry, LatheGeometry meshes, and raycasting.",
    astro: "Static engineering with Astro ClientRouter, persistent WebGL canvases, MDX, and Preact search.",
    graphics: "Graphics programming experiments, rendering pipelines, GPU profiling, and visual shader math.",
  },
  ru: {
    glsl: "Математика фрагментных и вершинных шейдеров GLSL, многоуровневый bloom и интерактивные WebGL-визуализаторы.",
    shaders: "Магия шейдеров реального времени: освещение в GLSL, цепочки HDR-bloom, бесшовный шум и свечение Френеля.",
    raylib: "Рендеринг в реальном времени, кастомные пайплайны шейдеров, постобработка и профилирование GPU в Raylib.",
    hdr: "Буферы кадра с высоким динамическим диапазоном, точность float16 и устранение 8-битного бандинга.",
    bloom: "Многоуровневые цепочки bloom, порог soft-knee, 13-выборочное размытие Хименеса и экспоненциальное свечение частиц.",
    webgl: "Эксперименты с RawShaderMaterial, бесшовные полярные туннели-вормхолы и рендеринг типографики на GPU.",
    threejs: "Интерактивные сцены на Three.js, инстансинг буферной геометрии, меши LatheGeometry и рейкастинг.",
    astro: "Статическая архитектура на Astro ClientRouter, непрерывные WebGL-холсты, MDX и поиск на Preact.",
    graphics: "Эксперименты с графическим программированием, пайплайны рендеринга, профилирование GPU и математика шейдеров.",
  },
};