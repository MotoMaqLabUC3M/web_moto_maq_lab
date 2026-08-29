"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

type SortableListProps<T> = {
  items: T[];
  getId: (item: T) => string;
  onReorder: (ids: string[]) => Promise<void>;
  className?: string;
  renderItem: (
    item: T,
    ctx: {
      dragHandle: ReactNode;
      isDragging: boolean;
    },
  ) => ReactNode;
};

function SortableRow({
  id,
  children,
}: {
  id: string;
  children: (ctx: {
    dragHandle: ReactNode;
    isDragging: boolean;
  }) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : undefined,
    position: isDragging ? ("relative" as const) : undefined,
  };

  const dragHandle = (
    <button
      type="button"
      aria-label="Arrastrar para reordenar"
      className="sortable-handle flex shrink-0 cursor-grab touch-none select-none items-center self-stretch border-0 bg-transparent px-2 text-[var(--app-muted)] active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <GripVertical size={18} />
    </button>
  );

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={isDragging ? "sortable-item sortable-item--dragging" : "sortable-item"}
    >
      {children({ dragHandle, isDragging })}
    </li>
  );
}

export function SortableList<T>({
  items,
  getId,
  onReorder,
  className = "space-y-3",
  renderItem,
}: SortableListProps<T>) {
  const [ordered, setOrdered] = useState(items);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const orderedRef = useRef(ordered);
  const itemsRef = useRef(items);
  const getIdRef = useRef(getId);
  const onReorderRef = useRef(onReorder);

  orderedRef.current = ordered;
  itemsRef.current = items;
  getIdRef.current = getId;
  onReorderRef.current = onReorder;

  useEffect(() => {
    setOrdered(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const ids = ordered.map(getId);
  const activeItem = activeId
    ? ordered.find((item) => getId(item) === activeId)
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrdered((current) => {
      const oldIndex = current.findIndex(
        (item) => getIdRef.current(item) === active.id,
      );
      const newIndex = current.findIndex(
        (item) => getIdRef.current(item) === over.id,
      );
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return current;
      return arrayMove(current, oldIndex, newIndex);
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);

    const { active, over } = event;
    let next = orderedRef.current;

    if (over && active.id !== over.id) {
      const oldIndex = next.findIndex(
        (item) => getIdRef.current(item) === active.id,
      );
      const newIndex = next.findIndex(
        (item) => getIdRef.current(item) === over.id,
      );
      if (oldIndex >= 0 && newIndex >= 0) {
        next = arrayMove(next, oldIndex, newIndex);
        setOrdered(next);
      }
    }

    const originalIds = itemsRef.current.map((item) => getIdRef.current(item));
    const nextIds = next.map((item) => getIdRef.current(item));
    if (originalIds.join() === nextIds.join()) return;

    setSaving(true);
    try {
      await onReorderRef.current(nextIds);
    } catch {
      setOrdered(itemsRef.current);
    } finally {
      setSaving(false);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className={`${className}${saving ? " opacity-90" : ""}`}>
          {ordered.map((item) => {
            const id = getId(item);
            return (
              <SortableRow key={id} id={id}>
                {({ dragHandle, isDragging }) =>
                  renderItem(item, { dragHandle, isDragging })
                }
              </SortableRow>
            );
          })}
        </ul>
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
        {activeItem ? (
          <div className="sortable-overlay rotate-[0.5deg] scale-[1.02] opacity-95 shadow-2xl">
            {renderItem(activeItem, {
              dragHandle: (
                <span className="sortable-handle flex shrink-0 items-center px-2 text-[var(--app-accent)]">
                  <GripVertical size={18} />
                </span>
              ),
              isDragging: true,
            })}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
