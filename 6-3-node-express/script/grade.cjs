#!/usr/bin/env node

/**
 * Lab Autograder — 6-3 Node Express Lab — Express Server
 *
 * Grades ONLY based on the lab's TODOs / setup items:
 *  - backend/server.js
 *  - backend/quotes.js
 *  - backend/utils/random.js
 *
 * Marking:
 * - 80 marks for lab TODOs / structure
 * - 20 marks for submission timing
 *   - On/before deadline => 20/20
 *   - After deadline     => 10/20
 *
 * Deadline: 06 Apr 2026 20:59 (Asia/Riyadh, UTC+03:00)
 *
 * Repo layout expected:
 * - repo root may be the project itself OR may contain the project folder
 * - project folder: 6-3-node-express-main/
 * - app folder:     6-3-node-express-main/6-3-node-express/
 * - grader file:    6-3-node-express-main/6-3-node-express/script/grade.cjs
 * - student files:
 *      6-3-node-express-main/6-3-node-express/backend/server.js
 *      6-3-node-express-main/6-3-node-express/backend/quotes.js
 *      6-3-node-express-main/6-3-node-express/backend/utils/random.js
 *
 * Notes:
 * - Ignores JS comments (starter TODO comments do NOT count).
 * - npm install commands are NOT graded.
 * - Manual testing steps are NOT graded.
 * - Morgan is graded only if actually imported and applied as middleware.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ARTIFACTS_DIR = "artifacts";
const FEEDBACK_DIR = path.join(ARTIFACTS_DIR, "feedback");
fs.mkdirSync(FEEDBACK_DIR, { recursive: true });

/* -----------------------------
   Deadline (Asia/Riyadh)
   05 Apr 2026, 20:59
-------------------------------- */
const DEADLINE_RIYADH_ISO = "2026-04-06T20:59:00+03:00";
const DEADLINE_MS = Date.parse(DEADLINE_RIYADH_ISO);

// Submission marks policy
const SUBMISSION_MAX = 20;
const SUBMISSION_LATE = 10;

/* -----------------------------
   TODO marks (out of 80)
-------------------------------- */
const tasks = [
  { id: "t1", name: "TODO 1: Initialize Express app in backend/server.js", marks: 10 },
  { id: "t2", name: "TODO 2: Implement getRandomInt(max) in backend/utils/random.js", marks: 10 },
  { id: "t3", name: "TODO 3: Implement getRandomQuote() in backend/quotes.js", marks: 10 },
  { id: "t4", name: "TODO 4: Enable CORS middleware in backend/server.js", marks: 10 },
  { id: "t5", name: "TODO 5: Add Morgan logger middleware in backend/server.js", marks: 10 },
  { id: "t6", name: "TODO 6: Define root and quote API routes in backend/server.js", marks: 20 },
  { id: "t7", name: "TODO 7: Start the server with app.listen(...) in backend/server.js", marks: 10 },
];

const STEPS_MAX = tasks.reduce((sum, t) => sum + t.marks, 0); // 80
const TOTAL_MAX = STEPS_MAX + SUBMISSION_MAX; // 100

