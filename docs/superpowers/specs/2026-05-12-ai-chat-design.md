# AI Chat: "Ask the data" — Design Spec

**Date:** 2026-05-12
**Author:** Rick (with Claude)
**Status:** Approved-pending-review

## Summary

Add a dedicated `/chat` page to Rick & Share-ah where either partner can have a private conversation with an AI assistant (Gemini 3.1 Pro) about their group's expense data. The assistant answers questions like "how much did we spend on groceries in March?" or "who's been paying more for transport lately?" by reading the group's full dataset each turn.

This is the first AI-driven analysis surface in the app. The existing Statistics page provides static aggregations; this provides ad-hoc, conversational analysis.

## Goals

- Let users ask natural-language questions about their group's spending and get accurate answers grounded in real data.
- Persist private conversation history per user so threads can be picked up later.
- Stay inside the existing AWS Amplify stack — no new infrastructure beyond one Lambda and one DynamoDB table.
- Keep cost observable but unrestricted (monitoring only, no hard limits).

## Non-Goals

- General financial advice not derivable from the data.
- Shared chat between partners (explicitly per-user private).
- Streaming responses (deferred — request/response only for v1).
- Hard rate limiting (deferred — CloudWatch monitoring only).
- Tool/function calling (deferred — full-dataset injection is sufficient at this scale).
- A chatbot in any surface other than `/chat` (no floating button, no dashboard widget).

## User-Facing Behavior

### Navigation
- New `/chat` route, gated by `<ProtectedRoute>` and `<RequireCouple>`.
- New "Chat" item in the bottom navigation, between Statistics and Settings. Icon: 💬.

### Chat page UX
- Loads the user's persisted thread on mount, oldest at top, newest at bottom.
- User bubbles right-aligned; assistant bubbles left-aligned. Brutalist styling consistent with `card-brutal` / `input-brutal`.
- Sticky input bar at the bottom with text input + send button.
- "Thinking…" indicator displayed while a mutation is in flight.
- Empty state shows three example prompts as tap-to-send chips:
  - "How much did we spend on food this month?"
  - "Who's ahead on transport?"
  - "What was our biggest expense?"
