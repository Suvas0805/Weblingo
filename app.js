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
// A lesson without `steps` is treated as locked/coming soon in the path UI.
//
// INTRO_LESSONS is a special shared track: it isn't tied to any one subject,
// and it always shows up FIRST on every subject's lesson path — no matter
// what the learner was placed into on the onboarding quiz. The idea is a
// quick, universal "how AI actually works" foundation before specializing.
// Progress on it is tracked by lesson id in state.lessonProgress, same as
// any other lesson — so completing it once counts for every subject, since
// the ids never repeat.
// ---------------------------------------------------------------------------
const INTRO_LESSONS = [
  {
    id: "introl1",
    title: "What Is AI, Really?",
    subtitle: "Demystifying what's actually happening",
    steps: [
      {
        type: "teach",
        title: "It's not magic, and it's not a person",
        body: "An AI chatbot doesn't \"think\" or \"know\" things the way a person does. It's a pattern-matching system, trained on huge amounts of text, that predicts the most likely next words — over and over — until a full answer forms.",
      },
      {
        type: "mc",
        prompt: "Which best describes how an AI chatbot generates a reply?",
        options: [
          "It looks up the exact right answer in a database",
          "It predicts the most likely next words, one at a time, based on patterns it learned",
          "It thinks the same way a human does",
          "It copies from a specific website in real time",
        ],
        correctIndex: 1,
        explanation: "There's no lookup table and no human-like thought — it's generating text piece by piece, based on patterns from its training.",
      },
      {
        type: "fillBlank",
        prompt: "Complete the sentence: “An AI chatbot is not ___, even though it can sound very confident.”",
        accepted: ["conscious", "alive", "a person", "sentient", "human", "self-aware"],
        hint: "Think about what it definitely isn't, no matter how fluent it sounds.",
      },
      {
        type: "teach",
        title: "\"AI\" isn't just one thing",
        body: "Chatbots, image generators, and recommendation systems are all \"AI\" — but they're built differently and do very different jobs. Knowing which kind you're using changes what you can expect from it.",
      },
      {
        type: "mc",
        prompt: "Which of these is an example of AI you've probably already used without thinking about it?",
        options: [
          "Autocomplete on your phone keyboard",
          "A paper calendar",
          "A handwritten note",
          "A physical library card catalog",
        ],
        correctIndex: 0,
        explanation: "Predictive keyboards are a simple, everyday form of AI — pattern prediction, just like a chatbot, on a much smaller scale.",
      },
      {
        type: "match",
        prompt: "Match each term to what it actually means.",
        pairs: [
          { left: "AI", right: "Technology trained to recognize patterns and generate responses" },
          { left: "Chatbot", right: "An AI you talk to in back-and-forth conversation" },
          { left: "Training", right: "The process of an AI learning patterns from huge amounts of example data" },
          { left: "Prompt", right: "The instruction or question you type to an AI" },
        ],
      },
      {
        type: "teach",
        title: "Confident doesn't mean correct",
        body: "Because it's predicting likely-sounding text, an AI can state something fluently and confidently that's still wrong. That's not lying — it just has no built-in fact-checker running alongside it.",
      },
      {
        type: "mc",
        prompt: "An AI gives you a confident, detailed, totally wrong answer. What's actually happening?",
        options: [
          "It's deliberately lying to you",
          "It generated fluent-sounding text that happened to be incorrect — it has no built-in way to know that",
          "It's broken and needs to be restarted",
          "This only happens with free AI tools",
        ],
        correctIndex: 1,
        explanation: "Confidence in an AI's tone isn't a signal of accuracy — it's just how the text came out.",
      },
      {
        type: "fillBlank",
        prompt: "Complete: “Because AI can sound confident and still be wrong, it's a good habit to ___ important answers before relying on them.”",
        accepted: ["double-check", "verify", "fact-check", "confirm", "check"],
        hint: "What would you do with any claim before trusting it for something important?",
      },
      {
        type: "mc",
        prompt: "You ask an AI for medical advice and it gives a clear, confident answer. What's the smartest move?",
        options: [
          "Trust it completely since it sounded very sure",
          "Use it as a starting point, then confirm with a real doctor or reliable source",
          "Never use AI for anything health-related, ever",
          "Ask a different AI the exact same question and go with whichever sounds more confident",
        ],
        correctIndex: 1,
        explanation: "Treating it as a starting point — not a final word — is the balance that gets you the benefit without the risk.",
      },
    ],
  },
  {
    id: "introl2",
    title: "How AI Chatbots Work",
    subtitle: "What's actually happening behind the chat window",
    steps: [
      {
        type: "teach",
        title: "It doesn't remember past chats",
        body: "Every time you start a new conversation, the AI usually doesn't remember your past separate chats — each new one typically starts blank, unless that specific tool is built to save memory on purpose.",
      },
      {
        type: "mc",
        prompt: "You had a great conversation with an AI yesterday. Today you open a brand new chat. What will it remember from yesterday?",
        options: [
          "Everything, automatically, always",
          "Nothing, unless that tool specifically saves and reloads memory",
          "Only the parts you marked important",
          "Only the first message",
        ],
        correctIndex: 1,
        explanation: "Without a memory feature built in, each new conversation starts from zero — nothing carries over automatically.",
      },
      {
        type: "fillBlank",
        prompt: "Complete: “Within ONE conversation, an AI chatbot usually ___ remember what you said earlier in that same chat.”",
        accepted: ["does", "can", "will"],
        hint: "Within a single ongoing chat, is earlier context remembered or not?",
      },
      {
        type: "teach",
        title: "It builds the reply piece by piece",
        body: "An AI generates its answer bit by bit, not all at once — that's why you sometimes see it \"type\" word by word. It's also why handing it the full picture up front (good prompting) matters so much: it only gets one shot at generating, based on what it has.",
      },
      {
        type: "mc",
        prompt: "Why does giving an AI clear, complete information up front usually work better than a vague first message?",
        options: [
          "Because it only gets one chance to generate the reply, based on what it has",
          "Because AI chatbots charge less for detailed prompts",
          "Because vague prompts are against the rules",
          "It doesn't actually matter",
        ],
        correctIndex: 0,
        explanation: "Since it's generating from what you gave it, more complete input up front means a more accurate result the first time.",
      },
      {
        type: "teach",
        title: "There's a limit to what it can \"see\" at once",
        body: "This limit is called a context window — the maximum amount of text an AI can take into account at a time. Extremely long conversations can eventually push earlier parts out of view.",
      },
      {
        type: "mc",
        prompt: "What's a context window, in plain terms?",
        options: [
          "A pop-up window asking to confirm your message",
          "The maximum amount of text an AI can take into account at once",
          "A setting for the chat's visual theme",
          "The amount of time you can spend talking to the AI per day",
        ],
        correctIndex: 1,
        explanation: "It's the AI's working \"field of view\" over text — everything within it can shape the reply; what falls outside it can't.",
      },
      {
        type: "fillBlank",
        prompt: "Complete: “If a conversation gets extremely long, the AI may eventually lose track of things said very ___ in the chat.”",
        accepted: ["early", "earlier"],
        hint: "What part of a long conversation is most likely to fall out of view first?",
      },
      {
        type: "match",
        prompt: "Match each concept to what it means.",
        pairs: [
          { left: "Context window", right: "How much text the AI can consider at once" },
          { left: "Prompt", right: "What you type to the AI" },
          { left: "Token", right: "A small chunk of text the AI reads or writes" },
          { left: "Response", right: "What the AI generates back to you" },
        ],
      },
      {
        type: "mc",
        prompt: "You're three days into a long, ongoing chat, and the AI seems to have forgotten something from your very first messages. What's most likely going on?",
        options: [
          "The AI is being lazy",
          "The conversation may have grown past what it can keep fully in view at once",
          "This never actually happens",
          "You need to buy a subscription to fix it",
        ],
        correctIndex: 1,
        explanation: "Very long chats can outgrow the context window, pushing the earliest messages out of view over time.",
      },
    ],
  },
  {
    id: "introl3",
    title: "Good At This, Bad At That",
    subtitle: "Knowing AI's real strengths and blind spots",
    steps: [
      {
        type: "teach",
        title: "Where AI genuinely shines",
        body: "AI chatbots are strong at drafting, brainstorming, explaining things in plain language, and summarizing long text — tasks where \"a solid first pass\" is genuinely useful.",
      },
      {
        type: "mc",
        prompt: "Which task plays to an AI chatbot's actual strengths?",
        options: [
          "Brainstorming 10 possible names for your new bakery",
          "Telling you today's exact stock price",
          "Confirming a fact that changed last week",
          "Counting the exact number of letters in a very long passage reliably",
        ],
        correctIndex: 0,
        explanation: "Brainstorming is exactly the kind of open-ended, generative task AI handles well — unlike precise counting or live facts.",
      },
      {
        type: "teach",
        title: "Where it tends to struggle",
        body: "AI chatbots are weaker at anything requiring up-to-the-minute facts, precise math or counting, and knowing the limits of their own knowledge — they can be confidently wrong instead of saying \"I don't know.\"",
      },
      {
        type: "fillBlank",
        prompt: "Complete: “Making up a confident-sounding but false answer is sometimes called ___.”",
        accepted: ["hallucination", "hallucinating", "a hallucination"],
        hint: "It's a specific term for an AI stating something false as if it were fact.",
      },
      {
        type: "mc",
        prompt: "Which of these is a weak spot for most AI chatbots?",
        options: [
          "Explaining a concept in simpler terms",
          "Brainstorming ideas",
          "Reporting today's exact news headlines reliably",
          "Drafting a first version of an email",
        ],
        correctIndex: 2,
        explanation: "Without live search, a chatbot is working from training data that has a cutoff — it can't reliably know what happened today.",
      },
      {
        type: "match",
        prompt: "Match each task to whether a typical AI chatbot is strong or weak at it.",
        pairs: [
          { left: "Brainstorming blog topics", right: "Strong" },
          { left: "Confirming today's weather", right: "Weak (unless it can search live)" },
          { left: "Explaining a concept simply", right: "Strong" },
          { left: "Precise exact math on big numbers", right: "Weak" },
        ],
      },
      {
        type: "teach",
        title: "Live search changes the picture — a bit",
        body: "Many AI tools now have a way to search the web for current information, which helps a lot. Even so, it's worth double-checking anything that really matters, especially for current events, prices, or statistics.",
      },
      {
        type: "mc",
        prompt: "You need today's exchange rate for a trip tomorrow. What's the smartest move?",
        options: [
          "Ask any AI chatbot and trust it completely, no matter what",
          "Use a tool that can actually search live, or check a live source directly",
          "Guess",
          "Ask the AI to just make something up",
        ],
        correctIndex: 1,
        explanation: "A rate that changes daily needs a live source — a chatbot relying only on memorized training data can't reliably know today's number.",
      },
      {
        type: "fillBlank",
        prompt: "Complete: “For anything that changes often — like news, prices, or scores — it's safer to use an AI with live ___ access, or check a live source yourself.”",
        accepted: ["search", "web", "internet"],
        hint: "What capability lets an AI check current information instead of relying on memorized training data?",
      },
      {
        type: "mc",
        prompt: "An AI chatbot gives you a specific statistic with no source, stated very confidently. What should you do before repeating it to someone else?",
        options: [
          "Repeat it immediately since it sounded confident",
          "Try to verify it against a real source first",
          "Assume all statistics from AI are automatically correct",
          "Ignore statistics from AI entirely, forever",
        ],
        correctIndex: 1,
        explanation: "A quick verification step is cheap insurance against repeating a confidently-wrong number.",
      },
    ],
  },
  {
    id: "introl4",
    title: "Staying Safe & Private",
    subtitle: "What's okay to share, and what isn't",
    steps: [
      {
        type: "teach",
        title: "Treat it like customer support, not a diary",
        body: "A good rule of thumb: treat an AI chat a bit like messaging a company's support line — useful, but not the place for your most sensitive information. Messages may be stored, reviewed, or used to improve the tool, depending on the service.",
      },
      {
        type: "mc",
        prompt: "Which is safest to share in a typical AI chat?",
        options: [
          "Your bank account number",
          "Your social security number",
          "A general question about how budgeting works",
          "Your account passwords",
        ],
        correctIndex: 2,
        explanation: "A general question has nothing identifying or sensitive attached to it — unlike account numbers, SSNs, or passwords.",
      },
      {
        type: "fillBlank",
        prompt: "Complete: “Before pasting something into an AI chat, it's smart to ask yourself: would I be okay with this being ___?”",
        accepted: ["seen", "stored", "saved", "read by someone else", "public"],
        hint: "What's the risk you're weighing before sharing something sensitive?",
      },
      {
        type: "teach",
        title: "This matters even more at work",
        body: "Pasting confidential client data, unreleased business plans, or private company info into a public AI tool can break confidentiality rules at your job — even if it feels like \"just getting a quick summary.\"",
      },
      {
        type: "mc",
        prompt: "A coworker pastes a client's private contract into a public AI chatbot to \"summarize it faster.\" What's the concern?",
        options: [
          "There's no concern, it's just text",
          "It could expose confidential client information to a third-party tool",
          "It will make the summary worse",
          "AI tools can't read contracts",
        ],
        correctIndex: 1,
        explanation: "Once sensitive text is pasted into an outside tool, you've lost control over where it goes — a real confidentiality risk.",
      },
      {
        type: "match",
        prompt: "Match each item to whether it's generally safe or unsafe to share in a typical AI chat.",
        pairs: [
          { left: "A general cooking question", right: "Safe" },
          { left: "Your full home address and daily schedule", right: "Unsafe" },
          { left: "A grammar check on a paragraph", right: "Safe" },
          { left: "A password or PIN", right: "Unsafe" },
        ],
      },
      {
        type: "teach",
        title: "For advice that really matters, verify with a real professional",
        body: "For medical, legal, or financial advice, treat an AI's answer as a helpful starting point, not a final word. A real professional can account for details an AI simply can't know about your specific situation.",
      },
      {
        type: "mc",
        prompt: "An AI suggests a specific medication dosage for a symptom you described. What's the right move?",
        options: [
          "Follow it exactly, no questions asked",
          "Use it only as a jumping-off point and confirm with an actual doctor or pharmacist",
          "Ignore all health questions ever",
          "Ask a friend instead of any professional",
        ],
        correctIndex: 1,
        explanation: "An AI can't know your full medical history or current medications — a real professional can, and should confirm anything dosage-related.",
      },
      {
        type: "fillBlank",
        prompt: "Complete: “For medical, legal, or financial decisions, it's smart to treat AI's answer as a starting point and confirm with a real ___.”",
        accepted: ["professional", "doctor", "lawyer", "expert"],
        hint: "Who should have the final say on something this important?",
      },
      {
        type: "mc",
        prompt: "You're using AI to help write a cover letter. Which detail is fine to include in your prompt?",
        options: [
          "Your job history and the role you're applying for",
          "Your social security number",
          "Your bank login",
          "Your home alarm code",
        ],
        correctIndex: 0,
        explanation: "Job history and the role are exactly the relevant, non-sensitive context the AI needs to help — nothing identity-risky required.",
      },
    ],
  },
  {
    id: "introl5",
    title: "Picking the Right Tool for the Job",
    subtitle: "Not all AI tools are the same AI tool",
    steps: [
      {
        type: "teach",
        title: "\"AI\" covers a lot of different tools",
        body: "Chatbots for conversation and writing, image generators for pictures, search-augmented tools for current information, coding assistants for programming — all \"AI,\" all built for different jobs.",
      },
      {
        type: "mc",
        prompt: "You need a brand-new picture of a cat wearing a spacesuit. Which type of AI tool is built for that?",
        options: [
          "A general chatbot with no image ability",
          "An image-generation AI tool",
          "A coding assistant",
          "A spreadsheet tool",
        ],
        correctIndex: 1,
        explanation: "A text-only chatbot can describe the image in words, but an image-generation tool is what actually creates the picture.",
      },
      {
        type: "fillBlank",
        prompt: "Complete: “A tool built specifically to search the web and cite sources is more reliable for ___ information than a chatbot relying only on memorized training data.”",
        accepted: ["current", "recent", "up-to-date", "today's"],
        hint: "What kind of information does a live-search tool handle better than a memory-only chatbot?",
      },
      {
        type: "teach",
        title: "Wrong tool ≠ \"AI doesn't work\"",
        body: "Using the wrong tool for a job doesn't mean AI failed — it often just means a different tool would've been a much better fit for what you actually needed.",
      },
      {
        type: "mc",
        prompt: "You ask a basic chatbot with no live search \"what's the score of tonight's game right now?\" and it gives a vague or outdated answer. What's really going on?",
        options: [
          "AI is completely useless",
          "That particular tool likely can't see live, current information — a search-enabled tool would be a better fit",
          "The game must not be happening",
          "This is a sign the chatbot is broken",
        ],
        correctIndex: 1,
        explanation: "It's a tool-fit issue, not a failure — live scores need a tool with live access, not just a memory-based chatbot.",
      },
      {
        type: "match",
        prompt: "Match each job to the right kind of AI tool.",
        pairs: [
          { left: "Writing a first draft of an email", right: "Chatbot" },
          { left: "Generating a logo concept", right: "Image generator" },
          { left: "Debugging a piece of code", right: "Coding assistant" },
          { left: "Finding this week's news on a topic", right: "Search-enabled AI tool" },
        ],
      },
      {
        type: "teach",
        title: "This is exactly why Weblingo has different subjects",
        body: "Each subject here is really \"how to get good at a different type of AI tool,\" because the skills for prompting a chatbot well aren't identical to prompting an image generator well — matching the tool to the job is step one.",
      },
      {
        type: "mc",
        prompt: "Why does it make sense for a prompting course to split into different subjects instead of teaching \"AI\" as one single skill?",
        options: [
          "Because different AI tools are built for different jobs, so good prompting looks a little different for each one",
          "Because that's just a marketing decision with no real reason",
          "Because all AI tools work identically under the hood",
          "To make the course artificially longer",
        ],
        correctIndex: 0,
        explanation: "The tools genuinely work differently under the hood, so the skills for using each one well are genuinely a little different too.",
      },
      {
        type: "fillBlank",
        prompt: "Complete: “Picking the right ___ for the job often matters more than being clever with your wording.”",
        accepted: ["tool"],
        hint: "What's the very first choice to get right, before you even start wording your prompt?",
      },
      {
        type: "mc",
        prompt: "You want help both writing a project plan AND generating a diagram image to go with it. What's the smartest approach?",
        options: [
          "Force one single chatbot to do both even if it can't generate images",
          "Use a chatbot for the writing, and an image-generation tool for the diagram",
          "Give up since one tool can't do everything",
          "Only do the writing part and skip the image entirely",
        ],
        correctIndex: 1,
        explanation: "Matching each piece of the task to the tool actually built for it is almost always the smoother path.",
      },
    ],
  },
];

