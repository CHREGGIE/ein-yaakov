# House standard — ein-yaakov (AGENTS.md-ready; cp to repo root as AGENTS.md to activate)

## What this repo is
Ein Yaakov site: public production Next.js content site (Torah story clips, design system).
Deploys to Vercel from branch `claude/determined-clarke-bi0vun` — NOT main. CI runs on that branch.

## Commands (use these exactly; CI runs the same ones)
- install: npm ci
- types:   npm run typecheck
- build:   npm run build
- lint:    npx oxlint . (advisory until an eslint config lands)
- security: gitleaks (CI security job)

## House rules
- Public production site: no secrets, no client data, no draft content on the deploy branch.
- Every content change must keep the build green — a broken build blocks the deploy branch.
- Design system lives in design/ — match existing tokens; don't introduce new palettes.

## PR format
Title: type(scope): summary — Conventional Commits. Body: what/why/verified (paste command output).

## Review protocol (reviewer agents)
Diff + acceptance criteria + this file. Top 5 findings max, file:line + severity
(blocker/bug/risk/nit). Second pass quotes the proving line. Verdict is advisory;
CI checks are the gate.
