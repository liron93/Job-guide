export interface GuideSection {
  category: string;
  emoji: string;
  what_they_test: string;
  structure: string[];
  frameworks: { name: string; description: string }[];
  tips: string[];
  avoid: string[];
}

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    category: "HR & Personal",
    emoji: "👤",
    what_they_test:
      "האם אתם מכירים את עצמכם — חוזקות, חולשות, מטרות. האם תתאימו לתרבות הארגונית. האם יש לכם self-awareness ויכולת לדבר בצורה אותנטית.",
    structure: [
      "Present — מי אתם ומה אתם עושים היום (30 שניות)",
      "Past — מה הוביל אתכם לכאן, מה למדתם (45 שניות)",
      "Future — למה הרול הזה עכשיו (30 שניות)",
    ],
    frameworks: [
      { name: "Present-Past-Future", description: "לשאלת 'ספרו על עצמכם' — מבנה קצר, ממוקד, מוביל לתפקיד הנוכחי" },
      { name: "SBI (Situation-Behavior-Impact)", description: "לשאלות על חולשות/חוזקות — תארו מצב, התנהגות, ומה הייתה ההשפעה" },
    ],
    tips: [
      "היו אותנטיים — מראיינים מזהים תשובות גנריות",
      "בחרו חולשה אמיתית שאתם עובדים עליה, לא 'אני פרפקציוניסט'",
      "תשובת 'למה אתם עוזבים' — תמיד לעתיד, לא נגד המעסיק הנוכחי",
      "שאלות על שכר — תחקרו מראש, תנו range מבוסס שוק",
    ],
    avoid: [
      "תשובות ארוכות מדי — מקסימום 2 דקות לכל תשובה",
      "לדבר רע על מעסיק קודם",
      "להגיד 'אין לי חולשות' או חולשה שהיא בעצם חוזק מוסווה",
    ],
  },
  {
    category: "Behavioral",
    emoji: "🧠",
    what_they_test:
      "איך התנהגתם בעבר במצבים קשים — קונפליקטים, כישלונות, הובלת צוות ללא סמכות. מניחים שהתנהגות עבר מנבאת עתיד.",
    structure: [
      "Situation — הקשר קצר (מה, מתי, מי)",
      "Task — מה היה האתגר שלכם ספציפית",
      "Action — מה עשיתם בפועל (זה החלק הגדול ביותר)",
      "Result — מה התוצאה + מה למדתם",
    ],
    frameworks: [
      { name: "STAR", description: "Situation → Task → Action → Result — הבסיס לכל שאלת behavioral" },
      { name: "SOAR", description: "Situation → Obstacle → Action → Result — מתאים יותר לשאלות על אתגרים" },
    ],
    tips: [
      "הכינו 5-6 סיפורים מהניסיון שאפשר לשנות אותם לשאלות שונות",
      "ה-Action צריך להיות 60% מהתשובה — פרטו מה עשיתם",
      "תמיד כללו תוצאה מדידה ('הגדלנו retention ב-15%')",
      "שאלות קונפליקט — הראו empathy לצד השני",
    ],
    avoid: [
      "תשובות היפותטיות ('הייתי עושה...') — תנו דוגמא אמיתית",
      "להאשים אחרים בסיפורי כישלון",
      "תשובה שבה ה-Action שלכם הוא 'דיברתי עם המנהל' בלבד",
    ],
  },
  {
    category: "Product Sense",
    emoji: "💡",
    what_they_test:
      "האם אתם חושבים כמו PM — מזהים משתמשים, מבינים צרכים, מייצרים פתרונות ומעריכים tradeoffs. יצירתיות לצד מבנה.",
    structure: [
      "Clarify — שאלו שאלות הבהרה (מטרת החברה? משתמש יעד?)",
      "User segments — פלחו משתמשים, בחרו סגמנט מוגדר",
      "Pain points — זהו 3-4 כאבים אמיתיים",
      "Solutions — 3 פתרונות שונים (לא רק features)",
      "Prioritize — בחרו אחד עם הסבר מפורש",
      "Success metrics — איך נדע שהצלחנו",
    ],
    frameworks: [
      { name: "CIRCLES", description: "Comprehend → Identify → Report → Cut → List → Evaluate → Summarize" },
      { name: "Jobs to be Done", description: "מה ה'עבודה' שהמשתמש מנסה לבצע — מה מפריע לו לבצע אותה היום" },
      { name: "User Journey", description: "מפו את כל שלבי חוויית המשתמש — זהו friction points" },
    ],
    tips: [
      "תמיד פלחו משתמשים — אל תדברו על 'כולם'",
      "הציגו לפחות 3 רעיונות לפני שבוחרים — הראיין רוצה לראות creativity",
      "כשאתם מעדיפים — הסבירו למה לא הבחרות האחרות",
      "חשבו ב-'why before what' — צורך לפני פתרון",
    ],
    avoid: [
      "לקפוץ ישר לפתרון מבלי להבין את הבעיה",
      "להציע רק feature קטן — חשבו big picture",
      "לשכוח success metrics בסוף",
    ],
  },
  {
    category: "Strategy",
    emoji: "♟️",
    what_they_test:
      "האם אתם רואים big picture — שוק, תחרות, טרנדים. יכולת לחשוב לטווח ארוך ולקבל החלטות אסטרטגיות עם מידע חלקי.",
    structure: [
      "Context — הבינו את השוק, החברה, המטרה",
      "Analysis — SWOT / Porter's 5 Forces / משתמשים vs. מתחרים",
      "Options — 2-3 כיוונים אסטרטגיים שונים",
      "Recommendation — בחרו ונמקו",
      "Risks — מה יכול להשתבש, איך תמתנו",
    ],
    frameworks: [
      { name: "Porter's 5 Forces", description: "ניתוח תחרותי: תחרים, ספקים, קונים, תחליפים, כניסה לשוק" },
      { name: "SWOT", description: "Strengths / Weaknesses / Opportunities / Threats — מהיר ויעיל" },
      { name: "BCG Matrix", description: "Stars / Cash Cows / Question Marks / Dogs — לתעדוף portfolio" },
    ],
    tips: [
      "תמיד שאלו 'מה המטרה של החברה?' לפני שמציעים אסטרטגיה",
      "הבחינו בין גדילה קצרת-טווח לבניית יתרון תחרותי ארוך-טווח",
      "אל תתעלמו מ-risks — הראיין רוצה לראות שאתם חושבים בצורה מאוזנת",
    ],
    avoid: [
      "המלצה ללא נימוק ברור",
      "התמקדות בטקטיקה במקום באסטרטגיה",
      "להתעלם מהמתחרים",
    ],
  },
  {
    category: "Metrics",
    emoji: "📊",
    what_they_test:
      "האם אתם data-driven — מגדירים מדדים נכון, יודעים לאבחן בעיות דרך מדדים, מבינים את ההבדל בין correlation ל-causation.",
    structure: [
      "Goal — מה המטרה העסקית? (growth / retention / engagement)",
      "North Star — מהו המדד המרכזי שמייצג ערך למשתמש",
      "Breakdown — פרקו ל-micro-metrics (acquisition / activation / retention / referral / revenue)",
      "Diagnosis — אם מדד ירד, בדקו segment by segment",
      "Action — מה עושים על בסיס הנתונים",
    ],
    frameworks: [
      { name: "AARRR (Pirate Metrics)", description: "Acquisition → Activation → Retention → Referral → Revenue" },
      { name: "North Star Metric", description: "מדד יחיד שמייצג ערך למשתמש וצמיחה עסקית" },
      { name: "HEART", description: "Happiness / Engagement / Adoption / Retention / Task Success — למוצרי UX" },
    ],
    tips: [
      "כשמדד יורד — תמיד שאלו 'האם זה ברחבי כל הסגמנטים או ספציפי?'",
      "הבחינו בין leading indicators (מוקדמים) ל-lagging indicators (מאוחרים)",
      "ה-North Star צריך להיות משהו שהמשתמש מרגיש, לא רק מה שהחברה מרוויחה",
    ],
    avoid: [
      "לבחור מדד שקל למדוד אך לא מייצג ערך אמיתי",
      "להתמקד רק ב-vanity metrics (כמו page views)",
      "לשכוח לשאול 'בהשוואה למה?' כשמדברים על ירידה",
    ],
  },
  {
    category: "Prioritization",
    emoji: "🎯",
    what_they_test:
      "איך אתם מקבלים החלטות עם משאבים מוגבלים. יכולת לאזן בין ערך למשתמש, עסקי ותכנותי. יכולת להגיד 'לא'.",
    structure: [
      "Clarify goals — מה המטרה העסקית לרבעון/שנה?",
      "List candidates — כל הדברים שמחכים לעבודה",
      "Score — העריכו כל אחד לפי קריטריונים",
      "Decide — בחרו ונמקו",
      "Communicate — איך מסבירים ל-stakeholders מה לא נעשה",
    ],
    frameworks: [
      { name: "RICE", description: "Reach × Impact × Confidence ÷ Effort — מספרי ומובנה" },
      { name: "ICE", description: "Impact × Confidence × Ease — גרסה פשוטה יותר" },
      { name: "Value vs. Effort Matrix", description: "2×2: Quick Wins / Big Bets / Fill-ins / Avoid — ויזואלי ומהיר" },
      { name: "MoSCoW", description: "Must / Should / Could / Won't — לתיעדוף scope" },
    ],
    tips: [
      "תמיד שאלו 'מה ה-cost של לא לעשות זאת?' לפני שדוחים",
      "Stakeholder management — עדיף לסנן לפני שמבטיחים",
      "הראו שאתם יודעים להגיד 'לא' בצורה מכבדת",
    ],
    avoid: [
      "לעשות prioritization ללא מטרה עסקית ברורה",
      "להתחיל עם framework מבלי להבין את ה-context",
      "לשכוח לדבר על stakeholder alignment",
    ],
  },
  {
    category: "Execution",
    emoji: "⚙️",
    what_they_test:
      "האם אתם יודעים לקחת רעיון ולהפוך אותו לפיצ'ר שיוצא לשוק. שיתוף פעולה עם R&D, עמידה בלוחות זמנים, ניהול סיכונים.",
    structure: [
      "Requirements — מה אנחנו בונים ולמה (PRD בגדול)",
      "Scope — MVP vs. full — מה בפנים, מה בחוץ",
      "Dependencies — מה צריך מאחרים",
      "Timeline — milestones עם buffers",
      "Launch plan — GTM, rollout, monitoring",
    ],
    frameworks: [
      { name: "PRD (Product Requirements Doc)", description: "Goals / Non-goals / User stories / Success metrics / Open questions" },
      { name: "MLP (Minimum Lovable Product)", description: "מעבר ל-MVP — מה שיגרום לאנשים באמת לאהוב את המוצר" },
      { name: "DACI", description: "Driver / Approver / Contributor / Informed — מי אחראי על מה" },
    ],
    tips: [
      "Scope creep — כשמוסיפים requirement חדש, תמיד שאלו 'מה מוציאים בתמורה?'",
      "תאמו ציפיות מוקדם — surprises בסוף ה-sprint הן PM failures",
      "Post-launch: הגדירו מראש מה 'הצלחה נראית' לפני שמודדים",
    ],
    avoid: [
      "לא לערב R&D בשלב ה-requirements",
      "לשכוח לתכנן מה קורה אחרי ה-launch",
      "לא להגדיר success criteria לפני שמתחילים",
    ],
  },
  {
    category: "Leadership",
    emoji: "🧭",
    what_they_test:
      "יכולת להוביל ללא סמכות פורמלית, לגרום לאנשים לאמץ חזון, לנהל קונפליקטים ולבנות תרבות של ownership.",
    structure: [
      "Vision — הציגו picture ברור של ה-destination",
      "Why now — למה זה חשוב עכשיו",
      "Alignment — איך גורמים לכולם לרצות ללכת לשם",
      "Execution — איך עוקבים ומסירים חסמים",
    ],
    frameworks: [
      { name: "Influence without authority", description: "בניית אמון, הוכחת ערך, שימוש בנתונים לשכנוע" },
      { name: "Situational Leadership", description: "התאימו סגנון ניהול לבשלות של כל חבר צוות" },
    ],
    tips: [
      "Leadership = enabling others, לא 'אני עשיתי הכל'",
      "בשאלות leadership — הראו empathy ל-stakeholders השונים",
      "אחד הדברים הכי חשובים: יכולת לקבל ולתת feedback",
    ],
    avoid: [
      "לתאר ניהול רק כ-top-down",
      "לא להזכיר איך מדדתם הצלחה",
      "לדבר על 'אני' בלבד — leadership הוא 'אנחנו'",
    ],
  },
  {
    category: "Estimation",
    emoji: "🔢",
    what_they_test:
      "יכולת חשיבה כמותית מובנית. לא מצפים לדיוק — מצפים לגישה הגיונית, הנחות ברורות, וחשיבה on your feet.",
    structure: [
      "Clarify — מה בדיוק מעריכים?",
      "Approach — איך אתם חושבים לפרק את הבעיה?",
      "Assumptions — הצהירו על כל הנחה בקול",
      "Calculate — step by step, עגלו בצורה הגיונית",
      "Sanity check — האם התוצאה הגיונית?",
    ],
    frameworks: [
      { name: "Top-down", description: "התחילו מגודל שוק כולל ← פלחו ← הגיעו לנתון" },
      { name: "Bottom-up", description: "התחילו מיחידה קטנה ← הכפילו למחלקים גדולים יותר" },
      { name: "Proxy method", description: "השתמשו במידע שאתם יודעים כדי לגזור מה שאתם לא יודעים" },
    ],
    tips: [
      "חשבו בקול — הראיין רוצה לראות את תהליך החשיבה",
      "עגלו מספרים לנוחות חישוב — זה לגיטימי",
      "תמיד סיימו ב-sanity check: 'זה נשמע הגיוני כי...'",
    ],
    avoid: [
      "לנסות לחשב בזכרון — כתבו/אמרו כל שלב",
      "לתת מספר מבלי להסביר איך הגעתם אליו",
      "להיות paralyzed מחוסר מידע — תניחו בקול",
    ],
  },
  {
    category: "Case Study",
    emoji: "📋",
    what_they_test:
      "אינטגרציה של כל היכולות — חשיבה עסקית, הבנת משתמש, ניתוח נתונים, קבלת החלטות תחת לחץ.",
    structure: [
      "Understand — שאלו שאלות עד שאתם מבינים את ה-context",
      "Diagnose — מה הבעיה האמיתית?",
      "Frameworks — איזה כלים רלוונטיים כאן?",
      "Recommendations — 2-3 אופציות עם tradeoffs",
      "Decision — בחרו אחת ונמקו",
      "Next steps — מה עושים מחר?",
    ],
    frameworks: [
      { name: "Problem → Root Cause → Solution", description: "הבנה מלאה לפני פתרון" },
      { name: "So what? So now what?", description: "לכל insight — מה המשמעות? מה עושים?" },
    ],
    tips: [
      "אל תמהרו — case studies מתגמלים מבנה על פני מהירות",
      "שאלו שאלות הבהרה — זה מראה בגרות, לא חוסר ידע",
      "הכינו 2-3 frameworks לכל scenario type (user drop, metrics decline, new market)",
    ],
    avoid: [
      "לקפוץ לפתרון לפני שמבינים את הבעיה",
      "להיות ודאיים מדי — הציגו tradeoffs",
      "לשכוח לקשור חזרה למטרות העסקיות",
    ],
  },
];

