/**
 * Script diagnosa koneksi Google Sheets
 * Jalankan: node scripts/test-sheets.mjs
 */

import { google } from 'googleapis';

const PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
const CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;

async function diagnose() {
  console.log('\n========================================');
  console.log('  Finansia — Google Sheets Diagnostics');
  console.log('========================================\n');

  // 1. Cek env vars
  console.log('1. Checking environment variables...');
  const missing = [];
  if (!CLIENT_EMAIL) missing.push('GOOGLE_SHEETS_CLIENT_EMAIL');
  if (!PRIVATE_KEY)  missing.push('GOOGLE_SHEETS_PRIVATE_KEY');
  if (!SPREADSHEET_ID) missing.push('GOOGLE_SHEETS_ID');

  if (missing.length > 0) {
    console.error('   ❌ MISSING env vars:', missing.join(', '));
    console.log('\n   ➡️  Pastikan .env.local memiliki ketiga variabel ini.');
    process.exit(1);
  }
  console.log('   ✅ All env vars present');
  console.log(`   📧 Service Account: ${CLIENT_EMAIL}`);
  console.log(`   📊 Spreadsheet ID:  ${SPREADSHEET_ID}`);

  // 2. Test autentikasi
  console.log('\n2. Testing Google Auth...');
  let auth;
  try {
    auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: CLIENT_EMAIL,
        private_key: PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const client = await auth.getClient();
    console.log('   ✅ Auth client created successfully');
  } catch (err) {
    console.error('   ❌ Auth failed:', err.message);
    console.log('\n   ➡️  Cek format GOOGLE_SHEETS_PRIVATE_KEY di .env.local');
    console.log('      Pastikan \\n dalam key sudah di-escape dengan benar');
    process.exit(1);
  }

  // 3. Test akses spreadsheet
  console.log('\n3. Testing spreadsheet access...');
  const sheets = google.sheets({ version: 'v4', auth });
  
  try {
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    console.log('   ✅ Spreadsheet accessible!');
    console.log(`   📋 Title: "${spreadsheet.data.properties?.title}"`);
    
    const sheetNames = spreadsheet.data.sheets?.map(s => s.properties?.title) ?? [];
    console.log(`   📄 Sheets found (${sheetNames.length}): ${sheetNames.join(', ') || '(none)'}`);
    
    // 4. Cek apakah sheet yang dibutuhkan ada
    console.log('\n4. Checking required sheet tabs...');
    const required = ['Transactions', 'Planning', 'Notes', 'Settings'];
    for (const name of required) {
      const exists = sheetNames.some(s => s?.toLowerCase() === name.toLowerCase());
      if (exists) {
        console.log(`   ✅ "${name}" tab found`);
      } else {
        console.warn(`   ⚠️  "${name}" tab NOT FOUND — will be auto-created on first write`);
      }
    }

    // 5. Test baca data
    console.log('\n5. Testing read access...');
    const firstSheet = sheetNames[0];
    if (firstSheet) {
      try {
        await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${firstSheet}!A1:E5`,
        });
        console.log(`   ✅ Read access confirmed on sheet "${firstSheet}"`);
      } catch (readErr) {
        console.warn(`   ⚠️  Read failed: ${readErr.message}`);
      }
    }

    console.log('\n========================================');
    console.log('  ✅ DIAGNOSIS: Spreadsheet OK!');
    console.log('  Error add_failed disebabkan oleh hal lain.');
    console.log('  Cek log server saat mencoba submit transaksi.');
    console.log('========================================\n');

  } catch (err) {
    console.error('   ❌ Spreadsheet access failed:', err.message);
    
    if (err.code === 404 || err.message?.includes('not found')) {
      console.log('\n   ➡️  PENYEBAB: Spreadsheet ID salah atau tidak ditemukan!');
      console.log('      Solusi:');
      console.log('      1. Buka Google Sheets Anda di browser');
      console.log('      2. Copy URL-nya: https://docs.google.com/spreadsheets/d/[ID]/edit');
      console.log('      3. Update GOOGLE_SHEETS_ID di .env.local dengan [ID] tersebut');
    } else if (err.code === 403 || err.message?.includes('PERMISSION_DENIED')) {
      console.log('\n   ➡️  PENYEBAB: Service account tidak punya akses ke spreadsheet!');
      console.log('      Solusi:');
      console.log(`      1. Buka spreadsheet Anda`);
      console.log(`      2. Klik "Share" / "Bagikan"`);
      console.log(`      3. Tambahkan: ${CLIENT_EMAIL}`);
      console.log(`      4. Berikan role "Editor"`);
    } else {
      console.log('\n   ➡️  Error tidak terduga:', err.message);
    }
    
    console.log('\n========================================');
    console.log('  ❌ DIAGNOSIS: Spreadsheet connection FAILED');
    console.log('  Ini adalah root cause dari transactions.add_failed');
    console.log('========================================\n');
    process.exit(1);
  }
}

diagnose().catch(console.error);
