import "server-only";
import { BaseRepository } from "./base";
import type { UserSettings } from "@/types/finance";

export class SettingsRepository extends BaseRepository<UserSettings> {
  protected sheetName = "Settings";
  protected headers = [
    "id",
    "userId",
    "language",
    "currency",
    "theme",
    "updatedAt",
  ];

  protected mapRowToEntity(row: string[]): UserSettings | null {
    if (!row || row.length < 5) return null;

    const [id, userId, language, currency, theme, updatedAt] = row;

    if (!id || !userId) return null;

    return {
      id,
      userId,
      language,
      currency,
      theme,
      updatedAt: updatedAt || new Date().toISOString(),
    };
  }

  protected mapEntityToRow(entity: UserSettings): (string | number | boolean)[] {
    return [
      entity.id,
      entity.userId,
      entity.language,
      entity.currency,
      entity.theme,
      entity.updatedAt,
    ];
  }

  async getByUserId(userId: string): Promise<UserSettings | null> {
    const all = await this.findAll(userId);
    return all.length > 0 ? all[0] : null;
  }

  async upsert(userId: string, settings: Partial<UserSettings>): Promise<UserSettings> {
    const existing = await this.getByUserId(userId);
    const now = new Date().toISOString();

    if (existing) {
      const updated = await this.update(existing.id, userId, {
        ...settings,
        updatedAt: now,
      });
      return updated!;
    } else {
      const newSettings: UserSettings = {
        id: crypto.randomUUID(),
        userId,
        language: settings.language || "en",
        currency: settings.currency || "USD",
        theme: settings.theme || "system",
        updatedAt: now,
      };
      return await this.create(newSettings);
    }
  }
}

export const settingsRepo = new SettingsRepository();
