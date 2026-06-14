# ADR 0007 — AI-native admin via a typed command surface + agent gateway

- **Status:** Accepted
- **Date:** 2026-06-14

## Context

LockIn should be administrable by AI agents (e.g. a Hermes-style agent) and operable
through Slack and voice — "not just type but also talk" — without compromising the
Vercel Hobby/Supabase Free guardrails or data privacy for children's data.

## Decision

1. **One command surface.** Every admin capability is a typed, validated **Admin
   Command** (create/edit students, subjects, tracks; create/assign tasks; build/edit
   schedule blocks; set weekly goals; review homework; adjust XP/rewards; create/
   approve plans). The web UI and agents call the *same* commands — no separate "AI
   path."
2. **Agent gateway (MVP).** Publish the commands as an agent-callable interface (MCP
   tools and/or authenticated webhook endpoints) with scoped service credentials.
   Every call is authenticated, authorized to the parent's own data (same
   RLS/ownership as the UI), validated, rate-limited, and written to an
   `AdminCommandLog` audit trail.
3. **Channels deferred (external).** Slack (text) and voice (speech-to-text) are
   external front-ends that translate natural language into Admin Commands via the
   gateway. They are post-MVP modules; heavy NLU/STT runs in the external service,
   never on Vercel. The MVP builds only the command surface + gateway contract + auth.

## Consequences

- Adding Slack or voice later is wiring a connector to an existing contract, not a
  rewrite (satisfies acceptance criteria 37–40).
- All agent input is untrusted: validate and authorize exactly as UI input.
- Keeps MVP free-tier friendly; paid NLU/STT lives outside Vercel.

## Open questions

- Gateway transport: MCP server vs. signed webhooks vs. both (decide in architecture
  phase).
- Which specific agent/runtime ("Hermes" or other) and how its credentials are issued.
- Voice stack (STT provider, push-to-talk vs. wake word) — deferred with the connector.
