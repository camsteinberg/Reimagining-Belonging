const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    if (!line || line.trim().startsWith('#')) return;
    const idx = line.indexOf('=');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    if (!key || key === 'GOOGLE_PRIVATE_KEY') return; // skip multi-line key
    let value = line.slice(idx + 1).trim();
    if (!value) return;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  });
}

async function main() {
  loadEnv();

  if (!process.env.GOOGLE_PRIVATE_KEY) {
    try {
      const keyPath = path.resolve(__dirname, '..', 'service-account.json');
      if (fs.existsSync(keyPath)) {
        const json = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        process.env.GOOGLE_PRIVATE_KEY = json.private_key;
        if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
          process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = json.client_email;
        }
      }
    } catch (err) {
      console.warn('Failed to load service account file:', err?.message || err);
    }
  }

  const missing = ['GOOGLE_PRIVATE_KEY', 'GOOGLE_SERVICE_ACCOUNT_EMAIL', 'BARNDOS_SHEET_ID'].filter(
    (k) => !process.env[k],
  );
  if (missing.length) {
    console.error('Missing env vars:', missing.join(', '));
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.BARNDOS_SHEET_ID,
    range: "'Locations/Unit/Acres Summary'!A1:AZ120",
  });
  console.log(JSON.stringify(res.data.values || [], null, 2));
}

main().catch((err) => {
  console.error('error', err?.message || err);
  process.exit(1);
});
