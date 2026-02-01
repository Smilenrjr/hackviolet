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
    msgIndex = (msgIndex + 1) % messages.length;
    setTimeout(typeStep, 300 + Math.random() * 400);
  }
}

typeStep();

// ===== Auth modal =====
const loginBtn = document.getElementById("btn-login");
const recsBtn = document.getElementById("btn-recs");

const modal = document.getElementById("authModal");
const authTitle = document.getElementById("authTitle");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const toSignup = document.getElementById("toSignup");
const toLogin = document.getElementById("toLogin");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");

const signupEmail = document.getElementById("signupEmail");
const signupEmail2 = document.getElementById("signupEmail2");
const signupPassword = document.getElementById("signupPassword");
const signupPassword2 = document.getElementById("signupPassword2");
const signupError = document.getElementById("signupError");

function setAuthView(view) {
  const isLogin = view === "login";
  loginForm.style.display = isLogin ? "block" : "none";
  signupForm.style.display = isLogin ? "none" : "block";
  authTitle.textContent = isLogin ? "Login" : "Create account";

  // Clear errors when switching views
  hideError(loginError);
  hideError(signupError);

  // Move focus to the first control
  setTimeout(() => {
    (isLogin ? loginEmail : signupEmail)?.focus();
  }, 0);
}

function openModal() {
  // Always start clean + on login
  resetAuthForms();
  setAuthView("login");

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  resetAuthForms(); // ensure fields aren't still filled when re-opened
}

function resetAuthForms() {
  // clear values
  [loginEmail, loginPassword, signupEmail, signupEmail2, signupPassword, signupPassword2].forEach((el) => {
    if (el) el.value = "";
  });

  hideError(loginError);
  hideError(signupError);
}

function showError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.style.display = "block";
}

function hideError(el) {
  if (!el) return;
  el.textContent = "";
  el.style.display = "none";
}

// Close on overlay / close button clicks
modal?.addEventListener("click", (e) => {
  const t = e.target;
  if (t && t.getAttribute && t.getAttribute("data-close") === "true") closeModal();
});

// Close on ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal?.classList.contains("open")) closeModal();
});

// Toggle views
toSignup?.addEventListener("click", () => setAuthView("signup"));
toLogin?.addEventListener("click", () => setAuthView("login"));

// Login behavior (no DB yet): validate non-empty -> close + clear
loginForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  hideError(loginError);

  const email = (loginEmail?.value || "").trim();
  const pass = loginPassword?.value || "";

  if (!email) return showError(loginError, "Please enter an email.");
  if (!pass) return showError(loginError, "Please enter a password.");

  // Placeholder success: close modal and return to landing page
  closeModal();
});

// Signup behavior (client-side validation only)
function isStrongPassword(pw) {
  // at least 8 chars, 1 lowercase, 1 uppercase, 1 digit, 1 special
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(pw);
}

signupForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  hideError(signupError);

  const e1 = (signupEmail?.value || "").trim();
  const e2 = (signupEmail2?.value || "").trim();
  const p1 = signupPassword?.value || "";
  const p2 = signupPassword2?.value || "";

  if (!e1 || !e2) return showError(signupError, "Please enter and confirm your email.");
  if (e1.toLowerCase() !== e2.toLowerCase()) return showError(signupError, "Email addresses do not match.");

  if (!isStrongPassword(p1)) {
    return showError(signupError, "Password must be 8+ chars and include upper, lower, number, and special character.");
  }
  if (p1 !== p2) return showError(signupError, "Passwords do not match.");

  // Placeholder success: switch back to login (still no DB)
  resetAuthForms();
  setAuthView("login");
});

// Open modal from topbar
loginBtn?.addEventListener("click", openModal);

// Find my FIT -> survey page
recsBtn?.addEventListener("click", () => {
  window.location.href = "./survey.html";
});