- One-time dismissible banner on first visit: privacy disclosure (data sent to Google's Gemini API, not used to train models per Google API terms). Dismissal stored in `localStorage`.

### Errors
- Gemini failure → assistant bubble: "⚠️ Couldn't reach the AI right now. Tap to retry." Retry resends the same user message.
- Network failure → user bubble shows "⚠️ Send failed" with retry tap.
- Auth mismatch → generic error toast (should not occur for legitimate users).

### Settings disclosure
- New "AI chat" section in Settings with the same privacy note as the first-visit banner.

## Architecture

```
[/chat page]
   │ sendChatMessage(groupId, content) mutation
   ▼
[AppSync]
   │ invoke
   ▼
[aiChat Lambda]
   ├─► verify caller is a member of groupId (DynamoDB Group read)
   ├─► fetch full expenses + settlements for groupId (paginated GSI scan)
   ├─► fetch caller's last 20 ChatMessage rows for groupId
   ├─► build system prompt with conventions + data + history
   ├─► POST to Google AI Studio: gemini-3.1-pro:generateContent
   ├─► persist user message and assistant reply to ChatMessage table
   ├─► emit structured CloudWatch log: { userId, groupId, inputTokens, outputTokens, latencyMs }
   └─► return assistant ChatMessage to client
```

### Provider integration
- **Google AI Studio REST API** (`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro:generateContent`). Chosen over Vertex AI because no GCP project setup is required.
- API key stored as `GEMINI_API_KEY` in Lambda environment, provisioned via Amplify secrets.
- Lambda timeout: 30s. HTTP request timeout to Gemini: 25s.

### Auth
- Existing Cognito identity flows through AppSync. The Lambda re-verifies the caller is a member of the requested `groupId` before reading any data.

## Data Model

### GraphQL schema additions

```graphql
type ChatMessage @model
  @auth(rules: [{ allow: owner, ownerField: "userId" }]) {
  id: ID!
  userId: String! @index(name: "byUserAndGroup", queryField: "chatMessagesByUserAndGroup", sortKeyFields: ["groupId", "createdAt"])
  groupId: ID!
  role: String!         # "user" | "assistant"
  content: String!
  createdAt: AWSDateTime!
}

type Mutation {
  sendChatMessage(groupId: ID!, content: String!): ChatMessage
    @function(name: "aiChat-${env}")
    @auth(rules: [{ allow: private }])
}
```

- Owner-based auth (`userId` as owner field) makes threads strictly private to the creating user.
- Composite GSI `byUserAndGroup` enables efficient per-user, per-group, time-ordered reads. The generated query `chatMessagesByUserAndGroup(userId, groupId, sortDirection: DESC, limit)` is what the frontend uses to load the thread.
- `groupId` recorded on every message so if a user switches groups, the thread can be filtered or reset.

### Fields explicitly excluded
- No `tokens` or `cost` fields per the "monitor only" decision — usage data goes to CloudWatch instead.

## Lambda: `aiChat`

**Path:** `amplify/backend/function/aiChat/src/index.js`
**Modeled after:** `amplify/backend/function/processReceipt/src/index.js`

### Request flow

1. **Authorize**: read Group record by `groupId`; verify `event.identity.sub` appears in its members. Reject with GraphQL error if not.
2. **Load group data**: fetch all Expenses and Settlements for the group via DynamoDB GSI on `groupId`, paginating fully. Also load Group + Members for names.
3. **Load thread context**: fetch the caller's most recent 20 `ChatMessage` rows for this `groupId`, sorted ascending by `createdAt`.
4. **Build system prompt**: see "System Prompt" section below.
5. **Call Gemini**: POST with `x-goog-api-key` header. Body shape: `{ systemInstruction, contents: [{role, parts:[{text}]}, ...] }`.
6. **Persist both messages**: write the user message row first, then the assistant row. On Gemini failure, still write the user row and return an assistant error row marked accordingly.
7. **Log usage**: emit a single structured JSON line per call: `{ userId, groupId, inputTokens, outputTokens, latencyMs, model, status }`.
8. **Return** the assistant `ChatMessage` to AppSync.

### Failure modes
- Gemini 429/5xx → assistant bubble with retry message; user message persisted; CloudWatch log `status: "gemini_error"`.
- Lambda timeout → AppSync surfaces error; no message persisted; client shows retry UI.
- Auth mismatch → GraphQL `Unauthorized` error; no DB writes.
- DynamoDB read partial failure → error returned; no AI call made (avoid charging for incomplete context).

## System Prompt

The Lambda assembles a single system instruction string each turn. Template:

```
You are an analyst built into Rick & Share-ah, an expense-splitting app for couples.
You help <USER_NAME> understand their group's spending. Answer ONLY using the data
below — never invent expenses. If the data doesn't contain the answer, say so.

CRITICAL CONVENTIONS:
- All amounts are integers in CENTS. $12.34 is stored as 1234.
- When showing money to the user, format as "$12.34" (divide by 100).
- "paidBy" is a userId; resolve it to a name using the members list.
- splitType is one of: equal, percentage, exact.
- Each Expense may have a "shares" JSON field mapping userId → share value (the
  authoritative split). Legacy "partner1Share" / "partner2Share" fields may also
  exist on older rows — prefer "shares" when both are present.
- A positive group balance means later partners owe earlier ones; settlements reduce that.
- Today's date is <ISO_DATE>.

GROUP: <group name>
MEMBERS: [{userId, name}, ...]
EXPENSES: [{id, description, amount, paidBy, splitType, shares,
            partner1Share, partner2Share, category, date, note}, ...]
SETTLEMENTS: [{amount, paidBy, paidTo, date}, ...]

When asked for totals or breakdowns, compute them from the data. Show your work
briefly (e.g. "March food = $X across 12 expenses"). Keep replies concise —
the user is on mobile.
```

The persisted thread (last 20 messages) is appended as alternating `user` / `model` turns after the system instruction.

### Design intent
- **Cents-awareness called out explicitly** — prevents "$1234.00" hallucinations on amounts stored in cents.
- **Data-grounded only** — discourages out-of-data financial advice.
- **Mobile-brevity** — replies optimized for small screens.

## Frontend

### Files added
- `src/pages/Chat.tsx` — page shell, thread fetch, send orchestration.
- `src/components/chat/ChatMessage.tsx` — single message bubble.
- `src/components/chat/ChatInput.tsx` — input + send button + "thinking" state.
- `src/components/chat/EmptyChat.tsx` — empty-state example prompts.
- `src/hooks/useChat.ts` — local thread state, `sendMessage()` with optimistic append and error rollback.

### Files modified
- `src/App.tsx` — add `/chat` route, guarded by `ProtectedRoute` + `RequireCouple` + `Layout`.
- `src/components/layout/Layout.tsx` — add "Chat" nav entry between Statistics and Settings.
- `src/pages/Settings.tsx` — add "AI chat" privacy disclosure section.
- `src/graphql/mutations.js` (regenerated after `amplify push`) — new `sendChatMessage` mutation.
- `src/graphql/queries.js` (regenerated) — generated `chatMessagesByUserAndGroup` query (from the `byUserAndGroup` GSI) used to load the thread.

### State management
- No new global context. `useChat` is page-scoped. Group and member metadata come from existing `useApp()`.

## Testing (manual)

No formal test suite in this repo. Manual smoke checklist:

1. **Happy path**: send a question, receive a sensible answer that quotes real data.
2. **Cents formatting**: ask "what was our biggest expense" — verify amount is shown as dollars (e.g. `$184.50`), not cents (`18450`).
3. **Empty data**: new group with zero expenses — assistant cleanly states there's nothing yet, does not fabricate.
4. **Long thread**: 25+ messages — verify the 20-message history window doesn't break coherence; older messages drop out without error.
5. **Failure path**: invalid `GEMINI_API_KEY` — verify the "Couldn't reach the AI" bubble appears and the user message is persisted.
6. **Cross-user isolation**: sign in as partner B, confirm partner A's chat thread is invisible.
7. **Privacy banner**: first visit shows banner; dismissal persists across reloads.

## Decisions Locked In

| Decision | Choice | Rationale |
|---|---|---|
| Feature flavor | Chat / Q&A | User chose over narrative/anomaly/parsing options. |
| Location | Dedicated `/chat` page in bottom nav | Maximum prominence; user chose over drawer/widget/tab. |
| Provider | Gemini 3.1 Pro via Google AI Studio | User specified. |
| Data access | Full dataset injected each turn | Couple-scale data is small; tool calling is overkill. |
| Persistence | Private per-user thread in DynamoDB | User chose privacy over shared collaboration. |
| Cost control | CloudWatch monitoring only, no hard limits | User chose; revisit if costs surprise. |
| Streaming | None for v1 | Avoids AppSync subscription complexity; revisit post-launch. |
| Tool calling | Deferred | YAGNI at current data scale. |

## Out of Scope / Future Work

- Streaming responses (would require AppSync subscriptions or Lambda function URLs with response streaming).
- Tool/function calling (would let the AI scale to much larger datasets).
- Shared group threads (explicit non-goal but a future toggle).
- Hard or token-based rate limits (data needed first).
- Suggested follow-up questions or auto-generated daily summaries.
- Export chat history.

## Parallelization Notes for Implementation

The work splits cleanly into four streams that can run mostly in parallel:

1. **Backend schema + Lambda** — schema.graphql changes, `aiChat` Lambda, Amplify env wiring, Gemini API key provisioning. Must finish before stream 3 can integration-test, but stream 2 and 4 can run independently.
2. **Frontend components** — `ChatMessage`, `ChatInput`, `EmptyChat`, `useChat` hook. Pure UI, mockable; can develop against a stub mutation.
3. **Frontend integration** — `Chat.tsx` page, route wiring, `Layout.tsx` nav entry. Depends on stream 1 for the real mutation but can prototype against stream 2 with a stub.
4. **Settings disclosure + privacy banner** — small additive UI work; independent of streams 1–3.

Suitable for `subagent-driven-development` after the implementation plan is written.
