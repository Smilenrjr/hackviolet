require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { execFile } = require("child_process");
const sqlite3 = require("sqlite3").verbose();
const { z } = require("zod");

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Database setup ----
const DB_PATH = path.join(__dirname, "data", "survey.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new sqlite3.Database(DB_PATH);
db.configure("busyTimeout", 5000); // wait up to 5s if the DB is momentarily locked
db.exec("PRAGMA journal_mode=WAL;"); // better concurrent read/write behavior

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS survey_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT DEFAULT (datetime('now')),
      q1 TEXT,
      q1_follow TEXT,
      q2 TEXT,
      q3 TEXT,
      q4 TEXT,
      q5 TEXT,
      q6 TEXT,
      q7 TEXT,
      q8 TEXT,
      q9 TEXT,
      q10 TEXT,
      q11 TEXT,
      q12 TEXT,
      q13 TEXT,
      q14 TEXT,
      q15 TEXT,
      raw_json TEXT NOT NULL
    )`
  );
});

function writeNdjsonFile(targetPath, limit = 500, cb) {
  db.all(
    `SELECT id, created_at, raw_json FROM survey_responses ORDER BY id DESC LIMIT ?`,
    [limit],
    (err, rows) => {
      if (err) return cb(err);
      const lines = rows.map((r) => {
        const a = r.raw_json ? JSON.parse(r.raw_json) : {};
        return JSON.stringify({
          id: r.id,
          t: r.created_at,
          q1: a.q1 ?? null,
          lang: a.q1_follow ?? null,
          lk: [
            a.q2,
            a.q3,
            a.q4,
            a.q5,
            a.q6,
            a.q7,
            a.q8,
            a.q9,
            a.q10,
            a.q11,
            a.q12,
            a.q13,
            a.q14,
          ],
          note: a.q15 ?? null,
        });
      });
      fs.writeFile(targetPath, lines.join("\n"), cb);
    }
  );
}

// ---- Validation ----
const likert = [
  "Strongly Disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly Agree",
];

const surveySchema = z
  .object({
    q1: z.enum(["yes", "no"]),
    q1_follow: z.string().trim().max(120).optional().nullable(),
    q2: z.enum(likert),
    q3: z.enum(likert),
    q4: z.enum(likert),
    q5: z.enum(likert),
    q6: z.enum(likert),
    q7: z.enum(likert),
    q8: z.enum(likert),
    q9: z.enum(likert),
    q10: z.enum(likert),
    q11: z.enum(likert),
    q12: z.enum(likert),
    q13: z.enum(likert),
    q14: z.enum(likert),
    q15: z.string().trim().max(2000).optional().nullable(),
  })
  .refine(
    (vals) => vals.q1 === "no" || typeof vals.q1_follow === "string",
    "q1_follow is required when q1 is yes"
  );

// ---- Middleware ----
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname)));

// Serve landing page at root
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "ui.html"));
});

// ---- Helpers ----
function formatRow(row) {
  const answers = row.raw_json ? JSON.parse(row.raw_json) : {};
  return {
    id: row.id,
    created_at: row.created_at,
    answers,
    ai_summary: `Survey #${row.id} on ${row.created_at}: experience=${answers.q1}${answers.q1_follow ? ` (${answers.q1_follow})` : ""
      }; interests: ${["q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10", "q11", "q12", "q13", "q14"]
        .map((k) => `${k}:${answers[k] ?? "n/a"}`)
        .join(", ")
      }; notes: ${answers.q15 || "none"}`,
  };
}

// ---- Routes ----
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/surveys", (req, res) => {
  const parsed = surveySchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Validation failed", details: parsed.error.flatten() });
  }

  const a = parsed.data;
  const sql = `
    INSERT INTO survey_responses
    (q1,q1_follow,q2,q3,q4,q5,q6,q7,q8,q9,q10,q11,q12,q13,q14,q15,raw_json)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `;
  const values = [
    a.q1,
    a.q1_follow ?? null,
    a.q2,
    a.q3,
    a.q4,
    a.q5,
    a.q6,
    a.q7,
    a.q8,
    a.q9,
    a.q10,
    a.q11,
    a.q12,
    a.q13,
    a.q14,
    a.q15 ?? null,
    JSON.stringify(a),
  ];

  db.run(sql, values, function (err) {
    if (err) {
      console.error("DB insert error", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(201).json({ id: this.lastID });
  });
});

app.get("/api/surveys", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  db.all(
    `SELECT * FROM survey_responses ORDER BY id DESC LIMIT ?`,
    [limit],
    (err, rows) => {
      if (err) {
        console.error("DB read error", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ data: rows.map(formatRow) });
    }
  );
});

app.get("/api/surveys/:id", (req, res) => {
  db.get(
    `SELECT * FROM survey_responses WHERE id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) {
        console.error("DB read error", err);
        return res.status(500).json({ error: "Database error" });
      }
      if (!row) return res.status(404).json({ error: "Not found" });
      res.json(formatRow(row));
    }
  );
});