// Returns the full ordered list of lessons for a subject's path: the
// 5 shared intro lessons first, then that subject's own Unit 1 lessons.
function getPathLessons(subjectId) {
  const subjectLessons = (LESSONS[subjectId] && LESSONS[subjectId].unit1) || [];
  return INTRO_LESSONS.concat(subjectLessons);
}

// Looks up one lesson by id, searching the intro track first, then the
// given subject's own lessons — since a lesson id could be either kind.
function findLessonById(subjectId, lessonId) {
  return getPathLessons(subjectId).find((l) => l.id === lessonId);
}

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
              { left: "Help me apologize", right: "Write a short, sincere apology text to a friend for missing their birthday" },
            ],
          },
          {
            type: "teach",
            title: "Context helps AI help you",
            body: "Telling the AI who a message is for, or why you need it, changes the result completely. “Write a project update” is vague. “Write a weekly project update for my manager, focused on what's blocking us” gives the AI an actual job to do.",
          },
          {
            type: "mc",
            prompt: "Which prompt gives the AI enough context to be genuinely useful?",
            options: [
              "Write an update",
              "Write a weekly project update for my manager, focused on blockers and next steps",
              "Update",
              "I need something written",
            ],
            correctIndex: 1,
            explanation: "Context — who it's for, and what matters most to them — turns a generic request into one the AI can actually act on.",
          },
          {
            type: "fillBlank",
            prompt: "Complete the sentence to add context: “Explain compound interest for a ___ who has never taken a finance class.” Type a specific audience.",
            accepted: [
              "teenager", "teen", "retiree", "small business owner", "beginner", "student",
              "kid", "child", "new investor", "college student", "high schooler", "adult",
            ],
            hint: "Any specific audience works — teenager, retiree, beginner, etc.",
          },
          {
            type: "teach",
            title: "Tone and audience change everything",
            body: "The same request can need a completely different tone depending on who's reading it. A text to a friend and an email to your boss shouldn't sound the same — telling the AI the tone you want (casual, formal, playful, firm) shapes the whole response.",
          },
          {
            type: "mc",
            prompt: "You're asking an AI to help write a message to your landlord about a broken heater. Which prompt sets the right tone?",
            options: [
              "Write a message about my heater",
              "Write a polite but firm message to my landlord about my broken heater, asking for a repair by Friday",
              "Tell my landlord to fix the heater",
              "Explain heaters",
            ],
            correctIndex: 1,
            explanation: "Naming the tone — polite but firm — plus a clear deadline gives the AI exactly the balance you want to strike.",
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
      {
        id: "u1l2",
        title: "Giving Context",
        subtitle: "Tell the AI what it needs to know",
        steps: [
          {
            type: "teach",
            title: "The AI only knows what you tell it",
            body: "An AI chatbot has no idea what's already happened, who you are, or what you're working with — unless you say so. “Write a follow-up email” is a guess. “Write a follow-up email, since I already emailed this client twice and haven't heard back” gives it something real to work with.",
          },
          {
            type: "mc",
            prompt: "Which prompt gives the AI the context it actually needs?",
            options: [
              "Write a follow-up email",
              "Write a follow-up email to a client I've already emailed twice with no response",
              "Email",
              "Help me follow up",
            ],
            correctIndex: 1,
            explanation: "The second prompt tells the AI what's already happened — that changes how firm or patient the follow-up should sound.",
          },
          {
            type: "fillBlank",
            prompt: "Complete the sentence with a piece of background info: “Help me write a budget plan, given that I just ___.” (e.g. started a new job, moved apartments, had a baby)",
            accepted: [
              "started a new job", "lost my job", "moved apartments", "moved", "had a baby",
              "got married", "started college", "paid off debt", "got a raise", "retired",
            ],
            hint: "Any life event that would change a budget works — a new job, a move, a baby, etc.",
          },
          {
            type: "match",
            prompt: "Match each vague request to the version that adds useful context.",
            pairs: [
              { left: "Write a cover letter", right: "Write a cover letter for a marketing role, highlighting my 3 years in social media" },
              { left: "Help me plan a trip", right: "Help me plan a trip for 2 adults with a tight $1,500 budget" },
              { left: "Draft a text to my friend", right: "Draft a text to my friend, since I have to cancel our plans tonight" },
              { left: "Explain this contract clause", right: "Explain this contract clause as if I've never signed a lease before" },
            ],
          },
          {
            type: "teach",
            title: "Context should be useful, not a info dump",
            body: "You don't need to explain your whole life story — just the one or two facts that would actually change the answer. “I'm a beginner” changes how something gets explained. What you had for breakfast probably doesn't.",
          },
          {
            type: "mc",
            prompt: "You're asking an AI to explain how mortgages work. Which context is actually useful to include?",
            options: [
              "That you're a first-time homebuyer with no finance background",
              "What neighborhood you grew up in",
              "Your favorite type of house",
              "That it's a sunny day",
            ],
            correctIndex: 0,
            explanation: "Being a first-time buyer with no finance background tells the AI to explain from scratch, in plain terms — that's context that changes the answer.",
          },
          {
            type: "fillBlank",
            prompt: "Complete the sentence: “Give me feedback on my resume — I'm applying for ___ roles.” Type a specific job type.",
            accepted: [
              "marketing", "engineering", "nursing", "teaching", "sales", "design",
              "accounting", "customer service", "software", "management", "retail", "finance",
            ],
            hint: "Any specific job field works — marketing, nursing, engineering, etc.",
          },
          {
            type: "teach",
            title: "Constraints are context too",
            body: "Telling the AI what you don't have, can't do, or must avoid is just as much context as telling it what you want. “No budget for a contractor” or “must fit in 100 words” shapes the answer just as much as the topic does.",
          },
          {
            type: "mc",
            prompt: "Which prompt includes a useful constraint?",
            options: [
              "Give me dinner ideas",
              "Give me 20-minute dinner ideas using only what's in a basic pantry — no specialty ingredients",
              "What should I eat?",
              "Dinner",
            ],
            correctIndex: 1,
            explanation: "The time limit and the \"no specialty ingredients\" constraint tell the AI exactly what kind of answer will actually be usable to you.",
          },
          {
            type: "mc",
            prompt: "You ask an AI to help plan a workout routine and get a generic answer. What context would most improve it?",
            options: [
              "Nothing — generic is fine",
              "Your fitness level, any injuries, and how many days a week you can train",
              "Your favorite color",
              "What gym equipment looks like",
            ],
            correctIndex: 1,
            explanation: "Fitness level, injuries, and available days are exactly the facts a real trainer would ask first — they're what actually shapes a usable plan.",
          },
        ],
      },
      {
        id: "u1l3",
        title: "Setting the Tone",
        subtitle: "Make it sound right for the moment",
        steps: [
          {
            type: "teach",
            title: "Same request, different tone",
            body: "A message to your best friend and a message to your boss might say the same thing, but they shouldn't sound the same. AI chatbots default to a kind of neutral, helpful tone — unless you tell them otherwise, you'll get that every time, even when it's wrong for the moment.",
          },
          {
            type: "mc",
            prompt: "You're texting a close friend to cancel plans. Which tone word fits best?",
            options: ["Formal", "Casual", "Corporate", "Legal"],
            correctIndex: 1,
            explanation: "A text to a close friend calls for a casual, relaxed tone — formal or corporate language would feel strange and distant here.",
          },
          {
            type: "fillBlank",
            prompt: "Complete the sentence: “Write this email in a ___ tone.” (e.g. formal, casual, warm, firm, playful)",
            accepted: ["formal", "casual", "warm", "firm", "playful", "friendly", "professional", "polite", "direct", "gentle"],
            hint: "Any real tone word works — formal, warm, firm, playful, etc.",
          },
          {
            type: "match",
            prompt: "Match each situation to the tone that fits it best.",
            pairs: [
              { left: "Declining a job offer", right: "Polite and professional" },
              { left: "Texting a close friend", right: "Casual and warm" },
              { left: "Asking a landlord to fix something, again", right: "Polite but firm" },
              { left: "Writing a kids' birthday card", right: "Playful and fun" },
            ],
          },
          {
            type: "teach",
            title: "Say the tone — don't hope the AI guesses it",
            body: "Leaving tone unstated means the AI picks something generic, which is rarely exactly right. Naming it directly — “keep this warm but professional” — takes the guesswork out completely.",
          },
          {
            type: "mc",
            prompt: "Which prompt is most likely to get the tone right on the first try?",
            options: [
              "Write a message to my team about the delay",
              "Write a message to my team about the delay — keep it calm and reassuring, not alarming",
              "Tell my team about the delay",
              "Delay message",
            ],
            correctIndex: 1,
            explanation: "Naming the tone directly — calm and reassuring, not alarming — removes any guesswork about how the message should land.",
          },
          {
            type: "fillBlank",
            prompt: "Complete the sentence: “Write a birthday message for my grandma — keep the tone ___.” Type a tone word that fits a grandma.",
            accepted: ["warm", "loving", "sweet", "gentle", "affectionate", "sincere", "heartfelt", "warm and loving"],
            hint: "Think warm, loving, sweet, gentle — something affectionate works.",
          },
          {
            type: "teach",
            title: "You can describe tone with a comparison, too",
            body: "If you can't think of the exact tone word, comparing it to something works just as well: “like a close friend checking in,” or “like a formal letter from a lawyer.” The AI can translate a comparison into tone just as easily as a label.",
          },
          {
            type: "mc",
            prompt: "Which instruction best sets a tone using a comparison instead of a label?",
            options: [
              "Make it sound nice",
              "Write it the way a doctor would calmly explain a diagnosis to a worried patient",
              "Use good tone",
              "Make it professional-ish",
            ],
            correctIndex: 1,
            explanation: "Comparing it to how a doctor calmly explains a diagnosis gives a vivid, specific picture of the tone — calm, careful, reassuring — without needing a single label word.",
          },
          {
            type: "mc",
            prompt: "You're writing a message to apologize to a coworker for missing a deadline. What's the biggest tone risk to avoid?",
            options: [
              "Sounding too playful or joking about it",
              "Being too specific about what happened",
              "Using complete sentences",
              "Being too short",
            ],
            correctIndex: 0,
            explanation: "A playful or joking tone undercuts a genuine apology — naming \"sincere, not jokey\" as the tone would steer the AI away from that risk.",
          },
        ],
      },
      {
        id: "u1l4",
        title: "Fixing a Bad Answer",
        subtitle: "Turn a so-so response into a great one",
        steps: [
          {
            type: "teach",
            title: "The first answer is a draft, not the final one",
            body: "Getting a mediocre response isn't a dead end — it's normal. AI chatbots remember what you've already said, so you can respond the way you would to a person: “close, but can you make it shorter?” works, and it's almost always faster than starting over.",
          },
          {
            type: "mc",
            prompt: "You get a response that's way too long. What's the best next move?",
            options: [
              "Give up and write it yourself",
              "Ask it to shorten the same response, instead of starting a brand new prompt",
              "Retype the exact same original prompt",
              "Switch to a different chatbot and start over",
            ],
            correctIndex: 1,
            explanation: "The chatbot already has the full conversation — asking it to shorten what it just wrote is faster than explaining everything again from scratch.",
          },
          {
            type: "fillBlank",
            prompt: "Complete the follow-up: “This is too formal — can you make it sound more ___?” Type a tone you'd ask for instead.",
            accepted: ["casual", "relaxed", "friendly", "warm", "natural", "conversational", "simple", "informal"],
            hint: "Any more relaxed tone works — casual, friendly, conversational, etc.",
          },
          {
            type: "match",
            prompt: "Match each complaint about a bad answer to the follow-up that actually fixes it.",
            pairs: [
              { left: "Too long", right: "Can you cut this down to 3 sentences?" },
              { left: "Too generic", right: "Can you make this specific to a small bakery, not businesses in general?" },
              { left: "Wrong tone", right: "Can you make this sound more casual, less corporate?" },
              { left: "Missing something", right: "Can you add a line about the refund policy too?" },
            ],
          },
          {
            type: "teach",
            title: "Name exactly what's wrong",
            body: "“This isn't quite right” forces the AI to guess what to change. “This is too technical for a beginner” tells it exactly what to fix. The more specific your complaint, the more accurate the next attempt will be — same rule as writing the first prompt.",
          },
          {
            type: "mc",
            prompt: "Which follow-up is most likely to get you a genuinely better second answer?",
            options: [
              "This isn't good, try again",
              "This is too technical — can you explain it like I'm new to this, with no jargon?",
              "Bad answer",
              "Redo it",
            ],
            correctIndex: 1,
            explanation: "Naming the exact problem — too technical, needs plain language — gives the AI something concrete to fix, instead of guessing what \"not good\" means.",
          },
          {
            type: "fillBlank",
            prompt: "Complete the follow-up: “Can you expand on the part about ___?” Type any topic you might want more detail on.",
            accepted: ["pricing", "the deadline", "the budget", "the timeline", "the next steps", "the risks", "the process", "the results"],
            hint: "Any specific topic works — pricing, the timeline, next steps, etc.",
          },
          {
            type: "teach",
            title: "If it keeps missing, break the ask into steps",
            body: "Sometimes a request is just too big for one shot — asking for a whole business plan at once, for example. Breaking it into smaller pieces (“first just the summary,” then “now the budget section”) usually gets much better results than one giant prompt.",
          },
          {
            type: "mc",
            prompt: "You asked for a full marketing plan and got something shallow and generic. What's the better approach?",
            options: [
              "Keep asking for \"a better marketing plan\" repeatedly",
              "Break it into pieces: ask for the target audience first, then the channels, then the budget",
              "Give up on using AI for this",
              "Copy and paste the same prompt three times",
            ],
            correctIndex: 1,
            explanation: "Breaking a big, vague ask into smaller specific pieces almost always produces sharper, more usable answers than one giant request.",
          },
          {
            type: "mc",
            prompt: "An AI gives you code that doesn't work. What's the most useful follow-up?",
            options: [
              "It's broken, fix it",
              "Share the exact error message you got, and ask it to fix that specific problem",
              "Ask for completely different code",
              "Try a different AI chatbot immediately",
            ],
            correctIndex: 1,
            explanation: "The exact error message is the single most useful piece of information you can hand back — it turns a guessing game into a specific, fixable problem.",
          },
        ],
      },
      {
        id: "u1l5",
        title: "Giving Examples",
        subtitle: "Show the AI the shape you want",
        steps: [
          {
            type: "teach",
            title: "Showing beats describing",
            body: "Sometimes it's hard to describe exactly the style or format you want in words — but easy to show it. Giving the AI one real example of the kind of output you're after (“write it like this: ...”) often works better than a paragraph of instructions.",
          },
          {
            type: "mc",
            prompt: "Which prompt is most likely to get a reply in exactly the style you want?",
            options: [
              "Write a product description for my candle",
              "Write a product description for my candle, in a punchy style — for example: 'This jacket doesn't just keep you warm. It makes you look like you meant it.'",
              "Make my candle sound good",
              "Candle description",
            ],
            correctIndex: 1,
            explanation: "The example shows the exact punchy, confident style you want — far more precise than just saying \"make it sound good.”",
          },
          {
            type: "fillBlank",
            prompt: "Complete the sentence: “Write a tagline for my bakery, for example, something like: ___.” Type a short made-up tagline in any style.",
            accepted: [
              "fresh bread, fresh start", "baked with love", "your daily rise", "where every crumb counts",
              "rise and shine bakery", "simple ingredients, big flavor",
            ],
            hint: "Any short, punchy made-up tagline works — it just needs to show a style.",
          },
          {
            type: "match",
            prompt: "Match each description-only prompt to its example-based upgrade.",
            pairs: [
              { left: "Write a witty bio for my dating profile", right: "Write a witty bio — like 'Professional snack enthusiast, amateur hiker, terrible singer.'" },
              { left: "Write a catchy headline for my blog post", right: "Write a headline — like '5 Mistakes Killing Your Morning Routine (and How to Fix Them)'" },
              { left: "Write a short, punchy slogan", right: "Write a slogan — like Nike's 'Just Do It'" },
              { left: "Write a friendly out-of-office message", right: "Write an out-of-office — like 'Away from my desk until Monday, but I promise your email is important to me!'" },
            ],
          },
          {
            type: "teach",
            title: "Examples are great for format, not just style",
            body: "Examples aren't just for tone — they're the clearest way to show structure too. Instead of saying “use a table,” showing a two-row example table tells the AI exactly how to lay out every row after it.",
          },
          {
            type: "mc",
            prompt: "You want your meeting notes formatted a specific way. What's the best way to show that?",
            options: [
              "Just say 'format it nicely'",
              "Paste one example row of formatted notes and ask it to continue in that exact format",
              "Say 'use bullet points' with no example",
              "Don't specify a format at all",
            ],
            correctIndex: 1,
            explanation: "One real example row shows the exact structure — far more precise than a vague instruction like \"format it nicely.”",
          },
          {
            type: "fillBlank",
            prompt: "Complete the sentence: “Summarize this in the same format as this example: ___.” Type any short example format, like 'Title, then 3 bullet points'.",
            accepted: [
              "title, then 3 bullet points", "one sentence summary", "a short paragraph", "bullet points",
              "a numbered list", "a table with two columns", "headline plus one sentence",
            ],
            hint: "Any short format description works — bullet points, a numbered list, a headline plus a sentence, etc.",
          },
          {
            type: "teach",
            title: "One good example beats a pile of adjectives",
            body: "Stacking up adjectives — “make it fun, punchy, exciting, energetic” — is vaguer than it feels. A single concrete example usually captures all of that at once, more precisely than any list of describing words could.",
          },
          {
            type: "mc",
            prompt: "Which approach gives the AI the clearest sense of the style you want?",
            options: [
              "Listing five adjectives: fun, bold, punchy, exciting, energetic",
              "Giving one real example sentence written in the style you want",
              "Just saying 'make it good'",
              "Not describing style at all",
            ],
            correctIndex: 1,
            explanation: "One concrete example usually captures tone, rhythm, and word choice all at once — more precisely than any stack of adjectives.",
          },
          {
            type: "mc",
            prompt: "You want an AI to write five more product names in the same style as three you already like. What's the best prompt?",
            options: [
              "Write five more product names",
              "Here are three names I like: [examples]. Write five more in that same style",
              "Make up some names",
              "Names, please",
            ],
            correctIndex: 1,
            explanation: "Handing over the three examples you already like is the clearest possible signal of the style, naming pattern, and tone to continue.",
          },
        ],
      },
    ],
  },
  "search-research": {
    unit1: [
      {
        id: "srl1",
        title: "How Search Engines Actually Work",
        subtitle: "Matching words, not understanding meaning",
        steps: [
          {
            type: "teach",
            title: "It's mostly matching, not understanding",
            body: "Classic search engines (Google, Bing) mostly work by matching the words you type to words on pages across the web, then ranking those pages by signals like relevance and trustworthiness. They don't fully \"understand\" your question the way a person would — wording still matters a lot.",
          },
          {
            type: "mc",
            prompt: "Why does the exact wording of a search matter more than you might expect?",
            options: [
              "Because search engines primarily match the words you typed against words on the page, so different wording can surface different results",
              "Because search engines charge extra for longer searches",
              "Wording doesn't actually matter at all",
              "Because search engines only read the first word you type",
            ],
            correctIndex: 0,
            explanation: "Since matching is largely word-based, swapping in different (even similar) words can surface a different set of results entirely.",
          },
          {
            type: "fillBlank",
            prompt: "Complete: “Typing more ___ words in a search, instead of vague ones, usually narrows down the results you get.”",
            accepted: ["specific", "precise", "exact", "targeted"],
            hint: "What kind of words narrow results down instead of broadening them?",
          },
          {
            type: "teach",
            title: "Matching results still get ranked",
            body: "A page matching your words isn't automatically shown first. Signals like how trustworthy a site is, how often other pages link to it, and how well it matches your intent all affect the order you see results in.",
          },
          {
            type: "mc",
            prompt: "Two pages both contain your exact search words. Why might one show up far above the other?",
            options: [
              "Ranking signals like trustworthiness and relevance push better-matching results higher",
              "Results are always shown in alphabetical order",
              "The page's color scheme affects ranking",
              "Older pages are always ranked first, no matter what",
            ],
            correctIndex: 0,
            explanation: "Matching gets you into the results pool — ranking signals decide where within that pool you land.",
          },
          {
            type: "match",
            prompt: "Match each term to what it means.",
            pairs: [
              { left: "Keyword matching", right: "Finding pages that contain the words you typed" },
              { left: "Ranking", right: "Deciding which matching pages to show first" },
              { left: "Index", right: "The search engine's giant stored copy of the web it searches through" },
              { left: "Query", right: "What you actually typed into the search box" },
            ],
          },
          {
            type: "teach",
            title: "First place isn't automatically \"most accurate\"",
            body: "Some top results are paid ads, and others rank well through SEO (search engine optimization) tactics that don't always correlate with higher quality or accuracy.",
          },
          {
            type: "mc",
            prompt: "Which is true about the very first results on a search page?",
            options: [
              "They're always the most accurate, unbiased source available",
              "Some may be ads, and ranking well doesn't automatically mean highest quality or accuracy",
              "Only government sites can ever rank first",
              "Rankings never change over time",
            ],
            correctIndex: 1,
            explanation: "Rank reflects a mix of relevance, SEO, and sometimes paid placement — not a guarantee of accuracy.",
          },
          {
            type: "fillBlank",
            prompt: "Complete: “Just because a result is ranked first doesn't guarantee it's the most ___.”",
            accepted: ["accurate", "reliable", "trustworthy", "correct"],
            hint: "Rank reflects relevance and other signals — not necessarily this quality.",
          },
          {
            type: "mc",
            prompt: "You search a health question and the top result is a brand selling a supplement related to that question. What should you keep in mind?",
            options: [
              "Top results are always neutral and unbiased",
              "That result may have a commercial interest in your answer — it's worth checking an independent source too",
              "You should buy the supplement immediately since it ranked first",
              "Ignore all search results about health topics forever",
            ],
            correctIndex: 1,
            explanation: "A commercial interest doesn't make a source automatically wrong — but it's a reason to double-check against something independent.",
          },
        ],
      },
      {
        id: "srl2",
        title: "Keywords That Actually Work",
        subtitle: "Say less, mean more",
        steps: [
          {
            type: "teach",
            title: "Drop the filler",
            body: "Full sentences and filler words (\"How do I find out...\") waste your search's focus. A search engine does better with the handful of specific words that actually matter.",
          },
          {
            type: "mc",
            prompt: "Which search is most likely to get a sharp, useful result?",
            options: [
              "How do I find out what the weather is going to be like this weekend in Chicago",
              "Chicago weather this weekend",
              "I need weather info",
              "weather",
            ],
            correctIndex: 1,
            explanation: "This keeps the essential words — location and timeframe — and drops everything that isn't doing real work.",
          },
          {
            type: "fillBlank",
            prompt: "Complete: “Searching with specific ___ instead of full sentences usually gets sharper results.”",
            accepted: ["keywords", "words", "terms"],
            hint: "What's the term for the handful of essential search terms, as opposed to a full sentence?",
          },
          {
            type: "teach",
            title: "Specificity narrows things fast",
            body: "Adding a brand, a location, a date, or a model number narrows results quickly. \"Best laptop\" returns millions of generic opinions; \"best laptop for video editing under $1500 2026\" returns something far more usable.",
          },
          {
            type: "mc",
            prompt: "Which search will get the most useful, specific results?",
            options: [
              "best laptop",
              "laptop",
              "best laptop for video editing under $1500 2026",
              "computer",
            ],
            correctIndex: 2,
            explanation: "Adding use case, budget, and year narrows millions of generic results down to something directly actionable.",
          },
          {
            type: "fillBlank",
            prompt: "Complete: “Adding a specific brand, model, date, or location to a search usually makes results more ___ to what you actually need.”",
            accepted: ["relevant", "specific", "targeted", "useful"],
            hint: "What quality improves when you narrow a search with specific details?",
          },
          {
            type: "teach",
            title: "Precise words beat vague descriptions",
            body: "Swapping in a more precise term — or searching the exact error message instead of a vague description — often surfaces far better results than describing the problem in your own words.",
          },
          {
            type: "mc",
            prompt: "Your laptop shows a specific error code. What's the best search approach?",
            options: [
              "Search the exact error code/message as written",
              "Search 'my laptop is broken'",
              "Search 'computer help'",
              "Search 'technology problems'",
            ],
            correctIndex: 0,
            explanation: "The exact error message is the most specific, searchable thing you have — others have likely searched that exact text before.",
          },
          {
            type: "match",
            prompt: "Match each vague search to its more specific upgrade.",
            pairs: [
              { left: "Vague: 'laptop problem'", right: "Specific: exact error message copied from the screen" },
              { left: "Vague: 'good recipe'", right: "Specific: '30-minute vegetarian pasta recipe'" },
              { left: "Vague: 'phone issue'", right: "Specific: 'iPhone 15 battery draining fast after update'" },
              { left: "Vague: 'car noise'", right: "Specific: '2019 Honda Civic grinding noise when braking'" },
            ],
          },
          {
            type: "mc",
            prompt: "You want to find a specific podcast episode you half-remember. What's the most effective search strategy?",
            options: [
              "Search 'that podcast episode I heard'",
              "Include any specific names, topics, or phrases you remember from it",
              "Give up since you don't remember the exact title",
              "Search just the word 'podcast'",
            ],
            correctIndex: 1,
            explanation: "Any specific fragment you remember — a guest name, a topic, a quoted phrase — gives the search engine something concrete to match.",
          },
        ],
      },
      {
        id: "srl3",
        title: "Search Operators & Filters",
        subtitle: "Little symbols, big precision",
        steps: [
          {
            type: "teach",
            title: "Quotes mean \"this exact phrase\"",
            body: "Quotation marks around a phrase tell a search engine to find that exact phrase, not just those words scattered somewhere on the page. \"best pizza in Seattle\" (with quotes) searches that exact phrase, word for word.",
          },
          {
            type: "mc",
            prompt: "What does putting quotation marks around a phrase do in a search?",
            options: [
              "Makes the search engine ignore the phrase entirely",
              "Searches for that exact phrase, word-for-word, instead of just matching the individual words",
              "Makes results load faster",
              "Nothing — quotes don't do anything in search",
            ],
            correctIndex: 1,
            explanation: "Quotes lock the words together as one exact phrase, instead of letting them match loosely anywhere on a page.",
          },
          {
            type: "fillBlank",
            prompt: "Complete: “Putting a phrase in ___ tells a search engine to match it exactly, word for word.”",
            accepted: ["quotes", "quotation marks"],
            hint: "What punctuation signals an exact-phrase search?",
          },
          {
            type: "teach",
            title: "A minus sign excludes a word",
            body: "A minus sign right before a word excludes pages containing that word — useful for cutting out an unwanted meaning, like searching \"jaguar -car\" to find the animal instead of the brand.",
          },
          {
            type: "mc",
            prompt: "You want info on the animal \"jaguar,\" not the car brand. Which search is smartest?",
            options: ["jaguar", "jaguar -car", "jaguar car", "jaguar AND car"],
            correctIndex: 1,
            explanation: "The minus sign excludes results about the car brand, leaving mostly results about the animal.",
          },
          {
            type: "teach",
            title: "site: narrows to one website",
            body: "The site: operator limits results to one specific website — e.g. \"site:reddit.com best budget headphones\" only searches within Reddit, instead of the whole web.",
          },
          {
            type: "mc",
            prompt: "Which search limits results to only one specific website?",
            options: [
              "site:reddit.com budget headphones",
              "reddit budget headphones",
              "budget headphones on reddit",
              "\"reddit\" budget headphones",
            ],
            correctIndex: 0,
            explanation: "The site: operator is what actually restricts results to that one domain — the other options just mention Reddit as a word.",
          },
          {
            type: "fillBlank",
            prompt: "Complete: “The site: operator narrows a search to results from just ___ website.”",
            accepted: ["one", "a single", "a specific"],
            hint: "How many websites does the site: operator limit results to?",
          },
          {
            type: "match",
            prompt: "Match each search operator to what it does.",
            pairs: [
              { left: "\"exact phrase\"", right: "Matches that phrase word-for-word" },
              { left: "-word", right: "Excludes pages containing that word" },
              { left: "site:example.com", right: "Limits results to one specific website" },
              { left: "filetype:pdf", right: "Limits results to a specific file type" },
            ],
          },
          {
            type: "mc",
            prompt: "You want a PDF research report about renewable energy, not random web pages. Which search is best?",
            options: [
              "renewable energy report",
              "renewable energy filetype:pdf",
              "renewable energy -web",
              "\"renewable energy\" \"report\"",
            ],
            correctIndex: 1,
            explanation: "filetype:pdf is built exactly for this — limiting results to one specific file format.",
          },
        ],
      },
      {
        id: "srl4",
        title: "Evaluating Sources",
        subtitle: "Just because it's online doesn't make it true",
        steps: [
          {
            type: "teach",
            title: "Check who, when, and why",
            body: "Before trusting a search result, it's worth a quick check: who wrote it, when, and why. An outdated article, an anonymous blog, or a site with an obvious sales motive all deserve more skepticism than a well-known, dated, sourced article.",
          },
          {
            type: "mc",
            prompt: "Which of these is the strongest signal that a source might be unreliable?",
            options: [
              "It's hosted on a well-known news organization's website",
              "It has no listed author, no date, and is trying to sell you something",
              "It includes citations to other sources",
              "It was published this month",
            ],
            correctIndex: 1,
            explanation: "No author, no date, and a sales motive are three separate red flags stacked on top of each other.",
          },
          {
            type: "fillBlank",
            prompt: "Complete: “A source with no listed author or date is harder to ___ than one that's clearly attributed.”",
            accepted: ["trust", "verify", "evaluate"],
            hint: "What's harder to do with an anonymous, undated source?",
          },
          {
            type: "teach",
            title: "Date matters a lot for fast-changing topics",
            body: "A \"best phone of the year\" article from three years ago is outdated, even if nothing about the article itself looks wrong — the facts it was built on have simply moved on.",
          },
          {
            type: "mc",
            prompt: "You're researching 'best laptops' and find a glowing, detailed article — but it's from 4 years ago. What should you do?",
            options: [
              "Trust it completely since it's detailed",
              "Look for something more recent, since laptop recommendations change fast",
              "Ignore the date — it doesn't matter for this topic",
              "Assume it's fake because it's old",
            ],
            correctIndex: 1,
            explanation: "Detail doesn't fix staleness — fast-moving topics like tech recommendations need a recency check, not just a depth check.",
          },
          {
            type: "teach",
            title: "Cross-referencing catches errors",
            body: "Checking whether multiple independent sources agree is one of the best ways to catch an error or a one-off bad take before you repeat it.",
          },
          {
            type: "mc",
            prompt: "You find a surprising claim on one blog. What's the smartest next step?",
            options: [
              "Repeat the claim immediately since you found it online",
              "Check whether other independent, credible sources say the same thing",
              "Assume it must be false since it's surprising",
              "Ignore all blogs forever",
            ],
            correctIndex: 1,
            explanation: "Cross-referencing — not blind trust or blind dismissal — is how you actually find out if a surprising claim holds up.",
          },
          {
            type: "fillBlank",
            prompt: "Complete: “Checking a claim against other ___ sources is called cross-referencing.”",
            accepted: ["independent", "credible", "reliable"],
            hint: "What kind of other sources are you checking a claim against?",
          },
          {
            type: "match",
            prompt: "Match each scenario to the right level of trust.",
            pairs: [
              { left: "No author, no date, trying to sell something", right: "Low trust — verify elsewhere" },
              { left: "Well-known organization, recent, cited sources", right: "Higher trust" },
              { left: "One blog making a surprising claim", right: "Worth cross-referencing before trusting" },
              { left: "Multiple independent sources agreeing", right: "Stronger evidence" },
            ],
          },
          {
            type: "mc",
            prompt: "You're researching a medical symptom and find a forum post claiming a dramatic home remedy \"cured\" someone. What's the smart move?",
            options: [
              "Try the remedy immediately since someone said it worked",
              "Treat it as one anecdote, not evidence, and check a credible medical source",
              "Share it with others as proven fact",
              "Assume all forum posts are automatically false",
            ],
            correctIndex: 1,
            explanation: "One anecdote isn't evidence either way — treating it as a lead to verify, not a conclusion, is the balanced move.",
          },
        ],
      },
      {
        id: "srl5",
        title: "AI-Powered Search vs Classic Search",
        subtitle: "Two different tools for finding things",
        steps: [
          {
            type: "teach",
            title: "Links vs. a direct answer",
            body: "Classic search engines return a list of links for you to sort through. AI-powered search tools instead generate a direct answer, often with citations — faster to read, but still worth checking, since it's summarizing (and can misread) what it found.",
          },
          {
            type: "mc",
            prompt: "What's the core difference between classic search and AI-powered search?",
            options: [
              "Classic search returns a list of links; AI search generates a direct written answer, often with citations",
              "They are exactly the same thing with different names",
              "Classic search is always more accurate",
              "AI search never shows any sources",
            ],
            correctIndex: 0,
            explanation: "The output format is the key difference — a list to sort through versus a synthesized answer.",
          },
          {
            type: "fillBlank",
            prompt: "Complete: “AI-powered search tools often include ___ so you can check where an answer came from.”",
            accepted: ["citations", "sources", "links"],
            hint: "What lets you trace an AI search answer back to where it came from?",
          },
          {
            type: "teach",
            title: "Different tools, different strengths",
            body: "AI search is great for quick synthesis of a broad topic. Classic search is often better when you want to browse many original sources yourself, or need something very current or niche the AI tool might not have indexed well.",
          },
          {
            type: "mc",
            prompt: "You want to quickly understand the general idea behind a broad topic you know nothing about. Which tool fits better?",
            options: [
              "An AI-powered search tool that synthesizes a direct answer",
              "A phone book",
              "A printed encyclopedia from decades ago",
              "None — this isn't possible",
            ],
            correctIndex: 0,
            explanation: "A quick, synthesized overview is exactly what AI search tools are built for.",
          },
          {
            type: "mc",
            prompt: "You want to read many original firsthand articles yourself to form your own opinion on a debated topic. Which fits better?",
            options: [
              "A classic search engine's list of links",
              "An AI tool with no option to see individual sources",
              "Neither works for this",
              "Asking a random stranger",
            ],
            correctIndex: 0,
            explanation: "Browsing original sources yourself is exactly what a list of links supports better than a single synthesized answer.",
          },
          {
            type: "teach",
            title: "Citations still need checking",
            body: "Even with citations, an AI search answer is still a summary — it can misread a source or blend details in a way that shifts the meaning slightly. Checking the actual cited source matters most for anything important.",
          },
          {
            type: "fillBlank",
            prompt: "Complete: “Even when an AI search tool cites a source, it's still worth ___ that source for anything important.”",
            accepted: ["checking", "verifying", "reading", "confirming"],
            hint: "What should you do with a cited source before relying on it for something important?",
          },
          {
            type: "match",
            prompt: "Match each need to the better-suited tool.",
            pairs: [
              { left: "Quick synthesis of a broad topic", right: "AI-powered search" },
              { left: "Browsing many original sources yourself", right: "Classic search" },
              { left: "Needing a direct, citation-backed answer fast", right: "AI-powered search" },
              { left: "Very current or niche info the AI may not have", right: "Classic search" },
            ],
          },
          {
            type: "mc",
            prompt: "You're making a decision that really matters (like a major purchase or health choice) based on an AI search summary. What's the smart move?",
            options: [
              "Trust the summary completely without checking anything",
              "Click through to the actual cited sources and verify the key facts yourself",
              "Ignore AI search tools entirely forever",
              "Ask the same AI tool the same question twice and assume two matching answers means it's true",
            ],
            correctIndex: 1,
            explanation: "Verifying the actual cited sources is the one step that catches a misread or oversimplified summary.",
          },
        ],
      },
      {
        id: "srl6",
        title: "Research Like a Pro",
        subtitle: "Turning a big question into real answers",
        steps: [
          {
            type: "teach",
            title: "Break big questions into small ones",
            body: "A big, vague question (\"should I buy a house?\") is too broad to search directly. Breaking it into smaller, specific sub-questions — like \"average mortgage rates this year\" or \"cost of home maintenance per year\" — makes each one actually searchable.",
          },
          {
            type: "mc",
            prompt: "Which is the better approach to researching a big decision like \"should I move to a new city\"?",
            options: [
              "Search the whole vague question as one search",
              "Break it into specific sub-questions: cost of living, job market, climate, commute times — and search each one",
              "Don't research at all, just decide randomly",
              "Only read one article and stop",
            ],
            correctIndex: 1,
            explanation: "Breaking a broad decision into its component parts makes each piece specific enough to actually research well.",
          },
          {
            type: "fillBlank",
            prompt: "Complete: “Breaking a big, vague question into smaller ___ questions makes each one easier to actually search.”",
            accepted: ["specific", "focused", "narrower"],
            hint: "What quality should the smaller sub-questions have, compared to the original big question?",
          },
          {
            type: "teach",
            title: "Good research is iterative",
            body: "Your first search often leads to new terms and ideas you didn't know to search for yet — which leads to the next, better search. Research rarely ends in one shot.",
          },
          {
            type: "mc",
            prompt: "You search a topic and a result mentions an unfamiliar term central to the topic. What's the smart next move?",
            options: [
              "Ignore the term and move on",
              "Search that new term specifically to understand it better",
              "Assume it's not important since you didn't know it already",
              "Stop researching entirely",
            ],
            correctIndex: 1,
            explanation: "Following up on an unfamiliar key term is exactly how research naturally deepens, search by search.",
          },
          {
            type: "teach",
            title: "Keep a running list as you go",
            body: "Even just a simple running list of sources and key points saves you from re-searching the same ground, and helps you spot patterns or disagreements across what you've found.",
          },
          {
            type: "mc",
            prompt: "Why is it useful to jot down sources and key points as you research, instead of just reading and moving on?",
            options: [
              "It prevents you from re-searching the same ground and helps you compare sources later",
              "It's required by every search engine",
              "It makes your search history public",
              "It has no real benefit",
            ],
            correctIndex: 0,
            explanation: "A running list is what turns scattered reading into something you can actually compare and draw conclusions from.",
          },
          {
            type: "fillBlank",
            prompt: "Complete: “Keeping a running list of sources and key points as you go helps you spot ___ across what you've found.”",
            accepted: ["patterns", "agreement", "trends", "consistency"],
            hint: "What can a running list help you notice across multiple sources?",
          },
          {
            type: "match",
            prompt: "Match each research situation to the right move.",
            pairs: [
              { left: "Big vague question", right: "Break into specific sub-questions" },
              { left: "Unfamiliar term in a result", right: "Search that term next" },
              { left: "Multiple searches over time", right: "Keep a running list of findings" },
              { left: "A claim only one source makes", right: "Cross-reference before trusting it" },
            ],
          },
          {
            type: "mc",
            prompt: "You're researching a big purchase (like a car) over several days. What's the strongest overall approach?",
            options: [
              "One single broad search and whatever comes up first",
              "Specific sub-searches (reliability, cost, reviews), cross-referenced sources, and a running list of findings as you go",
              "Picking the first result you see and stopping",
              "Avoiding research entirely and asking a salesperson only",
            ],
            correctIndex: 1,
            explanation: "This combines every skill from the unit — specific sub-searches, cross-referencing, and tracking findings — into one real research process.",
          },
        ],
      },
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
      <div class="hero-note hero-note-lg">Takes about a minute. No account needed yet.</div>
      <div class="hero-note hero-note-lg">You can choose multiple answers in the quizzes.</div>

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
  const unitLessons = getPathLessons(state.lessonSubjectId);
  const introCount = INTRO_LESSONS.length;

  // Horizontal position (as a % of the path's width) for each node, walking
  // left-right-left down the page — this is what gives the zigzag "ridge"
  // look instead of a plain vertical list. Repeats if there are ever more
  // than 5 lessons in a unit.
  const ZIGZAG_LEFT_PCT = [22, 58, 32, 68, 45];
  const NODE_SPACING = 128; // vertical px between node centers

  return `
    <section>
      <div class="result-eyebrow">${subject.name} · Lesson path</div>
      <h1 class="result-title">Lesson path</h1>
      <p class="result-desc">Starts with a ${introCount}-lesson AI foundation (shared across every subject), then moves into ${subject.name}.</p>
      <div class="mountain-path" style="height:${unitLessons.length * NODE_SPACING + 40}px;">
        ${unitLessons
          .map((lesson, i) => {
            const built = Boolean(lesson.steps);
            const progress = state.lessonProgress[lesson.id];
            const isPerfect = built && progress && progress.perfect;
            const isCompleted = built && progress && !progress.perfect;

            let subLine = "Coming soon";
            if (built) subLine = lesson.subtitle;
            if (isCompleted) subLine = `Completed · ${progress.mistakes} mistake${progress.mistakes === 1 ? "" : "s"}`;
            if (isPerfect) subLine = "✓ Perfect — no need to retake";

            // A perfect run locks the lesson entirely (not clickable at all).
            const clickable = built && !isPerfect;
            const leftPct = ZIGZAG_LEFT_PCT[i % ZIGZAG_LEFT_PCT.length];
            const topPx = i * NODE_SPACING;

            // Right where the shared intro track hands off to this
            // subject's own lessons, drop in a small divider label so the
            // path visually communicates "foundation done, now specializing."
            const sectionDivider =
              i === introCount
                ? `<div class="mountain-node-label" style="position:absolute; top:${topPx - 40}px; left:50%; transform:translateX(-50%); text-align:center; opacity:0.7;">
                     <div class="mountain-node-sub">— now specializing in ${subject.name} —</div>
                   </div>`
                : "";

            return `
          ${sectionDivider}
          <div class="mountain-node-wrap" style="left:${leftPct}%; top:${topPx}px;">
            <svg class="mountain-peak" viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="mtn-grad-${lesson.id}" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" style="stop-color:var(--mint); stop-opacity:0.6" />
                  <stop offset="100%" style="stop-color:var(--mint); stop-opacity:0.18" />
                </linearGradient>
              </defs>
              <path d="M0,80 C12,42 22,18 38,12 C46,9 54,9 62,13 C80,21 90,45 100,80 Z" fill="url(#mtn-grad-${lesson.id})" />
            </svg>
            <button class="mountain-node ${clickable ? "mountain-node-ready" : "mountain-node-locked"} ${isPerfect ? "mountain-node-perfect" : ""}" ${clickable ? `data-lesson="${lesson.id}"` : "disabled"}>
              ${isPerfect ? "★" : i + 1}
            </button>
            <div class="mountain-node-label">
              <div class="mountain-node-title">${lesson.title}</div>
              <div class="mountain-node-sub">${subLine}</div>
            </div>
          </div>`;
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
  const lesson = findLessonById(state.lessonSubjectId, state.lessonId);
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
    const lesson = findLessonById(state.lessonSubjectId, state.lessonId);
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
          // "Contains" rather than exact-match, so natural phrasing like
          // "paternal uncle" or "my best friend" still counts as correct —
          // it just needs to include one of the accepted words somewhere.
          state.lessonCorrect = step.accepted.some((term) => typed.includes(term));
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
  const lesson = findLessonById(state.lessonSubjectId, state.lessonId);
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
