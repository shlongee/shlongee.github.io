import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";

export async function GET(context: APIContext) {
  const posts = (await getCollection("blog", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

  const clean = (s: string) => s.replace(/\s+/g, " ").trim();

  return rss({
    title: "Shlongeeland",
    description:
      "GLSL shaders, Raylib HDR rendering, Three.js WebGL experiments, and Astro engineering notes by Shlongee.",
    site: context.site ?? "https://shlongee.github.io",
    items: posts.map((post) => ({
      title: clean(post.data.title),
      pubDate: post.data.pubDate,
      description: clean(post.data.description),
      categories: post.data.tags,
      link: `/blog/${post.id}/`,
    })),
  });
}