// Export responses for AI / debugging
app.get("/api/survey/export", (_req, res) => {
  db.all(
    `SELECT id, created_at, raw_json FROM survey_responses ORDER BY id DESC LIMIT 1000`,
    [],
    (err, rows) => {
      if (err) {
        console.error("DB export error", err);
        return res.status(500).json({ error: "DB read failed" });
      }
      const data = rows.map((r) => ({
        id: r.id,
        created_at: r.created_at,
        answers: r.raw_json ? JSON.parse(r.raw_json) : {},
      }));
      res.json({ ok: true, count: data.length, data });
    }
  );
});

// NDJSON export: one response per line, minimal keys
app.get("/api/survey/ndjson", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 500, 2000);
  db.all(
    `SELECT id, created_at, raw_json FROM survey_responses ORDER BY id DESC LIMIT ?`,
    [limit],
    (err, rows) => {
      if (err) {
        console.error("DB ndjson export error", err);
        return res.status(500).json({ error: "DB read failed" });
      }
      res.type("application/x-ndjson");
      const lines = rows.map((r) => {
        const a = r.raw_json ? JSON.parse(r.raw_json) : {};
        return JSON.stringify({
          id: r.id,
          t: r.created_at,
          q1: a.q1 ?? null,
          lang: a.q1_follow ?? null,
          lk: [
            a.q2,
            a.q3,
            a.q4,
            a.q5,
            a.q6,
            a.q7,
            a.q8,
            a.q9,
            a.q10,
            a.q11,
            a.q12,
            a.q13,
            a.q14,
          ],
          note: a.q15 ?? null,
        });
      });
      res.send(lines.join("\n"));
    }
  );
});

// Run Gemini recommendations using the NDJSON file
app.get("/api/recommendations", (req, res) => {
  const ndjsonPath = path.join(__dirname, "responses.ndjson");
  const script = path.join(__dirname, "..", "backend", "gemini.py");

  const runGemini = () => {
    execFile(
      "python3",
      [script, "--file", ndjsonPath, "--limit", "1"],
      { timeout: 20000 },
      (err, stdout, stderr) => {
        if (err) {
          console.error("Gemini script error", err, stderr);
          // Only return 500 if we didn't get stdout (fallback)
          // Actually, if err is present, child process likely failed. 
          // But our python script now catches exceptions and uses fallback.
          // If it exits with 0 but prints to stderr, err is null.
          // If python fails completely, return 500.
          return res.status(500).json({ error: "Gemini processing failed" });
        }
        try {
          const parsed = JSON.parse(stdout.trim());
          return res.json(parsed);
        } catch (e) {
          console.error("Gemini JSON parse error", e, stdout);
          return res.status(500).json({ error: "Invalid Gemini output" });
        }
      }
    );
  };

  // Always regenerate NDJSON to ensure fresh data
  writeNdjsonFile(ndjsonPath, 500, (err) => {
    if (err) {
      console.error("NDJSON regen error", err);
      // If write fails, try running anyway if file exists
      if (fs.existsSync(ndjsonPath)) {
        return runGemini();
      }
      return res.status(500).json({ error: "Failed to regenerate NDJSON" });
    }
    runGemini();
  });
});

// Compact export: minimal keys to save tokens; optionally NDJSON via ?format=ndjson
app.get("/api/surveys/compact", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 200, 1000);
  const format = (req.query.format || "").toLowerCase();
  db.all(
    `SELECT id, created_at, raw_json FROM survey_responses ORDER BY id DESC LIMIT ?`,
    [limit],
    (err, rows) => {
      if (err) {
        console.error("DB compact export error", err);
        return res.status(500).json({ error: "DB read failed" });
      }
      const data = rows.map((r) => {
        const a = r.raw_json ? JSON.parse(r.raw_json) : {};
        return {
          id: r.id,
          t: r.created_at,
          q1: a.q1 ?? null,
          lang: a.q1_follow ?? null,
          lk: [
            a.q2,
            a.q3,
            a.q4,
            a.q5,
            a.q6,
            a.q7,
            a.q8,
            a.q9,
            a.q10,
            a.q11,
            a.q12,
            a.q13,
            a.q14,
          ],
          note: a.q15 ?? null,
        };
      });

      if (format === "ndjson") {
        res.type("application/x-ndjson");
        res.send(data.map((row) => JSON.stringify(row)).join("\n"));
      } else {
        res.json({ ok: true, count: data.length, data });
      }
    }
  );
});

// Catch-all for unknown API routes
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () => {
  console.log(`Survey server listening on http://localhost:${PORT}`);
});