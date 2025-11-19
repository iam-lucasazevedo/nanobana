# Quickstart: Prompt Enhancement Feature

**Feature**: AI Prompt Enhancement via n8n Webhook
**Status**: Phase 1 Design - Ready for Implementation
**Time to Read**: 10 minutes

## Overview

This feature adds a prompt enhancement capability to the image editor. Users type a prompt, click "Enhance", and the system sends it to an n8n AI agent that improves the prompt and returns it.

## Architecture

```
┌─────────────────────┐
│  React Frontend     │
│  - Prompt input     │
│  - Enhance button   │
│  - Loading state    │
└──────────┬──────────┘
           │ POST /api/enhance
           │ { "prompt": "..." }
           ▼
┌─────────────────────────────────┐
│  Express.js Backend             │
│  - Validate prompt              │
│  - Check for in-progress req    │
│  - Call n8n webhook             │
│  - Handle errors + timeout      │
└──────────┬──────────────────────┘
           │ POST (webhook URL)
           │ { "prompt": "..." }
           ▼
┌─────────────────────────┐
│  n8n Webhook / AI Agent │
│  - Process prompt       │
│  - Return enhanced text │
└─────────────────────────┘
```

## Component Overview

### Backend: `promptEnhancementService.ts`

**Responsibilities**:
1. Accept prompt from API
2. Validate prompt (non-empty, length ≤10k chars)
3. Call n8n webhook via Axios with 30-second timeout
4. Handle success: return enhanced prompt as plain text
5. Handle errors: catch timeout/network/500 errors and return error message

**Key Methods**:
```typescript
async enhancePrompt(originalPrompt: string): Promise<string>
```

**Error Handling**:
- Validation errors → HTTP 400
- Timeout/network → HTTP 500 with "N8n webhook did not respond within 30 seconds"
- n8n HTTP 500 → HTTP 500 with n8n's error message (passed through)

**Dependencies**:
- Axios (HTTP client) - already in project
- dotenv for webhook URL (from .env)

---

### Backend: `enhanceRoute.ts` (Express endpoint)

**Route**: `POST /api/enhance`

**Handler**:
1. Extract X-Session-ID from header (existing pattern)
2. Extract prompt from JSON body
3. Validate: non-empty, ≤10k chars
4. Prevent duplicate requests: check if enhancement is already in-progress for this session
5. Call `promptEnhancementService.enhancePrompt(prompt)`
6. Return HTTP 200 with plain text response
7. Catch errors → return appropriate HTTP status + error message

**Duplicate Prevention**:
- Use in-memory Map: `Map<sessionId, in-progress-promise>`
- Before calling service: check if key exists
- If exists and still pending: return HTTP 429 "Already enhancing"
- If exists and completed: allow new request
- Clean up Map entry after response

---

### Frontend: `EnhancePromptButton.tsx`

**UI Component**:
- Button labeled "Enhance" or icon-based
- Positioned next to the prompt text input
- States:
  - Disabled: when prompt is empty
  - Normal: when prompt has content
  - Loading: when enhancement is in-progress (show spinner, disable button, change text to "Enhancing...")
  - Error: when enhancement fails (show error toast/message)

**Props**:
- `onPromptEnhanced`: callback when enhancement succeeds (receives enhanced prompt)
- `onError`: callback when enhancement fails (receives error message)
- Prompt text content (or get from parent/context)

**Behavior**:
- onClick: call useEnhancePrompt hook
- Show loading state during request
- On success: call `onPromptEnhanced(enhancedPrompt)` and clear loading state
- On error: call `onError(message)`, show error message for 5-10 seconds, clear loading state

---

### Frontend: `useEnhancePrompt.ts` (Custom Hook)

**Hook Interface**:
```typescript
const {
  enhancedPrompt,
  isLoading,
  error,
  enhance
} = useEnhancePrompt();
```

**Responsibilities**:
1. Manage loading/error state for enhancement request
2. Call `apiClient.enhancePrompt(prompt)`
3. Handle success: update `enhancedPrompt`, clear error
4. Handle error: capture error message, prevent duplicate clicks during loading
5. Auto-clear error after 5 seconds

---

### Frontend: `apiClient.ts` (Update)

