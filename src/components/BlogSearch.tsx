import { useEffect, useMemo, useState } from "preact/hooks";
import type { Lang } from "../i18n/ui";
import {
  formatDate,
  formatNotesCount,
  getTagLabel,
  localePath,
  useTranslations,
} from "../i18n/utils";

export interface SearchablePost {
  id: string;
  title: string;
  description: string;
  pubDate: string;
  tags: string[];
  body?: string;
}

interface Props {
  initialPosts: SearchablePost[];
  allTags: string[];
  lang: Lang;
}

export default function BlogSearch({ initialPosts, allTags, lang }: Props) {
  const t = useTranslations(lang);
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [posts, setPosts] = useState<SearchablePost[]>(initialPosts);
  const [indexLoaded, setIndexLoaded] = useState(false);

  const loadFullIndex = () => {
    if (indexLoaded) return;
    setIndexLoaded(true);
    fetch(localePath(lang, "/search-index.json"))
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SearchablePost[] | null) => {
        if (data) setPosts(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const tag = params.get("tag");
    if (q) {
      setQuery(q);
      loadFullIndex();
    }
    if (tag) setSelectedTags([tag]);
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    );
  };

  const filtered = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return posts.filter((post) => {
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => post.tags.includes(tag));
      if (!matchesTags) return false;

      if (terms.length === 0) return true;
      const tagWords = post.tags
        .map((tag) => `${tag} ${getTagLabel(lang, tag)}`)
        .join(" ");
      const haystack = `${post.title} ${post.description} ${tagWords} ${post.body ?? ""}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [posts, query, selectedTags, lang]);

  return (
    <section class="blog-search">
      <div class="search-controls">
        <label class="sr-only" for="blog-search-input">{t("search.label")}</label>
        <input
          id="blog-search-input"
          type="search"
          class="search-input"
          placeholder={t("search.placeholder")}
          value={query}
          onFocus={loadFullIndex}
          onInput={(e) => {
            loadFullIndex();
            setQuery((e.currentTarget as HTMLInputElement).value);
          }}
        />
        {(query || selectedTags.length > 0) && (
          <button
            type="button"
            class="clear-btn"
            onClick={() => {
              setQuery("");
              setSelectedTags([]);
            }}
          >
            {t("search.clear")}
          </button>
        )}
      </div>

      {allTags.length > 0 && (
        <div class="tag-filter-row" role="group" aria-label={t("search.filterAria")}>
          {allTags.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={active}
                class={`tag-pill ${active ? "is-active" : ""}`}
                onClick={() => toggleTag(tag)}
              >
                #{getTagLabel(lang, tag)}
              </button>
            );
          })}
        </div>
      )}

      <p class="search-count" role="status">
        {formatNotesCount(filtered.length, lang)}
      </p>

      <ul class="post-list">
        {filtered.map((post) => (
          <li key={post.id} class="post-card">
            <a class="post-card__link" href={localePath(lang, `/blog/${post.id}/`)}>
              <time datetime={post.pubDate}>
                {formatDate(post.pubDate, lang)}
              </time>
              <h2>{post.title}</h2>
              <p>{post.description}</p>
            </a>
            {post.tags.length > 0 && (
              <ul class="tag-list">
                {post.tags.map((tag) => (
                  <li key={tag}>
                    <a
                      class="tag-pill"
                      href={localePath(lang, `/tags/${encodeURIComponent(tag)}/`)}
                    >
                      #{getTagLabel(lang, tag)}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}