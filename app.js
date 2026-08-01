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
// 0. LESSON CONTENT
// Keyed by subject id -> unit id -> array of lessons. Each lesson has a
// list of `steps`, run in order:
//   - "teach"     — an explanation card, just tap Continue
//   - "mc"        — multiple choice, one correct option
//   - "fillBlank" — typed answer, checked against a small accepted list
//   - "match"     — tap one item on the left, then its pair on the right
// Only chat-prompting / unit1 / lesson 1 is fully built right now — this is
// the template the rest of the curriculum will follow once this is solid.
// A lesson without `steps` is treated as locked/coming soon in the path UI.
// ---------------------------------------------------------------------------
const LESSONS = {
  "chat-prompting": {
    unit1: [
      {
        id: "u1l1",
        title: "Your First Prompt",
        subtitle: "Say exactly what you want",
        steps: [
          {
            type: "teach",
            title: "Vague vs. specific",
            body: "AI chatbots can't read your mind — they just respond to the words you give them. The more specific your request, the better the result. Compare: “write about dogs” versus “write 3 fun facts about golden retrievers for a kids' presentation.” Same topic, very different usefulness.",
          },
          {
            type: "mc",
            prompt: "Which of these prompts will get the best result from an AI chatbot?",
            options: [
              "Tell me about dogs",
              "Write 3 fun facts about golden retrievers for a kids' presentation",
              "Dogs",
              "Can you help me?",
            ],
            correctIndex: 1,
            explanation: "The specific one gives the AI a topic, a format (3 facts), and an audience (kids) — everything it needs to give you something usable right away.",
          },
          {
            type: "fillBlank",
            prompt: "Complete the sentence: “Write a birthday message for my ___ who turns 30.” Type a specific relationship (like sister, dad, or coworker) instead of leaving it generic.",
            accepted: [
              "sister", "brother", "mom", "mother", "dad", "father", "friend", "best friend",
              "cousin", "aunt", "uncle", "grandma", "grandmother", "grandpa", "grandfather",
              "wife", "husband", "partner", "coworker", "boss", "girlfriend", "boyfriend",
            ],
            hint: "Any real relationship works — sister, coworker, best friend, etc.",
          },
          {
            type: "match",
            prompt: "Match each vague prompt to its specific upgrade.",
            pairs: [
              { left: "Write an email", right: "Write a 3-sentence email declining a meeting invite, politely" },
              { left: "Explain photosynthesis", right: "Explain photosynthesis in 2 sentences, for a 10-year-old" },
              { left: "Give me a recipe", right: "Give me a 20-minute vegetarian dinner recipe using only 5 ingredients" },
            ],
          },
          {
            type: "mc",
            prompt: "You ask an AI chatbot “write me a poem” and get something generic. What's the best next move?",
            options: [
              "Give up — AI can't write good poems",
              "Add a topic, tone, and length: “write a funny 4-line poem about Monday mornings”",
              "Ask a different chatbot the exact same question",
              "Retype the exact same request again",
            ],
            correctIndex: 1,
            explanation: "Same fix as before — a generic result almost always means a generic prompt. Adding specifics is the fastest way to improve it.",
          },
        ],
      },
      { id: "u1l2", title: "Giving Context" },
      { id: "u1l3", title: "Setting the Tone" },
      { id: "u1l4", title: "Fixing a Bad Answer" },
    ],
  },
};

