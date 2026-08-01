import "server-only";
import { BaseRepository } from "./base";
import type { Goal } from "@/types/finance";

export class PlanningRepository extends BaseRepository<Goal> {
  protected sheetName = "Planning";
  protected headers = [
    "id",
    "userId",
    "title",
    "category",
    "color",
    "targetAmount",
    "currentAmount",
    "monthlyContribution",
    "targetDate",
    "expectedAnnualReturn",
    "createdAt",
    "updatedAt",
  ];

  protected mapRowToEntity(row: string[]): Goal | null {
    if (!row || row.length < 9) return null;

    const [
      id,
      userId,
      title,
      category,
      color,
      targetAmount,
      currentAmount,
      monthlyContribution,
      targetDate,
      expectedAnnualReturn,
      createdAt,
      updatedAt,
    ] = row;

    if (!id || !userId || !title) return null;

    return {
      id,
      userId,
      title,
      category,
      color,
      targetAmount: Number(targetAmount) || 0,
      currentAmount: Number(currentAmount) || 0,
      monthlyContribution: Number(monthlyContribution) || 0,
      targetDate,
      expectedAnnualReturn: Number(expectedAnnualReturn) || 0,
      createdAt: createdAt || targetDate,
      updatedAt: updatedAt || targetDate,
    };
  }

  protected mapEntityToRow(entity: Goal): (string | number | boolean)[] {
    return [
      entity.id,
      entity.userId,
      entity.title,
      entity.category,
      entity.color,
      entity.targetAmount,
      entity.currentAmount,
      entity.monthlyContribution,
      entity.targetDate,
      entity.expectedAnnualReturn,
      entity.createdAt,
      entity.updatedAt,
    ];
  }
}

export const planningRepo = new PlanningRepository();
