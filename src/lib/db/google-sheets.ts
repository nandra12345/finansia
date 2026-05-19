import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

type CellValue = string | number | boolean | null;

type RowValues = CellValue[];

function getSheetsCredentials() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Google Sheets credentials are missing.");
  }

  return {
    client_email: clientEmail,
    private_key: privateKey,
  };
}

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: getSheetsCredentials(),
    scopes: SCOPES,
  });

  return google.sheets({ version: "v4", auth });
}

export async function appendRow(
  spreadsheetId: string,
  range: string,
  values: RowValues
) {
  const sheets = await getSheetsClient();

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [values],
    },
  });

  return response.data;
}

export async function getRows(spreadsheetId: string, range: string) {
  const sheets = await getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return response.data.values ?? [];
}

export async function replaceRows(
  spreadsheetId: string,
  range: string,
  values: RowValues[]
) {
  const sheets = await getSheetsClient();

  const response = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values,
    },
  });

  return response.data;
}

