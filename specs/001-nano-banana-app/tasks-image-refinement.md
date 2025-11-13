# Implementation Tasks: Image Click-to-Edit Refinement Feature

**Feature**: Quick Image Refinement from Generated Results (User Story 4)
**Branch**: `001-nano-banana-app`
**Date**: 2025-11-13
**Status**: Ready for Implementation
**Spec Reference**: [spec.md](spec.md) - User Story 4
**Design Reference**: [data-model.md](data-model.md), [contracts/api.md](contracts/api.md)

---

## Overview

This task list implements **User Story 4: Quick Image Refinement from Generated Results**, enabling users to click on generated images and either download them or refine them with new edit prompts. This feature accelerates creative workflows by reducing friction in iterating on promising results.

### Deliverables

- ✅ Image detail modal/popover component (click-triggered)
- ✅ "Download" and "Edit this image" action buttons
- ✅ Image refinement form (enter refinement prompt + options)
- ✅ Integration with existing edit endpoint
- ✅ Image download functionality from modal
- ✅ State management for selected image and modal visibility
- ✅ Error handling for refinement requests

### Dependencies

- Existing: `/api/generate` endpoint (generates base images)
- Existing: `/api/edit` endpoint (processes edit requests)
- Existing: Session management and user preferences
- New: Modal/popover UI component
- New: Image refinement form component

### Success Criteria

- Users can click any generated image and see modal with options
- "Download" option downloads the image directly from the modal
- "Edit this image" option opens refinement form
- Refinement prompt is sent to `/api/edit` endpoint with the selected image
- Edited results display inline or replace the original in modal
- All interactions provide feedback (loading states, error messages)

---

## Phase 1: Setup & Infrastructure

**Goal**: Prepare the codebase for image refinement feature development

### Data Model Updates (if needed)

- [ ] T001 Review current GeneratedImage data structure in `frontend/src/types/models.ts` and `backend/src/types/models.ts` to ensure it supports image refinement metadata

**Context**: The GeneratedImage entity needs to carry enough context (original request ID, image blob/URL) to be sent to the edit endpoint for refinement.

---

## Phase 2: Frontend - Image Detail Modal Component

**Goal**: Create clickable images with modal showing download and edit options

**Independent Test Criteria**:
- Click on a generated image displays a modal
- Modal shows "Download" and "Edit this image" buttons
- Modal can be closed with X button or outside click
- Modal displays image preview and dimensions

### Component Development

- [ ] T002 [P] Create ImageDetailModal component in `frontend/src/components/ImageDetailModal.tsx` with:
  - Image preview display
  - Image metadata (width, height, creation time)
  - "Download" button with download functionality
  - "Edit this image" button (toggles refinement form)
  - Close button and backdrop dismissal

- [ ] T003 [P] Create ImageRefinementForm component in `frontend/src/components/ImageRefinementForm.tsx` with:
  - Text input for refinement prompt (required, 1-1000 chars)
  - Style selector (matching generation form options)
  - Aspect ratio selector (optional)
  - Submit and cancel buttons
  - Input validation and error display

- [ ] T004 [P] Create ImageDownloader utility function in `frontend/src/utils/imageDownloader.ts` that:
  - Accepts image URL or blob
  - Generates appropriate filename (with timestamp and prompt snippet)
  - Triggers browser download with `<a>` tag or fetch blob
  - Handles errors (network, unsupported formats)

### State Management

- [ ] T005 Create custom hook `useImageModal` in `frontend/src/hooks/useImageModal.ts` to manage:
  - Modal visibility state
  - Currently selected image (with full context: URL, dimensions, source request)
  - Refinement form visibility state
  - Loading state during refinement request

- [ ] T006 Update `frontend/src/pages/CreateMode.tsx` (or equivalent) to:
  - Wrap generated images in clickable containers
  - Pass image data and context to modal hook
  - Render ImageDetailModal conditionally
  - Handle image click event with proper image context

### Integration with Existing Components

- [ ] T007 Update generated image grid/gallery in `frontend/src/components/GeneratedImageGallery.tsx` to:
  - Add click handlers to image elements
  - Pass image metadata to modal hook
  - Display visual feedback (cursor pointer, hover effect)

---

## Phase 3: Frontend - Download Functionality

**Goal**: Enable direct image downloads from the modal

**Independent Test Criteria**:
- Clicking "Download" in modal downloads image to user's device
- Downloaded filename includes timestamp and prompt reference
- Download works for both base64 and URL-based images

### Implementation

