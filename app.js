/* ==========================================================================
   WEBLINGO — app.js
   No framework here on purpose — just plain JavaScript, so every line is
   readable without knowing React/Vue first. The whole app is one idea:

     1. We keep everything the app "knows" in one `state` object.
     2. Every screen is a function that returns an HTML string.
     3. Whenever something changes, we re-render into #app-root.

   That loop (state -> render -> user does something -> update state ->
   render again) is the same idea every JS framework builds on top of.
   ========================================================================== */

// ---------------------------------------------------------------------------
// 1. QUIZ CONTENT
// Each question has 4 options. Each option carries a `points` value (0-3).
// We add up the points across all questions to place the learner on a path.
// Editing the quiz later just means editing this array — no other code
// needs to change.
// ---------------------------------------------------------------------------
const QUIZ_QUESTIONS = [
  {
    text: "A friend asks you to write a polite email declining an invitation. What's your move?",
    options: [
      { label: "I write it myself, word by word.", points: 0 },
      { label: "I ask an AI chatbot, but I'm never quite sure how to phrase the request.", points: 1 },
      { label: "I ask an AI chatbot and usually get something close to right on the first try.", points: 2 },
      { label: "I give it tone, length, and context up front, then refine the draft in one or two follow-ups.", points: 3 },
    ],
  },
  {
    text: "You need to find one very specific fact online. What do you do?",
    options: [
      { label: "Type a full question into a search engine and hope for the best.", points: 0 },
      { label: "Use a search engine's basic filters, like a date range.", points: 1 },
      { label: 'Use search operators, like quotes or "site:", to narrow results.', points: 2 },
      { label: "Ask an AI tool to research it, then double-check the sources it used.", points: 3 },
    ],
  },
  {
    text: "How do you handle repetitive computer tasks — like renaming 50 files or copying data between apps?",
    options: [
      { label: "One by one, by hand.", points: 0 },
      { label: "I know a few keyboard shortcuts that save time.", points: 1 },
      { label: "I use tools like spreadsheet formulas or Find & Replace to speed it up.", points: 2 },
      { label: "I set up an automation — a script or a tool like Zapier — to do it for me.", points: 3 },
    ],
  },
  {
    text: "An AI tool gives you an answer that's wrong or oddly generic. What's next?",
    options: [
      { label: "I assume it's right and move on.", points: 0 },
      { label: "I try asking again with different words.", points: 1 },
      { label: "I add more context or a concrete example to guide it.", points: 2 },
      { label: "I break the task into smaller steps and check each one.", points: 3 },
    ],
  },
  {
    text: "How comfortable are you combining tools to get something done — say, AI plus a spreadsheet plus your calendar?",
    options: [
      { label: "I mostly use one tool at a time.", points: 0 },
      { label: "I copy information between tools by hand.", points: 1 },
      { label: "I know a handful of shortcuts or built-in integrations.", points: 2 },
      { label: "I regularly chain tools together into a small workflow.", points: 3 },
    ],
  },
];

// ---------------------------------------------------------------------------
// 2. LEARNING PATHS
// Total quiz score (0-15) maps to one of these. `min` is the lowest score
// that qualifies for that path.
// ---------------------------------------------------------------------------
const PATHS = [
  {
    id: "foundations",
    min: 0,
    name: "Foundations",
    tagline: "Start from the ground up",
    desc: "You'll build steady habits first: how to phrase a request, where AI tools help versus where they don't, and how to spot a wrong answer.",
  },
  {
    id: "builder",
    min: 6,
    name: "Builder",
    tagline: "You've got the basics — now go faster",
    desc: "You already get results from AI tools sometimes. We'll sharpen your prompting, add real search techniques, and start chaining simple tools together.",
  },
  {
    id: "power-user",
    min: 11,
    name: "Power User",
    tagline: "Refine what you already do well",
    desc: "You're already combining tools. We'll focus on precision — better prompts on the first try, small automations, and knowing when to trust the output.",
  },
];

