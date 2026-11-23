import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { DEFAULT_LANG, LANGUAGES } from "../../i18n/ui";
import { localePath, resolveLang, splitPostId, useTranslations } from "../../i18n/utils";

export function getStaticPaths() {
  return LANGUAGES.map((lang) => ({
    params: { locale: lang === DEFAULT_LANG ? undefined : lang },
  }));
}

export async function GET(context: APIContext) {
  const lang = resolveLang(context.params.locale);
  const t = useTranslations(lang);

  const posts = (
    await getCollection(
      "blog",
      ({ id, data }) => !data.draft && splitPostId(id).lang === lang,
    )
  ).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const clean = (s: string) => s.replace(/\s+/g, " ").trim();

  return rss({
    title: lang === "ru" ? "Shlongeeland (RU)" : "Shlongeeland",
    description: t("rss.description"),
    site: context.site ?? "https://shlongee.github.io",
    items: posts.map((post) => {
      const { slug } = splitPostId(post.id);
      return {
        title: clean(post.data.title),
        pubDate: post.data.pubDate,
        description: clean(post.data.description),
        categories: post.data.tags,
        link: localePath(lang, `/blog/${slug}/`),
      };
    }),
  });
}