// ---------------------------------------------------------------------------
// 1. PLACEMENT QUESTION BANK
// One 5-question set per subject, ordered easy -> hard. Each option carries
// a `points` value (0-3) reflecting how strong that answer is. A learner's
// score on THIS subject's 5 questions decides which unit they get placed
// into for THAT subject only — other subjects aren't affected.
// ---------------------------------------------------------------------------
const SUBJECT_QUESTIONS = {
  "chat-prompting": [
    {
      text: "You want to write a quick thank-you note. What do you type into the AI chatbot?",
      options: [
        { label: "A long, rambling request, typed just like you'd say it out loud.", points: 0 },
        { label: "Just the word 'note' plus who it's for.", points: 1 },
        { label: "A prompt naming the occasion and the tone you want.", points: 2 },
        { label: "A short prompt with occasion, tone, and length.", points: 3 },
      ],
    },
    {
      text: "The AI's first draft of your email is close, but too long. What do you do?",
      options: [
        { label: "Send it as-is and hope nobody minds the length.", points: 0 },
        { label: "Ask it to trim things down a little.", points: 1 },
        { label: "Give it an exact sentence count to hit.", points: 2 },
        { label: "Name the length and which parts to cut.", points: 3 },
      ],
    },
    {
      text: "You need the AI to match a very particular tone, like your boss's writing style. How do you get that?",
      options: [
        { label: "Ask it to sound professional and see what happens.", points: 0 },
        { label: "Describe the tone using a couple of adjectives.", points: 1 },
        { label: "Paste a sample of that tone as a reference.", points: 2 },
        { label: "Paste a sample, name the traits, then check the result matches.", points: 3 },
      ],
    },
    {
      text: "You're using AI to help strengthen an argument in an essay. What's your approach?",
      options: [
        { label: "Ask if the essay sounds good overall.", points: 0 },
        { label: "Have it scan for typos and grammar slips.", points: 1 },
        { label: "Ask it to find weak points in your argument.", points: 2 },
        { label: "Have it argue the other side, then sharpen your draft against that.", points: 3 },
      ],
    },
    {
      text: "You're using an AI chatbot to help plan a multi-step project, like a small event. How do you prompt it?",
      options: [
        { label: "Ask it to help you plan an event.", points: 0 },
        { label: "Share a few details, then ask for a plan.", points: 1 },
        { label: "Give your constraints and goals, then ask for clear steps.", points: 2 },
        { label: "Trade drafts back and forth, refining specific steps each round.", points: 3 },
      ],
    },
  ],

  "search-research": [
    {
      text: "You want to know a movie's release year. What do you type into a search engine?",
      options: [
        { label: "What year did that movie come out?", points: 0 },
        { label: "The movie title plus release year.", points: 1 },
        { label: "The title in quotes plus release year.", points: 2 },
        { label: "The title in quotes, release year, plus a site filter.", points: 3 },
      ],
    },
    {
      text: "You're trying to find a recipe that excludes one specific ingredient. How do you search?",
      options: [
        { label: "Just search for the dish and skim results.", points: 0 },
        { label: "Add 'without the ingredient' to your search.", points: 1 },
        { label: "Use a minus sign before the ingredient.", points: 2 },
        { label: "Use a minus sign, plus a trusted recipe site filter.", points: 3 },
      ],
    },
    {
      text: "You need information that's most reliable on government websites. What do you do?",
      options: [
        { label: "Search as usual and scroll past the ads.", points: 0 },
        { label: "Add the word government to your search.", points: 1 },
        { label: "Restrict the search to .gov sites directly.", points: 2 },
        { label: "Restrict to .gov, then quote the exact phrase you need.", points: 3 },
      ],
    },
    {
      text: "An AI chatbot gives you a fact you're not sure is true. What's your move?",
      options: [
        { label: "Take its word for it and move on.", points: 0 },
        { label: "Look the fact up separately to check.", points: 1 },
        { label: "Ask it for a source, then check that source.", points: 2 },
        { label: "Confirm the fact across two independent sources first.", points: 3 },
      ],
    },
    {
      text: "You're researching a topic where a lot of the info online is outdated, like tech advice. How do you filter for what's current?",
      options: [
        { label: "Read whatever result appears first.", points: 0 },
        { label: "Add the current year to your search.", points: 1 },
        { label: "Use the search engine's built-in date filter.", points: 2 },
        { label: "Filter by date, then check against a source that updates often.", points: 3 },
      ],
    },
  ],

  automation: [
    {
      text: "You need to rename 5 files that all follow a similar pattern. What do you do?",
      options: [
        { label: "Rename each one by hand, one at a time.", points: 0 },
        { label: "Copy and paste to speed the typing up.", points: 1 },
        { label: "Use a rename-all or batch tool for the group.", points: 2 },
        { label: "Use a batch tool with a pattern, so it scales to any number.", points: 3 },
      ],
    },
    {
      text: "You copy the same data between two apps every week. What's your approach?",
      options: [
        { label: "Keep doing the copy-paste by hand.", points: 0 },
        { label: "Use shortcuts to move through it faster.", points: 1 },
        { label: "Use a built-in import or export feature.", points: 2 },
        { label: "Set up an automation so it happens without you.", points: 3 },
      ],
    },
    {
      text: "You want a spreadsheet to calculate something automatically as you add new rows. What do you do?",
      options: [
        { label: "Work it out by hand every time.", points: 0 },
        { label: "Use a calculator, then type in the result.", points: 1 },
        { label: "Write a formula into a single cell.", points: 2 },
        { label: "Write a formula, then fill it down so new rows update themselves.", points: 3 },
      ],
    },
    {
      text: "You get the same 3 questions by email every week and want to save time replying. What do you do?",
      options: [
        { label: "Write a brand-new reply each time.", points: 0 },
        { label: "Keep old replies handy to copy from.", points: 1 },
        { label: "Use saved templates or canned responses.", points: 2 },
        { label: "Set up a rule that drafts the reply automatically.", points: 3 },
      ],
    },
    {
      text: "You want to automate a multi-step task, like sorting emails, saving attachments, and notifying you. What do you do?",
      options: [
        { label: "Handle each step by hand as it comes in.", points: 0 },
        { label: "Set up one basic filter, like a folder rule.", points: 1 },
        { label: "Link a couple of tools together for it.", points: 2 },
        { label: "Build one workflow that handles all three steps end-to-end.", points: 3 },
      ],
    },
  ],

  "file-org": [
    {
      text: "You just downloaded 10 files. What do you do next?",
      options: [
        { label: "Leave them sitting in the downloads folder.", points: 0 },
        { label: "Drop them into a folder called Stuff.", points: 1 },
        { label: "Sort them into folders by type or project.", points: 2 },
        { label: "Sort into folders and rename each so it's clear at a glance.", points: 3 },
      ],
    },
    {
      text: "You need to find a file you saved 6 months ago but forgot the name of. What do you do?",
      options: [
        { label: "Scroll through folders hoping to spot it.", points: 0 },
        { label: "Search using a guess at the file name.", points: 1 },
        { label: "Search by file type or date modified.", points: 2 },
        { label: "Search inside the document's contents, not just its name.", points: 3 },
      ],
    },
    {
      text: "You're sharing a folder of documents with a small team. How do you organize it?",
      options: [
        { label: "Dump everything into a single folder.", points: 0 },
        { label: "Make a couple of loosely-named subfolders.", points: 1 },
        { label: "Use a clear structure with consistent naming.", points: 2 },
        { label: "Use a clear structure, naming, and a short note explaining it.", points: 3 },
      ],
    },
    {
      text: "Your files are scattered across your computer, an old backup, and your phone. How do you consolidate?",
      options: [
        { label: "Leave everything where it already is.", points: 0 },
        { label: "Move files over slowly as you notice them.", points: 1 },
        { label: "Pick one cloud service and move it all there.", points: 2 },
        { label: "Migrate everything, then set up automatic backup going forward.", points: 3 },
      ],
    },
    {
      text: "You manage a lot of similar documents, like invoices, and need to find any one instantly. What's your setup?",
      options: [
        { label: "One big folder, in whatever order they landed.", points: 0 },
        { label: "Folders split out by month or year.", points: 1 },
        { label: "A naming convention, like date plus client plus type.", points: 2 },
        { label: "A naming convention plus a searchable index tracking them all.", points: 3 },
      ],
    },
  ],

  "productivity-apps": [
    {
      text: "You have a list of things to do today. Where do you keep it?",
      options: [
        { label: "Mostly just in your head.", points: 0 },
        { label: "A sticky note or a plain notes app.", points: 1 },
        { label: "A to-do app with due dates attached.", points: 2 },
        { label: "A to-do app with dates, priorities, and recurring tasks set.", points: 3 },
      ],
    },
    {
      text: "You need to schedule a meeting with 3 people in different time zones. What do you do?",
      options: [
        { label: "Pick a time and hope it lines up.", points: 0 },
        { label: "Ask everyone's time zone and do the math yourself.", points: 1 },
        { label: "Check a calendar app's time zone display.", points: 2 },
        { label: "Use a scheduling tool that finds overlap and sends invites.", points: 3 },
      ],
    },
    {
      text: "You're tracking a budget across several categories. What's your tool?",
      options: [
        { label: "Rough mental math as you go.", points: 0 },
        { label: "A running list in a notes app.", points: 1 },
        { label: "A spreadsheet split into categories.", points: 2 },
        { label: "A spreadsheet that totals and flags overspending on its own.", points: 3 },
      ],
    },
    {
      text: 'You want a reminder that repeats with an exception, like "every Monday, but skip holidays." What do you do?',
      options: [
        { label: "Just try to remember it yourself.", points: 0 },
        { label: "Set a simple weekly reminder.", points: 1 },
        { label: "Set it recurring, then skip the ones that don't apply.", points: 2 },
        { label: "Use the app's built-in exception rules for recurring reminders.", points: 3 },
      ],
    },
    {
      text: "You use several productivity apps — notes, tasks, calendar — that don't talk to each other. What do you do?",
      options: [
        { label: "Keep switching between them by hand.", points: 0 },
        { label: "Pick one as your main app and mostly ignore the rest.", points: 1 },
        { label: "Use a couple of their built-in integrations.", points: 2 },
        { label: "Connect them with a tool so information flows automatically.", points: 3 },
      ],
    },
  ],

  "staying-current": [
    {
      text: "A friend mentions a new AI tool you've never heard of. What do you do?",
      options: [
        { label: "Nod along and forget about it later.", points: 0 },
        { label: "Look it up out of curiosity.", points: 1 },
        { label: "Try it out to see what it actually does.", points: 2 },
        { label: "Try it, then weigh it against tools you already use.", points: 3 },
      ],
    },
    {
      text: "How do you currently keep up with new digital tools and updates?",
      options: [
        { label: "I mostly hear about things by accident.", points: 0 },
        { label: "I occasionally see something on social media.", points: 1 },
        { label: "I follow a newsletter or a few accounts.", points: 2 },
        { label: "I follow a few sources and set aside time to try things.", points: 3 },
      ],
    },
    {
      text: "A tool you rely on gets a major update that changes how it works. What do you do?",
      options: [
        { label: "Avoid the new version out of confusion.", points: 0 },
        { label: "Muddle through it by trial and error.", points: 1 },
        { label: "Check the app's what's-new notes first.", points: 2 },
        { label: "Read the release notes, then test new features before you need them.", points: 3 },
      ],
    },
    {
      text: "Two tools claim to do the same thing. How do you decide which to use?",
      options: [
        { label: "Go with whichever one you heard about first.", points: 0 },
        { label: "Pick based on which one looks nicer.", points: 1 },
        { label: "Compare a couple of reviews or write-ups.", points: 2 },
        { label: "Try both yourself on the same task and compare directly.", points: 3 },
      ],
    },
    {
      text: "It's been 6 months since you evaluated your toolset. What do you do?",
      options: [
        { label: "Nothing, really — I don't revisit it.", points: 0 },
        { label: "Swap something out only if it's clearly broken.", points: 1 },
        { label: "Check occasionally for a better option for frequent tasks.", points: 2 },
        { label: "Regularly re-evaluate the toolkit and retire what no longer earns its place.", points: 3 },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 2. PLACEMENT TEST UNITS
// This only matters if the learner opts into the placement test (it's not
// the main path anymore — subjects are). A score maps to how far into the
// unit sequence they get to skip. `min` is the lowest score that qualifies.
// ---------------------------------------------------------------------------
const UNITS = [
  {
    id: "unit1",
    min: 0,
    name: "Unit 1",
    tagline: "Start at the beginning",
    desc: "We'll start with the fundamentals across your subjects — no assumptions, nothing skipped.",
  },
  {
    id: "unit2",
    min: 6,
    name: "Unit 2",
    tagline: "Skip the basics",
    desc: "You've already got the fundamentals down. We'll drop you in past the intro material.",
  },
  {
    id: "unit3",
    min: 11,
    name: "Unit 3",
    tagline: "Jump ahead",
    desc: "You're already comfortable with the basics and then some. We'll start you a bit further in.",
  },
];

// ---------------------------------------------------------------------------
// Runs before anything else, like Duolingo's "why are you here" screens.
// Each step is multi-select (tap to toggle chips on/off) with an "Other"
// chip that reveals free text for anything not listed.
//
// The "struggle" and "shortterm" steps double as signal for which SUBJECTS
// to recommend — each of their options carries a `subject` id. The
// "longterm" step has no subject tag; it's context for the learner, not a
// scoring input (a "start a business" goal doesn't map to one subject).
// ---------------------------------------------------------------------------
const ONBOARDING_STEPS = [
  {
    id: "struggle",
    text: "What are you struggling with that you think extra digital skills would help with?",
    options: [
      { label: "Writing emails and messages faster", subject: "chat-prompting" },
      { label: "Getting good answers from AI chatbots", subject: "chat-prompting" },
      { label: "Organizing files and information", subject: "file-org" },
      { label: "Automating repetitive tasks", subject: "automation" },
      { label: "Keeping up with new tools", subject: "staying-current" },
    ],
  },
  {
    id: "longterm",
    text: "What are your long-term projects?",
    options: [
      { label: "Starting or growing a business", subject: null },
      { label: "A creative project — writing, art, video", subject: null },
      { label: "Advancing my career", subject: null },
      { label: "A personal project just for me", subject: null },
      { label: "Helping my family or community", subject: null },
    ],
  },
  {
    id: "shortterm",
    text: "What short-term skills do you need to make that long-term goal possible?",
    options: [
      { label: "Prompting AI tools well", subject: "chat-prompting" },
      { label: "Searching more effectively", subject: "search-research" },
      { label: "Basic automation or scripting", subject: "automation" },
      { label: "Organizing my digital files", subject: "file-org" },
      { label: "Using productivity apps well", subject: "productivity-apps" },
    ],
  },
];

// ---------------------------------------------------------------------------
// 2c. SUBJECT CATALOG
// The areas of AI/digital-tool usage a learner can be routed into. Every
// tagged onboarding option above points at one of these ids.
// ---------------------------------------------------------------------------
const SUBJECTS = [
  { id: "chat-prompting", name: "AI Chat & Prompting", blurb: "Getting real, useful answers out of chatbots." },
  { id: "search-research", name: "Search & Research", blurb: "Finding exactly what you need, fast." },
  { id: "automation", name: "Automation & Scripting", blurb: "Making repetitive work happen on its own." },
  { id: "file-org", name: "File & Data Organization", blurb: "Keeping information easy to find and use." },
  { id: "productivity-apps", name: "Productivity Apps", blurb: "Getting more out of tools you already use." },
  { id: "staying-current", name: "Staying Current", blurb: "Keeping up as new tools show up every month." },
];

// Tally which subjects the learner's onboarding answers point toward, most
// mentioned first. If nothing tagged got selected (e.g. they only used
// "Other" answers), fall back to a sensible starter set instead of an
// empty list.
function computeSubjects() {
  const counts = {};

  state.onboardingAnswers.forEach((answer, stepIndex) => {
    const step = ONBOARDING_STEPS[stepIndex];
    answer.selected.forEach((label) => {
      const opt = step.options.find((o) => o.label === label);
      if (opt && opt.subject) {
        counts[opt.subject] = (counts[opt.subject] || 0) + 1;
      }
    });
  });

  const ranked = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => SUBJECTS.find((s) => s.id === id));

  return ranked.length > 0 ? ranked.slice(0, 4) : SUBJECTS.slice(0, 3);
}

function unitForScore(score) {
  // Walk the list backwards so we return the *highest* unit the score clears.
  return [...UNITS].reverse().find((u) => score >= u.min);
}

// Returns a shuffled array of indices [0..n-1] — used to randomize the
// on-screen order of a question's answer options, so the "best" answer
// isn't predictably in the same position every time (otherwise people just
// learn to click the last button without reading).
function shuffledIndices(n) {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------------------------------------------------------------------------
// 3. APP STATE
// `screen` controls which render function runs.
// ---------------------------------------------------------------------------
const state = {
  screen: "welcome",   // "welcome" | "onboarding" | "subjects" | "testIntro" | "subjectQuiz" | "subjectResult" | "allSet" | "account" | "accountWelcome" | "lessonPath" | "lesson" | "lessonComplete"

  onboardingIndex: 0,
  // One entry per ONBOARDING_STEPS item: { selected: Set of chosen chip labels, otherText: string }
  onboardingAnswers: ONBOARDING_STEPS.map(() => ({ selected: new Set(), otherText: "" })),

  subjects: [],           // filled in by computeSubjects() once onboarding finishes

  // Per-subject placement test. Keyed by subject id:
  // { unit: UNITS entry, source: "default" | "test" }
  subjectPlacement: {},
  honestyShown: false, // once true, testIntro is skipped for every later subject test

  activeSubject: null,    // which subject's test is currently in progress
  subjectQuestionIndex: 0,
  subjectAnswers: [],     // points picked for each question of the active subject's test
  currentOptionOrder: [], // shuffled option indices for the question currently on screen

  // --- Account (mock for now — see note in renderAccount) ---
  accountMode: "signup",  // "signup" | "login"
  accountError: "",       // validation/login error message, shown above the form
  mockUser: null,         // { name, email, password } once an account is "created" this session

  // --- Lesson engine ---
  lessonSubjectId: null,  // which subject's lesson path is open
  lessonId: null,         // which lesson within that path is active
  lessonStepIndex: 0,
  lessonXP: 0,
  lessonMistakes: 0,
  lessonAnswered: false,  // has the current step been checked yet? controls when "Continue" appears
  lessonCorrect: null,    // true/false feedback for the current step, null = not answered yet
  matchMatched: [],       // indices into the current match step's `pairs` that are already matched
  matchLeftSelected: null, // index of the left item currently selected, or null
  matchRightOrder: [],    // shuffled display order for the right-hand column
  selectedOptionIndex: null, // which MC option was picked, for highlighting

  // Completion record per lesson id: { mistakes, xp, perfect }. A perfect
  // run (zero mistakes) locks the lesson from being retaken; anything else
  // stays retakeable but asks for confirmation first.
  lessonProgress: {},
};

const root = document.getElementById("app-root");

function render() {
  if (state.screen === "welcome") root.innerHTML = renderWelcome();
  if (state.screen === "onboarding") root.innerHTML = renderOnboarding();
  if (state.screen === "subjects") root.innerHTML = renderSubjects();
  if (state.screen === "testIntro") root.innerHTML = renderTestIntro();
  if (state.screen === "subjectQuiz") root.innerHTML = renderSubjectQuiz();
  if (state.screen === "subjectResult") root.innerHTML = renderSubjectResult();
  if (state.screen === "allSet") root.innerHTML = renderAllSet();
  if (state.screen === "account") root.innerHTML = renderAccount();
  if (state.screen === "accountWelcome") root.innerHTML = renderAccountWelcome();
  if (state.screen === "lessonPath") root.innerHTML = renderLessonPath();
  if (state.screen === "lesson") root.innerHTML = renderLesson();
  if (state.screen === "lessonComplete") root.innerHTML = renderLessonComplete();
  attachHandlers();
}

// ---------------------------------------------------------------------------
// 4. WELCOME SCREEN
// ---------------------------------------------------------------------------
function renderWelcome() {
  return `
    <section class="hero">
      <div class="eyebrow">Digital & AI tools, one small lesson at a time</div>
      <h1>Get fluent in the language of the future, with Weblingo.</h1>
      <p class="disclaimer-note">Not to be confused with Weblingo Digital Backend Solutions.</p>
      <p class="lede">
        Weblingo teaches skills that are useful right here, right now, with a
        wholesome, holistic, and effective curriculum which makes learning
        digital skills as easy as pie.
      </p>
      <p class="lede lede-punch">No longer are you "not a computer person"!</p>

      <ul class="benefit-list">
        <li>Practice with personalized simulations and mistake analysis to meet your needs.</li>
        <li>Learn fast with simple, user-friendly language and built-in motivation. No jargon knowledge or slogging required!</li>
      </ul>
      <p class="best-of-all"><strong>And best of all…</strong> Completely free FOREVER!</p>

      <div class="hero-actions">
        <button class="btn btn-primary" id="start-quiz-btn">Find my starting point</button>
      </div>
      <div class="hero-note">Takes about a minute. No account needed yet.</div>
      <div class="hero-note">You can choose multiple answers in the quizzes.</div>

      <div class="track-row">
        <div class="track-chip"><strong>AI Chat Tools</strong> · prompting</div>
        <div class="track-chip"><strong>Search</strong> · finding things fast</div>
        <div class="track-chip"><strong>Automation</strong> · doing less by hand</div>
      </div>
    </section>
  `;
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
          <button class="chip ${answer.selected.has(opt.label) ? "chip-selected" : ""}" data-chip="${opt.label}">
            ${opt.label}
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
// 4c. SUBJECTS SCREEN
// The main hub. Each subject is decided independently: either start it at
// Unit 1, or take that subject's own 5-question placement test to possibly
// skip ahead. Once every subject has a decision, a "Continue" button appears.
// ---------------------------------------------------------------------------
function renderSubjects() {
  const allDecided = state.subjects.every((s) => state.subjectPlacement[s.id]);

  return `
    <section>
      <div class="result-eyebrow">Based on what you told us</div>
      <h1 class="result-title">Here's what to focus on</h1>
      <p class="result-desc">
        These are the subjects that match what you're struggling with and
        what your goals need. Decide each one on its own — start at Unit 1,
        or test in to see if you can skip ahead.
      </p>

      <div class="subject-list">
        ${state.subjects
          .map((s) => {
            const placement = state.subjectPlacement[s.id];
            return `
          <div class="subject-card">
            <div class="subject-name">${s.name}</div>
            <div class="subject-blurb">${s.blurb}</div>
            ${
              placement
                ? `<div class="subject-status">
                     Placed at <strong>${placement.unit.name}</strong>
                     ${placement.source === "test" ? "· from your test" : "· starting fresh"}
                     <button class="link-btn" data-retest="${s.id}">Retest</button>
                   </div>`
                : `<div class="subject-actions">
                     <button class="btn btn-small btn-ghost" data-start-unit1="${s.id}">Start from Unit 1</button>
                     <button class="btn btn-small btn-primary" data-test-subject="${s.id}">Test into a unit</button>
                   </div>`
            }
          </div>`;
          })
          .join("")}
      </div>

      ${
        allDecided
          ? `<div class="hero-actions"><button class="btn btn-primary" id="continue-btn">Continue</button></div>`
          : `<div class="hero-note">Decide each subject to continue.</div>`
      }
    </section>
  `;
}

// ---------------------------------------------------------------------------
// 4d. ALL SET — final summary once every subject has a placement
// Placeholder for now — real lesson content isn't built yet, but this is
// where that flow will plug in.
// ---------------------------------------------------------------------------
function renderAllSet() {
  return `
    <section>
      <div class="result-eyebrow">All set</div>
      <h1 class="result-title">Your course is <span class="accent">ready</span></h1>
      <div class="subject-list">
        ${state.subjects
          .map((s) => {
            const placement = state.subjectPlacement[s.id];
            return `
          <div class="subject-card">
            <div class="subject-name">${s.name}</div>
            <div class="subject-status">Starting at <strong>${placement.unit.name}</strong></div>
          </div>`;
          })
          .join("")}
      </div>
      <p class="result-desc">Lesson content for these units is the next thing to build. For now, create an account to save this setup — otherwise it resets if you leave.</p>
      <div class="hero-actions">
        <button class="btn btn-primary" id="goto-account-btn">Create my account</button>
        <button class="btn btn-ghost" id="restart-btn">Start over</button>
      </div>
    </section>
  `;
}

// ---------------------------------------------------------------------------
// 4e. ACCOUNT SCREEN — real signup/login via Supabase
// Auth calls go through window.supabaseClient (set up in index.html).
// `state.mockUser` is just this app's local copy of "who's logged in" for
// display purposes — the actual account lives in Supabase, not here. On a
// refresh, this local copy is gone even though the Supabase session isn't;
// see the session-check note near the bottom of this file for that.
// ---------------------------------------------------------------------------
function renderAccount() {
  const isSignup = state.accountMode === "signup";

  return `
    <section>
      <div class="result-eyebrow">${isSignup ? "Create your account" : "Log in"}</div>
      <h1 class="result-title">${isSignup ? "Save your <span class=\"accent\">progress</span>" : "Welcome <span class=\"accent\">back</span>"}</h1>
      <p class="result-desc">
        ${isSignup
          ? "This is a preview account — nothing is saved permanently yet."
          : "Log in with the account you just created this session."}
      </p>

      ${state.accountError ? `<div class="form-error">${state.accountError}</div>` : ""}

      <div class="question-card">
        ${
          isSignup
            ? `
          <label class="field-label" for="signup-name">Name</label>
          <input type="text" id="signup-name" class="text-input" placeholder="Your name" />

          <label class="field-label" for="signup-email">Email</label>
          <input type="email" id="signup-email" class="text-input" placeholder="you@example.com" />

          <label class="field-label" for="signup-password">Password</label>
          <input type="password" id="signup-password" class="text-input" placeholder="At least 8 characters" />

          <label class="field-label" for="signup-confirm">Confirm password</label>
          <input type="password" id="signup-confirm" class="text-input" placeholder="Type it again" />
        `
            : `
          <label class="field-label" for="login-email">Email</label>
          <input type="email" id="login-email" class="text-input" placeholder="you@example.com" />

          <label class="field-label" for="login-password">Password</label>
          <input type="password" id="login-password" class="text-input" placeholder="Your password" />
        `
        }
      </div>

      <div class="hero-actions">
        <button class="btn btn-primary" id="account-submit-btn">${isSignup ? "Create account" : "Log in"}</button>
      </div>
      <div class="hero-note">
        ${
          isSignup
            ? `Already have an account? <button class="link-btn" id="switch-to-login-btn">Log in</button>`
            : `Need an account? <button class="link-btn" id="switch-to-signup-btn">Sign up</button>`
        }
      </div>
    </section>
  `;
}

// ---------------------------------------------------------------------------
// 4f. POST-SIGNUP/LOGIN CONFIRMATION
// ---------------------------------------------------------------------------
function renderAccountWelcome() {
  return `
    <section>
      <div class="result-eyebrow">You're in</div>
      <h1 class="result-title">Welcome, <span class="accent">${state.mockUser.name}</span></h1>
      <p class="result-desc">Signed in as ${state.mockUser.email}. Your subject setup is saved.</p>
      <div class="hero-actions">
        <button class="btn btn-primary" id="start-learning-btn">Start learning</button>
        <button class="btn btn-ghost" id="restart-btn">Start over</button>
      </div>
    </section>
  `;
}

// ---------------------------------------------------------------------------
// 4h. LESSON PATH — the map of lessons for one subject's Unit 1
// Built lessons (ones with `steps`) are tappable; everything else shows as
// "Coming soon" so the path still communicates the full plan even before
// every lesson is written.
// ---------------------------------------------------------------------------
function renderLessonPath() {
  const subject = SUBJECTS.find((s) => s.id === state.lessonSubjectId);
  const unitLessons = (LESSONS[state.lessonSubjectId] && LESSONS[state.lessonSubjectId].unit1) || [];

  return `
    <section>
      <div class="result-eyebrow">${subject.name} · Unit 1</div>
      <h1 class="result-title">Lesson path</h1>
      <div class="lesson-path">
        ${unitLessons
          .map((lesson, i) => {
            const built = Boolean(lesson.steps);
            const progress = state.lessonProgress[lesson.id];
            const isPerfect = built && progress && progress.perfect;
            const isCompleted = built && progress && !progress.perfect;

            let subLine = "Coming soon";
            if (built) subLine = lesson.subtitle;
            if (isCompleted) subLine = `Completed · ${progress.mistakes} mistake${progress.mistakes === 1 ? "" : "s"}`;
            if (isPerfect) subLine = "✓ Perfect score — no need to retake";

            // A perfect run locks the lesson entirely (not clickable at all).
            // Everything else that's built stays clickable.
            const clickable = built && !isPerfect;

            return `
          <button class="lesson-node ${clickable ? "lesson-node-ready" : "lesson-node-locked"}" ${clickable ? `data-lesson="${lesson.id}"` : "disabled"}>
            <div class="lesson-node-num">${isPerfect ? "★" : i + 1}</div>
            <div class="lesson-node-body">
              <div class="lesson-node-title">${lesson.title}</div>
              <div class="lesson-node-sub">${subLine}</div>
            </div>
          </button>`;
          })
          .join("")}
      </div>
      <div class="hero-actions">
        <button class="btn btn-ghost" id="lesson-path-back-btn">Back</button>
      </div>
    </section>
  `;
}

// ---------------------------------------------------------------------------
// 4i. LESSON — runs one step at a time from the active lesson's `steps`
// ---------------------------------------------------------------------------
function renderLesson() {
  const lesson = LESSONS[state.lessonSubjectId].unit1.find((l) => l.id === state.lessonId);
  const step = lesson.steps[state.lessonStepIndex];
  const progressPct = Math.round((state.lessonStepIndex / lesson.steps.length) * 100);

  let stepHtml = "";

  if (step.type === "teach") {
    stepHtml = `
      <div class="question-card">
        <div class="question-eyebrow">Quick tip</div>
        <h2 class="question-text">${step.title}</h2>
        <p class="teach-body">${step.body}</p>
      </div>
    `;
  }

  if (step.type === "mc") {
    stepHtml = `
      <div class="question-card">
        <div class="question-eyebrow">Multiple choice</div>
        <h2 class="question-text">${step.prompt}</h2>
        <div class="option-list">
          ${step.options
            .map((opt, i) => {
              let cls = "option";
              if (state.lessonAnswered) {
                if (i === step.correctIndex) cls += " option-correct";
                else if (i === state.selectedOptionIndex) cls += " option-incorrect";
              }
              return `<button class="${cls}" data-mc-index="${i}" ${state.lessonAnswered ? "disabled" : ""}>
                <span class="option-key">${["A", "B", "C", "D"][i]}</span>
                <span>${opt}</span>
              </button>`;
            })
            .join("")}
        </div>
        ${state.lessonAnswered ? `<div class="step-feedback ${state.lessonCorrect ? "step-feedback-correct" : "step-feedback-incorrect"}">${state.lessonCorrect ? "Correct! " : "Not quite. "}${step.explanation}</div>` : ""}
      </div>
    `;
  }

  if (step.type === "fillBlank") {
    stepHtml = `
      <div class="question-card">
        <div class="question-eyebrow">Fill in the blank</div>
        <h2 class="question-text">${step.prompt}</h2>
        <input type="text" id="fill-blank-input" class="text-input" placeholder="Type your answer..." ${state.lessonAnswered ? "disabled" : ""} />
        ${
          state.lessonAnswered
            ? `<div class="step-feedback ${state.lessonCorrect ? "step-feedback-correct" : "step-feedback-incorrect"}">${state.lessonCorrect ? "Correct!" : `Not quite — ${step.hint}`}</div>`
            : `<div class="hero-actions"><button class="btn btn-primary" id="fill-blank-check-btn">Check</button></div>`
        }
      </div>
    `;
  }

  if (step.type === "match") {
    const rightItems = state.matchRightOrder.map((pairIndex) => ({ pairIndex, text: step.pairs[pairIndex].right }));
    stepHtml = `
      <div class="question-card">
        <div class="question-eyebrow">Match the pairs</div>
        <h2 class="question-text">${step.prompt}</h2>
        <div class="match-grid">
          <div class="match-column">
            ${step.pairs
              .map((pair, i) => {
                const matched = state.matchMatched.includes(i);
                const selected = state.matchLeftSelected === i;
                return `<button class="match-item ${matched ? "match-item-matched" : ""} ${selected ? "match-item-selected" : ""}" data-match-left="${i}" ${matched ? "disabled" : ""}>${pair.left}</button>`;
              })
              .join("")}
          </div>
          <div class="match-column">
            ${rightItems
              .map(
                ({ pairIndex, text }) => `<button class="match-item ${state.matchMatched.includes(pairIndex) ? "match-item-matched" : ""}" data-match-right="${pairIndex}" ${state.matchMatched.includes(pairIndex) ? "disabled" : ""}>${text}</button>`
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  }

  const canContinue = step.type === "teach" || state.lessonAnswered || (step.type === "match" && state.matchMatched.length === step.pairs.length);

  return `
    <section class="quiz-header">
      <div class="progress-track">
        <div class="progress-fill" style="width:${progressPct}%"></div>
      </div>
      <div class="progress-label">${lesson.title} · Step ${state.lessonStepIndex + 1} of ${lesson.steps.length}</div>
    </section>

    ${stepHtml}

    <div class="quiz-nav">
      <button class="btn btn-ghost" id="lesson-exit-btn">Exit lesson</button>
      ${canContinue ? `<button class="btn btn-primary" id="lesson-continue-btn">Continue</button>` : ""}
    </div>
  `;
}

// ---------------------------------------------------------------------------
// 4j. LESSON COMPLETE
// ---------------------------------------------------------------------------
function renderLessonComplete() {
  return `
    <section>
      <div class="result-eyebrow">Lesson complete</div>
      <h1 class="result-title">Nice work!</h1>
      <p class="result-desc">You earned <strong>${state.lessonXP} XP</strong>${state.lessonMistakes > 0 ? ` and had ${state.lessonMistakes} mistake${state.lessonMistakes === 1 ? "" : "s"} along the way — that's normal, mistakes are part of how this sticks.` : ", with zero mistakes — nice."}</p>
      <div class="hero-actions">
        <button class="btn btn-primary" id="back-to-path-btn">Back to lesson path</button>
      </div>
    </section>
  `;
}

// ---------------------------------------------------------------------------
// 4g. TEST INTRO — the honesty message, on its own page
// Shown once, right after picking "Test into a unit" (or "Retest") on the
// subjects hub, before the actual 5 questions start.
// ---------------------------------------------------------------------------
function renderTestIntro() {
  const subject = SUBJECTS.find((s) => s.id === state.activeSubject);

  return `
    <section>
      <div class="result-eyebrow">${subject.name} · before you start</div>
      <h1 class="result-title">Answer <span class="accent">honestly</span></h1>
      <p class="result-desc">
        Base each answer on what you'd actually do — not what sounds best.
        It's the only way this test can place you accurately.
      </p>
      <div class="hero-actions">
        <button class="btn btn-primary" id="start-test-btn">Start the test</button>
      </div>
    </section>
  `;
}

// ---------------------------------------------------------------------------
// 5. SUBJECT PLACEMENT TEST SCREEN
// Pulls its 5 questions from SUBJECT_QUESTIONS[state.activeSubject]. Same
// shape/behavior as before, just scoped to one subject at a time.
// ---------------------------------------------------------------------------
function renderSubjectQuiz() {
  const subject = SUBJECTS.find((s) => s.id === state.activeSubject);
  const questions = SUBJECT_QUESTIONS[state.activeSubject];
  const q = questions[state.subjectQuestionIndex];
  const progressPct = Math.round((state.subjectQuestionIndex / questions.length) * 100);
  const optionLetters = ["A", "B", "C", "D"];

  return `
    <section class="quiz-header">
      <div class="progress-track">
        <div class="progress-fill" style="width:${progressPct}%"></div>
      </div>
      <div class="progress-label">${subject.name} · Question ${state.subjectQuestionIndex + 1} of ${questions.length}</div>
    </section>

    <section class="question-card">
      <div class="question-eyebrow">Placement test</div>
      <h2 class="question-text">${q.text}</h2>
      <div class="option-list">
        ${state.currentOptionOrder
          .map((optIndex) => q.options[optIndex])
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
      <button class="btn btn-ghost" id="subject-back-btn" ${state.subjectQuestionIndex === 0 ? "disabled" : ""}>Back</button>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// 6. SUBJECT RESULT SCREEN
// Shows the placement for the one subject just tested, then sends the
// learner back to the subjects hub to decide the rest.
// ---------------------------------------------------------------------------
function renderSubjectResult() {
  const subject = SUBJECTS.find((s) => s.id === state.activeSubject);
  const score = state.subjectAnswers.reduce((sum, p) => sum + p, 0);
  const unit = unitForScore(score);
  const maxScore = SUBJECT_QUESTIONS[state.activeSubject].length * 3;

  return `
    <section>
      <div class="result-eyebrow">${subject.name} · placement result</div>
      <h1 class="result-title">You're starting at <span class="accent">${unit.name}</span></h1>
      <p class="result-desc">${unit.desc}</p>
      <div class="score-strip">Placement score: <strong>${score} / ${maxScore}</strong></div>

      <div class="path-map">
        ${UNITS.map(
          (u) => `
          <div class="path-node ${u.id === unit.id ? "active" : ""}">
            <div class="node-dot">${u.id === unit.id ? "●" : "○"}</div>
            <div class="node-body">
              <div class="node-title">${u.name}</div>
              <div class="node-sub">${u.tagline}</div>
            </div>
          </div>`
        ).join("")}
      </div>

      <div class="hero-actions">
        <button class="btn btn-primary" id="back-to-subjects-btn">Back to subjects</button>
      </div>
    </section>
  `;
}

// ---------------------------------------------------------------------------
// 7. EVENT HANDLERS
// Re-attached after every render(), since re-writing innerHTML wipes out
// any listeners that were on the old elements.
// ---------------------------------------------------------------------------
// Resets the course-setup flow (onboarding answers, subjects, placements)
// back to the welcome screen. Deliberately leaves state.mockUser alone —
// "start over" restarts the course setup, it doesn't sign anyone out.
function resetApp() {
  state.screen = "welcome";
  state.onboardingIndex = 0;
  state.onboardingAnswers = ONBOARDING_STEPS.map(() => ({ selected: new Set(), otherText: "" }));
  state.subjects = [];
  state.subjectPlacement = {};
  render();
}

// ---------------------------------------------------------------------------
// PROGRESS PERSISTENCE (Supabase)
// Reads/writes the `user_progress` table set up via the SQL in our setup
// step. Both functions are small and single-purpose on purpose: saving and
// loading are called from different places (signup, login, and the
// startup session-check), so keeping them separate avoids duplicating the
// actual Supabase calls at each of those call sites.
// ---------------------------------------------------------------------------
async function saveProgress(userId) {
  const supabase = window.supabaseClient;
  await supabase.from("user_progress").upsert({
    user_id: userId,
    subjects: state.subjects,
    subject_placement: state.subjectPlacement,
    updated_at: new Date().toISOString(),
  });
}

async function loadProgress(userId) {
  const supabase = window.supabaseClient;
  const { data } = await supabase
    .from("user_progress")
    .select("subjects, subject_placement")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

function attachHandlers() {
  if (state.screen === "welcome") {
    document.getElementById("start-quiz-btn").onclick = () => {
      state.screen = "onboarding";
      state.onboardingIndex = 0;
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
        // Onboarding done — figure out their subjects and show that screen.
        state.subjects = computeSubjects();
        state.screen = "subjects";
        render();
      }
    };
  }

  if (state.screen === "subjects") {
    // "Start from Unit 1" — decide this subject immediately, no test needed.
    document.querySelectorAll("[data-start-unit1]").forEach((btn) => {
      btn.onclick = () => {
        const subjectId = btn.dataset.startUnit1;
        state.subjectPlacement[subjectId] = { unit: UNITS[0], source: "default" };
        render();
      };
    });

    // "Test into a unit" — go take that subject's 5-question test.
    document.querySelectorAll("[data-test-subject]").forEach((btn) => {
      btn.onclick = () => {
        state.activeSubject = btn.dataset.testSubject;
        state.subjectQuestionIndex = 0;
        state.subjectAnswers = [];
        state.currentOptionOrder = shuffledIndices(SUBJECT_QUESTIONS[state.activeSubject][0].options.length);
        state.screen = state.honestyShown ? "subjectQuiz" : "testIntro";
        render();
      };
    });

    // "Retest" — clear this subject's decision and go test it again.
    document.querySelectorAll("[data-retest]").forEach((btn) => {
      btn.onclick = () => {
        state.activeSubject = btn.dataset.retest;
        state.subjectQuestionIndex = 0;
        state.subjectAnswers = [];
        state.currentOptionOrder = shuffledIndices(SUBJECT_QUESTIONS[state.activeSubject][0].options.length);
        state.screen = state.honestyShown ? "subjectQuiz" : "testIntro";
        render();
      };
    });

    const continueBtn = document.getElementById("continue-btn");
    if (continueBtn) {
      continueBtn.onclick = () => {
        state.screen = "allSet";
        render();
      };
    }
  }

  if (state.screen === "testIntro") {
    document.getElementById("start-test-btn").onclick = () => {
      state.honestyShown = true;
      state.screen = "subjectQuiz";
      render();
    };
  }

  if (state.screen === "subjectQuiz") {
    const questions = SUBJECT_QUESTIONS[state.activeSubject];

    document.querySelectorAll(".option").forEach((btn) => {
      btn.onclick = () => {
        const points = Number(btn.dataset.points);
        state.subjectAnswers[state.subjectQuestionIndex] = points;

        if (state.subjectQuestionIndex < questions.length - 1) {
          state.subjectQuestionIndex++;
          state.currentOptionOrder = shuffledIndices(questions[state.subjectQuestionIndex].options.length);
          render();
        } else {
          // Test finished — score it and record this subject's placement.
          const score = state.subjectAnswers.reduce((sum, p) => sum + p, 0);
          state.subjectPlacement[state.activeSubject] = { unit: unitForScore(score), source: "test" };
          state.screen = "subjectResult";
          render();
        }
      };
    });

    const backBtn = document.getElementById("subject-back-btn");
    if (backBtn) {
      backBtn.onclick = () => {
        if (state.subjectQuestionIndex > 0) {
          state.subjectQuestionIndex--;
          state.currentOptionOrder = shuffledIndices(questions[state.subjectQuestionIndex].options.length);
          render();
        }
      };
    }
  }

  if (state.screen === "subjectResult") {
    document.getElementById("back-to-subjects-btn").onclick = () => {
      state.screen = "subjects";
      render();
    };
  }

  if (state.screen === "allSet") {
    document.getElementById("goto-account-btn").onclick = () => {
      state.screen = "account";
      state.accountMode = "signup";
      state.accountError = "";
      render();
    };
    document.getElementById("restart-btn").onclick = resetApp;
  }

  if (state.screen === "account") {
    document.getElementById("switch-to-login-btn")?.addEventListener("click", () => {
      state.accountMode = "login";
      state.accountError = "";
      render();
    });
    document.getElementById("switch-to-signup-btn")?.addEventListener("click", () => {
      state.accountMode = "signup";
      state.accountError = "";
      render();
    });

    // NOTE: this calls real Supabase auth (see the script tag in
    // index.html for the client setup). It's an async function because
    // network calls take time — we can't know the result instantly like
    // the old mock version could.
    document.getElementById("account-submit-btn").onclick = async () => {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const supabase = window.supabaseClient;

      if (state.accountMode === "signup") {
        const name = document.getElementById("signup-name").value.trim();
        const email = document.getElementById("signup-email").value.trim();
        const password = document.getElementById("signup-password").value;
        const confirm = document.getElementById("signup-confirm").value;

        if (!name) {
          state.accountError = "Enter your name.";
        } else if (!emailPattern.test(email)) {
          state.accountError = "Enter a valid email address.";
        } else if (password.length < 8) {
          state.accountError = "Password needs to be at least 8 characters.";
        } else if (password !== confirm) {
          state.accountError = "Passwords don't match.";
        } else {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } }, // Supabase has no built-in "name" field, so it goes in metadata
          });

          if (error) {
            state.accountError = error.message;
          } else {
            state.mockUser = { name, email };
            state.accountError = "";

            // With "Confirm email" turned on, signUp doesn't hand back an
            // active session yet — there's nothing we're allowed to save
            // until they've confirmed and logged in. Only save right away
            // if a session actually came back (e.g. confirmation disabled).
            if (data.session) {
              await saveProgress(data.user.id);
            }
            state.screen = "accountWelcome";
          }
        }
      } else {
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          state.accountError = error.message;
        } else {
          state.mockUser = {
            name: data.user.user_metadata?.name || email,
            email: data.user.email,
          };
          state.accountError = "";

          // Logging in always has a real session, so this is the reliable
          // place to sync with whatever's saved on the server: load it if
          // it exists, otherwise save whatever's currently in local state
          // (e.g. a first-time login right after confirming an email).
          const saved = await loadProgress(data.user.id);
          if (saved && saved.subjects && saved.subjects.length > 0) {
            state.subjects = saved.subjects;
            state.subjectPlacement = saved.subject_placement || {};
          } else {
            await saveProgress(data.user.id);
          }

          state.screen = "accountWelcome";
        }
      }
      render();
    };
  }

  if (state.screen === "accountWelcome") {
    document.getElementById("restart-btn").onclick = resetApp;
    document.getElementById("start-learning-btn").onclick = () => {
      // Only chat-prompting has real lesson content right now — that's
      // what we're opening regardless of which subjects were picked.
      state.lessonSubjectId = "chat-prompting";
      state.screen = "lessonPath";
      render();
    };
  }

  if (state.screen === "lessonPath") {
    document.getElementById("lesson-path-back-btn").onclick = () => {
      state.screen = "accountWelcome";
      render();
    };
    document.querySelectorAll("[data-lesson]").forEach((btn) => {
      btn.onclick = () => {
        const lessonId = btn.dataset.lesson;
        const alreadyDone = Boolean(state.lessonProgress[lessonId]);

        // Only non-perfect completed lessons reach this point at all —
        // perfect ones are rendered disabled, so they never get a click
        // handler in the first place. This confirm is specifically for
        // "you've done this, but not perfectly — sure you want to redo it?"
        if (alreadyDone && !window.confirm("Are you sure? You've already done this lesson.")) {
          return;
        }

        startLesson(lessonId);
        render();
      };
    });
  }

  if (state.screen === "lesson") {
    const lesson = LESSONS[state.lessonSubjectId].unit1.find((l) => l.id === state.lessonId);
    const step = lesson.steps[state.lessonStepIndex];

    document.getElementById("lesson-exit-btn").onclick = () => {
      state.screen = "lessonPath";
      render();
    };

    if (step.type === "mc") {
      document.querySelectorAll("[data-mc-index]").forEach((btn) => {
        btn.onclick = () => {
          const idx = Number(btn.dataset.mcIndex);
          state.selectedOptionIndex = idx;
          state.lessonAnswered = true;
          state.lessonCorrect = idx === step.correctIndex;
          if (state.lessonCorrect) state.lessonXP += 10;
          else state.lessonMistakes += 1;
          render();
        };
      });
    }

    if (step.type === "fillBlank") {
      const checkBtn = document.getElementById("fill-blank-check-btn");
      if (checkBtn) {
        checkBtn.onclick = () => {
          const typed = document.getElementById("fill-blank-input").value.trim().toLowerCase();
          state.lessonAnswered = true;
          state.lessonCorrect = step.accepted.includes(typed);
          if (state.lessonCorrect) state.lessonXP += 10;
          else state.lessonMistakes += 1;
          render();
        };
      }
    }

    if (step.type === "match") {
      document.querySelectorAll("[data-match-left]").forEach((btn) => {
        btn.onclick = () => {
          state.matchLeftSelected = Number(btn.dataset.matchLeft);
          render();
        };
      });
      document.querySelectorAll("[data-match-right]").forEach((btn) => {
        btn.onclick = () => {
          const rightPairIndex = Number(btn.dataset.matchRight);
          if (state.matchLeftSelected === null) return; // nothing selected on the left yet
          if (rightPairIndex === state.matchLeftSelected) {
            state.matchMatched.push(rightPairIndex);
            state.lessonXP += 5;
          } else {
            state.lessonMistakes += 1;
          }
          state.matchLeftSelected = null;
          render();
        };
      });
    }

    const continueBtn = document.getElementById("lesson-continue-btn");
    if (continueBtn) {
      continueBtn.onclick = () => {
        if (state.lessonStepIndex < lesson.steps.length - 1) {
          state.lessonStepIndex++;
          resetStepState();
          render();
        } else {
          state.lessonProgress[state.lessonId] = {
            mistakes: state.lessonMistakes,
            xp: state.lessonXP,
            perfect: state.lessonMistakes === 0,
          };
          state.screen = "lessonComplete";
          render();
        }
      };
    }
  }

  if (state.screen === "lessonComplete") {
    document.getElementById("back-to-path-btn").onclick = () => {
      state.screen = "lessonPath";
      render();
    };
  }
}

// Resets everything the *current step* was tracking — called whenever we
// move to a new step, so old feedback/selections don't carry over.
function resetStepState() {
  state.lessonAnswered = false;
  state.lessonCorrect = null;
  state.selectedOptionIndex = null;
  state.matchMatched = [];
  state.matchLeftSelected = null;
  const lesson = LESSONS[state.lessonSubjectId].unit1.find((l) => l.id === state.lessonId);
  const step = lesson.steps[state.lessonStepIndex];
  if (step.type === "match") {
    state.matchRightOrder = shuffledIndices(step.pairs.length);
  }
}

// Sets up a fresh run of one lesson — called when tapping a lesson node on
// the path screen.
function startLesson(lessonId) {
  state.lessonId = lessonId;
  state.lessonStepIndex = 0;
  state.lessonXP = 0;
  state.lessonMistakes = 0;
  state.screen = "lesson";
  resetStepState();
}

// ---------------------------------------------------------------------------
// 8. THEME TOGGLE
// Lives in the static topbar (index.html), not inside #app-root, so it
// never gets wiped out by render() — it only needs its listener attached
// once, here, rather than being re-attached in attachHandlers().
// ---------------------------------------------------------------------------
let currentTheme = "dark";
const themeToggleBtn = document.getElementById("theme-toggle");

// Guarded with a null-check on purpose: if this element is ever missing
// (e.g. a stale index.html without it), we skip the toggle instead of
// throwing an error that would stop every script below this point from
// running — including the render() call that builds the rest of the app.
if (themeToggleBtn) {
  themeToggleBtn.onclick = () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", currentTheme);
    themeToggleBtn.textContent = currentTheme === "dark" ? "🌙" : "☀️";
    themeToggleBtn.setAttribute(
      "aria-label",
      currentTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"
    );
  };
}

// ---------------------------------------------------------------------------
// 8b. DEV JUMP PANEL — testing convenience only
// A small floating dropdown that jumps straight to any screen, seeding
// whatever fake data that screen needs so it doesn't crash from missing
// state (e.g. jumping to "allSet" needs subjects + placements to exist).
// DELETE THIS WHOLE SECTION (and the panel it creates) before real users
// ever use the site — it's a testing shortcut, not a feature.
// ---------------------------------------------------------------------------
const DEV_SCREENS = [
  "welcome", "onboarding", "subjects", "testIntro", "subjectQuiz", "subjectResult",
  "allSet", "account", "accountWelcome", "lessonPath", "lesson", "lessonComplete",
];

function devJumpTo(target) {
  // Seed whatever each screen assumes already exists, only if it's missing —
  // this never overwrites real progress you already have mid-test.
  if (state.subjects.length === 0) {
    state.subjects = SUBJECTS.slice(0, 3);
  }
  if (Object.keys(state.subjectPlacement).length === 0) {
    state.subjects.forEach((s) => {
      state.subjectPlacement[s.id] = { unit: UNITS[0], source: "default" };
    });
  }
  if (!state.activeSubject) {
    state.activeSubject = "chat-prompting";
  }
  if (state.subjectAnswers.length === 0) {
    state.subjectAnswers = [2, 2, 2, 2, 2];
  }
  if (state.currentOptionOrder.length === 0) {
    state.currentOptionOrder = shuffledIndices(4);
  }
  if (!state.mockUser) {
    state.mockUser = { name: "Test User", email: "test@example.com" };
  }
  if (state.lessonXP === 0 && state.lessonMistakes === 0) {
    state.lessonXP = 30;
    state.lessonMistakes = 1;
  }

  if (target === "lesson") {
    state.lessonSubjectId = "chat-prompting";
    startLesson("u1l1"); // sets state.screen itself
  } else {
    if (target === "lessonPath" || target === "lessonComplete") {
      state.lessonSubjectId = "chat-prompting";
      state.lessonId = "u1l1";
    }
    state.screen = target;
  }
  render();
}

const devPanel = document.createElement("div");
devPanel.style.cssText =
  "position:fixed; bottom:10px; right:10px; z-index:9999; " +
  "background:#1c2130; border:1px solid #333b52; border-radius:8px; padding:6px;";
devPanel.innerHTML = `
  <select id="dev-jump-select" style="font-family:monospace; font-size:11px; background:#242b3d; color:#e8a33d; border:1px solid #333b52; border-radius:4px; padding:4px;">
    <option value="">🛠 DEV: jump to...</option>
    ${DEV_SCREENS.map((s) => `<option value="${s}">${s}</option>`).join("")}
  </select>
`;
document.body.appendChild(devPanel);
document.getElementById("dev-jump-select").onchange = (e) => {
  if (e.target.value) devJumpTo(e.target.value);
  e.target.value = "";
};

// ---------------------------------------------------------------------------
// 9. KICK OFF
// If Supabase already has a logged-in session (e.g. the page was
// refreshed), pick that up now instead of showing the signup screen again.
// This runs after the first render() so the person sees *something*
// immediately rather than a blank screen while this check is in flight.
// ---------------------------------------------------------------------------
render();

(async () => {
  const { data } = await window.supabaseClient.auth.getSession();
  if (data.session) {
    const user = data.session.user;
    state.mockUser = { name: user.user_metadata?.name || user.email, email: user.email };

    const saved = await loadProgress(user.id);
    if (saved && saved.subjects && saved.subjects.length > 0) {
      state.subjects = saved.subjects;
      state.subjectPlacement = saved.subject_placement || {};
    }

    state.screen = "accountWelcome";
    render();
  }
})();
