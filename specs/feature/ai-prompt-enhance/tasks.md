# Tasks: AI Prompt Enhancement Implementation

**Feature**: Prompt Enhancement Integration with n8n Webhook
**Branch**: `feature/ai-prompt-enhance`
**Created**: 2025-11-15
**Status**: Phase 2 - Implementation Ready

---

## Implementation Strategy

**MVP Scope**: User Stories 1 & 3 (core enhancement + loading feedback)
- Implement basic "Enhance" button with loading state
- Backend calls n8n webhook synchronously
- Frontend displays enhanced prompt
- **Estimated**: 3-4 hours for experienced developer

**Phase 2 Addition**: User Story 2 (error handling)
- Add error messages and retry capability
- Comprehensive error scenarios
- **Estimated**: 2-3 hours

**Parallel Opportunities**:
- Backend service implementation (T003-T006) can proceed independently of frontend (T007-T010)
- Environment setup (T001-T002) must complete first
- All PR/testing tasks (T011+) can be parallelized after implementation phases

---

## Phase 1: Setup & Configuration

### Project initialization and environment setup

- [ ] T001 Add n8n webhook URL and timeout configuration to `.env` file at `backend/.env` with `N8N_ENHANCEMENT_WEBHOOK_URL` and `N8N_ENHANCEMENT_TIMEOUT_MS` variables

- [ ] T002 Create `backend/src/types/models.ts` file with TypeScript types for `EnhancementRequest`, `EnhancementResponse`, and `EnhancementError` interfaces

---

## Phase 2: Foundational Backend Infrastructure

### Core service layer and error handling setup (blocking for all stories)

- [ ] T003 [P] Add enhancement-specific error messages to `backend/src/utils/errorMessages.ts` including "Prompt is empty", "Prompt too long", "Enhancement timeout", "Enhancement service unavailable", and "Network error" messages

- [ ] T004 Create `backend/src/services/promptEnhancementService.ts` with `enhancePrompt(originalPrompt: string): Promise<string>` method that calls the n8n webhook with timeout handling, error catching, and plain text response extraction

- [ ] T005 [P] Create `backend/src/api/enhanceRoute.ts` with Express POST route handler for `/api/enhance` that validates request, manages in-memory duplicate prevention using `Map<sessionId, Promise>`, calls `promptEnhancementService`, and returns appropriate HTTP status codes (200/400/429/500)

- [ ] T006 Update `backend/src/index.ts` to register the new `enhanceRoute` middleware at `/api` prefix

---

## Phase 3: User Story 1 - User Enhances Prompt with AI (Priority: P1)

### Core enhancement flow with basic UI

**Goal**: Enable users to click "Enhance" button and receive AI-improved prompts

**Independent Test**: Enter a prompt → Click Enhance → See improved prompt displayed in text field

**Acceptance Criteria**:
- Enhance button appears next to prompt input
- Button is disabled when prompt is empty
- Button shows loading state during enhancement
- Enhanced prompt replaces original after success
- User can immediately use enhanced prompt

---

- [ ] T007 [P] [US1] Create `frontend/src/hooks/useEnhancePrompt.ts` custom React hook managing `isLoading`, `error`, and `enhance(prompt)` state with 30-second timeout handling and auto-clearing of errors after 5 seconds

- [ ] T008 [P] [US1] Create `frontend/src/components/EnhancePromptButton.tsx` React component with:
  - Disabled state when prompt is empty
  - Loading spinner/text ("Enhancing...") during request
  - Error message display on failure
  - Styled with Tailwind CSS matching project design
  - Props: `prompt`, `onPromptEnhanced`, `onError`

- [ ] T009 [US1] Update `frontend/src/services/apiClient.ts` to add `enhancePrompt(prompt: string): Promise<string>` method using existing Axios instance and X-Session-ID interceptor

- [ ] T010 [US1] Integrate `EnhancePromptButton` component into `frontend/src/pages/CreateMode.tsx` next to the prompt input field with proper callback handlers

---

## Phase 4: User Story 2 - Error Handling (Priority: P2)

### Graceful error recovery and user feedback

**Goal**: Provide clear feedback on enhancement failures and allow retry

**Independent Test**: Trigger error scenarios → See error message → Click retry → Enhancement succeeds

