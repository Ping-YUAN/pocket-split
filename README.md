# Pocket Split 💸

A lightweight, 100% client-side web application built with React, TypeScript, and Material UI to track shared gathering expenses and calculate settlements without a backend.

## ✨ Features

- Create, save, switch between, and delete gatherings; each gathering keeps its participants and expenses separate
- Manage gatherings and participants together in a collapsible section
- Add expenses with per-expense payer and split-participant selection
- View gathering totals, average cost per participant, expense count, suggested transfers, and net balances
- Persist data in `localStorage`, including migration of older single-gathering data
- Use in-app confirmation dialogs to protect deletion and reset actions
- Responsive layouts for mobile, tablet, and desktop

## 🖼️ Screenshots

### Gathering and participant management

Gatherings are selected, created, and deleted as chips in the collapsible management panel. Participants for the active gathering are managed in the same section.

![Gathering and participant management](assets/participants.png)

### Add an expense

Enter the description, amount, payer, and participants sharing the expense. Split controls stay together in one row, and the add button remains easy to reach.

![Add expense form](assets/add-expense.png)

### Settlement results

The summary shows total spending, average per participant, expense count, suggested transfers, and net balances.

![Settlement results](assets/results.png)

## 🚀 Local Development

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Build for production: `npm run build`
4. Run lint checks: `npm run lint`

## 📦 Deployment

Build the app with `npm run build`, then deploy the generated `dist` folder using your preferred static hosting provider. For GitHub Pages, configure the Vite `base` path to match the repository URL.

## 📜 License

MIT License. Feel free to use and modify this project for your gatherings.
