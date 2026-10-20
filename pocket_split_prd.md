Pocket Split - Product Requirements Document & AI Development Guide (v5)
This document serves as the complete Product Requirements Document (PRD) and developer specification for Pocket Split, a purely frontend web application designed to calculate and settle group expenses (AA-style billing) with zero backend dependency, built with TypeScript and optimized for mobile, tablet, and desktop browsers.
1. Project Overview & Tech Stack
App Name: Pocket Split
Purpose: Allow a user to create and save multiple gatherings, input participants and expenses separately for each, and calculate the minimal debt-settlement transactions (who pays whom) for the selected gathering.
Architecture: 100% Client-Side Single Page Application (SPA).
Core Tech Stack:
Language: TypeScript (Strict type safety for participants, expenses, and calculations)
Framework: React (Functional components, Hooks)
UI Library: Material UI (MUI v5/v6) with a heavy Mobile-First UX focus
Icons: `@mui/icons-material`
Persistence: Browser `localStorage` for state persistence across sessions
Offline Support: Use a service worker to precache the built app shell and static assets. After at least one successful online visit, navigation/reload while offline should serve the most recently cached app version. Automatically update the cache when a new version is available online; gathering data remains in `localStorage`.
Deployment: GitHub Pages (via `gh-pages` package or GitHub Actions)
Visual References: Current workflow screenshots are stored in `assets/`: `app.png` (iPhone home-screen installation), `gathering-participants.png` (gathering and participant management), `add-expense.PNG` (expense form), `expense-log.png` (recorded expenses), and `result.png` (settlement summary). Link and present these screenshots in README in the order a user performs the core tasks. Preserve filename casing in references.
Repository Link: Display an accessible GitHub icon in the application header that opens `https://github.com/Ping-YUAN/pocket-split` in a new tab.
Home Screen Icon: Crop the already-rounded artwork and its shadow in `assets/icon.jpeg` to a square, preserving the existing design and adding transparent rounded corners to the square crop. Store the 180x180 PNG at `assets/apple-touch-icon.png`, reference it from `index.html` as a Vite-processed local asset for both `rel="apple-touch-icon"` and standard favicon metadata, and set the iOS home screen title to "Pocket Split". Do not store the app icon in `public/`.
Header Branding: Display the same app icon beside the Pocket Split title in the application header.
Home Screen Guide: README must explain how to add the live website to an iPhone/iPad home screen using Safari's Share > Add to Home Screen flow and to an Android home screen using Chrome's menu > Add to Home screen (or Install app, when offered). Explain that app data remains browser-local and that removing/re-adding a shortcut can refresh a cached icon.
2. TypeScript Data Models & Types (`src/types/index.ts`)
To ensure clean code and robust calculation logic, the following TypeScript interfaces should be implemented:
```typescript
export interface Participant {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  payerId: string; // Participant ID who paid
  participantIds: string[]; // IDs of participants sharing this expense
  date: string; // ISO string or formatted date
}

export interface Gathering {
  id: string;
  name: string;
  participants: Participant[];
  expenses: Expense[];
  createdAt: string;
}

export interface DebtTransfer {
  from: string; // Debtor Name
  to: string;   // Creditor Name
  amount: number;
}
```
3. Core Functional Requirements
Feature 1: Participant Management
Input: Text field + "Add Participant" button, optimized for mobile keyboard input (using `inputMode="text"`).
Validation: Prevent duplicate names (case-insensitive) and empty strings.
Display: Scrollable horizontal or wrap layout of chips with a delete icon. Use an in-app Material UI dialog to confirm participant deletion; explain when their removal will also clear linked expense allocations. Do not use browser-native confirmation dialogs.
Compact Management Pattern: The participant section should remain lightweight and collapsible on mobile so it does not consume too much screen space; users can expand it again later when they need to add or edit names.
Quick-Add Behavior: Once a participant is added in the current session, they should be automatically included in the active expense split selection when the form is still in its default “all selected” state. This reduces follow-up edits and keeps the flow fast on mobile.
Feature 2: Expense Logging & Participant Selection
Fields required per expense:
`description` (Optional text, e.g., "Dinner", "Uber"). When omitted, use `Expense by <payer name>` as the expense label; the expense date remains available separately.
`amount` (Number, `inputMode="decimal"` for mobile numeric keypad)
`payerId` (Dropdown selection from existing participants)
`participantIds` (Checkboxes or interactive chips/list).
Deletion Safety: Use an in-app Material UI dialog to confirm expense deletion. The "Reset All" action must also use this dialog style. Do not use browser-native confirmation dialogs.
Clear Gathering Expenses: Provide a "Clear all" action in the expense log. Confirm with an in-app Material UI dialog that states the number of expenses to be removed and clarifies that the gathering and participants will remain. Clear expenses only from the active gathering.
Participant Selection Efficiency (Key UX Enhancement):
Default State: By default, all current participants should be selected when opening the "Add Expense" form/modal.
Quick Actions / Toggle All: Provide a prominent "Select All / Clear All" (全选 / 反选) checkbox or button at the top of the participant selection list.
Since most expenses in group gatherings are shared by everyone, one-tap "Select All" eliminates manual tap fatigue on mobile screens.
Split Logic: Equal split among selected participants ($\text{Amount} / \text{Count}$).
Feature 3: Debt Settlement Calculation (The Algorithm)
Net Balance Calculation:
For each participant, calculate: $\text{Total Paid} - \text{Total Owed}$.
Positive = Creditor (to receive money), Negative = Debtor (to pay money).
Settlement Simplification (Greedy Algorithm):
Match debtors with creditors to minimize the number of transfer transactions.
Return an array of `DebtTransfer` objects to render in a clean summary table or card stack.
Feature 4: Multiple Gatherings
Create: Users can create and name any number of gatherings, such as "Weekend trip" or "Birthday dinner".
Select and delete: Render gatherings as chips inside the collapsible participant-management section. Tapping a gathering chip selects it; its delete icon opens the same in-app confirmation dialog as deleting a participant and warns that its participants and expenses will also be deleted. If the deleted gathering was active, switch to another saved gathering; if it was the last gathering, create a fresh empty "My first gathering".
Create: Provide an "Add gathering" chip alongside the gathering chips; newly created gatherings become active immediately.
Summary: The collapsed section shows the active gathering and participant count; expanding it exposes the gathering chips and participant management.
Isolation: Every gathering has its own participants and expenses. Participant changes, expense entry/removal, and settlement calculations affect only the selected gathering.
Independent Settlement: The settlement tab reports totals, balances, and transfers for the selected gathering only; switching gatherings shows that gathering's own results.
Settlement Summary: The three summary cards show total spending, average per participant, and the number of expenses. Do not show the number of settlement transfers as a headline statistic.
Persistence: Gatherings and the active gathering ID are automatically saved in `localStorage` under `pocket_split_state_v3`. Each gathering stores its ID, name, participants, expenses, and creation date.
Migration: On first load, migrate the existing single-gathering `pocket_split_state_v2` or `pocket_split_state_v1` data into a gathering named "My gathering", without losing participants or expenses.
Initial State: A fresh installation starts with an empty "My first gathering" so users can immediately add participants and expenses.
Reset Data: "Reset All" confirms before replacing all saved gatherings with a fresh empty gathering.
4. Mobile-First UI/UX & Material UI Guidelines
The UI must adapt cleanly from phones through tablets to desktop browsers:
Layout Structure:
Gathering and Participants: Combine gathering chips and participant management in one collapsible card. Give the "Gatherings" label a prominent title style. Tapping a gathering chip selects it, its delete icon deletes it after in-app confirmation, and an "Add gathering" chip opens the creation dialog. Keep the active gathering name and participant count visible while collapsed.
Mobile Bottom Navigation or Sticky Header Tabs: Easily switch between "1. Expenses" and "2. Settlement" within the selected gathering.
Responsive Expense Layout: Stack the participant manager, expense form, and expense log on phones; display them in two columns on tablet-sized screens and three columns on desktop. Expand the content container at larger viewport widths so desktop layouts can use the available space.
Compact Forms: Keep the amount and payer fields side-by-side on all screen sizes, followed by the optional description field. Display "Split with", "Select All", and "Clear All" in a single row with the label and actions aligned to opposite ends. Set the top padding of the expense form card header to 16px, with a small additional top inset on the "Add expense" title; keep remaining form spacing compact. Keep the "Add Expense" submit button sticky at the bottom of the expense form while scrolling through split participants, so it remains readily accessible; use appropriate mobile keypads (`type="number"` or `inputMode="decimal"` for amounts).
Fast Multi-select Controls: In the expense form, display participants as tap-friendly MUI `Chip` controls or `Checkbox` list items with an accessible top toolbar for "Select All".
Cards & Accordions: Group expenses in clean cards rather than wide desktop tables.
Color Theme: Vibrant, friendly financial palette (e.g., Deep Purple / Teal primary, amber accents) with support for clean typography.
5. Project Structure (Vite + React + TypeScript + MUI)
```
pocket-split/
├── public/
├── assets/
│   ├── app.png
│   ├── gathering-participants.png
│   ├── add-expense.PNG
│   ├── expense-log.png
│   ├── result.png
│   ├── icon.jpeg
│   └── apple-touch-icon.png
├── src/
│   ├── components/
│   │   ├── ExpenseForm.tsx
│   │   ├── ExpenseList.tsx
│   │   ├── ParticipantManager.tsx
│   │   └── SettlementSummary.tsx
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── calculateDebts.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```
6. GitHub Pages Deployment Guide (TypeScript/Vite)
Initialize Git & Push Repository:
```bash
   git init
   git add .
   git commit -m "Initial commit with TypeScript"
   git branch -M main
   git remote add origin https://github.com/<your-username>/pocket-split.git
   git push -u origin main
   ```
