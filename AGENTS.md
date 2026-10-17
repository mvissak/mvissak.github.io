# AGENTS.md

## Purpose

This repository is a blackjack basic-strategy training app built with Next.js App Router, TypeScript, React, Tailwind CSS, and Vitest.

It is not a general casino simulator. The product goal is corrective learning: every player decision is checked against the canonical strategy engine, wrong decisions pause the hand, and the player must choose again until the correct move is selected.

This file defines the coding standards, architecture rules, testing expectations, UI conventions, and implementation constraints for human and AI contributors.

When goals compete, prioritize them in this order:

1. Strategy correctness
2. Architectural integrity
3. Testability and determinism
4. UX clarity
5. Visual polish

---

## Product Rules And Current Table Assumptions

These rules are currently part of the product and must stay aligned across domain logic, UI copy, and tests:

- 6-deck blackjack shoe
- Dealer stands on soft 17
- Blackjack payout selectable between 6:5 (default) and 3:2
- Payout changes apply to the next dealt hand; each round keeps the payout selected when dealt
- Double on any two cards
- Double after split allowed
- No surrender
- No insurance
- Dealer checks for blackjack with an Ace or 10-value upcard before player actions (after the insurance training prompt for an Ace)
- Explicit shoe with no replacement
- Cut card penetration between 70% and 80%
- No mid-hand reshuffle
- Reshuffle only after the current hand completes once the cut card has been reached
- Minimum wager: `$25`
- Maximum wager: `$1000`

If any of these change:

- Update the domain source of truth first
- Update tests
- Update any visible rule copy in the UI
- Update README and this file if the contributor guidance is affected

---

## Non-Negotiable Rules

1. Do not place business logic in React components.
2. Do not hardcode strategy decisions in JSX, hooks, or view models.
3. Do not couple domain logic to React, Next.js, Tailwind, browser APIs, or session storage.
4. Do not bypass the current onion architecture for convenience.
5. Do not use `any` unless there is no reasonable alternative.
6. Do not add giant files or giant components.
7. Do not duplicate rules, chip palettes, colors, spacing, breakpoints, or table assumptions across files.
8. Do not reshuffle the shoe mid-hand.
9. Do not replace the explicit shoe with “infinite deck” shortcuts or random card spawning.
10. Do not silently change payouts, action validity, or dealing order.
11. Do not introduce reusable UI inline when it should be its own module.
12. Do not skip automated tests for domain or application changes.
13. Do not let visible UI copy disagree with the enforced trainer rules.

---

## Tech Stack

Current stack:

- Next.js 16 App Router
- React 19
- TypeScript with `strict` mode
- Tailwind CSS
- Vitest
- React Testing Library
- JSDOM test environment

Project aliases:

- `@/*` -> `src/*`
- `@tests/*` -> `tests/*`

Prefer those aliases over brittle relative imports.

---

## Architecture

This codebase follows onion architecture. Dependencies must point inward.

Allowed dependency direction:

- `src/presentation` -> `src/application`
- `src/application` -> `src/domain`
- `src/infrastructure` -> `src/domain` and `src/application` ports
- `src/app` -> `src/presentation`

Not allowed:

- `src/domain` -> any outer layer
- `src/application` -> `src/presentation`
- `src/domain` -> browser APIs
- `src/domain` -> Tailwind or formatting concerns

### Current Layer Responsibilities

#### `src/domain`

Owns the blackjack rules and pure game logic.

Current examples:

- [`src/domain/types.ts`](./src/domain/types.ts)
- [`src/domain/blackjackRules.ts`](./src/domain/blackjackRules.ts)
- [`src/domain/hand.ts`](./src/domain/hand.ts)
- [`src/domain/round.ts`](./src/domain/round.ts)
- [`src/domain/strategy.ts`](./src/domain/strategy.ts)
- [`src/domain/Shoe.ts`](./src/domain/Shoe.ts)

What belongs here:

- card and hand modeling
- hand value calculation
- soft/hard/pair classification
- action validity rules
- strategy lookup and fallback resolution
- payout logic
- dealer play
- shoe lifecycle and cut-card handling
- randomness interfaces