/* -----------------------------
   Helpers
-------------------------------- */
function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function mdEscape(s) {
  return String(s).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function splitMarks(stepMarks, missingCount, totalChecks) {
  if (missingCount <= 0) return stepMarks;
  const perItem = stepMarks / totalChecks;
  const deducted = perItem * missingCount;
  return Math.max(0, round2(stepMarks - deducted));
}

/**
 * Strip JS comments while trying to preserve strings/templates.
 */
function stripJsComments(code) {
  if (!code) return code;

  let out = "";
  let i = 0;

  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;

  while (i < code.length) {
    const ch = code[i];
    const next = code[i + 1];

    if (!inDouble && !inTemplate && ch === "'" && !inSingle) {
      inSingle = true;
      out += ch;
      i++;
      continue;
    }
    if (inSingle && ch === "'") {
      let backslashes = 0;
      for (let k = i - 1; k >= 0 && code[k] === "\\"; k--) backslashes++;
      if (backslashes % 2 === 0) inSingle = false;
      out += ch;
      i++;
      continue;
    }

    if (!inSingle && !inTemplate && ch === '"' && !inDouble) {
      inDouble = true;
      out += ch;
      i++;
      continue;
    }
    if (inDouble && ch === '"') {
      let backslashes = 0;
      for (let k = i - 1; k >= 0 && code[k] === "\\"; k--) backslashes++;
      if (backslashes % 2 === 0) inDouble = false;
      out += ch;
      i++;
      continue;
    }

    if (!inSingle && !inDouble && ch === "`" && !inTemplate) {
      inTemplate = true;
      out += ch;
      i++;
      continue;
    }
    if (inTemplate && ch === "`") {
      let backslashes = 0;
      for (let k = i - 1; k >= 0 && code[k] === "\\"; k--) backslashes++;
      if (backslashes % 2 === 0) inTemplate = false;
      out += ch;
      i++;
      continue;
    }

    if (!inSingle && !inDouble && !inTemplate) {
      if (ch === "/" && next === "/") {
        i += 2;
        while (i < code.length && code[i] !== "\n") i++;
        continue;
      }
      if (ch === "/" && next === "*") {
        i += 2;
        while (i < code.length) {
          if (code[i] === "*" && code[i + 1] === "/") {
            i += 2;
            break;
          }
          i++;
        }
        continue;
      }
    }

    out += ch;
    i++;
  }

  return out;
}

function existsFile(p) {
  try {
    return fs.existsSync(p) && fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function existsDir(p) {
  try {
    return fs.existsSync(p) && fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function hasAll(text, patterns) {
  return patterns.every((p) => p.test(text));
}

function hasAny(text, patterns) {
  return patterns.some((p) => p.test(text));
}

function bodyOfFunction(code, functionName) {
  if (!code) return null;

  const patterns = [
    new RegExp(`export\\s+function\\s+${functionName}\\s*\\([^)]*\\)\\s*\\{`, "i"),
    new RegExp(`function\\s+${functionName}\\s*\\([^)]*\\)\\s*\\{`, "i"),
    new RegExp(`export\\s+const\\s+${functionName}\\s*=\\s*\\([^)]*\\)\\s*=>\\s*\\{`, "i"),
    new RegExp(`const\\s+${functionName}\\s*=\\s*\\([^)]*\\)\\s*=>\\s*\\{`, "i"),
  ];

  let match = null;
  for (const p of patterns) {
    match = p.exec(code);
    if (match) break;
  }
  if (!match) return null;

  const start = match.index + match[0].length;
  let depth = 1;
  let i = start;

  while (i < code.length) {
    const ch = code[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;

    if (depth === 0) return code.slice(start, i);
    i++;
  }

  return null;
}

/* -----------------------------
   Project root detection
-------------------------------- */
const REPO_ROOT = process.cwd();

function isAppFolder(p) {
  try {
    return (
      fs.existsSync(path.join(p, "package.json")) &&
      fs.existsSync(path.join(p, "src")) &&
      fs.existsSync(path.join(p, "backend")) &&
      fs.existsSync(path.join(p, "backend", "server.js"))
    );
  } catch {
    return false;
  }
}

function pickProjectRoot(cwd) {
  if (isAppFolder(cwd)) return cwd;

  const preferred = path.join(cwd, "6-3-node-express");
  if (isAppFolder(preferred)) return preferred;

  const preferredNested = path.join(cwd, "6-3-node-express-main", "6-3-node-express");
  if (isAppFolder(preferredNested)) return preferredNested;

  let subs = [];
  try {
    subs = fs
      .readdirSync(cwd, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    subs = [];
  }

  for (const name of subs) {
    const p = path.join(cwd, name);
    if (isAppFolder(p)) return p;

    const nested = path.join(p, "6-3-node-express");
    if (isAppFolder(nested)) return nested;
  }

  return cwd;
}

const PROJECT_ROOT = pickProjectRoot(REPO_ROOT);

/* -----------------------------
   Find files
-------------------------------- */
const backendDir = path.join(PROJECT_ROOT, "backend");
const utilsDir = path.join(backendDir, "utils");

const serverFile = path.join(backendDir, "server.js");
const quotesFile = path.join(backendDir, "quotes.js");
const randomFile = path.join(utilsDir, "random.js");

/* -----------------------------
   Determine submission time
-------------------------------- */
let lastCommitISO = null;
let lastCommitMS = null;

try {
  lastCommitISO = execSync("git log -1 --format=%cI", { encoding: "utf8" }).trim();
  lastCommitMS = Date.parse(lastCommitISO);
} catch {
  lastCommitISO = new Date().toISOString();
  lastCommitMS = Date.now();
}

/* -----------------------------
   Submission marks
-------------------------------- */
const isLate = Number.isFinite(lastCommitMS) ? lastCommitMS > DEADLINE_MS : true;
const submissionScore = isLate ? SUBMISSION_LATE : SUBMISSION_MAX;

/* -----------------------------
   Load & strip student files
-------------------------------- */
const serverRaw = existsFile(serverFile) ? safeRead(serverFile) : null;
const quotesRaw = existsFile(quotesFile) ? safeRead(quotesFile) : null;
const randomRaw = existsFile(randomFile) ? safeRead(randomFile) : null;

const serverCode = serverRaw ? stripJsComments(serverRaw) : null;
const quotesCode = quotesRaw ? stripJsComments(quotesRaw) : null;
const randomCode = randomRaw ? stripJsComments(randomRaw) : null;

const results = [];

/* -----------------------------
   Result helpers
-------------------------------- */
function addResult(task, required) {
  const missing = required.filter((r) => !r.ok);
  const score = splitMarks(task.marks, missing.length, required.length);

  results.push({
    id: task.id,
    name: task.name,
    max: task.marks,
    score,
    checklist: required.map((r) => `${r.ok ? "✅" : "❌"} ${r.label}`),
    deductions: missing.length ? missing.map((m) => `Missing: ${m.label}`) : [],
  });
}

function failTask(task, reason) {
  results.push({
    id: task.id,
    name: task.name,
    max: task.marks,
    score: 0,
    checklist: [],
    deductions: [reason],
  });
}

/* -----------------------------
   Function bodies for deeper checks
-------------------------------- */
const getRandomIntBody = bodyOfFunction(randomCode, "getRandomInt");
const getRandomQuoteBody = bodyOfFunction(quotesCode, "getRandomQuote");

/* -----------------------------
   Grade TODOs
-------------------------------- */

/**
 * TODO 1 — Initialize Express app
 */
{
  if (!serverCode) {
    failTask(tasks[0], "backend/server.js not found / unreadable.");
  } else {
    const required = [
      {
        label: 'Imports express using import express from "express"',
        ok: /import\s+express\s+from\s+['"]express['"]/i.test(serverCode),
      },
      {
        label: "Creates the Express app using const app = express()",
        ok: /const\s+app\s*=\s*express\s*\(\s*\)/i.test(serverCode),
      },
      {
        label: "Defines PORT",
        ok: hasAny(serverCode, [
          /const\s+PORT\s*=\s*\d+/i,
          /const\s+PORT\s*=\s*process\.env\.PORT\s*\|\|\s*\d+/i,
          /const\s+PORT\s*=\s*process\.env\.PORT\s*\?\?\s*\d+/i,
          /let\s+PORT\s*=\s*\d+/i,
        ]),
      },
    ];

    addResult(tasks[0], required);
  }
}

/**
 * TODO 2 — getRandomInt(max)
 */
{
  if (!randomCode) {
    failTask(tasks[1], "backend/utils/random.js not found / unreadable.");
  } else {
    const required = [
      {
        label: "Exports getRandomInt(max)",
        ok: hasAny(randomCode, [
          /export\s+function\s+getRandomInt\s*\(\s*max\s*\)/i,
          /export\s+const\s+getRandomInt\s*=\s*\(\s*max\s*\)\s*=>/i,
        ]),
      },
      {
        label: "Uses Math.random()",
        ok: !!getRandomIntBody && /Math\.random\s*\(\s*\)/i.test(getRandomIntBody),
      },
      {
        label: "Uses Math.floor(...)",
        ok: !!getRandomIntBody && /Math\.floor\s*\(/i.test(getRandomIntBody),
      },
      {
        label: "Uses max in the random integer calculation and returns a value",
        ok:
          !!getRandomIntBody &&
          /max/i.test(getRandomIntBody) &&
          /return\s+/i.test(getRandomIntBody),
      },
    ];

    addResult(tasks[1], required);
  }
}

/**
 * TODO 3 — getRandomQuote()
 */
{
  if (!quotesCode) {
    failTask(tasks[2], "backend/quotes.js not found / unreadable.");
  } else {
    const required = [
      {
        label: "Imports getRandomInt from ./utils/random.js",
        ok: /import\s*\{\s*getRandomInt\s*\}\s*from\s*['"]\.\/utils\/random\.js['"]/i.test(quotesCode),
      },
      {
        label: "Exports getRandomQuote()",
        ok: hasAny(quotesCode, [
          /export\s+function\s+getRandomQuote\s*\(\s*\)/i,
          /export\s+const\s+getRandomQuote\s*=\s*\(\s*\)\s*=>/i,
        ]),
      },
      {
        label: "Uses getRandomInt(quotes.length) or equivalent",
        ok:
          !!getRandomQuoteBody &&
          /getRandomInt\s*\(\s*quotes\.length\s*\)/i.test(getRandomQuoteBody),
      },
      {
        label: "Returns one quote from the quotes array",
        ok:
          !!getRandomQuoteBody &&
          hasAny(getRandomQuoteBody, [
            /return\s+quotes\s*\[\s*\w+\s*\]/i,
            /return\s+quotes\s*\[/i,
          ]),
      },
    ];

    addResult(tasks[2], required);
  }
}

/**
 * TODO 4 — CORS middleware
 */
{
  if (!serverCode) {
    failTask(tasks[3], "backend/server.js not found / unreadable.");
  } else {
    const required = [
      {
        label: 'Imports cors using import cors from "cors"',
        ok: /import\s+cors\s+from\s+['"]cors['"]/i.test(serverCode),
      },
      {
        label: "Applies CORS middleware using app.use(cors())",
        ok: /app\.use\s*\(\s*cors\s*\(\s*\)\s*\)/i.test(serverCode),
      },
    ];

    addResult(tasks[3], required);
  }
}

/**
 * TODO 5 — Morgan middleware
 */
{
  if (!serverCode) {
    failTask(tasks[4], "backend/server.js not found / unreadable.");
  } else {
    const required = [
      {
        label: 'Imports morgan using import morgan from "morgan"',
        ok: /import\s+morgan\s+from\s+['"]morgan['"]/i.test(serverCode),
      },
      {
        label: 'Applies Morgan middleware using app.use(morgan("dev"))',
        ok: /app\.use\s*\(\s*morgan\s*\(\s*['"]dev['"]\s*\)\s*\)/i.test(serverCode),
      },
    ];

    addResult(tasks[4], required);
  }
}

/**
 * TODO 6 — Routes
 */
{
  if (!serverCode) {
    failTask(tasks[5], "backend/server.js not found / unreadable.");
  } else {
    const required = [
      {
        label: "Imports getRandomQuote from ./quotes.js",
        ok: /import\s*\{\s*getRandomQuote\s*\}\s*from\s*['"]\.\/quotes\.js['"]/i.test(serverCode),
      },
      {
        label: 'Defines root route app.get("/")',
        ok: /app\.get\s*\(\s*['"]\/['"]\s*,/i.test(serverCode),
      },
      {
        label: "Root route sends plain text using res.send(...)",
        ok: /app\.get\s*\(\s*['"]\/['"]\s*,[\s\S]*?res\.send\s*\(/i.test(serverCode),
      },
      {
        label: 'Defines quote API route app.get("/api/quote")',
        ok: /app\.get\s*\(\s*['"]\/api\/quote['"]\s*,/i.test(serverCode),
      },
      {
        label: "Quote API route calls getRandomQuote()",
        ok: /app\.get\s*\(\s*['"]\/api\/quote['"]\s*,[\s\S]*?getRandomQuote\s*\(\s*\)/i.test(serverCode),
      },
      {
        label: "Quote API route returns JSON using res.json({ quote }) or equivalent",
        ok: hasAny(serverCode, [
          /app\.get\s*\(\s*['"]\/api\/quote['"]\s*,[\s\S]*?res\.json\s*\(\s*\{\s*quote\s*\}\s*\)/i,
          /app\.get\s*\(\s*['"]\/api\/quote['"]\s*,[\s\S]*?res\.json\s*\(\s*\{\s*quote\s*:\s*\w+\s*\}\s*\)/i,
        ]),
      },
    ];

    addResult(tasks[5], required);
  }
}

/**
 * TODO 7 — Start server
 */
{
  if (!serverCode) {
    failTask(tasks[6], "backend/server.js not found / unreadable.");
  } else {
    const required = [
      {
        label: "Starts the server using app.listen(...)",
        ok: /app\.listen\s*\(/i.test(serverCode),
      },
      {
        label: "Uses PORT in app.listen(PORT, ...)",
        ok: /app\.listen\s*\(\s*PORT\s*,/i.test(serverCode),
      },
      {
        label: "Logs a server-start message using console.log(...)",
        ok: /app\.listen\s*\([\s\S]*?console\.log\s*\(/i.test(serverCode),
      },
    ];

    addResult(tasks[6], required);
  }
}

/* -----------------------------
   Final scoring
-------------------------------- */
const stepsScore = results.reduce((sum, r) => sum + r.score, 0);
const totalScore = round2(stepsScore + submissionScore);

/* -----------------------------
   Build summary + feedback
-------------------------------- */
const LAB_NAME = "6-3-node-express-main";

const submissionLine = `- **Lab:** ${LAB_NAME}
- **Deadline (Riyadh / UTC+03:00):** ${DEADLINE_RIYADH_ISO}
- **Last commit time (from git log):** ${lastCommitISO}
- **Submission marks:** **${submissionScore}/${SUBMISSION_MAX}** ${isLate ? "(Late submission)" : "(On time)"}
`;

let summary = `# ${LAB_NAME} — Autograding Summary

## Submission

${submissionLine}

## Files Checked

- Repo root (cwd): ${REPO_ROOT}
- Detected project root: ${PROJECT_ROOT}
- Backend folder: ${existsDir(backendDir) ? `✅ ${backendDir}` : "❌ backend folder not found"}
- Utils folder: ${existsDir(utilsDir) ? `✅ ${utilsDir}` : "❌ backend/utils folder not found"}
- Server: ${existsFile(serverFile) ? `✅ ${serverFile}` : "❌ backend/server.js not found"}
- Quotes: ${existsFile(quotesFile) ? `✅ ${quotesFile}` : "❌ backend/quotes.js not found"}
- Random: ${existsFile(randomFile) ? `✅ ${randomFile}` : "❌ backend/utils/random.js not found"}

## Marks Breakdown

| Component | Marks |
|---|---:|
`;

for (const r of results) summary += `| ${r.name} | ${r.score}/${r.max} |\n`;
summary += `| Submission (timing) | ${submissionScore}/${SUBMISSION_MAX} |\n`;

summary += `
## Total Marks

**${totalScore} / ${TOTAL_MAX}**

## Detailed Checks (What you did / missed)
`;

for (const r of results) {
  const done = (r.checklist || []).filter((x) => x.startsWith("✅"));
  const missed = (r.checklist || []).filter((x) => x.startsWith("❌"));

  summary += `
<details>
  <summary><strong>${mdEscape(r.name)}</strong> — ${r.score}/${r.max}</summary>

  <br/>

  <strong>✅ Found</strong>
  ${done.length ? "\n" + done.map((x) => `- ${mdEscape(x)}`).join("\n") : "\n- (Nothing detected)"}

  <br/><br/>

  <strong>❌ Missing</strong>
  ${missed.length ? "\n" + missed.map((x) => `- ${mdEscape(x)}`).join("\n") : "\n- (Nothing missing)"}

  <br/><br/>

  <strong>❗ Deductions / Notes</strong>
  ${
    r.deductions && r.deductions.length
      ? "\n" + r.deductions.map((d) => `- ${mdEscape(d)}`).join("\n")
      : "\n- No deductions."
  }

</details>
`;
}

summary += `
> Full feedback is also available in: \`artifacts/feedback/README.md\`
`;

let feedback = `# ${LAB_NAME} — Feedback

## Submission

${submissionLine}

## Files Checked

- Repo root (cwd): ${REPO_ROOT}
- Detected project root: ${PROJECT_ROOT}
- Backend folder: ${existsDir(backendDir) ? `✅ ${backendDir}` : "❌ backend folder not found"}
- Utils folder: ${existsDir(utilsDir) ? `✅ ${utilsDir}` : "❌ backend/utils folder not found"}
- Server: ${existsFile(serverFile) ? `✅ ${serverFile}` : "❌ backend/server.js not found"}
- Quotes: ${existsFile(quotesFile) ? `✅ ${quotesFile}` : "❌ backend/quotes.js not found"}
- Random: ${existsFile(randomFile) ? `✅ ${randomFile}` : "❌ backend/utils/random.js not found"}

---

## TODO-by-TODO Feedback
`;

for (const r of results) {
  feedback += `
### ${r.name} — **${r.score}/${r.max}**

**Checklist**
${r.checklist.length ? r.checklist.map((x) => `- ${x}`).join("\n") : "- (No checks available)"}

**Deductions / Notes**
${r.deductions.length ? r.deductions.map((d) => `- ❗ ${d}`).join("\n") : "- ✅ No deductions. Good job!"}
`;
}

feedback += `
---

## How marks were deducted (rules)

- JS comments are ignored (so starter TODO comments do NOT count).
- Checks are intentionally lenient, but include top-level implementation logic.
- Code can be in ANY order; repeated code is allowed.
- Common equivalents are accepted, and naming is flexible where possible.
- npm install commands and manual testing commands are NOT graded.
- Missing required items reduce marks proportionally within that TODO.
- Morgan only gets marks if it is both imported and applied as middleware.
- Route checks only verify top-level implementation, not exact response text wording.
`;

/* -----------------------------
   Write outputs
-------------------------------- */
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}

const csv = `student,score,max_score
all_students,${totalScore},${TOTAL_MAX}
`;

fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
fs.writeFileSync(path.join(ARTIFACTS_DIR, "grade.csv"), csv);
fs.writeFileSync(path.join(FEEDBACK_DIR, "README.md"), feedback);

console.log(
  `✔ Lab graded: ${totalScore}/${TOTAL_MAX} (Submission: ${submissionScore}/${SUBMISSION_MAX}, TODOs: ${stepsScore}/${STEPS_MAX}).`
);