// ---------------------------------------------------------------------------
// 2b. ONBOARDING QUESTIONS
// Runs before the placement quiz, like Duolingo's "why are you here" screens.
// Each step is multi-select (tap to toggle chips on/off) and includes an
// "Other" chip that reveals a free-text input for anything not listed.
// Same pattern as QUIZ_QUESTIONS: this data doesn't know anything about how
// it gets rendered, so editing the questions/options later is safe.
// ---------------------------------------------------------------------------
const ONBOARDING_STEPS = [
  {
    id: "struggle",
    text: "What are you struggling with that you think extra digital skills would help with?",
    options: [
      "Writing emails and messages faster",
      "Getting good answers from AI chatbots",
      "Organizing files and information",
      "Automating repetitive tasks",
      "Keeping up with new tools",
    ],
  },
  {
    id: "longterm",
    text: "What are your long-term projects?",
    options: [
      "Starting or growing a business",
      "A creative project — writing, art, video",
      "Advancing my career",
      "A personal project just for me",
      "Helping my family or community",
    ],
  },
  {
    id: "shortterm",
    text: "What short-term skills do you need to make that long-term goal possible?",
    options: [
      "Prompting AI tools well",
      "Searching more effectively",
      "Basic automation or scripting",
      "Organizing my digital files",
      "Using productivity apps well",
    ],
  },
];

function pathForScore(score) {
  // Walk the list backwards so we return the *highest* path the score clears.
  return [...PATHS].reverse().find((p) => score >= p.min);
}

// ---------------------------------------------------------------------------
// 3. APP STATE
// `screen` controls which render function runs. `answers` stores the point
// value the learner picked for each question index.
// ---------------------------------------------------------------------------
const state = {
  screen: "welcome",   // "welcome" | "onboarding" | "quiz" | "result"
  questionIndex: 0,
  answers: [],           // quiz answers, e.g. [3, 1, 2, 0, 3]

  onboardingIndex: 0,
  // One entry per ONBOARDING_STEPS item: { selected: Set of chosen chip labels, otherText: string }
  onboardingAnswers: ONBOARDING_STEPS.map(() => ({ selected: new Set(), otherText: "" })),
};

const root = document.getElementById("app-root");

function render() {
  if (state.screen === "welcome") root.innerHTML = renderWelcome();
  if (state.screen === "onboarding") root.innerHTML = renderOnboarding();
  if (state.screen === "quiz") root.innerHTML = renderQuiz();
  if (state.screen === "result") root.innerHTML = renderResult();
  attachHandlers();
}

// ---------------------------------------------------------------------------
// 4. WELCOME SCREEN
// ---------------------------------------------------------------------------
function renderWelcome() {
  return `
    <section class="hero">
      <div class="eyebrow">Digital & AI tools, one small lesson at a time</div>
      <h1>Get fluent in the tools <em>everyone</em> assumes you already know.</h1>
      <p class="lede">
        Weblingo teaches you how to actually use AI chatbots, search engines,
        and everyday software well — in bite-sized lessons, with streaks and
        XP to keep you coming back.
      </p>

      <div class="prompt-demo">
        <div class="prompt-demo-label">What a Weblingo lesson looks like</div>
        <div class="prompt-line" id="prompt-line"></div>
        <div class="xp-toast" id="xp-toast">+15 XP · better prompt</div>
      </div>

      <div class="hero-actions">
        <button class="btn btn-primary" id="start-quiz-btn">Find my starting point</button>
        <button class="btn btn-ghost" id="skip-btn">Skip, I know my level</button>
      </div>
      <div class="hero-note">Takes about a minute. No account needed yet.</div>

      <div class="track-row">
        <div class="track-chip"><strong>AI Chat Tools</strong> · prompting</div>
        <div class="track-chip"><strong>Search</strong> · finding things fast</div>
        <div class="track-chip"><strong>Automation</strong> · doing less by hand</div>
      </div>
    </section>
  `;
}

// Typing animation for the hero demo: types a rough prompt, pauses,
// then swaps in an "upgraded" version and pops the XP toast.
function runPromptDemo() {
  const el = document.getElementById("prompt-line");
  const toast = document.getElementById("xp-toast");
  if (!el) return; // guard: only run this on the welcome screen

  const rough = "write me an email";
  const upgraded = "Write a 3-sentence email to my landlord, polite but firm, asking to fix the heater by Friday.";

  let i = 0;
  el.innerHTML = `<span class="cursor"></span>`;

  function typeRough() {
    if (i <= rough.length) {
      el.innerHTML = rough.slice(0, i) + `<span class="cursor"></span>`;
      i++;
      setTimeout(typeRough, 45);
    } else {
      setTimeout(swapToUpgraded, 900);
    }
  }

  function swapToUpgraded() {
    el.classList.add("upgraded");
    let j = 0;
    function typeUpgraded() {
      if (j <= upgraded.length) {
        el.innerHTML = upgraded.slice(0, j) + `<span class="cursor"></span>`;
        j++;
        setTimeout(typeUpgraded, 18);
      } else if (toast) {
        toast.classList.add("show");
      }
    }
    el.innerHTML = "";
    typeUpgraded();
  }

  typeRough();
}

