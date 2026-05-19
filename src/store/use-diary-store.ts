import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { DiaryNote, DiaryNoteInput } from "@/types/finance";

const nowIso = () => new Date().toISOString();

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const createNote = (input: DiaryNoteInput): DiaryNote => {
  const timestamp = nowIso();

  return {
    id: input.id ?? createId(),
    title: input.title.trim(),
    content: input.content,
    tags: input.tags,
    date: input.date,
    relatedGoalIds: input.relatedGoalIds,
    relatedTransactionIds: input.relatedTransactionIds,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

interface DiaryState {
  notes: DiaryNote[];
  addNote: (input: DiaryNoteInput) => DiaryNote;
  updateNote: (id: string, updates: Partial<DiaryNoteInput>) => void;
  removeNote: (id: string) => void;
}

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set) => ({
      notes: [],
      addNote: (input) => {
        const note = createNote(input);
        set((state) => ({ notes: [note, ...state.notes] }));
        return note;
      },
      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((note) => {
            if (note.id !== id) {
              return note;
            }

            return {
              ...note,
              ...updates,
              title: updates.title?.trim() ?? note.title,
              tags: updates.tags ?? note.tags,
              relatedGoalIds: updates.relatedGoalIds ?? note.relatedGoalIds,
              relatedTransactionIds: updates.relatedTransactionIds ?? note.relatedTransactionIds,
              updatedAt: nowIso(),
            };
          }),
        }));
      },
      removeNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        }));
      },
    }),
    {
      name: "diary-storage",
      version: 2,
      migrate: (persistedState, version) => {
        if (version < 2) {
          const legacyState = persistedState as { notes?: Array<Record<string, unknown>> };
          return {
            ...legacyState,
            notes: (legacyState.notes ?? []).map((note) => ({
              id: String(note.id ?? createId()),
              title: String(note.title ?? "Untitled Note"),
              content: String(note.content ?? ""),
              tags: Array.isArray(note.tags)
                ? note.tags.filter((tag): tag is string => typeof tag === "string")
                : [],
              date: String(note.date ?? nowIso()),
              relatedGoalIds: [],
              relatedTransactionIds: [],
              createdAt: String(note.createdAt ?? nowIso()),
              updatedAt: String(note.updatedAt ?? nowIso()),
            })),
          };
        }

        return persistedState;
      },
    }
  )
);

export type { DiaryNote as Note };

