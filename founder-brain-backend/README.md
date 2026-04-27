# 🧠 Founder Brain - Complete Route-by-Route API Documentation

This guide provides an exhaustive technical mapping of every network interface in the Founder Brain Backend, including exact request and response JSON bodies. This documentation is designed for production integration and security auditing.

---

## 🌐 Global API Settings

- **Base URL**: `http://localhost:3000/api`
- **WS Endpoint**: `ws://localhost:3000`
- **Standard Success Envelope**: 
```json
{ 
  "success": true, 
  "message": "Human readable summary",
  "data": { ... }, 
  "traceId": "trace-99102", 
  "timestamp": "2026-04-28T00:00:00.000Z" 
}
```

---

## 🔐 1. Authentication & Security (Auth 2.0)

Founder Brain uses a production-grade Auth 2.0 pattern with Access/Refresh token rotation, HTTP-only cookies, and CSRF protection.

### 🔵 `GET /auth/csrf-token`
Acquire the CSRF token for subsequent write operations.
- **Note**: Must be called before any POST/PATCH/DELETE request from a browser.
- **Response**:
```json
{
  "success": true,
  "token": "d7a8f...92e1"
}
```
- **Usage**: Clients must send this token in the `X-XSRF-TOKEN` header.

### 🔵 `POST /auth/register`
Create a new account. Account is initially `inactive`.
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email with the OTP sent.",
  "data": {
    "userId": "662...",
    "email": "user@example.com",
    "isEmailVerified": false
  }
}
```

### 🔵 `POST /auth/verify-signup`
Verify email using the 6-digit OTP sent to the user's inbox.
- **Request Body**:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Account activated successfully."
}
```

### 🔵 `POST /auth/login`
Authenticate and receive tokens.
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbG...",
    "user": {
      "id": "662...",
      "name": "John Doe",
      "email": "user@example.com"
    }
  }
}
```
- **Set-Cookie**: `refreshToken=...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`

### 🔵 `POST /auth/refresh`
Rotate tokens using the refresh cookie.
- **Note**: Requires the `refreshToken` cookie.
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "accessToken": "new_eyJhbG..."
  }
}
```

### 🔵 `POST /auth/logout`
Invalidate the current session and clear cookies.
- **Response (200 OK)**:
```json
{ "success": true, "message": "Logged out successfully" }
```

### 🟠 `POST /auth/forgot-password`
Initiate password recovery flow. Generates a 6-digit OTP.
- **Request Body**: `{ "email": "user@example.com" }`
- **Response**: `{ "success": true, "message": "OTP sent to your email" }`

### 🔵 `POST /auth/verify-reset-otp`
Verify the recovery OTP before allowing password change.
- **Request Body**:
```json
{
  "email": "user@example.com",
  "otp": "654321"
}
```
- **Response**: `{ "success": true, "message": "OTP verified. You may now reset your password." }`

### 🔵 `POST /auth/reset-password`
Set a new password using a verified OTP.
- **Request Body**:
```json
{
  "email": "user@example.com",
  "otp": "654321",
  "password": "NewSecurePassword456!"
}
```
- **Response**: `{ "success": true, "message": "Password updated successfully." }`

---

## 📅 2. Meetings Endpoints
*All routes require Authorization: Bearer <accessToken>*

### 🟢 `GET /meetings`
List meetings owned by the authenticated user.
- **Request (Query)**: `?page=1&limit=5&search=roadmap&status=completed`
- **Response Body**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "662...",
      "summary": "Project Roadmap Phase 2",
      "decisions": ["Adopt Docker", "Use LanceDB"],
      "processingStatus": "completed",
      "createdAt": "2026-04-27T10:00:00Z"
    }
  ],
  "pagination": { "total": 1, "page": 1, "limit": 5, "totalPages": 1 }
}
```

### 🔵 `POST /meetings/process`
Queue meeting transcript for analysis. Supports idempotency.
- **Request Header**: `Idempotency-Key: uuid-v4`, `X-XSRF-TOKEN: ...`
- **Request Body**:
```json
{
  "text": "The full transcript of the meeting goes here. Sara will be in charge of architecture. Ali will write the tests."
}
```
- **Response Body (202 Accepted)**:
```json
{
  "success": true,
  "data": {
    "jobId": "meeting-job-7721",
    "meetingId": "662...",
    "status": "queued"
  }
}
```

### 🟢 `GET /meetings/:id/status`
Check processing progress for a specific meeting.
- **Response**:
```json
{
  "success": true,
  "data": {
    "status": "processing",
    "progress": 45,
    "step": "ai_analysis"
  }
}
```

### 🟢 `GET /meetings/:id/progress`
Get meeting details along with task completion percentages.
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": "662...",
    "summary": "...",
    "taskProgress": {
      "total": 5,
      "completed": 2,
      "percent": 40
    }
  }
}
```

---

## ✅ 3. Task Management Endpoints
*All routes require Authorization: Bearer <accessToken>*