// ---------------------------------------------------------------------------
// 4b. ONBOARDING SCREEN
// Same structure as the quiz screen (progress bar + card), but chips can be
// toggled on/off (multi-select) instead of immediately advancing.
// ---------------------------------------------------------------------------
function renderOnboarding() {
  const step = ONBOARDING_STEPS[state.onboardingIndex];
  const answer = state.onboardingAnswers[state.onboardingIndex];
  const progressPct = Math.round((state.onboardingIndex / ONBOARDING_STEPS.length) * 100);
  const isLast = state.onboardingIndex === ONBOARDING_STEPS.length - 1;

  // A step is "answered" if at least one chip is selected, or the free-text
  // "Other" field has something typed in it.
  const hasAnswer = answer.selected.size > 0 || answer.otherText.trim().length > 0;

  return `
    <section class="quiz-header">
      <div class="progress-track">
        <div class="progress-fill" style="width:${progressPct}%"></div>
      </div>
      <div class="progress-label">Getting to know you · ${state.onboardingIndex + 1} of ${ONBOARDING_STEPS.length}</div>
    </section>

    <section class="question-card">
      <div class="question-eyebrow">Tell us a bit about you</div>
      <h2 class="question-text">${step.text}</h2>
      <div class="chip-list">
        ${step.options
          .map(
            (opt) => `
          <button class="chip ${answer.selected.has(opt) ? "chip-selected" : ""}" data-chip="${opt}">
            ${opt}
          </button>`
          )
          .join("")}
        <button class="chip chip-other ${answer.otherText.length > 0 ? "chip-selected" : ""}" id="other-chip">
          Other
        </button>
      </div>

      <input
        type="text"
        id="other-input"
        class="other-input ${answer.otherText.length > 0 || answer.showOtherInput ? "" : "hidden"}"
        placeholder="Type your own answer..."
        value="${answer.otherText.replace(/"/g, "&quot;")}"
      />
    </section>

    <div class="quiz-nav">
      <button class="btn btn-ghost" id="onboarding-back-btn" ${state.onboardingIndex === 0 ? "disabled" : ""}>Back</button>
      <button class="btn btn-primary" id="onboarding-next-btn" ${hasAnswer ? "" : "disabled"}>
        ${isLast ? "Start quiz" : "Next"}
      </button>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// 5. QUIZ SCREEN
// ---------------------------------------------------------------------------
function renderQuiz() {
  const q = QUIZ_QUESTIONS[state.questionIndex];
  const progressPct = Math.round((state.questionIndex / QUIZ_QUESTIONS.length) * 100);
  const optionLetters = ["A", "B", "C", "D"];

  return `
    <section class="quiz-header">
      <div class="progress-track">
        <div class="progress-fill" style="width:${progressPct}%"></div>
      </div>
      <div class="progress-label">Question ${state.questionIndex + 1} of ${QUIZ_QUESTIONS.length}</div>
    </section>

    <section class="question-card">
      <div class="question-eyebrow">Placement quiz</div>
      <h2 class="question-text">${q.text}</h2>
      <div class="option-list">
        ${q.options
          .map(
            (opt, i) => `
          <button class="option" data-points="${opt.points}">
            <span class="option-key">${optionLetters[i]}</span>
            <span>${opt.label}</span>
          </button>`
          )
          .join("")}
      </div>
    </section>

    <div class="quiz-nav">
      <button class="btn btn-ghost" id="back-btn" ${state.questionIndex === 0 ? "disabled" : ""}>Back</button>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// 6. RESULT SCREEN
// ---------------------------------------------------------------------------
function renderResult() {
  const score = state.answers.reduce((sum, p) => sum + p, 0);
  const path = pathForScore(score);
  const maxScore = QUIZ_QUESTIONS.length * 3;

  return `
    <section>
      <div class="result-eyebrow">Your placement</div>
      <h1 class="result-title">You're starting on <span class="accent">${path.name}</span></h1>
      <p class="result-desc">${path.desc}</p>
      <div class="score-strip">Placement score: <strong>${score} / ${maxScore}</strong></div>

      <div class="path-map">
        ${PATHS.map(
          (p) => `
          <div class="path-node ${p.id === path.id ? "active" : ""}">
            <div class="node-dot">${p.id === path.id ? "●" : "○"}</div>
            <div class="node-body">
              <div class="node-title">${p.name}</div>
              <div class="node-sub">${p.tagline}</div>
            </div>
          </div>`
        ).join("")}
      </div>

      <div class="hero-actions">
        <button class="btn btn-primary" id="restart-btn">Retake the quiz</button>
      </div>
    </section>
  `;
}

// ---------------------------------------------------------------------------
// 7. EVENT HANDLERS
// Re-attached after every render(), since re-writing innerHTML wipes out
// any listeners that were on the old elements.
// ---------------------------------------------------------------------------
function attachHandlers() {
  if (state.screen === "welcome") {
    runPromptDemo();
    document.getElementById("start-quiz-btn").onclick = () => {
      state.screen = "onboarding";
      state.onboardingIndex = 0;
      render();
    };
    document.getElementById("skip-btn").onclick = () => {
      // "I know my level" — send them straight to the Builder path for now.
      // Later this could open a manual level picker instead.
      state.answers = [6];
      state.screen = "result";
      render();
    };
  }

  if (state.screen === "onboarding") {
    const answer = state.onboardingAnswers[state.onboardingIndex];

    // Toggle a regular chip on/off. Multi-select: clicking an already
    // selected chip removes it, clicking an unselected one adds it.
    document.querySelectorAll(".chip[data-chip]").forEach((btn) => {
      btn.onclick = () => {
        const label = btn.dataset.chip;
        if (answer.selected.has(label)) {
          answer.selected.delete(label);
        } else {
          answer.selected.add(label);
        }
        render();
      };
    });

    // "Other" chip just reveals the text input — it doesn't select anything
    // itself, the typed text is what counts as the answer.
    document.getElementById("other-chip").onclick = () => {
      answer.showOtherInput = true;
      render();
      document.getElementById("other-input").focus();
    };

    document.getElementById("other-input").oninput = (e) => {
      answer.otherText = e.target.value;
      // Only re-render on input to toggle the Next button's disabled state
      // when text is typed/cleared — but re-rendering on every keystroke
      // would steal focus, so we update state directly and only touch the
      // Next button, not the whole screen.
      const nextBtn = document.getElementById("onboarding-next-btn");
      const hasAnswer = answer.selected.size > 0 || answer.otherText.trim().length > 0;
      nextBtn.disabled = !hasAnswer;
    };

    const backBtn = document.getElementById("onboarding-back-btn");
    if (backBtn) {
      backBtn.onclick = () => {
        if (state.onboardingIndex > 0) {
          state.onboardingIndex--;
          render();
        }
      };
    }

    document.getElementById("onboarding-next-btn").onclick = () => {
      if (state.onboardingIndex < ONBOARDING_STEPS.length - 1) {
        state.onboardingIndex++;
        render();
      } else {
        // Onboarding done — move on to the placement quiz.
        state.screen = "quiz";
        state.questionIndex = 0;
        state.answers = [];
        render();
      }
    };
  }

  if (state.screen === "quiz") {
    document.querySelectorAll(".option").forEach((btn) => {
      btn.onclick = () => {
        const points = Number(btn.dataset.points);
        state.answers[state.questionIndex] = points;

        if (state.questionIndex < QUIZ_QUESTIONS.length - 1) {
          state.questionIndex++;
          render();
        } else {
          state.screen = "result";
          render();
        }
      };
    });

    const backBtn = document.getElementById("back-btn");
    if (backBtn) {
      backBtn.onclick = () => {
        if (state.questionIndex > 0) {
          state.questionIndex--;
          render();
        }
      };
    }
  }

  if (state.screen === "result") {
    document.getElementById("restart-btn").onclick = () => {
      state.screen = "quiz";
      state.questionIndex = 0;
      state.answers = [];
      render();
    };
  }
}

// ---------------------------------------------------------------------------
// 8. KICK OFF
// ---------------------------------------------------------------------------
render();
