import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function getSheetsCredentials() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Google Sheets credentials (CLIENT_EMAIL or PRIVATE_KEY) are missing.");
  }

  return {
    client_email: clientEmail,
    private_key: privateKey,
  };
}

export async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: getSheetsCredentials(),
    scopes: SCOPES,
  });

  return google.sheets({ version: "v4", auth });
}

export function getSpreadsheetId() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_ID is not configured.");
  }

  return spreadsheetId;
}