Configure Vite for GitHub Pages (`vite.config.js`):
```typescript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   
   export default defineConfig({
     plugins: [react()],
     base: '/pocket-split/', // Match your GitHub repository name
   })
   ```
Install gh-pages package:
```bash
   npm install gh-pages --save-dev
   ```
The project `package.json` includes deployment scripts. The deploy command explicitly specifies the repository:
```json
   "scripts": {
     "dev": "vite",
     "build": "tsc --noEmit && vite build",
     "lint": "eslint . --ext .ts,.tsx",
     "preview": "vite preview",
     "predeploy": "npm run build",
     "deploy": "gh-pages-clean && gh-pages -d dist -r https://github.com/Ping-YUAN/pocket-split.git"
   }
   ```
Deploy:
```bash
   npm run deploy
   ```
Go to your GitHub repo settings -> Pages -> Set source branch to `gh-pages`.

Deployment troubleshooting:
- The `deploy` script clears the local `gh-pages` cache before publishing. If `gh-pages` still reports `Failed to get remote.origin.url`, run `npx gh-pages-clean` explicitly and retry `npm run deploy`. This removes the deploy cache only, not the project or Git history.
- If GitHub reports `Repository not found`, confirm the repository exists, verify the remote with `git remote -v`, and ensure the authenticated account has access. Correct the remote using `git remote set-url origin https://github.com/Ping-YUAN/pocket-split.git` if necessary.
- If Git reports `Invalid username or token`, authenticate HTTPS Git operations using GitHub CLI (`gh auth login`, choose browser-based HTTPS login) or refresh the saved `github.com` credentials in Windows Credential Manager. GitHub account passwords are not accepted for Git over HTTPS; never expose or commit a personal access token.
- If `gh` is not recognized after installation, reopen PowerShell or install GitHub CLI from `https://cli.github.com/`.
- If the deployed site returns 404 or serves old assets, verify GitHub Pages publishes `gh-pages` from the repository root, confirm Vite `base` is `/pocket-split/`, and allow time for Pages to refresh.
7. README.md Template
````markdown
# Pocket Split 💸

A lightweight, 100% client-side mobile-first web application built with **React, TypeScript, and Material UI** to effortlessly calculate and settle group expenses (AA-style billing) without needing a backend.

## ✨ Features
- **Mobile-First UX:** Designed specifically for quick entry on mobile phones while out with friends.
- **Quick Participant Selection:** One-tap "Select All" toggle for split participants, with default full selection.
- **Strict Type Safety:** Built using TypeScript for reliable calculations and state handling.
- **Participant & Expense Management:** Easily add friends, track who paid, and select who shares each cost.
- **Smart Debt Settlement:** Automatically calculates minimal transfer transactions.
- **Persistent Storage:** Uses browser `localStorage` so your event data stays saved locally across sessions.

## 🚀 Live Demo
[https://<your-username>.github.io/pocket-split/](https://<your-username>.github.io/pocket-split/)

## 🛠️ Local Development
1. Clone the repo:
   ```bash
   git clone https://github.com/<your-username>/pocket-split.git
   cd pocket-split
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
````