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
    userId: "", // PERBAIKAN: Menambahkan properti wajib 'userId' agar sesuai dengan tipe data DiaryNote
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
  isLoading: boolean;
  error: string | null;
  fetchNotes: () => Promise<void>;
  addNote: (input: DiaryNoteInput) => Promise<DiaryNote>;
  updateNote: (id: string, updates: Partial<DiaryNoteInput>) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
}

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set, get) => ({
      notes: [],
      isLoading: false,
      error: null,

      fetchNotes: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/notes");
          if (!response.ok) throw new Error("Failed to fetch notes");
          const data = await response.json();
          set({ notes: data, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      addNote: async (input) => {
        const note = createNote(input);
        // Optimistic update
        set((state) => ({ notes: [note, ...state.notes] }));

        try {
          const payload = {
            id: note.id,
            title: note.title,
            content: note.content,
            tags: note.tags,
            date: note.date,
            relatedGoalIds: note.relatedGoalIds,
            relatedTransactionIds: note.relatedTransactionIds,
          };
          const response = await fetch("/api/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!response.ok) throw new Error("Failed to save note");
          const saved = await response.json();
          set((state) => ({
            notes: state.notes.map((n) => (n.id === note.id ? saved : n)),
          }));
          return saved;
        } catch (error) {
          // Rollback
          set((state) => ({
            notes: state.notes.filter((n) => n.id !== note.id),
            error: (error as Error).message,
          }));
          throw error;
        }
      },

      updateNote: async (id, updates) => {
        const previousNotes = get().notes;
        const now = nowIso();

        set((state) => ({
          notes: state.notes.map((note) => {
            if (note.id !== id) return note;
            return {
              ...note,
              ...updates,
              title: updates.title?.trim() ?? note.title,
              tags: updates.tags ?? note.tags,
              relatedGoalIds: updates.relatedGoalIds ?? note.relatedGoalIds,
              relatedTransactionIds: updates.relatedTransactionIds ?? note.relatedTransactionIds,
              updatedAt: now,
            };
          }),
        }));

        try {
          const response = await fetch("/api/notes", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, ...updates }),
          });
          if (!response.ok) throw new Error("Failed to update note");
        } catch (error) {
          set({ notes: previousNotes, error: (error as Error).message });
          throw error;
        }
      },

      removeNote: async (id) => {
        const previousNotes = get().notes;

        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        }));

        try {
          const response = await fetch(`/api/notes?id=${id}`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error("Failed to delete note");
        } catch (error) {
          set({ notes: previousNotes, error: (error as Error).message });
          throw error;
        }
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
              userId: String(note.userId ?? ""), // PERBAIKAN: Menambahkan placeholder migrasi local storage lama
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

        return persistedState as DiaryState;
      },
    }
  )
);

export type { DiaryNote as Note };