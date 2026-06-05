/**
 * One-time setup: get Gmail OAuth refresh token.
 * Run: npm run setup-gmail
 * Paste the output lines into .env.local
 */
import { google } from "googleapis";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(`
❌ GMAIL_CLIENT_ID ו-GMAIL_CLIENT_SECRET לא מוגדרים ב-.env.local

כדי להגדיר:
1. פתח https://console.cloud.google.com
2. צור פרויקט חדש (או השתמש בקיים)
3. חפש "Gmail API" → Enable
4. Credentials → Create Credentials → OAuth 2.0 Client ID
5. Application type: Desktop app
6. הורד JSON → העתק client_id ו-client_secret

הוסף ל-.env.local:
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...

ואז הרץ שוב: npm run setup-gmail
`);
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  "urn:ietf:wg:oauth:2.0:oob"
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/gmail.send"],
  prompt: "consent",
});

console.log("\n🔑 פתח את הקישור הבא בדפדפן:\n");
console.log(authUrl);
console.log("\n");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question("הדבק את קוד ההרשאה שקיבלת: ", async (code) => {
  rl.close();
  try {
    const { tokens } = await oauth2Client.getToken(code.trim());
    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      console.error("❌ לא התקבל refresh_token — ודא שלחצת 'Allow' ושהוספת prompt: consent");
      process.exit(1);
    }

    console.log("\n✅ הצלחה! הוסף שורה זו ל-.env.local:\n");
    console.log(`GMAIL_REFRESH_TOKEN=${refreshToken}\n`);

    // Optionally append to .env.local automatically
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const existing = fs.readFileSync(envPath, "utf8");
      if (!existing.includes("GMAIL_REFRESH_TOKEN")) {
        fs.appendFileSync(envPath, `\nGMAIL_REFRESH_TOKEN=${refreshToken}\n`);
        console.log("✅ נוסף אוטומטית ל-.env.local");
      }
    }
  } catch (err) {
    console.error("❌ שגיאה:", err);
    process.exit(1);
  }
});
