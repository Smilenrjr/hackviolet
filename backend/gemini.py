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
import sys

# Try to load .env from frontend directory
try:
  from dotenv import load_dotenv
  # Look for .env in frontend dir relative to this script
  script_dir = Path(__file__).parent
  frontend_env = script_dir.parent / "frontend" / ".env"
  if frontend_env.exists():
    load_dotenv(frontend_env)
  else:
    # Try current dir or parent (standard locations)
    load_dotenv()
except ImportError:
  sys.stderr.write("WARNING: python-dotenv not installed. Environment variables must be set manually.\\n")

try:
  import google as genai
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
  
  questions = [
    "The visual side of technology interests me.",
    "I prefer logic and problem-solving over visual design.",
    "I want to know on a deep level how computer systems work.",
    "I’m interested in designing websites.",
    "I want to learn how to code for video games.",
    "I want to know more about AI.",
    "I am curious about the robotics scene.",
    "I’m interested in animations or simulations.",
    "New technologies like VR and AR interest me.",
    "It’s important to me that my workplace values inclusion and diversity.",
    "I like building things from scratch.",
    "I like to learn a little bit about everything.",
    "I enjoy organization and am detail-oriented.",
  ]

  mapped_likert = []
  for i, q in enumerate(questions):
    val = likerts[i] if i < len(likerts) else "N/A"
    mapped_likert.append(f"- {q}: {val}")

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
likert_responses:
{chr(10).join(mapped_likert)}
notes: {entry.get('note')}

Return strict JSON with keys: languages, concepts, jobs.
Each key should be an array of objects with "name" and "why".
Keep responses concise (max 18 words per reason).
"""
  return prompt.strip()


def call_gemini(prompt: str) -> dict:
  api_key = os.getenv("GEMINI_API_KEY")
  
  missing = []
  if not genai:
    missing.append("google-generativeai library not installed")
  if not api_key:
    missing.append("GEMINI_API_KEY environment variable not set")
    # Debug info for the user

  if missing:
    import sys
    sys.stderr.write(f"WARNING: {' and '.join(missing)}. Using fallback.\\n")
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

  try:
    genai.configure(api_key=api_key)
    # Using gemini-flash-latest for best availability
    model = genai.GenerativeModel("gemini-flash-latest")
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
  except Exception as e:
    import sys
    sys.stderr.write(f"ERROR: Gemini API call failed: {e}\\nUsing fallback.\\n")
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