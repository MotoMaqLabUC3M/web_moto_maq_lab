import type { Block, PartialBlock } from "@blocknote/core";
import type { BlogBlock } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const MEDIA_BASE =
  process.env.NEXT_PUBLIC_MEDIA_URL ??
  `${API_URL.replace(/\/$/, "")}/media`;

export function mediaUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("assets/")) return `/${path}`;
  const clean = path.replace(/^\//, "");
  if (clean.startsWith("media/")) return `${API_URL}/${clean}`;
  return `${MEDIA_BASE}/${clean}`;
}

function uid() {
  return crypto.randomUUID();
}

type InlineItem = {
  type: string;
  text?: string;
  styles?: Record<string, boolean | string>;
  href?: string;
  content?: InlineItem[];
};

function inlineToMarkdown(block: Block): string {
  if (!block.content || !Array.isArray(block.content)) return "";
  return block.content
    .map((item) => inlineItemToMarkdown(item as InlineItem | string))
    .join("");
}

function inlineItemToMarkdown(item: InlineItem | string): string {
  if (typeof item === "string") return item;
  if (item.type === "link" && item.href) {
    const label = (item.content ?? []).map(inlineItemToMarkdown).join("") || item.href;
    return `[${label}](${item.href})`;
  }
  if ("text" in item && item.text != null) {
    let text = String(item.text);
    const styles = item.styles ?? {};
    if (styles.code) text = `\`${text}\``;
    if (styles.bold) text = `**${text}**`;
    if (styles.italic) text = `*${text}*`;
    if (styles.strike) text = `~~${text}~~`;
    return text;
  }
  return "";
}

function markdownToInline(text: string): InlineItem[] {
  if (!text) return [];
  const nodes: InlineItem[] = [];
  const pattern =
    /(\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;

  const pushPlain = (chunk: string) => {
    if (chunk) nodes.push({ type: "text", text: chunk, styles: {} });
  };

  while ((match = pattern.exec(text)) !== null) {
    pushPlain(text.slice(last, match.index));
    const token = match[0];
    last = match.index + token.length;

    if (token.startsWith("**")) {
      nodes.push({
        type: "text",
        text: token.slice(2, -2),
        styles: { bold: true },
      });
    } else if (token.startsWith("*")) {
      nodes.push({
        type: "text",
        text: token.slice(1, -1),
        styles: { italic: true },
      });
    } else if (token.startsWith("~~")) {
      nodes.push({
        type: "text",
        text: token.slice(2, -2),
        styles: { strike: true },
      });
    } else if (token.startsWith("`")) {
      nodes.push({
        type: "text",
        text: token.slice(1, -1),
        styles: { code: true },
      });
    } else if (token.startsWith("[")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        nodes.push({
          type: "link",
          href: linkMatch[2],
          content: [{ type: "text", text: linkMatch[1], styles: {} }],
        });
      }
    }
  }
  pushPlain(text.slice(last));
  return nodes.length ? nodes : [{ type: "text", text, styles: {} }];
}

export function blocksToApi(blocks: Block[]): BlogBlock[] {
  const result: BlogBlock[] = [];
  let listBuffer: string[] = [];
  let listType: "bullet" | "numbered" = "bullet";

  const flushList = () => {
    if (listBuffer.length === 0) return;
    result.push({
      id: uid(),
      type: "list",
      content: { items: [...listBuffer], ordered: listType === "numbered" },
    });
    listBuffer = [];
  };

  for (const block of blocks) {
    if (block.type === "bulletListItem") {
      if (listType !== "bullet" && listBuffer.length) flushList();
      listType = "bullet";
      listBuffer.push(inlineToMarkdown(block));
      continue;
    }
    if (block.type === "numberedListItem") {
      if (listType !== "numbered" && listBuffer.length) flushList();
      listType = "numbered";
      listBuffer.push(inlineToMarkdown(block));
      continue;
    }
    flushList();

    switch (block.type) {
      case "paragraph":
        result.push({
          id: block.id,
          type: "paragraph",
          content: { text: inlineToMarkdown(block) },
        });
        break;
      case "heading": {
        const level = (block.props as { level?: number })?.level ?? 2;
        result.push({
          id: block.id,
          type: "heading",
          content: { text: inlineToMarkdown(block), level },
        });
        break;
      }
      case "quote":
        result.push({
          id: block.id,
          type: "quote",
          content: { text: inlineToMarkdown(block) },
        });
        break;
      case "image": {
        const url = (block.props as { url?: string })?.url ?? "";
        const caption = (block.props as { caption?: string })?.caption ?? "";
        result.push({
          id: block.id,
          type: "image",
          content: { src: stripMediaBase(url), alt: caption },
        });
        break;
      }
      case "file": {
        const url = (block.props as { url?: string })?.url ?? "";
        result.push({
          id: block.id,
          type: "pdf",
          content: { src: stripMediaBase(url) },
        });
        break;
      }
      default:
        if (inlineToMarkdown(block).trim()) {
          result.push({
            id: block.id,
            type: "paragraph",
            content: { text: inlineToMarkdown(block) },
          });
        }
    }
  }
  flushList();
  return result;
}

