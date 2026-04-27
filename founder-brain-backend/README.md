# Founder Brain - Meeting Intelligence Platform

Founder Brain is a powerful backend service designed to transform raw meeting notes into actionable insights using AI. It provides asynchronous processing of meeting text, automated task extraction, and robust task management with optimistic locking.

## 🚀 Tech Stack
- **Core**: TypeScript 5, Express.js
- **AI**: Google Gemini 1.5 Flash
- **Database**: MongoDB (Mongoose)
- **Queue System**: BullMQ (Powered by Redis)
- **Logging**: Winston
- **Infrastructure**: Docker & Docker Compose

---

## 🛠 Getting Started

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose
- Gemini AI API Key

### Installation
1. Clone the repository and navigate to the project folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```
4. Start infrastructure (MongoDB & Redis):
   ```bash
   npm run docker:up
   ```
5. Run the application:
   ```bash
   npm run dev
   ```

---

## 📖 API Documentation

### 1. Meetings API

#### List Meetings
List all meetings with pagination, search, and filtering.
- **URL**: `/api/meetings`
- **Method**: `GET`
- **Query Params**:
  - `page`: Page number (default 1)
  - `limit`: Items per page (default 10)
  - `search`: Keyword to search in summary/decisions
  - `status`: Filter by processing status (`pending`, `processing`, `completed`, `failed`)
- **Sample Output**:
```json
{
  "data": [
    {
      "id": "662...",
      "summary": "Project kickoff meeting...",
      "decisions": ["Use React", "Deploy on AWS"],
      "processingStatus": "completed",
      "createdAt": "2026-04-27T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

#### Process Meeting Notes
Queues a meeting text for AI processing. Returns immediately with a Job ID.
- **URL**: `/api/meetings/process`
- **Method**: `POST`
- **Input**:
```json
{
  "text": "Team meeting: Ali will build the dashboard. Sara will handle the database. We decided to use Postgres."
}
```
- **Output (202 Accepted)**:
```json
{
  "jobId": "meeting-662...",
  "meetingId": "662...",
  "status": "queued",
  "message": "Meeting processing has been queued."
}
```

#### Get Meeting Progress
Retrieve meeting details along with task completion statistics.
- **URL**: `/api/meetings/:id/progress`
- **Method**: `GET`
- **Sample Output**:
```json
{
  "id": "662...",
  "summary": "...",
  "taskProgress": {
    "total": 5,
    "completed": 2,
    "percent": 40
  }
}
```

#### Get Global Statistics
- **URL**: `/api/meetings/stats`
- **Method**: `GET`
- **Sample Output**:
```json
{
  "total": 50,
  "byStatus": {
    "completed": 42,
    "failed": 3,
    "processing": 5
  }
}
```

---

### 2. Task Management API

#### List All Tasks
- **URL**: `/api/tasks`
- **Method**: `GET`
- **Filters**: `status`, `owner`, `meetingId`, `fromDate`, `toDate`
- **Sample Output**:
```json
{
  "data": [
    {
      "id": "task_123",
      "description": "Build dashboard",
      "owner": "Ali",
      "deadline": "2026-05-01T00:00:00Z",
      "status": "pending",
      "version": 0
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "pages": 1 }
}
```

#### Get Grouped Tasks (Board View)
- **URL**: `/api/tasks/pending/grouped`
- **Method**: `GET`
- **Sample Output**:
```json
{
  "Ali": [
    { "id": "t1", "description": "Frontend setup", "status": "pending" }
  ],
  "Sara": [
    { "id": "t2", "description": "Database schema", "status": "pending" }
  ],
  "Unassigned": []
}
```

#### Update Task (Optimistic Locking)
- **URL**: `/api/tasks/:id`
- **Method**: `PATCH`
- **Header**: `If-Match: 0`
- **Input**:
```json
{
  "owner": "Ali Updated",
  "deadline": "2026-06-01T00:00:00Z"
}
```
- **Output (200 OK)**:
```json
{
  "id": "...",
  "owner": "Ali Updated",
  "version": 1
}
```
- **Error Output (409 Conflict)**:
```html
<pre>Error: Conflict: Task was modified by another request...</pre>
```

---

## 🛡 Optimistic Locking
To prevent concurrent data loss, task updates require an **ETag/Version** check.
1. When you `GET` a task, it includes a `version` field.
2. When performing a `PATCH` or `POST/complete`, you MUST provide this version in the `If-Match` header.
3. If the task was modified by someone else in the meantime, the server returns `409 Conflict`.

---

## 🚀 Tech Stack
- **Core**: TypeScript 5, Express.js
- **AI**: Google Gemini (Analysis), OpenAI (RAG & Embeddings)
- **Vector DB**: LanceDB (Embedded)
- **Database**: MongoDB (Mongoose)
- **Queue System**: BullMQ (Powered by Redis)
- **Logging**: Winston
- **Infrastructure**: Docker & Docker Compose

---

## 🛠 Getting Started

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose
- Gemini AI API Key
- OpenAI API Key (for Semantic Search)

---

## 📖 API Documentation

### 1. Meetings API
... (Existing Docs)

### 2. Task Management API
... (Existing Docs)

### 3. Semantic Query API (NEW)

#### Ask a Natural Language Question
Retrieves relevant meeting context via vector search and answers using AI.
- **URL**: `/api/query`
- **Method**: `POST`
- **Input**:
```json
{
  "question": "What did we decide about the vector database?",
  "maxSources": 3
}
```
- **Output**:
```json
{
  "answer": "The team decided to use LanceDB for the vector database because it is local and embedded...",
  "sources": [
    {
      "meetingId": "662...",
      "relevanceScore": 0.89,
      "excerpt": "...integrating the vector database using LanceDB..."
    }
  ],
  "processingTimeMs": 1200
}
```

#### Get Suggested Questions
Returns common questions based on recently processed meeting data.
- **URL**: `/api/query/suggestions`
- **Method**: `GET`

---

## 🏗 Project Architecture

### Background Processing
The system uses **BullMQ** for multi-stage processing:
1.  **AI Extraction**: Workers use Gemini to extract summary, decisions, and tasks.
2.  **Vector Indexing**: After extraction, an embedding job is queued. Workers generate vectors (OpenAI or Local) and store them in **LanceDB**.

### Semantic Search (RAG)
1.  **Query**: Users provide natural language questions.
2.  **Retrieval**: The `VectorService` converts the query to an embedding and finds the top-K similar meeting chunks.
3.  **Augmentation**: Context is injected into a specialized prompt.
4.  **Generation**: OpenAI's GPT-4o-mini generates a grounded answer with source citations.

### Logging
Logs are generated using **Winston** and stored in the `/logs` directory:
- `combined.log`: All logs
- `error.log`: Only error-level logs

---

## 📋 Scripts
- `npm run dev`: Start development server with nodemon.
- `npm run build`: Compile TypeScript to JavaScript.
- `npm run start`: Run the production build.
- `npm run docker:up`: Start infrastructure containers.
- `npm run docker:down`: Stop infrastructure containers.
