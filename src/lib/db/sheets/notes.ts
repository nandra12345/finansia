import "server-only";
import { BaseRepository } from "./base";
import type { DiaryNote } from "@/types/finance";

export class NotesRepository extends BaseRepository<DiaryNote> {
  protected sheetName = "Notes";
  protected headers = [
    "id",
    "userId",
    "title",
    "content",
    "tags",
    "date",
    "relatedGoalIds",
    "relatedTransactionIds",
    "createdAt",
    "updatedAt",
  ];

  protected mapRowToEntity(row: string[]): DiaryNote | null {
    if (!row || row.length < 6) return null;

    const [
      id,
      userId,
      title,
      content,
      tags,
      date,
      relatedGoalIds,
      relatedTransactionIds,
      createdAt,
      updatedAt,
    ] = row;

    if (!id || !userId || !title) return null;

    return {
      id,
      userId,
      title,
      content,
      tags: tags ? tags.split(",").map(t => t.trim()) : [],
      date,
      relatedGoalIds: relatedGoalIds ? relatedGoalIds.split(",") : [],
      relatedTransactionIds: relatedTransactionIds ? relatedTransactionIds.split(",") : [],
      createdAt: createdAt || date,
      updatedAt: updatedAt || date,
    };
  }

  protected mapEntityToRow(entity: DiaryNote): (string | number | boolean)[] {
    return [
      entity.id,
      entity.userId,
      entity.title,
      entity.content,
      entity.tags.join(","),
      entity.date,
      entity.relatedGoalIds.join(","),
      entity.relatedTransactionIds.join(","),
      entity.createdAt,
      entity.updatedAt,
    ];
  }
}

export const notesRepo = new NotesRepository();
