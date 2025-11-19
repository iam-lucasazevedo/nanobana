# Implementation Plan: AI Prompt Enhancement

**Branch**: `feature/ai-prompt-enhance` | **Date**: 2025-11-15 | **Spec**: `/specs/001-ai-prompt-enhance/spec.md`
**Input**: Feature specification from `/specs/001-ai-prompt-enhance/spec.md`

## Summary

Implement a prompt enhancement feature that allows image editor users to improve their creative prompts using an AI agent via n8n webhook. Users click an "Enhance" button next to the prompt input, the backend calls the n8n webhook endpoint with the prompt, and returns the enhanced prompt. The feature integrates into the existing React frontend and Express.js backend as a simple blocking API call with a 30-second timeout.

**Key Design Decision**: Simple synchronous API endpoint (not polling pattern) to minimize complexity and align with specification requirements.

## Technical Context

**Language/Version**: TypeScript, Node.js 18+
**Primary Dependencies**: Express.js 4.18, Axios (HTTP client for webhook calls)
**Storage**: Supabase PostgreSQL (for request logging/audit trail if needed; enhancement requests are stateless)
**Testing**: Vitest (existing test framework in project)
**Target Platform**: Web (React 18 frontend + Express backend)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: <5 seconds end-to-end for prompt enhancement (from click to response); 95% success rate
**Constraints**: 30-second timeout for n8n webhook calls; no processing of enhanced prompt (pass-through from n8n); prevent duplicate simultaneous requests
**Scale/Scope**: Feature adds one API endpoint + UI component; integrates with existing session-based architecture

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Alignment with Project Constitution

✅ **Simplicity**: Simple blocking API call is simpler than polling pattern; minimal abstraction
✅ **Integration Testing**: Will require contract tests for n8n webhook integration; existing patterns (Axios, session handling) documented
✅ **Versioning & Breaking Changes**: No new database schemas; backward-compatible API addition (new endpoint only)

**No violations detected.** All three core principles align with the design approach.

## Project Structure

### Documentation (this feature)

```text
specs/feature/ai-prompt-enhance/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output (none needed - no unknowns)
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── prompt-enhancement-api.openapi.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (Web Application)

**Backend Changes** (Express.js):
```text
backend/src/
├── api/
│   └── enhanceRoute.ts          # NEW: POST /api/enhance endpoint
├── services/
│   └── promptEnhancementService.ts  # NEW: n8n webhook integration logic
├── utils/
│   └── errorMessages.ts         # ADD: Enhancement-specific error messages
└── types/
    └── models.ts                # UPDATE: Add EnhancementRequest type
```

**Frontend Changes** (React):
```text
frontend/src/
├── components/
│   └── EnhancePromptButton.tsx  # NEW: Button + loading state UI component
├── hooks/
│   └── useEnhancePrompt.ts      # NEW: Hook to manage enhancement API calls
└── services/
    └── apiClient.ts             # UPDATE: Add enhancePrompt() method
```

**Structure Decision**: Follows existing web application structure. Enhancement is a new backend endpoint + new frontend component/hook. No database schema changes; stateless operation. Aligns with session-based architecture (existing session header flow).

---

## Phase 0: Research

**Status**: ✅ Complete - No unknowns detected

No research artifacts needed. All technical decisions clarified in planning questionnaire:
- Backend framework: Express.js (confirmed)
- Frontend framework: React (confirmed)
- API pattern: Simple blocking call (user preference)
- Response validation: Pass-through, no sanitization (user preference)
- Timeout: 30 seconds (user confirmed)
- No new database requirements
- Constitution alignment: All three principles satisfied

---

## Phase 1: Design & Contracts

**Status**: ✅ Complete

### Artifacts Generated

1. **data-model.md**
   - Enhancement Request entity (runtime, no persistence)
   - Enhanced Prompt response entity
   - API contracts (request/response/error)
   - State diagram
   - Type definitions
   - Validation rules
   - Integration point with n8n webhook

2. **contracts/prompt-enhancement-api.openapi.yaml**
   - OpenAPI 3.0.0 specification
   - POST /api/enhance endpoint
   - Request/response schemas
   - Error handling (400, 401, 500, 503)
   - Plain text response format
   - Header requirements (X-Session-ID)

3. **quickstart.md**
   - Architecture overview
   - Component responsibilities
   - Frontend: EnhancePromptButton.tsx + useEnhancePrompt.ts
   - Backend: promptEnhancementService.ts + enhanceRoute.ts
   - Integration checklist
   - Environment variables
   - Error messages for users
   - Success criteria mapping
   - Key decisions & constraints

### Design Decisions Locked

| Decision | Rationale |
|----------|-----------|
| Synchronous API (no polling) | Simpler implementation; 30s timeout acceptable |
| Plain text response | Per user clarification; minimal parsing required |
| No response validation | Pass-through from n8n webhook |
| In-memory duplicate tracking | Simple, prevents accidental double-requests |
| Per-session duplicate prevention | Allow concurrent users, prevent self-conflicts |
| No database changes | Stateless operation; enhancement history not required |
| HTTP 500 from n8n passthrough | Direct error reporting to users |

### Constitution Re-check (Post-Design)

✅ **Simplicity**: Design is minimal - one endpoint + one UI component. No layers of abstraction added.
✅ **Integration Testing**: Contract tests required for n8n webhook integration; documented in quickstart.
✅ **Versioning**: New endpoint only; fully backward-compatible. No breaking changes.

**All constraints satisfied. Ready for task generation.**

---

## Next Steps

Execute `/speckit.tasks` to generate actionable task list for implementation phase.
