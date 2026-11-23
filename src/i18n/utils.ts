import {
  DEFAULT_LANG,
  LANGUAGE_META,
  LANGUAGES,
  TAG_DESCRIPTIONS,
  TAG_LABELS,
  ui,
  type Lang,
  type UIKey,
} from "./ui";

export function isValidLang(value: string | undefined): value is Lang {
  return value !== undefined && Object.prototype.hasOwnProperty.call(LANGUAGE_META, value);
}

export function resolveLang(value: string | undefined): Lang {
  return isValidLang(value) ? value : DEFAULT_LANG;
}

export function useTranslations(lang: Lang) {
  return function t(key: UIKey): string {
    return ui[lang][key] ?? ui[DEFAULT_LANG][key];
  };
}

export function localePath(lang: Lang, path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (lang === DEFAULT_LANG) return normalized;
  return normalized === "/" ? `/${lang}/` : `/${lang}${normalized}`;
}

export function stripLocaleFromPath(pathname: string): string {
  for (const lang of LANGUAGES) {
    if (lang === DEFAULT_LANG) continue;
    if (pathname === `/${lang}` || pathname === `/${lang}/`) return "/";
    if (pathname.startsWith(`/${lang}/`)) return pathname.slice(lang.length + 1);
  }
  return pathname;
}

export function getSwitchLocalePath(pathname: string, targetLang: Lang): string {
  return localePath(targetLang, stripLocaleFromPath(pathname));
}

export function getLocalePaths(
  pathname: string,
  overrides?: Partial<Record<Lang, string>>,
): Record<Lang, string> {
  const result = {} as Record<Lang, string>;
  for (const lang of LANGUAGES) {
    result[lang] = overrides?.[lang] ?? getSwitchLocalePath(pathname, lang);
  }
  return result;
}

export function splitPostId(id: string): { lang: Lang; slug: string } {
  for (const lang of LANGUAGES) {
    if (id.startsWith(`${lang}/`)) {
      return { lang, slug: id.slice(lang.length + 1) };
    }
  }
  return { lang: DEFAULT_LANG, slug: id };
}

export function getTagLabel(lang: Lang, tag: string): string {
  return TAG_LABELS[lang][tag] ?? tag;
}

export function getTagDescription(lang: Lang, tag: string): string {
  const preset = TAG_DESCRIPTIONS[lang][tag];
  if (preset) return preset;
  const label = getTagLabel(lang, tag);
  return lang === "ru"
    ? `Технические отчёты и заметки по шейдерам с тегом #${label} на Shlongeeland.`
    : `Dev reports and shader notes tagged #${label} on Shlongeeland.`;
}

export function formatDate(date: Date | string, lang: Lang): string {
  return new Date(date).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const ruPluralRules = new Intl.PluralRules("ru-RU");

export function formatNotesCount(count: number, lang: Lang): string {
  if (lang === "en") {
    return `Showing ${count} ${count === 1 ? "note" : "notes"} found`;
  }
  if (count === 0) return "Заметок не найдено";
  const category = ruPluralRules.select(count);
  if (category === "one") return `Найдена ${count} заметка`;
  if (category === "few") return `Найдено ${count} заметки`;
  return `Найдено ${count} заметок`;
}