**Acceptance Criteria**:
- Clear error messages for different failure scenarios
- Original prompt preserved on error
- User can retry without losing work
- Error message dismissible

---

- [ ] T011 [P] [US2] Add error message display and auto-dismiss (5-10 second timeout) to `EnhancePromptButton.tsx` using toast/notification component from existing project patterns

- [ ] T012 [US2] Update `frontend/src/services/apiClient.ts` to properly parse and return error messages from backend HTTP 400/500 responses

- [ ] T013 [US2] Add error-specific handling in `useEnhancePrompt.ts` for distinct messages: "Prompt is empty", "Enhancement timeout", "Unable to reach service", "Service unavailable", or raw n8n error text

---

## Phase 5: User Story 3 - Visual Feedback During Enhancement (Priority: P2)

### Loading state indicators already implemented in Phase 3

**Goal**: Show user that system is processing

**Independent Test**: Click Enhance → Observe loading indicator → Verify indicator disappears when done

**Acceptance Criteria**:
- Loading spinner visible during enhancement
- Button text changes to "Enhancing..."
- Button is disabled during loading
- All indicators cleared on completion

---

- [ ] T014 [US3] Verify loading state implementation in `EnhancePromptButton.tsx` displays spinner and "Enhancing..." text (already covered by T008, this is acceptance test)

- [ ] T015 [US3] Test that loading state persists for entire duration of backend request and clears immediately on response (success or error)

---

## Phase 6: Integration & Contract Testing

### API contract validation and integration testing

- [ ] T016 [P] Create `backend/tests/contract/enhanceRoute.test.ts` contract tests for POST `/api/enhance` endpoint validating:
  - HTTP 200 success response with plain text enhanced prompt
  - HTTP 400 on empty prompt validation failure
  - HTTP 429 on duplicate in-progress request
  - HTTP 500 on n8n webhook timeout
  - HTTP 500 on network error

- [ ] T017 [P] Create `backend/tests/unit/promptEnhancementService.test.ts` unit tests with mocked Axios calls validating:
  - Successful webhook call and response extraction
  - Timeout error handling at 30 seconds
  - Network error handling
  - Error message pass-through from n8n HTTP 500

- [ ] T018 [P] Create `frontend/tests/hooks/useEnhancePrompt.test.ts` tests validating:
  - Hook state management (loading, error, success)
  - API call invocation with correct parameters
  - Error state auto-clear after 5 seconds
  - Multiple sequential enhancement calls

- [ ] T019 [P] Create `frontend/tests/components/EnhancePromptButton.test.tsx` component tests validating:
  - Button disabled when prompt empty
  - Button enabled when prompt has content
  - Loading state display during request
  - Error message display on failure
  - Callback invocations on success and error

---

## Phase 7: End-to-End Testing

### Full user journey validation

- [ ] T020 Create E2E test in `tests/e2e/enhancePrompt.spec.ts` validating complete user flow:
  1. User navigates to Create mode
  2. User types a prompt
  3. User clicks "Enhance" button
  4. Loading state appears
  5. Enhanced prompt received and displayed in text field
  6. User can immediately generate images with enhanced prompt

- [ ] T021 Manual testing checklist covering:
  - [ ] Enhance with 50-char prompt completes in <5 seconds
  - [ ] Enhance with max 10k-char prompt succeeds
  - [ ] Empty prompt prevent enhancement
  - [ ] Clicking enhance twice rapidly shows "already enhancing" message
  - [ ] Timeout after 30 seconds shows appropriate error
  - [ ] Network failure shows appropriate error
  - [ ] User can retry after error
  - [ ] Enhanced prompt can be manually edited
  - [ ] UI remains responsive during enhancement

---

## Phase 8: Documentation & Polish

### Final documentation and code cleanup

- [ ] T022 [P] Add JSDoc comments to `promptEnhancementService.ts` documenting:
  - Method signatures and parameters
  - Error handling behavior
  - n8n webhook contract
  - Timeout mechanism

- [ ] T023 [P] Add JSDoc comments to `enhanceRoute.ts` documenting:
  - Endpoint purpose
  - Request/response formats
  - HTTP status codes
  - Duplicate prevention logic

- [ ] T024 [P] Add inline comments to `useEnhancePrompt.ts` hook explaining:
  - State management flow
  - Error auto-clear mechanism
  - Duplicate request prevention
  - Timeout handling

