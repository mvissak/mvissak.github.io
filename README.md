# Blackjack Basic Strategy Trainer

A production-oriented blackjack basic-strategy trainer built with Next.js App Router, TypeScript, React, Tailwind CSS, and Vitest. The app is centered on corrective learning: when a player picks the wrong move, the hand pauses, the correct play is explained, and the same decision must be retried.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Test

```bash
npm test
```

Type-check manually with:

```bash
npx tsc --noEmit
```

## Deploy To GitHub Pages

This repo is configured for static export deployment to GitHub Pages.

- Repository: `mvissak.github.io`
- Production URL: `https://mvissak.github.io/`
- Deployment workflow: `.github/workflows/deploy-pages.yml`

To publish:

1. Push the repository to GitHub.
2. Make sure the default branch is `main`, or update the workflow if you use a different branch.
3. In GitHub repository settings, set Pages to use `GitHub Actions` if GitHub prompts you to choose a source.
4. Push to `main` and let the workflow deploy the `out/` export.

The app uses `output: "export"` in Next.js, so GitHub Pages serves the generated static files directly.

## Architecture Overview

The codebase follows onion architecture with framework-independent domain logic at the center:

- `src/domain`
  - Core blackjack rules, hand evaluation, basic-strategy lookup, round settlement, and the explicit 6-deck shoe entity.
  - The shoe is modeled explicitly with 312 cards, Fisher-Yates shuffle, no replacement, cut-card penetration, and post-hand reshuffle behavior.
  - Randomness is injected through the `RandomSource` interface for deterministic tests.

- `src/application`
  - Session and round state DTOs.
  - The `BlackjackTrainer` orchestrator coordinates dealing order, decision validation, corrective feedback, split/double flow, payout tracking, and shoe lifecycle.
  - Thin use-case functions expose application actions cleanly to the presentation layer.

- `src/infrastructure`
  - `MathRandomSource` and `Mulberry32RandomSource` implement the domain randomness contract.
  - `SessionStorageTrainerStore` persists the session snapshot and shoe state between reloads.

- `src/presentation`
  - Client hook wires React to the application use cases.
  - View-model mapping keeps formatting and display concerns out of the domain and JSX.
  - UI is composed from reusable components with centralized tokens and Tailwind theme extensions.

- `src/app`
  - Minimal App Router entrypoints and global styling only.

## Core Product Notes

- Canonical basic strategy is encoded centrally in `src/domain/strategy.ts`.
- Blackjack pays 6:5 by default, with a 3:2 option in the header. Payout and base-bet changes apply to the next dealt hand; the current round keeps its original settings. The payout selection persists when reloading or starting a new session.
- Domain logic never depends on React, Next.js, browser APIs, or Tailwind.
- Dealer hole card stays hidden until dealer resolution.
- Dealer checks for blackjack with an Ace or 10-value upcard before hit, stand, double, or split. With an Ace, the insurance training prompt comes first; dealer blackjack then resolves immediately.
- Session stats include hands played, first-try accuracy inputs, mistakes, streaks, and running winnings.
- Shoe state persists across hands within a session and only reshuffles after the cut card has been reached and the current hand finishes.

## Future Extension Points

The current structure is intended to make future trainer modes straightforward:

- Difficulty modes and chart subsets can be added by swapping or decorating the strategy engine.
- Drill modes and spaced repetition can hang off the application layer without changing UI components.
- Additional persistence strategies can implement the existing store interface.
- Sound, streak challenges, historical analytics, and alternate rulesets can be added without moving business rules into React.