export const GENERAL_TIPS = [
  {
    title: "בנו את הספרייה שלכם",
    body: "הכינו 5-7 סיפורים מהניסיון שלכם שמדגימים: הובלה, כישלון שלמדתם ממנו, החלטה קשה, השפעה מדידה, ניהול קונפליקט. כל שאלה behavioral היא וריאציה על אחד מהאלה.",
  },
  {
    title: "תחקיר לפני הראיון",
    body: "קראו את ה-10 press releases האחרונים של החברה. הבינו מה המוצר עושה, מה ה-business model, מי המתחרים, מה האתגרים. מראיינים מעריכים מאוד מועמדים שמגיעים מוכנים.",
  },
  {
    title: "דברו על מספרים",
    body: "'שיפרנו retention' חלש. 'הגדלנו 30-day retention מ-42% ל-57% תוך רבעון אחד, שתרם ל-$2M ARR נוסף' — זה חזק. הכינו את המספרים מהניסיון שלכם לפני כל ראיון.",
  },
  {
    title: "מבנה לפני תוכן",
    body: "אמרו את ה-framework בקול לפני שמתחילים: 'אני ארצה לפלח את המשתמשים, לזהות pain points, ואז להציע פתרונות'. זה מראה מחשבה מובנית ונותן לראיין לעקוב.",
  },
  {
    title: "שאלות לראיין",
    body: "תמיד הכינו 3-4 שאלות: אחת על המוצר, אחת על הצוות, אחת על האתגרים. 'מה האתגר הכי גדול שה-PM צריך לפתור ברבעון הקרוב?' — שאלה מצוינת.",
  },
];