- [ ] T025 [P] Add inline comments to `EnhancePromptButton.tsx` explaining:
  - Component props and callbacks
  - Loading/error state transitions
  - Styling and accessibility

- [ ] T026 Add `.env.example` entry documenting new configuration variables: `N8N_ENHANCEMENT_WEBHOOK_URL` and `N8N_ENHANCEMENT_TIMEOUT_MS` with descriptions

- [ ] T027 Update project README at repository root to document:
  - New Enhance button feature location (CreateMode)
  - Environment variables required
  - How to test the feature locally

---

## Phase 9: Code Review & Deployment Preparation

### Final validation before merge

- [ ] T028 [P] Run `npm run lint` across both `backend/src` and `frontend/src` for new files, fix any issues

- [ ] T029 [P] Run `npm run build` to verify TypeScript compilation succeeds with no errors

- [ ] T030 [P] Run `npm test` to verify all new tests pass with >80% coverage on new code

- [ ] T031 Verify all `.env` variables are documented in `.env.example`

- [ ] T032 Create git commit with all implementation changes with message summarizing feature (see git guide)

---

## Task Summary

**Total Tasks**: 32 (26 implementation + 6 setup/documentation)
**Estimated Time**: 6-8 hours for experienced developer (can be parallelized)

### By User Story
- **US1 (P1 - Core Enhancement)**: T001, T002, T003, T004, T005, T006, T007, T008, T009, T010 = 10 tasks
- **US2 (P2 - Error Handling)**: T011, T012, T013 = 3 tasks
- **US3 (P2 - Loading Feedback)**: T014, T015 = 2 tasks (covered by US1)
- **Testing/QA**: T016, T017, T018, T019, T020, T021 = 6 tasks
- **Documentation/Polish**: T022-T027 = 6 tasks
- **Review/Deploy**: T028-T032 = 5 tasks

### Parallel Execution Plan

**Wave 1** (Sequential - must complete first):
```
T001 → T002 → T003
(Setup environment and types - 30 min)
```

**Wave 2** (Can start after Wave 1, runs in parallel):
```
Backend Track:
T004 (service) → T005 (route) → T006 (register)
(2 hours)

Frontend Track:
T007 (hook) → T008 (component) → T009 (api client) → T010 (integrate)
(1.5 hours)

These run in parallel!
```

**Wave 3** (Sequential per story):
```
T011 → T012 → T013 (Error handling - 1 hour)
T014 → T015 (Loading states - already done, just verify)
```

**Wave 4** (Can parallelize):
```
T016, T017, T018, T019 (Tests - 1.5 hours, parallel)
```

**Wave 5** (Sequential):
```
T020 (E2E) → T021 (Manual testing)
(1 hour)
```

**Wave 6** (Parallelize):
```
T022-T027 (Docs) in parallel
(1 hour)
```

**Wave 7** (Parallelize):
```
T028-T030 (Lint/build/test) in parallel
(30 min)
```

### Critical Path

**Minimum time with full parallelization**: ~4 hours
1. T001-T003 (30 min)
2. T004-T010 in parallel (2 hours)
3. T011-T015 (1 hour)
4. T016-T019 in parallel (1.5 hours)
5. T020-T021 (1 hour)
6. T022-T030 in parallel (1.5 hours)

---

## Success Criteria Mapping

| Spec SC-001 | SC-002 | SC-003 | SC-004 | SC-005 |
|-------------|--------|--------|--------|--------|
| **Task Coverage** | T004, T009 | T004, T017, T020 | T008, T010 | n8n dependent | T004, T009, T015 |
| **Description** | <5s response time | 95% success rate | 85% first-try success | n8n quality | Zero UI blocking |
| **Validated By** | T021 (manual) | T021 (manual) | T020 (E2E) | User feedback | T015, T021 |

---

## Next Steps

1. **Start with Phase 1** (T001-T002): ~15 minutes
2. **Proceed to Phase 2** (T003-T006): ~1.5 hours (foundational)
3. **Run Waves 2-4 in parallel**: Backend + Frontend simultaneously
4. **Complete testing and documentation**: Final validation
5. **Run final checks**: Lint, build, test, commit

Execute this plan by running tasks in order within each phase, or leverage parallel wave structure for faster completion.