**New Method**:
```typescript
async enhancePrompt(prompt: string): Promise<string>
```

**Implementation**:
- POST to `/api/enhance`
- Send: `{ "prompt": prompt }`
- Receive: plain text response
- Handle errors: parse error response as JSON, extract message
- Use existing Axios instance with X-Session-ID interceptor

---

## Integration Checklist

### Backend Setup
- [ ] Create `backend/src/services/promptEnhancementService.ts`
- [ ] Create `backend/src/api/enhanceRoute.ts`
- [ ] Update `backend/src/index.ts` to register route
- [ ] Add n8n webhook URL to `.env`: `N8N_ENHANCEMENT_WEBHOOK_URL=https://webhooks.magosdosconcursos.com.br/webhook/BWMUOvay3JXVPsDi`
- [ ] Add error messages to `backend/src/utils/errorMessages.ts`
- [ ] Create TypeScript types in `backend/src/types/models.ts`

### Frontend Setup
- [ ] Create `frontend/src/hooks/useEnhancePrompt.ts`
- [ ] Create `frontend/src/components/EnhancePromptButton.tsx`
- [ ] Update `frontend/src/services/apiClient.ts` with `enhancePrompt()` method
- [ ] Integrate EnhancePromptButton into prompt input page (CreateMode.tsx)
- [ ] Style button with Tailwind CSS (match existing design)

### Testing
- [ ] Unit tests for promptEnhancementService (mock Axios)
- [ ] Contract tests for /api/enhance endpoint (mock n8n response)
- [ ] Integration tests with actual n8n webhook (staging environment)
- [ ] Frontend component tests for EnhancePromptButton loading/error states
- [ ] E2E test: user types prompt → clicks enhance → sees enhanced prompt

### Configuration
- [ ] Verify N8N_ENHANCEMENT_WEBHOOK_URL is set in .env and .env.production
- [ ] Test timeout value (30 seconds) against actual n8n response times
- [ ] Review error messages for clarity to users

---

## Environment Variables

**Add to `.env` and `.env.production`**:
```bash
# n8n Webhook for prompt enhancement
N8N_ENHANCEMENT_WEBHOOK_URL=https://webhooks.magosdosconcursos.com.br/webhook/BWMUOvay3JXVPsDi

# Optional: override timeout (milliseconds)
N8N_ENHANCEMENT_TIMEOUT_MS=30000
```

---

## Error Messages for Users

| Scenario | Message |
|----------|---------|
| Prompt is empty | "Please enter a prompt to enhance" |
| Enhancement in progress | "Enhancement already in progress..." |
| Timeout (>30s) | "Enhancement took too long. Please try again." |
| Network error | "Unable to reach enhancement service. Check your internet connection." |
| n8n error | Show the error message from n8n (plain text) |
| Service unavailable | "Enhancement service is temporarily unavailable. Please try again later." |

---

## Key Decisions & Constraints

| Decision | Why |
|----------|-----|
| **Synchronous blocking call** | Simpler than polling; 30s timeout is acceptable per spec |
| **Plain text response** | Aligns with user clarification; minimal parsing |
| **No response validation** | Pass-through from n8n; trust the service |
| **In-memory duplicate tracking** | Simple, prevents accidental duplicate requests; single-instance backend |
| **Per-session duplicate prevention** | Different users can enhance simultaneously; same user cannot launch 2nd request until first completes |
| **No database persistence** | Stateless operation; enhancement history not required |

---

## Success Criteria (from Spec)

- **SC-001**: Enhance <5 seconds on typical 50-char prompt (depends on n8n response time)
- **SC-002**: 95% success rate (depends on n8n availability)
- **SC-003**: 85% of users successfully enhance on first try (depends on UX clarity)
- **SC-004**: 4/5 star user satisfaction (depends on n8n enhancement quality)
- **SC-005**: Zero impact on editor responsiveness (async API call, no blocking on UI thread)

---

## Next Steps

1. **Read** `data-model.md` for detailed entity definitions
2. **Review** `contracts/prompt-enhancement-api.openapi.yaml` for API contract
3. **Run** `/speckit.tasks` to generate task list for implementation
4. **Begin** backend implementation following the component overview above