- [ ] T008 Implement image download logic in ImageDetailModal component:
  - Call ImageDownloader utility when "Download" is clicked
  - Handle success (show brief confirmation, close modal after delay)
  - Handle errors (display error message to user)
  - Support both data URIs and HTTP URLs

- [ ] T009 [P] Add download state management to `useImageModal` hook:
  - `isDownloading` state (shows loading indicator)
  - `downloadError` state (displays error message)
  - Reset states after successful/failed download

---

## Phase 4: Frontend - Image Refinement Flow

**Goal**: Implement refinement prompt entry and API integration

**Independent Test Criteria**:
- User can enter refinement prompt in form
- Form validation prevents submission with empty prompt
- Submit button shows loading state during request
- Refinement request is sent to backend with selected image and new prompt
- Results display after API responds

### Implementation

- [ ] T010 Update `useImageModal` hook to handle refinement workflow:
  - Add `refinementFormVisible` state
  - Add `refinementLoading` state
  - Add `refinementError` state
  - Add `refinementResults` state

- [ ] T011 Integrate ImageRefinementForm with API client in `frontend/src/services/apiClient.ts`:
  - Create `editImageForRefinement(image, refinementPrompt, options)` method
  - Convert selected image to blob or formData for `/api/edit` endpoint
  - Handle response and update `refinementResults` state
  - Display loading indicator while request processes

- [ ] T012 Update ImageDetailModal to show refinement form when "Edit this image" clicked:
  - Toggle between image view and refinement form
  - Pass selected image and settings to form
  - Handle form submission via API client
  - Display results inline or in new modal section

- [ ] T013 [P] Add error handling for refinement requests:
  - Catch and display API errors to user
  - Validate refinement prompt before submission (1-1000 chars)
  - Show appropriate error messages (API errors, validation errors, network errors)

---

## Phase 5: Backend - Edit Endpoint Enhancement (if needed)

**Goal**: Ensure `/api/edit` endpoint supports receiving base64 image data from frontend

**Independent Test Criteria**:
- Backend can accept image data as multipart/form-data with base64-encoded image
- Backend validates and processes image data same as uploaded files
- Response format matches existing edit endpoint contract

### Implementation

- [ ] T014 Review current `/api/edit` endpoint in `backend/src/api/editRoute.ts`:
  - Verify multipart/form-data handling supports base64-encoded images
  - If needed, add middleware to convert base64 to Buffer before processing
  - Ensure file validation works for base64 images

- [ ] T015 [P] Update API contract documentation in `specs/001-nano-banana-app/contracts/api.md`:
  - Document support for base64-encoded image data in `/api/edit` request
  - Add example request showing image refinement workflow
  - Note differences from standard multi-image upload (single image + refinement prompt)

---

## Phase 6: Frontend - Results Display & State Management

**Goal**: Display refinement results and integrate with session history

**Independent Test Criteria**:
- Refinement results display in modal or new section
- User can download refined images from results
- Refined images are added to edit history in session
- Modal can be closed to return to main gallery

### Implementation

- [ ] T016 Create RefinementResults component in `frontend/src/components/RefinementResults.tsx`:
  - Display refined images from refinement API response
  - Show image metadata (dimensions, timestamps)
  - Provide download and share options for each refined image
  - Include "Try Again" button to modify refinement prompt

- [ ] T017 Update `useImageModal` hook to integrate with session service:
  - After successful refinement, update session's edit history
  - Track refinement as an EditRequest in user preferences
  - Save refinement settings as preferred options for future edits

- [ ] T018 [P] Add refinement state to React context/provider (if using centralized state):
  - Track currently selected image for refinement
  - Maintain refinement history within session
  - Enable cross-component access to refinement state

---

## Phase 7: Integration & UI Polish

**Goal**: Integrate all components and ensure seamless UX

**Independent Test Criteria**:
- Complete workflow: click image → modal appears → click edit → enter prompt → see results
- Modal styling matches app design system
- Loading states are visually clear (spinners, disabled buttons)
- Error messages are helpful and actionable
- Modal animations (open, close, transitions) are smooth

### Implementation

- [ ] T019 [P] Style ImageDetailModal with Tailwind CSS in `frontend/src/components/ImageDetailModal.tsx`:
  - Dark overlay with centered modal box
  - Image preview with aspect ratio preservation
  - Metadata section (size, creation time)
  - Button group with proper spacing and hover states
  - Smooth transitions for modal open/close
  - Mobile-responsive layout

- [ ] T020 [P] Style ImageRefinementForm with Tailwind CSS:
  - Consistent with CreateMode and EditMode forms
  - Input fields with proper labels and validation feedback
  - Disabled state for submit button during loading
  - Error message display below relevant fields

