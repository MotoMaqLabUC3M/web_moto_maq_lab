"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { es } from "@blocknote/core/locales";
import type { Block } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { api } from "@/lib/api";
import { apiToBlocks, blocksToApi, mediaUrl } from "@/lib/blocks";
import type { BlogBlock } from "@/lib/types";

type Props = {
  initialBlocks: BlogBlock[];
  slug: string;
  onChange: (blocks: BlogBlock[]) => void;
};

function BlogEditorInner({ initialBlocks, slug, onChange }: Props) {
  const seeded = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const uploadFile = useCallback(
    async (file: File) => {
      const { path } = await api.uploadMedia(file, slug);
      return mediaUrl(path);
    },
    [slug],
  );

  const editor = useCreateBlockNote(
    {
      dictionary: es,
      uploadFile,
      placeholders: {
        default: "Escribe / para insertar bloques…",
        emptyDocument: "Empieza a escribir tu entrada…",
      },
    },
    [slug],
  );

  const sync = useCallback((blocks: Block[]) => {
    onChangeRef.current(blocksToApi(blocks));
  }, []);

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const blocks = apiToBlocks(initialBlocks);
    editor.replaceBlocks(editor.document, blocks);
    sync(editor.document);
  }, [editor, initialBlocks, sync]);

  useEffect(() => {
    return editor.onChange(() => sync(editor.document));
  }, [editor, sync]);

  return (
    <div className="blog-editor space-y-2">
      <p className="text-xs text-[var(--app-muted)] lg:text-sm">
        Escribe{" "}
        <kbd className="rounded bg-[var(--app-surface-2)] px-1.5 py-0.5 font-mono text-[10px]">
          /
        </kbd>{" "}
        para bloques · selecciona texto para formato
      </p>
      <div className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] [&_.bn-editor]:min-h-[360px] [&_.bn-editor]:px-4 [&_.bn-editor]:py-3 lg:[&_.bn-editor]:min-h-[480px]">
        <BlockNoteView
          editor={editor}
          theme="dark"
          slashMenu
          sideMenu
          formattingToolbar
          linkToolbar
          filePanel
          emojiPicker={false}
          tableHandles={false}
          comments={false}
        />
      </div>
    </div>
  );
}

export const BlogEditor = memo(BlogEditorInner);
