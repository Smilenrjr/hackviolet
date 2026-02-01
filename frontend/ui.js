// ===== Terminal typewriter (looping, natural speed) =====
const typedEl = document.getElementById("typed");

const messages = [
  "ready. answer a quick fit calibration (~2 minutes).",
  "personalized path loading...",
  "downloading customized plans for success..."
];

let msgIndex = 0;
let charIndex = 0;

function typeStep() {
  const msg = messages[msgIndex];
  typedEl.textContent = msg.slice(0, charIndex);

  if (charIndex < msg.length) {
    charIndex++;
    setTimeout(typeStep, 20 + Math.random() * 40);
  } else {
    // pause on full line, then erase
    setTimeout(eraseStep, 900 + Math.random() * 900);
  }
}

function eraseStep() {
  const msg = messages[msgIndex];
  typedEl.textContent = msg.slice(0, charIndex);

  if (charIndex > 0) {
    charIndex--;
    setTimeout(eraseStep, 10 + Math.random() * 25);
  } else {
    // move to next message
    msgIndex = (msgIndex + 1) % messages.length;
    setTimeout(typeStep, 300 + Math.random() * 400);
  }
}

// start the loop
typeStep();

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