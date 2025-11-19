# Data Model: AI Prompt Enhancement

**Feature**: Prompt Enhancement Integration with n8n
**Created**: 2025-11-15
**Status**: Phase 1 Design

## Entities

### 1. Enhancement Request (Runtime Entity - No Persistence)

**Purpose**: Represents a single prompt enhancement request in-flight.

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|-----------|
| `originalPrompt` | string | Yes | The user's original prompt text | Non-empty, ≤10,000 chars |
| `sessionId` | string | Yes | Session ID from X-Session-ID header | Valid UUID format |
| `requestTimestamp` | ISO 8601 | Yes | When the enhancement was requested | Server-generated |
| `timeoutMs` | number | No | Request timeout in milliseconds | Default: 30,000 (30 seconds) |

**Lifecycle**:
1. Created when user clicks "Enhance" button
2. Sent to n8n webhook endpoint
3. Destroyed after response received or timeout
4. No persistence to database (stateless operation)

**Error States**:
- `NetworkError`: n8n endpoint unreachable
- `TimeoutError`: No response within 30 seconds
- `InvalidResponseError`: n8n returns malformed data or HTTP 500+
- `EmptyPromptError`: Prompt is empty or whitespace-only

---

### 2. Enhanced Prompt (Response Entity)

**Purpose**: The AI-improved version of the user's prompt returned from n8n.

**Attributes**:

| Field | Type | Description |
|-------|------|-------------|
| `enhancedPrompt` | string | Plain text enhanced prompt from n8n webhook |
| `originalPrompt` | string | Echo of the original prompt for context |
| `enhancementDuration` | number | Time elapsed (ms) from request to response |

**Constraints**:
- `enhancedPrompt` is passed through as-is from n8n (no sanitization)
- Maximum length: 10,000 characters (same as original)
- Returned as plain text in API response body

---

## API Contracts

### Request Contract

**Endpoint**: `POST /api/enhance`

**Headers**:
```
X-Session-ID: <uuid>  # Required, existing session
Content-Type: application/json
```

**Body**:
```json
{
  "prompt": "a magical forest with glowing crystals"
}
```

**Request Validation**:
- `prompt` must be non-empty string
- `prompt` must be ≤10,000 characters
- Must have valid X-Session-ID header
- Content-Type must be application/json

---

### Success Response Contract

**Status**: `200 OK`

**Body** (plain text):
```
A serene magical forest landscape with bioluminescent crystal formations, ethereal glowing lights, mystical atmosphere, ultra-detailed, cinematic lighting, high resolution
```

**Description**: Raw plain text enhanced prompt from n8n, returned directly without modification.

---

### Error Response Contract

**Status**: `500 Internal Server Error` (from n8n webhook)

**Body** (plain text):
```
LLM timeout: No response after 25 seconds
```

OR other HTTP error codes:

| Code | Cause | Response Body |
|------|-------|---------------|
| 400 | Invalid request (empty prompt) | Error message describing validation failure |
| 500 | n8n webhook error or timeout | n8n error message (from webhook HTTP 500 response) |
| 503 | Service unavailable | "Enhancement service temporarily unavailable" |

---

## State Diagram

```
User types prompt
         ↓
   [Enhance button enabled]
         ↓
   User clicks Enhance
         ↓
   [Loading state shown]
         ↓
   POST /api/enhance
         ↓
   ┌─────────────────────────┐
   │                         │
   ↓                         ↓
Success             Failure/Timeout
   ↓                         ↓
HTTP 200             HTTP 5xx or timeout
   ↓                         ↓
[Display enhanced prompt]  [Display error message]
   ↓                         ↓
User can edit/use        User can retry
```

---

## Type Definitions

### TypeScript Models

```typescript
// Backend types
interface EnhancementRequest {
  originalPrompt: string;
  sessionId: string;
  requestTimestamp: string; // ISO 8601
  timeoutMs?: number; // Default 30000
}

interface EnhancementResponse {
  enhancedPrompt: string;
  originalPrompt: string;
  enhancementDuration: number;
}

interface EnhancementError {
  error: string;
  message: string;
  statusCode: number;
}

// Frontend/HTTP body types
type EnhanceRequestBody = {
  prompt: string;
};

type EnhanceResponseBody = string; // Plain text
```

---

## Integration Points

### Outbound: n8n Webhook

**Webhook URL**: `https://webhooks.magosdosconcursos.com.br/webhook/BWMUOvay3JXVPsDi`

**Method**: POST

**Request Body** (from backend service):
```json
{
  "prompt": "user's prompt text"
}
```

**Response** (on success HTTP 200):
- Plain text body containing enhanced prompt

**Response** (on error HTTP 500+):
- Plain text error message from n8n

**Timeout Handling**:
- Backend sets 30-second timeout on Axios HTTP call
- If timeout or error, catch and return HTTP 500 with error message

---

## Validation Rules

| Entity | Field | Rule |
|--------|-------|------|
| Enhancement Request | prompt | Length 1-10,000 chars |
| Enhancement Request | prompt | Non-whitespace content |
| Enhancement Request | sessionId | Valid UUID format |
| Enhancement Response | enhancedPrompt | Plain text (no JSON parsing) |

---

## No Database Changes

- **No new tables**: Enhancement requests are stateless, not persisted
- **No schema migrations**: Existing session/user tables unchanged
- **Future consideration**: If audit logging of all enhancements is needed, add `enhancement_logs` table (out of scope for MVP)
