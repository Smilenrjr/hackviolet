document.addEventListener("DOMContentLoaded", () => {
  const questionsContainer = document.getElementById("questions");
  const resultsEl = document.getElementById("results");

  // Q1: Yes/No with conditional dropdown when Yes
  const q1 = document.createElement("div");
  q1.className = "field";
  q1.innerHTML = `
    <label for="q1">1) Do you have prior programming experience?</label>
    <select id="q1" class="control" required>
      <option value="">Choose...</option>
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>
    <div id="q1-follow" style="margin-top:8px; display:none;">
      <label for="q1-langs">If yes, which language are you most comfortable with?</label>
      <select id="q1-langs" class="control">
        <option value="">Choose...</option>
        <option value="js">JavaScript / TypeScript</option>
        <option value="py">Python</option>
        <option value="c">C / C++</option>
        <option value="cs">C# / Unity</option>
        <option value="rs">Rust / Go</option>
        <option value="other">Other</option>
      </select>
      <input id="q1-langs-other" class="control" type="text" placeholder="Please specify..." style="display:none; margin-top:8px;" />
    </div>
  `;
  questionsContainer.appendChild(q1);

  // Questions 2-14: Likert scale (1-5)
  const likertPrompts = [
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
  ];

  function makeLikert(index, text) {
    const wrapper = document.createElement("div");
    wrapper.className = "field";
    const qId = `q${index}`;
    const scale = ["Strongly Disagree","Disagree","Neutral","Agree","Strongly Agree"];
    const radios = scale
      .map(
        (v) =>
          `<label class="option"><input type=\"radio\" name=\"${qId}\" value=\"${v}\" required><span class=\"bubble\" aria-hidden=\"true\"></span><span class=\"opt-text\">${v}</span></label>`
      )
      .join("");

    wrapper.innerHTML = `
      <label>${index}) ${text}</label>
      <div class="options">${radios}</div>
    `;
    return wrapper;
  }

  for (let i = 0; i < likertPrompts.length; i++) {
    const node = makeLikert(i + 2, likertPrompts[i]);
    questionsContainer.appendChild(node);
  }

  // Q15: Text box
  const q15 = document.createElement("div");
  q15.className = "field";
  q15.innerHTML = `
    <label for="q15">15) Anything else you'd like us to know?</label>
    <textarea id="q15" class="control" rows="5" placeholder="List any other interests/preferences you have about your programming journey. Also list any prior experience if applicable."></textarea>
  `;
  questionsContainer.appendChild(q15);

  // Show/hide follow-up for Q1
  const q1Select = document.getElementById("q1");
  const q1Follow = document.getElementById("q1-follow");
  const statusEl = resultsEl || document.getElementById("status");
  const langLabels = {
    js: "JavaScript / TypeScript",
    py: "Python",
    c: "C / C++",
    cs: "C# / Unity",
    rs: "Rust / Go",
    other: "Other",
  };
  q1Select.addEventListener("change", (e) => {
    if (e.target.value === "yes") {
      q1Follow.style.display = "block";
      document.getElementById("q1-langs").setAttribute("required", "required");
      // If "Other" is already selected, reveal the input
      const langSel = document.getElementById("q1-langs");
      if (langSel && langSel.value === "other") {
        const otherInput = document.getElementById("q1-langs-other");
        if (otherInput) {
          otherInput.style.display = "block";
          otherInput.setAttribute("required", "required");
        }
      }
    } else {
      q1Follow.style.display = "none";
      document.getElementById("q1-langs").removeAttribute("required");
      // hide other input if present
      const otherInput = document.getElementById("q1-langs-other");
      if (otherInput) {
        otherInput.style.display = "none";
        otherInput.removeAttribute("required");
      }
    }
  });


  // Show/hide "Other" text input for language dropdown
  const q1LangSelect = document.getElementById("q1-langs");
  const q1LangOtherInput = document.getElementById("q1-langs-other");

  q1LangSelect?.addEventListener("change", (e) => {
    const val = e.target.value;
    if (!q1LangOtherInput) return;

    if (val === "other") {
      q1LangOtherInput.style.display = "block";
      q1LangOtherInput.setAttribute("required", "required");
      q1LangOtherInput.focus();
    } else {
      q1LangOtherInput.style.display = "none";
      q1LangOtherInput.removeAttribute("required");
      q1LangOtherInput.value = "";
    }
  });

  // Submit handler: collect responses and render a simple summary
  const form = document.getElementById("surveyForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const answers = {};

    // Q1
    answers.q1 = q1Select.value || null;
    if (!answers.q1) {
      statusEl && statusEl.classList.remove("error", "success");
      statusEl && (statusEl.textContent = "Please answer question 1.");
      statusEl && statusEl.classList.add("error");
      return;
    }
    if (answers.q1 === "yes") {
      const q1LangEl = document.getElementById('q1-langs');
      const q1LangOther = document.getElementById('q1-langs-other');
      const val = q1LangEl ? q1LangEl.value : null;
      if (val === 'other') {
        const otherVal = q1LangOther && q1LangOther.value.trim();
        answers.q1_follow = otherVal || null;
      } else if (val) {
        answers.q1_follow = langLabels[val] || val;
      }
      if (!answers.q1_follow) {
        statusEl && (statusEl.textContent = "Please select or enter your primary language.");
        statusEl && statusEl.classList.add("error");
        return;
      }
    } else {
      answers.q1_follow = null;
    }

    // Q2-14
    for (let i = 2; i <= 14; i++) {
      const name = `q${i}`;
      const val = form.querySelector(`input[name=${name}]:checked`);
      answers[name] = val ? val.value : null;
      if (!answers[name]) {
        statusEl && (statusEl.textContent = "Please answer all questions before submitting.");
        statusEl && statusEl.classList.add("error");
        return;
      }
    }

    // Q15
    const q15Val = document.getElementById("q15").value.trim();
    answers.q15 = q15Val.length ? q15Val : null;

    try {
      statusEl && statusEl.classList.remove("error", "success");
      statusEl && (statusEl.textContent = "Saving your survey...");

      const resp = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        const msg = err?.error || "Unable to save right now.";
        statusEl && (statusEl.textContent = msg);
        statusEl && statusEl.classList.add("error");
        return;
      }

      const data = await resp.json();
      statusEl && (statusEl.textContent = `Saved! Response #${data.id}. You can close or adjust answers anytime.`);
      statusEl && statusEl.classList.add("success");

      form.reset();
      q1Follow.style.display = "none";
      const otherInput = document.getElementById("q1-langs-other");
      if (otherInput) {
        otherInput.style.display = "none";
        otherInput.removeAttribute("required");
      }
    } catch (err) {
      console.error(err);
      statusEl && (statusEl.textContent = "Network error—please try again.");
      statusEl && statusEl.classList.add("error");
    }
  });

});
