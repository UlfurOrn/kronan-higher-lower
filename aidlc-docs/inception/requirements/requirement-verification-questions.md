# Requirements Clarification Questions

Please answer each question by filling in the letter choice after the `[Answer]:` tag.
If none of the options match your needs, choose the last option (Other) and describe your preference.
Let me know when you're done.

---

## Question 1
What technology stack do you want to use for the frontend?

A) React (TypeScript)
B) Next.js (TypeScript, full-stack)
C) Vue.js
D) Plain HTML/CSS/JavaScript (no framework)
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2
Do you need a backend/server component, or should this be a purely frontend application that calls the Krónan API directly from the browser?

A) Purely frontend — call Krónan API directly from the browser (requires user to provide their own Krónan AccessToken)
B) Backend required — a server proxies Krónan API calls so users don't need their own token (requires a shared service account token)
C) Backend required — users log in via Krónan (OAuth/AccessToken flow) and the backend proxies on their behalf
D) Other (please describe after [Answer]: tag below)

[Answer]: A purely frontend, but we want to query the API upfront for data and the frontend only gets a JSON

---

## Question 3
How should products be selected for each game round?

A) Randomly from all available products in the Krónan catalog
B) Randomly within a specific product category (user can choose category)
C) A curated/pre-selected list of well-known products
D) Mix — random from catalog but filtered to avoid very obscure items (e.g. only products with images and a known price)
E) Other (please describe after [Answer]: tag below)

[Answer]: Have option for random across everything, and a specific category. But we also only want prodycts with an image and known price

---

## Question 4
What is the core game mechanic — what are players comparing?

A) Current price in ISK (e.g. "Does Product A cost more or less than Product B?")
B) Price per unit/weight (e.g. price per kg or per litre)
C) Both options available, player can choose
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 5
Should the game track a score / streak, and should scores be persisted?

A) Yes — track a streak (how many correct guesses in a row), stored in browser (localStorage), no account needed
B) Yes — track score and maintain a global leaderboard (requires user accounts / nicknames)
C) Yes — both a local streak and a global leaderboard
D) No scoring — just play for fun with no tracking
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 6
Should the game support multiple languages, and what language should the UI default to?

A) Icelandic only
B) English only
C) Both Icelandic and English, defaulting to Icelandic
D) Both Icelandic and English, defaulting to English
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 7
What should happen when the player answers incorrectly (game over)?

A) Show the correct answer, then immediately offer "Play Again"
B) Show the correct answer with a summary of the streak/score, then offer "Play Again"
C) Allow the player to continue after a wrong answer (infinite play, just show if they were right or wrong)
D) Other (please describe after [Answer]: tag below)

[Answer]: B, but we want to support lives (a normal mode with 3 lives and a hard mode with 1 life) 

---

## Question 8
Should the game show product images alongside each item?

A) Yes — always show product images (fall back to a placeholder if no image available)
B) Yes — only show product images if available, no placeholder
C) No — text-only, name and category only
D) Other (please describe after [Answer]: tag below)

[Answer]: A, and we should try to only have products with images

---

## Question 9
How should the app be deployed/hosted?

A) Static hosting (Vercel, Netlify, GitHub Pages) — frontend only
B) Containerized (Docker) — suitable for any cloud or self-hosted environment
C) AWS (specify preferred services, e.g. S3+CloudFront, ECS, Amplify)
D) No preference — just make it easy to run locally
E) Other (please describe after [Answer]: tag below)

[Answer]: Locally

---

## Question 10
Are there any specific non-functional requirements you care about?

A) Performance is key — game should load fast, API calls should be minimal/cached
B) Mobile-first design is important
C) Both performance and mobile-first
D) No specific NFR requirements — just functional correctness
E) Other (please describe after [Answer]: tag below)

[Answer]: D

---

## Question: Security Extensions
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)
B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)
X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints (recommended for projects with business logic, data transformations, serialization, or stateful components)
B) Partial — enforce PBT rules only for pure functions and serialization round-trips (suitable for projects with limited algorithmic complexity)
C) No — skip all PBT rules (suitable for simple CRUD applications, UI-only projects, or thin integration layers with no significant business logic)
X) Other (please describe after [Answer]: tag below)

[Answer]: C
