# Development Protocol

Follow this methodology for every component. No skipping. If a phase surfaces a blocker, **stop and report**.

## Phase 1 — Exploration

- Read `package.json`, `tsconfig.json`, `vite.config.ts`, the existing `src/` tree, and `CLAUDE.md`.
- Confirm every library you plan to call is installed (`pnpm list <pkg>` or equivalent).
- For each external API, open the official docs and confirm endpoint, method, auth header, request shape, and response shape.
- Resolve every entry in the "Verify Before Use" list in `CLAUDE.md`.

**Output:** a written report listing what exists, what is missing, what needs user input, and the resolution of each verification item.

On the first task of a session, **wait for approval before starting Phase 2**.

## Phase 2 — Planning

Produce a written plan covering:

- Files to create or modify (full paths)
- Public types and function signatures
- WebSocket topics involved (read.* and write.*)
- Failure modes considered
- The full test list (named, not yet written)

Mark each decision as **reversible-cheap** or **reversible-expensive**. Get sign-off on the expensive ones before Phase 3.

## Phase 3 — Failing Tests

Tests describe observable behavior, not internal structure. Required coverage for every component:

- Happy path
- Empty state
- Malformed payload (null, undefined, wrong type, empty string, empty array)
- 4xx error
- 5xx error
- Network timeout
- Two concurrent events arriving in the same tick
- Rate-limit boundary at `N` and `N+1`

Run the suite. Confirm tests fail for the **right reason** — an assertion failure, not an import or syntax error.

## Phase 4 — Minimal Implementation

The smallest code that turns the tests green. No extra features. No "while I'm here" refactors. No speculative abstractions.

## Phase 5 — Adversarial Review

Answer each of these in writing before declaring done:

1. If two WebSocket events arrive in the same tick, is ordering deterministic? Is state mutation atomic?
2. What happens on 4xx? On 5xx? On a 200 with malformed JSON? On a socket that opens then closes immediately? On reconnect mid-stream?
3. What if a payload field is `null`, `undefined`, an empty string, an empty array, or the wrong type?
4. Are any `catch` blocks silent? Any unhandled rejections? Any `// TODO: handle error` left behind?
5. Could user input reach `dangerouslySetInnerHTML`, `eval`, a shell command, or a SQL string? If yes, refactor.
6. Are secrets read only from env, never logged, never shipped to the client bundle?
7. **Quorum-specific:** can a decision execute below threshold under any reorder, replay, or duplicate-event scenario?

## Phase 6 — Regression

- Full test suite green
- `tsc --noEmit` clean
- ESLint clean
- No new warnings of any kind

## Phase 7 — Runtime Verification

- Start the dev server
- Confirm the new Room mounts and the WebSocket connects
- Stress-test the rate limiter with a scripted burst at `N+5`; confirm excess messages are dropped *and* surfaced on the counter
- If layout breaks, fix the root cause — do not suppress warnings

## Phase 8 — Documentation

Update `CLAUDE.md` (or the relevant Room-level doc) with:

- Room purpose
- Routes
- WebSocket topics
- Environment variables introduced
- Any non-obvious decisions

Inline comments only where the **why** is non-obvious. Never restate the **what**.