### 🟢 `GET /tasks`
List user's tasks with filters and pagination.
- **Request (Query)**: `?status=pending&owner=Sara`
- **Response Body**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "task_882",
      "description": "Write architecture doc",
      "owner": "Sara",
      "deadline": "2026-05-01T00:00:00Z",
      "status": "pending",
      "version": 0
    }
  ]
}
```

### 🟢 `GET /tasks/pending/grouped`
Retrieves pending tasks grouped by owner/assigned person.
- **Response**:
```json
{
  "success": true,
  "data": {
    "groups": [
      {
        "owner": "Sara",
        "tasks": [{ "id": "task_882", "description": "..." }]
      },
      {
        "owner": "Unassigned",
        "tasks": []
      }
    ]
  }
}
```

### 🟠 `PATCH /tasks/:id`
Update task owner, description, or deadline with Optimistic Locking.
- **Request Header**: `If-Match: 0`, `X-XSRF-TOKEN: ...`
- **Request Body**:
```json
{
  "owner": "Ali",
  "description": "Write architecture doc and tests",
  "deadline": "2026-05-05",
  "version": 0
}
```
- **Response Body (200 OK)**:
```json
{
  "success": true,
  "data": {
    "_id": "task_882",
    "owner": "Ali",
    "version": 1
  }
}
```

### 🔵 `POST /tasks/:id/complete`
Atomically mark a task as completed and trigger notifications.
- **Request Body**: `{ "version": 1 }`
- **Response**: `{ "success": true, "message": "Task marked as completed" }`

---

## 🔍 4. Semantic Search (RAG) Endpoints
*All routes require Authorization: Bearer <accessToken>*

### 🔵 `POST /query`
Ask Gemini questions about your specific meetings using semantic memory.
- **Request Body**:
```json
{
  "question": "What is the plan for database migration?",
  "maxSources": 3
}
```
- **Response Body**:
```json
{
  "success": true,
  "data": {
    "answer": "The database migration is planned for Friday night using a blue-green strategy...",
    "sources": [
      {
        "meetingId": "662...",
        "relevance": 0.98,
        "excerpt": "Migration planned for Friday night..."
      }
    ]
  }
}
```

### 🟢 `GET /query/suggestions`
Get dynamic question suggestions based on common meeting topics.
- **Response**:
```json
{
  "success": true,
  "data": {
    "suggestions": ["What are the key decisions?", "Who was assigned to the API?"]
  }
}
```

---

## 🔔 5. Notification Endpoints
*All routes require Authorization: Bearer <accessToken>*

### 🟢 `GET /notifications`
Fetch personal alerts for the logged-in user.
- **Response Body**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "691...",
      "type": "task_completed",
      "title": "Task Finished",
      "message": "Task 'Write docs' marked as complete.",
      "isRead": false,
      "createdAt": "2026-04-28T00:30:00Z"
    }
  ]
}
```

### 🟢 `GET /notifications/unread/count`
Get the count of unread notifications for the badge.
- **Response**: `{ "success": true, "count": 3 }`

---

## ⚙ 6. Monitoring & Admin

### 🟢 `GET /health`
Deep health check of micro-services.
- **Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 123456,
    "services": {
      "mongodb": "connected",
      "redis": "connected",
      "queue": "active",
      "vector_db": "ready"
    }
  }
}
```

### 🟢 `GET /metrics`
Prometheus metrics format output for Grafana dashboards.
- **Example Fragment**:
```text
http_request_duration_seconds_bucket{le="0.1",method="GET",path="/api/meetings"} 12
ai_token_usage_total{model="gemini-1.5-flash"} 4502
```

---

## 🔌 7. WebSocket Events (Socket.io)

### Auth Context
Connect with your JWT specified in the query: `ws://localhost:3000?token=YOUR_JWT`

### Events
| Event | Direction | Payload Example | Description |
|-------|-----------|-----------------|-------------|
| `query:chunk` | S -> C | `{ "token": "The", "isComplete": false }` | Streaming AI response |
| `meeting:status` | S -> C | `{ "meetingId": "123", "progress": 50 }` | Background job progress |
| `notification:new` | S -> C | `{ "id": "456", "title": "New Assignment" }` | Real-time user alert |
| `presence:update` | S -> C | `["user-1", "user-2"]` | Active user list |

---

## 🔴 8. Error Codes & Handling

| Code | Name | Meaning |
|------|------|---------|
| 400 | Bad Request | Validation failed (Check Zod errors) |
| 401 | Unauthorized | Token missing or expired |
| 403 | Forbidden | CSRF token missing or session mismatch |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Optimistic Lock failure (Check Version) |
| 429 | Rate Limit | Global or AI specific limit exceeded |
| 500 | Server Error | Internal failure (Check TraceId in logs) |

---

## 🛡 Security Architecture Summary

1. **JWT Rotation**: `accessToken` (15m) + `refreshToken` (7d). New refresh token issued on every rotation.
2. **CSRF Enforcement**: Mandatory `X-XSRF-TOKEN` header for all state-changing operations.
3. **Data Isolation**: Strict multi-tenant filtering using `userId` at MongoDB and LanceDB layers.
4. **Rate Limiting**: Tiered protection (Global, AI, Auth) to prevent brute force and DDoS.
5. **Ownership Middleware**: Server-side verification that `req.user.id === resource.userId`.
6. **OTP Security**: 6-digit codes stored in Redis with 10-minute TTL and limited attempt window.
