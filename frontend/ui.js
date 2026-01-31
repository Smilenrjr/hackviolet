// ===== Terminal typewriter =====
const typedEl = document.getElementById("typed");

const scriptLines = [
  "codefit --init",
  "loading interest compiler…",
  "building learning plan…",
  "matching roles…",
  "ready. answer 3 questions to compute your fit.",
];

let lineIndex = 0;
let charIndex = 0;

function typeLoop() {
  const line = scriptLines[lineIndex];
  typedEl.textContent = line.slice(0, charIndex);

  if (charIndex < line.length) {
    charIndex++;
    setTimeout(typeLoop, 28 + Math.random() * 22);
  } else {
    // Pause at end of each line, then move to next line
    setTimeout(() => {
      lineIndex = (lineIndex + 1) % scriptLines.length;
      charIndex = 0;
      typeLoop();
    }, 700);
  }
}
typeLoop();

// ===== UI controls =====
const btnScroll = document.getElementById("btn-scroll");
const btnFocus = document.getElementById("btn-focus");
const btnDemo = document.getElementById("btn-demo");
const btnRandom = document.getElementById("btn-random");

const form = document.getElementById("survey");
const results = document.getElementById("results");
const resultsCard = document.getElementById("resultsCard");

const interest = document.getElementById("interest");
const style = document.getElementById("style");
const goal = document.getElementById("goal");

function smoothToForm() {
  form.scrollIntoView({ behavior: "smooth", block: "center" });
}
btnScroll.addEventListener("click", smoothToForm);
btnFocus.addEventListener("click", smoothToForm);
btnDemo.addEventListener("click", () => {
  interest.value = "web";
  style.value = "builder";
  goal.value = "portfolio";
  smoothToForm();
});

btnRandom.addEventListener("click", () => {
  const interests = ["web","data","games","systems","automation","security"];
  const styles = ["visual","logical","builder","curious"];
  const goals = ["job","portfolio","learn","startup"];
  interest.value = interests[Math.floor(Math.random() * interests.length)];
  style.value = styles[Math.floor(Math.random() * styles.length)];
  goal.value = goals[Math.floor(Math.random() * goals.length)];
  smoothToForm();
});

// ===== Recommendation engine (simple v1) =====
function recommend({ interest, style, goal }) {
  // Base recommendations by interest
  const map = {
    web: {
      languages: ["TypeScript", "JavaScript"],
      concepts: ["React", "Accessibility", "Design systems", "APIs"],
      roles: ["Frontend Engineer", "UI Engineer", "Web Developer"],
    },
    data: {
      languages: ["Python", "SQL"],
      concepts: ["Pandas", "Data viz", "ETL", "Statistics basics"],
      roles: ["Data Analyst", "BI Developer", "Junior Data Engineer"],
    },
    games: {
      languages: ["C#", "C++"],
      concepts: ["Unity/Unreal", "Linear algebra", "Physics", "Game loops"],
      roles: ["Gameplay Programmer", "Game Developer", "Technical Designer"],
    },
    systems: {
      languages: ["Rust", "C"],
      concepts: ["Memory", "Networking", "OS basics", "Profiling"],
      roles: ["Systems Engineer", "Embedded Developer", "Platform Engineer"],
    },
    automation: {
      languages: ["Python", "JavaScript"],
      concepts: ["Scripting", "APIs", "CLI tools", "Testing"],
      roles: ["Automation Engineer", "QA Automation", "DevOps (junior)"],
    },
    security: {
      languages: ["Python", "Go"],
      concepts: ["Web security", "OWASP basics", "Crypto basics", "Threat modeling"],
      roles: ["Security Analyst (junior)", "AppSec Intern", "SOC Analyst"],
    },
  };

  const base = map[interest];

  // Slight flavoring
  const boosters = [];
  if (style === "visual") boosters.push("UI motion", "CSS mastery");
  if (style === "logical") boosters.push("DSA fundamentals", "Debugging discipline");
  if (style === "builder") boosters.push("Shipping habits", "Git + CI basics");
  if (style === "curious") boosters.push("Systems thinking", "Reading docs fast");

  const goalAdd = [];
  if (goal === "job") goalAdd.push("Interview projects", "Resume-ready portfolio");
  if (goal === "portfolio") goalAdd.push("Case studies", "Polished demos");
  if (goal === "learn") goalAdd.push("Deep dives", "Build-from-scratch projects");
  if (goal === "startup") goalAdd.push("MVP building", "Product iteration");

  return {
    languages: base.languages,
    concepts: [...base.concepts, ...boosters.slice(0, 2)],
    roles: base.roles,
    nextSteps: ["Pick 1 language", "Build 2 tiny projects", "Ship 1 portfolio piece", ...goalAdd.slice(0, 1)],
  };
}

function render(rec) {
  results.innerHTML = `
    <div class="grid2">
      <div class="block">
        <h3>Languages</h3>
        ${rec.languages.map((x) => `<span class="chip">${x}</span>`).join("")}
      </div>
      <div class="block">
        <h3>Concepts</h3>
        ${rec.concepts.map((x) => `<span class="chip">${x}</span>`).join("")}
      </div>
      <div class="block">
        <h3>Roles</h3>
        ${rec.roles.map((x) => `<span class="chip">${x}</span>`).join("")}
      </div>
    </div>
    <div class="block" style="margin-top:10px;">
      <h3>Next steps</h3>
      ${rec.nextSteps.map((x) => `<span class="chip">${x}</span>`).join("")}
    </div>
  `;

  // subtle emphasis
  resultsCard.style.transform = "translateY(-1px)";
  setTimeout(() => (resultsCard.style.transform = "translateY(0px)"), 160);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const rec = recommend({
    interest: interest.value,
    style: style.value,
    goal: goal.value,
  });
  render(rec);
});

// Optional: Enter key anywhere in the page focuses form if nothing is active
window.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && document.activeElement?.tagName !== "SELECT" && document.activeElement?.tagName !== "BUTTON") {
    smoothToForm();
  }
});
