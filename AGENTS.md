# AGENTS.md

Guidance for any AI agent (Claude Code or otherwise) working in this repo. This is a
short pointer; the authoritative rules are in [CLAUDE.md](CLAUDE.md).

- Read [CLAUDE.md](CLAUDE.md) and [docs/specs/approved-prd.md](docs/specs/approved-prd.md)
  before acting.
- Do not write app code before a reviewed plan exists.
- Stay within your assigned files when working in parallel (use git worktrees).
- Never touch auth, storage, or RLS without explicit human approval (CODEOWNERS-protected).
- Put planning drafts in `docs/ai-drafts/`; promote to `docs/specs/` only after review.
- Disclose AI authorship via PR labels and commit trailers — see
  [AI_DISCLOSURE.md](AI_DISCLOSURE.md).
- Organize code by architecture, never by human-vs-AI author.

Defined roles live in [.claude/agents/](.claude/agents/).
