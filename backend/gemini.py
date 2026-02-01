"""
Generate learning recommendations from survey NDJSON using Gemini.

Usage:
  python3 gemini.py --file ../frontend/responses.ndjson --limit 1

Env:
  GEMINI_API_KEY must be set for live calls. If missing, a fallback
  deterministic response is returned so the pipeline still works.
"""

import argparse
import json
import os
from pathlib import Path
from typing import Optional

try:
  import google.generativeai as genai
except Exception:  # pragma: no cover
  genai = None


def load_entries(path: Path, limit: Optional[int] = None):
  lines = []
  if not path.exists():
    raise FileNotFoundError(f"NDJSON file not found: {path}")
  with path.open() as f:
    for line in f:
      line = line.strip()
      if not line:
        continue
      lines.append(json.loads(line))
      if limit and len(lines) >= limit:
        break
  return lines


def format_prompt(entry: dict) -> str:
  likerts = entry.get("lk") or []
  prompt = f"""
You are a career guide. Given one survey response, recommend:
- 3 programming languages to learn next (short reason each)
- 5 concepts/skills to study (short reason each)
- 5 job roles that fit (short reason each)

Survey:
id: {entry.get('id')}
timestamp: {entry.get('t')}
experience: {entry.get('q1')}
primary_language: {entry.get('lang')}
likert: {likerts}
notes: {entry.get('note')}

Return strict JSON with keys: languages, concepts, jobs.
Each key should be an array of objects with "name" and "why".
Keep responses concise (max 18 words per reason).
"""
  return prompt.strip()


def call_gemini(prompt: str) -> dict:
  api_key = os.getenv("GEMINI_API_KEY")
  if not api_key or not genai:
    # fallback so the app still works without network/key
    return {
      "languages": [
        {"name": "Python", "why": "Fast to learn and great for AI/automation."},
        {"name": "JavaScript", "why": "Essential for web UIs and full‑stack work."},
        {"name": "SQL", "why": "Needed to query and reason over data."},
      ],
      "concepts": [
        {"name": "Data Structures", "why": "Core for interviews and building efficient code."},
        {"name": "APIs & REST", "why": "Lets you integrate services and ship features."},
        {"name": "Git", "why": "Collaboration and version control."},
        {"name": "Testing", "why": "Confidence and quality in releases."},
        {"name": "HTTP & Web", "why": "Understand how clients and servers talk."},
      ],
      "jobs": [
        {"name": "Full‑Stack Intern", "why": "Build end‑to‑end features with JS/Python."},
        {"name": "Automation Engineer", "why": "Use Python to script and test systems."},
        {"name": "Data Analyst", "why": "Apply SQL/Python to answer business questions."},
        {"name": "Junior Web Dev", "why": "Use JS/HTML/CSS to ship front‑end work."},
        {"name": "Support Engineer", "why": "Debug user issues and automate fixes."},
      ],
      "source": "fallback",
    }

  genai.configure(api_key=api_key)
  model = genai.GenerativeModel("gemini-1.5-flash")
  resp = model.generate_content(prompt)
  text = resp.text or ""
  # try to locate JSON in response
  start = text.find("{")
  end = text.rfind("}")
  if start == -1 or end == -1:
    raise ValueError("Gemini response missing JSON.")
  parsed = json.loads(text[start : end + 1])
  parsed["source"] = "gemini"
  return parsed


def main():
  parser = argparse.ArgumentParser()
  parser.add_argument("--file", required=True, help="Path to responses NDJSON")
  parser.add_argument("--limit", type=int, default=1, help="Number of entries to use (latest first)")
  args = parser.parse_args()

  entries = load_entries(Path(args.file), args.limit)
  if not entries:
    raise SystemExit("No survey entries found.")

  prompt = format_prompt(entries[0])
  data = call_gemini(prompt)
  data["used_ids"] = [e.get("id") for e in entries[: args.limit]]
  print(json.dumps(data))


if __name__ == "__main__":
  main()