What must not live here:

- React state
- JSX
- text formatting meant only for presentation styling
- session storage
- timers
- DOM concerns

#### `src/application`

Owns use-case orchestration and trainer session flow.

Current examples:

- [`src/application/BlackjackTrainer.ts`](./src/application/BlackjackTrainer.ts)
- [`src/application/trainerState.ts`](./src/application/trainerState.ts)
- [`src/application/useCases.ts`](./src/application/useCases.ts)
- [`src/application/ports.ts`](./src/application/ports.ts)

What belongs here:

- start session
- restore session
- deal round
- validate submitted action against strategy
- hold correction state when the player is wrong
- split and double sequencing
- per-session stats
- banner messages such as reshuffle notices
- wager normalization

What must not live here:

- Tailwind classes
- component rendering
- browser storage implementations

#### `src/infrastructure`

Owns implementations of external concerns behind application/domain interfaces.

Current examples:

- [`src/infrastructure/random.ts`](./src/infrastructure/random.ts)
- [`src/infrastructure/SessionStorageTrainerStore.ts`](./src/infrastructure/SessionStorageTrainerStore.ts)

What belongs here:

- `RandomSource` implementations
- persistence adapters
- test doubles when needed

Do not move trainer rules or validation policy here.

#### `src/presentation`

Owns UI composition, interaction wiring, formatting, and animation decisions.

Current examples:

- Components in `src/presentation/components`
- [`src/presentation/hooks/useTrainerController.ts`](./src/presentation/hooks/useTrainerController.ts)
- [`src/presentation/view-models/buildTrainerViewModel.ts`](./src/presentation/view-models/buildTrainerViewModel.ts)
- [`src/presentation/view-models/betChips.ts`](./src/presentation/view-models/betChips.ts)
- theme modules in `src/presentation/theme`

What belongs here:

- mapping application state into display state
- outcome callouts
- countdown UI
- card visuals and animations
- chip visuals and stack layout
- input controls
- responsive layout

What must not live here:

- strategy tables
- payout rules
- action validity logic
- hand value calculation

#### `src/app`

Keep this layer thin.

Current rule:

- App Router entrypoints should mainly host layout and compose presentation modules
- Do not move business logic into route files

---

## Current Structural Conventions

Follow the current repository structure unless there is a strong reason to refactor:

```text
src/
  app/
  application/
  domain/
  infrastructure/
  presentation/
  test/

tests/
  application/
  domain/
  presentation/
  helpers.ts
```

This project currently favors flat, cohesive modules over deep nesting. Do not add folder depth without a clear benefit.

---

## Where To Put Changes

When making a change, use these heuristics:

- New blackjack or trainer rule: `src/domain` first, possibly `src/application` if it changes flow
- New session or round orchestration behavior: `src/application/BlackjackTrainer.ts`
- New storage or randomness implementation: `src/infrastructure`
- New formatting, display mapping, or UI-only derivation: `src/presentation/view-models`
- New reusable UI element: its own file in `src/presentation/components`
- New design token or palette: `src/presentation/theme`

Avoid putting formatting logic directly into JSX if it can live in the view model.

---

## Domain Standards

- Prefer pure functions for rule evaluation and calculations.
- Keep domain modules deterministic except where randomness is explicitly injected through an interface.
- Use explicit types for ranks, suits, actions, outcomes, and phases.
- Keep strategy logic centralized in `src/domain/strategy.ts`.
- Keep dealing order and payout behavior centralized in the domain/application flow. Do not re-derive them in the UI.
- Preserve the current shoe contract: explicit cards, Fisher-Yates shuffle, no replacement, cut-card reshuffle after hand completion.

If you need a new rule toggle, prefer adding it to `src/domain/blackjackRules.ts` and threading it through the correct layers.

---

## Application Standards

