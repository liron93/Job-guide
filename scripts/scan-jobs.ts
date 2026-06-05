import { chromium } from "playwright";
import path from "path";
import os from "os";
import fs from "fs";

const PROFILE_DIR = path.join(os.homedir(), ".pm-prep-browser");
const APP_URL = process.env.APP_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET || "";
const LINKEDIN_SEARCH_URL =
  "https://www.linkedin.com/jobs/search/?keywords=Product%20Manager&location=Israel&f_TPR=r86400&sortBy=DD";

interface ScannedJob {
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
}

async function run() {
  if (!CRON_SECRET) {
    console.error("❌ CRON_SECRET not set in .env.local");
    process.exit(1);
  }

  fs.mkdirSync(PROFILE_DIR, { recursive: true });

  // First run: headless=false so user can log in manually
  // Subsequent runs: profile already has session cookies
  const isFirstRun = !fs.existsSync(path.join(PROFILE_DIR, "Default", "Cookies"));

  const browser = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: !isFirstRun,
    args: ["--no-sandbox"],
    viewport: { width: 1280, height: 800 },
  });

  const page = await browser.newPage();

  try {
    console.log("🔍 פותח LinkedIn Jobs...");
    await page.goto(LINKEDIN_SEARCH_URL, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Check if redirected to login
    const currentUrl = page.url();
    if (currentUrl.includes("/login") || currentUrl.includes("/authwall")) {
      if (!isFirstRun) {
        console.log("⚠️  Session פג — פותח חלון להתחברות מחדש...");
        await browser.close();
        const visibleBrowser = await chromium.launchPersistentContext(PROFILE_DIR, {
          headless: false,
          viewport: { width: 1280, height: 800 },
        });
        const loginPage = await visibleBrowser.newPage();
        await loginPage.goto(LINKEDIN_SEARCH_URL);
        console.log("🔑 התחבר ל-LinkedIn בחלון שנפתח, לאחר מכן הסקריפט ימשיך אוטומטית...");
        await loginPage.waitForURL(/linkedin\.com\/jobs/, { timeout: 120000 });
        await visibleBrowser.close();
        console.log("✅ התחברות הצליחה — מריץ מחדש...");
        await run();
        return;
      } else {
        console.log("🔑 פעם ראשונה — יש להתחבר ל-LinkedIn בחלון שנפתח...");
        await page.waitForURL(/linkedin\.com\/jobs/, { timeout: 180000 });
        console.log("✅ התחברות הצליחה!");
      }
    }

    await page.waitForTimeout(2000);

    // Scroll to load more job cards
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 800));
      await page.waitForTimeout(1000);
    }

    // Extract job cards
    const jobCards = await page.$$eval(
      "ul.jobs-search-results__list > li, .jobs-search__results-list > li",
      (cards) =>
        cards
          .map((card) => {
            const titleEl = card.querySelector("h3.base-search-card__title, .job-search-card__title");
            const companyEl = card.querySelector("h4.base-search-card__subtitle, .job-search-card__subtitle-link");
            const locationEl = card.querySelector(".job-search-card__location, .base-search-card__metadata span");
            const linkEl = card.querySelector("a.base-card__full-link, a[href*='/jobs/view/']") as HTMLAnchorElement | null;
            return {
              title: titleEl?.textContent?.trim() ?? "",
              company: companyEl?.textContent?.trim() ?? "",
              location: locationEl?.textContent?.trim() ?? "",
              url: linkEl?.href ?? "",
            };
          })
          .filter((j) => j.title && j.company && j.url)
    );

    console.log(`📋 נמצאו ${jobCards.length} משרות`);

    if (jobCards.length === 0) {
      console.log("⚠️  לא נמצאו משרות — ייתכן שה-DOM של LinkedIn השתנה");
      await browser.close();
      return;
    }

    // Get description for each job (up to 15)
    const jobs: ScannedJob[] = [];
    const toProcess = jobCards.slice(0, 15);

    for (const card of toProcess) {
      try {
        await page.goto(card.url, { waitUntil: "domcontentloaded", timeout: 20000 });
        await page.waitForTimeout(1500);

        const description = await page.$eval(
          ".jobs-description__content, .jobs-box__html-content, #job-details",
          (el) => el.textContent?.replace(/\s{2,}/g, " ").trim() ?? ""
        ).catch(() => "");

        jobs.push({ ...card, description: description.slice(0, 5000) });
        console.log(`  ✓ ${card.company} — ${card.title}`);
      } catch {
        // Skip jobs we can't access
        jobs.push({ ...card, description: "" });
      }
    }

    await browser.close();

    if (jobs.length === 0) {
      console.log("❌ לא הצלחנו לקרוא פרטי משרות");
      process.exit(1);
    }

    // Send to app API
    console.log(`\n📤 שולח ${jobs.length} משרות לניתוח Claude...`);
    const res = await fetch(`${APP_URL}/api/jobs/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": CRON_SECRET,
      },
      body: JSON.stringify({ jobs }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("❌ API error:", err);
      process.exit(1);
    }

    const result = await res.json();
    console.log(`\n✅ סיום — נמצאו: ${result.found}, נשמרו חדשות: ${result.saved}`);
    if (result.errors?.length) {
      console.log("⚠️  שגיאות:", result.errors);
    }
  } catch (err) {
    await browser.close();
    console.error("❌ שגיאה:", err);
    process.exit(1);
  }
}

run();
