import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { DEFAULT_LANG, LANGUAGES } from "../../i18n/ui";
import { resolveLang, splitPostId } from "../../i18n/utils";

export const prerender = true;

export function getStaticPaths() {
  return LANGUAGES.map((lang) => ({
    params: { locale: lang === DEFAULT_LANG ? undefined : lang },
  }));
}

function stripMarkdown(raw: string): string {
  return raw
    .replace(/^import\s+.*$/gm, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_`>\[\]()!|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(context: APIContext) {
  const lang = resolveLang(context.params.locale);
  const posts = await getCollection(
    "blog",
    ({ id, data }) => !data.draft && splitPostId(id).lang === lang,
  );

  const index = posts
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .map((post) => ({
      id: splitPostId(post.id).slug,
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate.toISOString(),
      tags: post.data.tags,
      body: stripMarkdown(post.body ?? ""),
    }));

  return new Response(JSON.stringify(index), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}