- `BlackjackTrainer` is the main orchestrator. Prefer extending it rather than scattering flow logic across hooks and components.
- Use `trainerState.ts` as the source of truth for application state shape.
- Keep use-case functions in `src/application/useCases.ts` thin.
- Normalize and validate values like wagers in the application layer, not only in the UI.
- Session stats should be updated in one place, not recomputed ad hoc in presentation.

---

## Presentation Standards

- All React components must be function components.
- Extract reusable UI even if it is only used once today. This repo already follows that pattern with components like `OutcomeCallout`, `CasinoChip`, `BetChipStack`, `ControlButton`, and `MetricCard`.
- Keep components small and focused.
- Use `buildTrainerViewModel.ts` for display-oriented formatting and derived labels.
- Use `src/presentation/theme/tokens.ts` for colors, spacing, radii, breakpoints, fonts, shadows, and motion tokens.
- Use `src/presentation/theme/casinoChips.ts` for chip denominations and chip-specific palette decisions.
- Do not hardcode new breakpoints or repeated color values inside individual components if they belong in the theme layer.
- Preserve current UX decisions unless intentionally changing them:
  - player cards are always face up
  - dealer hole card stays hidden until reveal
  - wrong actions open a correction modal and do not advance the hand
  - resolved hands show prominent outcome callouts
  - next hand can auto-advance via countdown or manual button
  - player bet chips render beneath the cards
  - chip stacks use larger denominations at the bottom
  - doubled hands show two adjacent stacks rather than a single combined chip

When adding presentation state, prefer putting the logic in the controller hook or view model rather than the leaf component.

---

## Styling And Design Token Rules

- Centralize shared visual values.
- Use Tailwind utilities, but route shared design decisions through theme modules when they are reused.
- `src/presentation/theme/tokens.ts` is the source for global tokens.
- `tailwind.config.ts` should consume those tokens rather than redefining them.
- Global utility classes belong in `src/app/globals.css` only when they are truly shared.

Do not introduce:

- repeated magic colors across multiple components
- ad hoc breakpoint values in arbitrary files
- alternate chip denomination lists outside `casinoChips.ts`

---

## Copy And UX Consistency

- Header rule copy must reflect the actual enforced rules.
- Correction messaging must include both the specific decision and the broader chart pattern when applicable.
- Outcome messaging should be immediately legible and not depend on subtle styling alone.
- If you change table rules, also update visible descriptions and relevant tests.

---

## Testing Standards

Every meaningful change should include or update automated tests.

Current test layout:

- `tests/domain`
- `tests/application`
- `tests/presentation`

Use the existing coverage style:

- domain tests for pure rule behavior
- application tests for round/session flow
- presentation tests for UI behavior and rendering

Examples already in the repo:

- hand valuation, pair detection, soft/hard detection
- strategy lookup and fallback behavior
- shoe lifecycle and reshuffle timing
- dealing order
- corrective feedback flow
- blackjack payout behavior
- wager min/max enforcement
- chip stack breakdown
- countdown advance behavior
- prominent outcome rendering

When changing:

- `src/domain/*`: add or update domain tests
- `src/application/*`: add or update application tests
- `src/presentation/*`: add or update presentation tests when the user-visible behavior changes

Use `tests/helpers.ts` for deterministic fixtures rather than duplicating setup code.

---

## Required Verification Before Handoff

Before finishing work, run:

```bash
npx tsc --noEmit
npm test
npm run build
```

If one of these cannot be run, say so explicitly.

Do not claim a rule is enforced unless the code and tests both support that claim.

---

## TypeScript Standards

- Keep `strict` TypeScript compatibility.
- Prefer discriminated unions and explicit domain types over loose objects.
- Prefer narrow interfaces for props and state.
- Do not widen literal unions without a good reason.
- Avoid unsafe assertions when a real type can be modeled instead.

---

## Contributor Checklist

Before submitting changes, confirm:

- The change respects onion architecture
- Domain logic remains framework-agnostic
- No business rules were added to React components
- Shared style values were centralized when appropriate
- UI copy still matches the real rules
- Tests were updated
- Typecheck, tests, and production build pass

If a requested change conflicts with this file, preserve instructional correctness and architectural discipline first.
