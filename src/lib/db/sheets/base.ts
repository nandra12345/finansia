import "server-only";
import type { sheets_v4 } from "googleapis";
import { getSheetsClient, getSpreadsheetId } from "./client";

export abstract class BaseRepository<T extends { id: string; userId: string }> {
  protected abstract sheetName: string;
  protected abstract headers: string[];

  protected async getSheets() {
    return await getSheetsClient();
  }

  protected getRange(range?: string) {
    // Google Sheets tab names are case-sensitive. Some deployments may use localized tab names.
    // Keep range building based on `sheetName` but let `getAllRows()` attempt a fallback lookup.
    return range ? `${this.sheetName}!${range}` : `${this.sheetName}!A:Z`;
  }


  protected async getAllRows(): Promise<string[][]> {
    const sheets = await this.getSheets();
    const spreadsheetId = getSpreadsheetId();

    const primaryRange = this.getRange();

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: primaryRange,
      });

      return response.data.values || [];
    } catch (error: any) {
      console.warn(
        `Error membaca range '${primaryRange}' for sheetName '${this.sheetName}'. Falling back to sheet list lookup.`,
        error?.message || error
      );

      // Fallback: attempt to find a sheet whose title matches case-insensitively.
      // This mitigates tab naming/casing differences (e.g., "Transactions" vs "transactions").
      try {
        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
        const sheet = spreadsheet.data.sheets?.find(
          (s: sheets_v4.Schema$Sheet | undefined) =>
            !!s?.properties?.title &&
            String(s.properties.title).toLowerCase() === String(this.sheetName).toLowerCase()
        );

        const fallbackTitle = sheet?.properties?.title;
        if (!fallbackTitle) return [];

        const fallbackRange = `${fallbackTitle}!A:Z`;
        const fallbackResponse = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: fallbackRange,
        });

        return fallbackResponse.data.values || [];
      } catch (fallbackError) {
        console.error(`Fallback sheet lookup failed for '${this.sheetName}':`, fallbackError);
        return [];
      }
    }
  }


  protected abstract mapRowToEntity(row: string[]): T | null;
  protected abstract mapEntityToRow(entity: T): (string | number | boolean)[];

  async findAll(userId: string): Promise<T[]> {
    const rows = await this.getAllRows();
    if (!rows || rows.length <= 1) return [];

    // Skip baris header
    const dataRows = rows.slice(1);
    
    return dataRows
      .map((row) => this.mapRowToEntity(row))
      // PERBAIKAN: Cek objek entity ada terlebih dahulu sebelum membaca properti userId (Mencegah Error 500)
      .filter((entity): entity is T => entity !== null && entity !== undefined && entity.userId === userId);
  }

  async findById(id: string, userId: string): Promise<T | null> {
    const entities = await this.findAll(userId);
    return entities.find((e) => e.id === id) || null;
  }

  async create(entity: T): Promise<T> {
    const sheets = await this.getSheets();
    const spreadsheetId = getSpreadsheetId();
    const range = this.getRange("A:A"); 

    const row = this.mapEntityToRow(entity);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [row],
      },
    });

    return entity;
  }

  async update(id: string, userId: string, entity: Partial<T>): Promise<T | null> {
    const sheets = await this.getSheets();
    const spreadsheetId = getSpreadsheetId();
    const allRows = await this.getAllRows();
    
    const rowIndex = allRows.findIndex((row, index) => {
      if (index === 0) return false; 
      const mapped = this.mapRowToEntity(row);
      // PERBAIKAN: Gunakan optional chaining (?.) untuk menghindari crash jika mapped bernilai null
      return mapped?.id === id && mapped?.userId === userId;
    });

    if (rowIndex === -1) return null;

    const currentEntity = this.mapRowToEntity(allRows[rowIndex]);
    if (!currentEntity) return null;

    const updatedEntity = { ...currentEntity, ...entity };
    const row = this.mapEntityToRow(updatedEntity);

    const range = `${this.sheetName}!A${rowIndex + 1}`; 

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [row],
      },
    });

    return updatedEntity;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const sheets = await this.getSheets();
    const spreadsheetId = getSpreadsheetId();
    const allRows = await this.getAllRows();

    const rowIndex = allRows.findIndex((row, index) => {
      if (index === 0) return false; 
      const mapped = this.mapRowToEntity(row);
      // PERBAIKAN: Gunakan optional chaining (?.) agar aman dari baris kosong
      return mapped?.id === id && mapped?.userId === userId;
    });

    if (rowIndex === -1) return false;

    const sheet = await this.getSheetInfo();
    if (!sheet) return false;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties?.sheetId,
                dimension: "ROWS",
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });

    return true;
  }

  private async getSheetInfo() {
    try {
      const sheets = await this.getSheets();
      const spreadsheetId = getSpreadsheetId();
      
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
      
      if (!spreadsheet.data.sheets) return null;

      return spreadsheet.data.sheets.find(
        (sheet: sheets_v4.Schema$Sheet) => sheet.properties?.title === this.sheetName
      ) ?? null;
    } catch (error) {
      console.error("Gagal mengambil informasi struktur Sheet:", error);
      return null;
    }
  }
}

