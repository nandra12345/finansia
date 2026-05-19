"use client";

import { BookText, Link2, Plus, Search, Tag, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { RichTextEditor } from "@/components/features/diary/rich-text-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDiaryStore } from "@/store/use-diary-store";
import { useFinanceStore } from "@/store/use-finance-store";
import { usePlanningStore } from "@/store/use-planning-store";
import type { DiaryNoteInput } from "@/types/finance";
import { useTranslation } from "@/hooks/use-translation";

function stripHtml(value: string) {
  return value.replace(/<[^>]*>?/gm, "").trim();
}

export default function DiaryPage() {
  const notes = useDiaryStore((state) => state.notes);
  const addNote = useDiaryStore((state) => state.addNote);
  const updateNote = useDiaryStore((state) => state.updateNote);
  const removeNote = useDiaryStore((state) => state.removeNote);

  const goals = usePlanningStore((state) => state.goals);
  const transactions = useFinanceStore((state) => state.transactions);

  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");

  const filteredNotes = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return notes.filter((note) => {
      if (!keyword) {
        return true;
      }

      return (
        note.title.toLowerCase().includes(keyword) ||
        stripHtml(note.content).toLowerCase().includes(keyword) ||
        note.tags.some((tag) => tag.toLowerCase().includes(keyword))
      );
    });
  }, [notes, search]);

  const resolvedSelectedId =
    selectedId && notes.some((note) => note.id === selectedId)
      ? selectedId
      : notes[0]?.id ?? null;

  const activeNote = notes.find((note) => note.id === resolvedSelectedId) ?? null;

  const createNote = () => {
    const payload: DiaryNoteInput = {
      title: t("diary.untitledNote"),
      content: "",
      tags: [],
      date: new Date().toISOString(),
      relatedGoalIds: [],
      relatedTransactionIds: [],
    };

    const created = addNote(payload);
    setSelectedId(created.id);
    toast.success("New note created.");
  };

  const addTag = () => {
    if (!activeNote) {
      return;
    }

    const nextTag = tagInput.trim();
    if (!nextTag) {
      return;
    }

    if (activeNote.tags.includes(nextTag)) {
      toast.error("Tag already exists.");
      return;
    }

    updateNote(activeNote.id, { tags: [...activeNote.tags, nextTag] });
    setTagInput("");
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col gap-4 lg:flex-row">
      <aside className="w-full shrink-0 lg:w-80">
        <Card className="h-full">
          <CardContent className="flex h-full flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold">{t("diary.title")}</h1>
              <Button size="icon" variant="ghost" onClick={createNote}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("diary.searchPlaceholder")}
                className="pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="space-y-2 overflow-y-auto">
              {filteredNotes.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">{t("diary.noNotes")}</p>
              ) : (
                filteredNotes.map((note) => (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => setSelectedId(note.id)}
                    className={cn(
                      "w-full rounded-lg border p-3 text-left transition-colors",
                      resolvedSelectedId === note.id
                        ? "border-blue-500/40 bg-blue-500/5"
                        : "border-border hover:bg-muted/40"
                    )}
                  >
                    <p className="truncate text-sm font-medium">{note.title || t("diary.untitledNote")}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {stripHtml(note.content) || t("diary.noContent")}
                    </p>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {new Date(note.date).toLocaleDateString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </aside>

      <section className="flex-1">
        <Card className="h-full">
          <CardContent className="flex h-full flex-col gap-4 p-4">
            {activeNote ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <Input
                    className="h-auto border-none px-0 text-3xl font-semibold shadow-none focus-visible:ring-0"
                    value={activeNote.title}
                    onChange={(event) =>
                      updateNote(activeNote.id, {
                        title: event.target.value,
                      })
                    }
                    placeholder={t("diary.noteTitle")}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      removeNote(activeNote.id);
                      toast.success("Note deleted.");
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  {activeNote.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => {
                      updateNote(activeNote.id, {
                        tags: activeNote.tags.filter((item) => item !== tag),
                      });
                    }}>
                      {tag}
                    </Badge>
                  ))}
                  <Input
                    className="h-7 w-32"
                    placeholder={t("diary.addTag")}
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button size="sm" variant="outline" onClick={addTag}>
                    {t("common.confirm")}
                  </Button>
                </div>

                <RichTextEditor
                  value={activeNote.content}
                  onChange={(value) => updateNote(activeNote.id, { content: value })}
                  className="flex-1"
                />

                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="space-y-2 rounded-lg border p-3">
                    <p className="flex items-center gap-1 text-sm font-medium">
                      <Link2 className="h-4 w-4" /> {t("diary.relatedGoals")}
                    </p>
                    <div className="max-h-24 space-y-1 overflow-y-auto">
                      {goals.length === 0 ? (
                        <p className="text-xs text-muted-foreground">{t("diary.noGoalsAvailable")}</p>
                      ) : (
                        goals.map((goal) => {
                          const active = activeNote.relatedGoalIds.includes(goal.id);
                          return (
                            <button
                              key={goal.id}
                              type="button"
                              className={cn(
                                "block w-full rounded-md border px-2 py-1 text-left text-xs",
                                active
                                  ? "border-blue-500/40 bg-blue-500/10"
                                  : "border-border hover:bg-muted/40"
                              )}
                              onClick={() => {
                                const next = active
                                  ? activeNote.relatedGoalIds.filter((id) => id !== goal.id)
                                  : [...activeNote.relatedGoalIds, goal.id];

                                updateNote(activeNote.id, { relatedGoalIds: next });
                              }}
                            >
                              {goal.title}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 rounded-lg border p-3">
                    <p className="flex items-center gap-1 text-sm font-medium">
                      <BookText className="h-4 w-4" /> {t("diary.relatedTransactions")}
                    </p>
                    <div className="max-h-24 space-y-1 overflow-y-auto">
                      {transactions.length === 0 ? (
                        <p className="text-xs text-muted-foreground">{t("diary.noTransactionsAvailable")}</p>
                      ) : (
                        transactions.slice(0, 12).map((transaction) => {
                          const active = activeNote.relatedTransactionIds.includes(transaction.id);
                          return (
                            <button
                              key={transaction.id}
                              type="button"
                              className={cn(
                                "block w-full rounded-md border px-2 py-1 text-left text-xs",
                                active
                                  ? "border-blue-500/40 bg-blue-500/10"
                                  : "border-border hover:bg-muted/40"
                              )}
                              onClick={() => {
                                const next = active
                                  ? activeNote.relatedTransactionIds.filter((id) => id !== transaction.id)
                                  : [...activeNote.relatedTransactionIds, transaction.id];

                                updateNote(activeNote.id, { relatedTransactionIds: next });
                              }}
                            >
                              {transaction.description}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <BookText className="mb-3 h-10 w-10 text-muted-foreground" />
                <h2 className="text-xl font-semibold">{t("diary.selectOrCreate")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("diary.selectDescription")}
                </p>
                <Button className="mt-4" onClick={createNote}>
                  {t("diary.createNote")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