- [ ] T021 Style RefinementResults component with Tailwind CSS:
  - Grid layout for refined images (matching gallery style)
  - Loading skeleton placeholders while results fetch
  - Download button on hover or always visible
  - Fade-in animation when results appear

- [ ] T022 Add loading indicators and state feedback throughout:
  - Show spinner in modal while refinement request processes
  - Disable form inputs during submission
  - Show success message after download completes (optional toast)
  - Display error toast for failed refinement requests

---

## Phase 8: Testing & Validation

**Goal**: Validate complete flow and edge cases

**Independent Test Criteria**:
- Click image, see modal, click edit, enter prompt, see results
- Download works from both modal and results view
- Error handling displays appropriate messages
- Mobile and desktop layouts work correctly
- Performance is acceptable (no excessive re-renders)

### Manual Testing Checklist

- [ ] T023 Test complete image-to-refinement flow:
  - Generate images in CreateMode
  - Click on an image
  - Verify modal displays correctly
  - Click "Download" and verify download completes
  - Click "Edit this image" and verify form appears
  - Enter refinement prompt and submit
  - Verify refined results display
  - Download a refined image

- [ ] T024 [P] Test error scenarios:
  - Empty refinement prompt (validation prevents submission)
  - Network error during refinement (error message displays)
  - API returns error response (error details displayed)
  - Image is invalid format (if applicable)

- [ ] T025 [P] Test edge cases:
  - Very long refinement prompt (1000+ chars, validation prevents)
  - Multiple rapid clicks on same image (modal only opens once)
  - Close modal and reopen (state resets properly)
  - Switch between different images quickly

- [ ] T026 [P] Test responsiveness and accessibility:
  - Modal displays properly on mobile devices
  - Modal can be closed with Escape key
  - Form inputs are properly labeled and accessible
  - Image alt text is descriptive
  - Loading states have proper ARIA labels

---

## Phase 9: Documentation & Handoff

**Goal**: Document changes and ensure team can maintain feature

### Implementation

- [ ] T027 Update `frontend/src/components/README.md` (create if missing):
  - Document ImageDetailModal component props and usage
  - Document ImageRefinementForm component props and usage
  - Include usage examples

- [ ] T028 [P] Update `frontend/src/hooks/README.md` (create if missing):
  - Document useImageModal hook
  - Explain state management and event handlers

- [ ] T029 Update backend API documentation in `specs/001-nano-banana-app/contracts/api.md`:
  - Add section on image refinement workflow
  - Document expected request/response format for `/api/edit` when used for refinement

- [ ] T030 [P] Update project CLAUDE.md with implementation notes:
  - Image refinement feature architecture
  - Key components and their responsibilities
  - Future enhancement ideas (e.g., batch refinement, side-by-side comparison)

---

## Summary

**Total Tasks**: 30
**Parallelizable Tasks**: ~12 (marked with [P])
**Estimated Duration**: 4-6 hours for full implementation
**Critical Path**: T002 → T006 → T011 → T012 → T016 → T019

### By Category

| Phase | Tasks | Purpose |
|-------|-------|---------|
| Setup | T001 | Data model review |
| Modal Component | T002-T004 | Create modal UI and utilities |
| State Management | T005-T007 | Integrate with existing components |
| Download | T008-T009 | File download functionality |
| Refinement | T010-T013 | API integration and form |
| Backend | T014-T015 | Endpoint review and docs |
| Results Display | T016-T018 | Show and persist results |
| Polish | T019-T022 | Styling and UX |
| Testing | T023-T026 | Validation and edge cases |
| Documentation | T027-T030 | Code and API documentation |

### Implementation Notes

1. **Modular Design**: Each component (modal, form, results) is independent and can be developed in parallel
2. **Backward Compatibility**: Changes don't affect existing generate/edit workflows
3. **UX Priority**: Focus on smooth interactions, clear loading states, and helpful error messages
4. **Performance**: Minimize re-renders by using custom hooks and proper React patterns (useCallback, useMemo)
5. **Testing**: Manual testing covers happy path, error scenarios, and edge cases; consider adding unit/integration tests per team standards

### Future Enhancements (Post-MVP)

- Batch refinement: Select multiple images and refine together
- Side-by-side comparison: Original vs. refined versions
- Refinement history: Track previous refinements for undo/redo
- Preset refinement prompts: Suggest common refinements (e.g., "increase contrast", "change colors")
- Advanced options: Expose more Nano Banana API parameters in refinement form
