// ===== Terminal typewriter =====
const typedEl = document.getElementById("typed");

const line = "ready. answer a quick fit calibration (~5 minutes).";

let i = 0;

function typeOnce() {
  typedEl.textContent = line.slice(0, i);

  if (i < line.length) {
    i++;
    setTimeout(typeOnce, 28 + Math.random() * 22);
  }
}
typeOnce();

// ===== Buttons =====
const loginBtn = document.getElementById("btn-login");
const recsBtn = document.getElementById("btn-recs");

loginBtn.addEventListener("click", () => {
  // Placeholder until auth exists
  console.log("Login clicked");
});

recsBtn.addEventListener("click", () => {
  // REAL navigation now
  window.location.href = "./survey.html";
});