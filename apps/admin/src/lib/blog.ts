import type { BlogPost } from "./types";

export type BlogArticleGroup = {
  slug: string;
  sortOrder: number;
  posts: BlogPost[];
  primary: BlogPost;
};

/** Agrupa traducciones (mismo slug) como un único artículo. */
export function groupPostsBySlug(posts: BlogPost[]): BlogArticleGroup[] {
  const map = new Map<string, BlogPost[]>();
  for (const post of posts) {
    const list = map.get(post.slug) ?? [];
    list.push(post);
    map.set(post.slug, list);
  }

  return [...map.entries()]
    .map(([slug, versions]) => {
      const sorted = [...versions].sort((a, b) =>
        a.locale.localeCompare(b.locale),
      );
      const primary =
        sorted.find((p) => p.locale === "es") ?? sorted[0]!;
      return {
        slug,
        sortOrder: Math.min(...sorted.map((p) => p.sort_order)),
        posts: sorted,
        primary,
      };
    })
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder ||
        a.primary.title.localeCompare(b.primary.title, "es"),
    );
}

export function countArticlesBySlug(posts: BlogPost[] | undefined): number {
  if (!posts?.length) return 0;
  return new Set(posts.map((p) => p.slug)).size;
}