function stripMediaBase(url: string): string {
  if (!url) return "";
  const prefix = `${API_URL}/media/`;
  if (url.startsWith(prefix)) return url.slice(prefix.length);
  if (url.startsWith("/media/")) return url.slice("/media/".length);
  return url.replace(/^\//, "");
}

const defaultParagraphProps = {
  backgroundColor: "default" as const,
  textColor: "default" as const,
  textAlignment: "left" as const,
};

const defaultHeadingProps = {
  backgroundColor: "default" as const,
  textColor: "default" as const,
  textAlignment: "left" as const,
  level: 2 as const,
};

export function apiToBlocks(blocks: BlogBlock[]): PartialBlock[] {
  const result: PartialBlock[] = [];

  const push = (block: PartialBlock) => {
    result.push(block);
  };

  for (const block of blocks) {
    const text = String(block.content.text ?? "");
    const inline = markdownToInline(text);

    switch (block.type) {
      case "paragraph":
        push({
          id: block.id,
          type: "paragraph",
          props: defaultParagraphProps,
          content: inline,
        } as PartialBlock);
        break;
      case "heading":
        push({
          id: block.id,
          type: "heading",
          props: {
            ...defaultHeadingProps,
            level: (Number(block.content.level ?? 2) || 2) as 1 | 2 | 3,
          },
          content: inline.length ? inline : markdownToInline(text),
        } as PartialBlock);
        break;
      case "quote":
        push({
          id: block.id,
          type: "quote",
          props: defaultParagraphProps,
          content: inline,
        } as PartialBlock);
        break;
      case "image":
        push({
          id: block.id,
          type: "image",
          props: {
            url: mediaUrl(String(block.content.src ?? "")),
            caption: String(block.content.alt ?? ""),
            previewWidth: 512,
            name: "",
            backgroundColor: "default",
            textAlignment: "left",
            showPreview: true,
          },
        } as PartialBlock);
        break;
      case "list": {
        const items = (block.content.items as string[]) ?? [];
        const ordered = Boolean(block.content.ordered);
        for (const item of items) {
          push({
            id: uid(),
            type: ordered ? "numberedListItem" : "bulletListItem",
            props: defaultParagraphProps,
            content: markdownToInline(item),
          } as PartialBlock);
        }
        break;
      }
      case "pdf":
        push({
          id: block.id,
          type: "file",
          props: {
            url: mediaUrl(String(block.content.src ?? "")),
            caption: "",
            name: "document.pdf",
            backgroundColor: "default",
          },
        } as PartialBlock);
        break;
      default:
        break;
    }
  }

  if (result.length === 0) {
    push({
      id: uid(),
      type: "paragraph",
      props: defaultParagraphProps,
      content: [],
    } as PartialBlock);
  }

  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseInlineMarkdown(text: string): string {
  const safe = escapeHtml(text);
  return safe
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/~~(.+?)~~/g, "<s>$1</s>")
    .replace(/`([^`]+)`/g, '<code class="blog-inline-code">$1</code>')
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="blog-inline-a">$1</a>',
    );
}

export function blocksToPreviewHtml(blocks: BlogBlock[]): string {
  let html = "";
  let inSection = false;

  const closeSection = () => {
    if (inSection) {
      html += "</section>";
      inSection = false;
    }
  };

  for (const block of blocks) {
    switch (block.type) {
      case "heading": {
        closeSection();
        const level = Number(block.content.level ?? 2) || 2;
        const tag = level === 1 ? "h1" : level === 3 ? "h3" : "h2";
        const title = String(block.content.text ?? "");
        html += `<section class="sp-text-block"><div class="sp-section-label"><div class="sp-label-line"></div><${tag}>${parseInlineMarkdown(title)}</${tag}></div>`;
        inSection = true;
        break;
      }
      case "quote": {
        if (!inSection) {
          html += '<section class="sp-text-block">';
          inSection = true;
        }
        html += `<blockquote class="blog-quote">${parseInlineMarkdown(String(block.content.text ?? ""))}</blockquote>`;
        break;
      }
      case "paragraph": {
        const text = String(block.content.text ?? "").trim();
        if (!text) break;
        if (!inSection) {
          html += '<section class="sp-text-block">';
          inSection = true;
        }
        html += `<p>${parseInlineMarkdown(text)}</p>`;
        break;
      }
      case "image": {
        closeSection();
        const src = mediaUrl(String(block.content.src ?? ""));
        const alt = escapeHtml(String(block.content.alt ?? ""));
        html += `<figure class="blog-inline-figure"><img src="${src}" alt="${alt}" loading="lazy" /></figure>`;
        break;
      }
      case "pdf": {
        closeSection();
        const src = mediaUrl(String(block.content.src ?? ""));
        html += `<div class="blog-pdf-preview"><a href="${src}" target="_blank" rel="noopener noreferrer">Ver PDF</a></div>`;
        break;
      }
      case "list": {
        if (!inSection) {
          html += '<section class="sp-text-block">';
          inSection = true;
        }
        const items = (block.content.items as string[]) ?? [];
        const ordered = Boolean(block.content.ordered);
        const tag = ordered ? "ol" : "ul";
        html += `<${tag} class="blog-list">`;
        for (const item of items) {
          html += `<li>${parseInlineMarkdown(item)}</li>`;
        }
        html += `</${tag}>`;
        break;
      }
      default:
        break;
    }
  }
  closeSection();
  return html;
}

export function blocksToPlainExcerpt(blocks: BlogBlock[], max = 160): string {
  const text = blocks
    .filter((b) =>
      ["paragraph", "heading", "quote"].includes(b.type),
    )
    .map((b) =>
      String(b.content.text ?? "")
        .replace(/\*\*|~~|`/g, "")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"),
    )
    .join(" ")
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trim() + "…";
}
