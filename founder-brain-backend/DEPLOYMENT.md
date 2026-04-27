# Founder Brain - Deployment Guide

This guide covers how to deploy the Founder Brain platform using Docker or to cloud providers.

## 1. Local Deployment (Docker)

The fastest way to get the entire system running locally.

### Prerequisites
- Docker & Docker Compose installed
- AI API keys (Gemini and/or OpenAI)

### One-Command Setup
1. Create a `.env` file (copy from `.env.example` if available)
2. Run:
   ```bash
   docker-compose up -d
   ```
3. Wait for services to initialize (approx 30-60 seconds)
4. Access the following:
   - **API Documentation**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
   - **Health Status**: [http://localhost:3000/health/detailed](http://localhost:3000/health/detailed)
   - **Admin Dashboard**: [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard)
   - **Mongo Express**: [http://localhost:8081](http://localhost:8081)

## 2. Cloud Deployment

### Railway.app (Recommended)
1. Fork the repository
2. Create a new Project on Railway
3. Connect your GitHub repository
4. Add **Redis** and **MongoDB** plugins from Railway
5. Configure the following environment variables:
   - `GEMINI_API_KEY`: Your key
   - `OPENAI_API_KEY`: Your key (optional if using Gemini)
   - `MONGODB_URI`: Provided by Railway plugin
   - `REDIS_URL`: Provided by Railway plugin
6. Railway will automatically detect the `Dockerfile` and deploy.

### Health Checks
The application provides standard health check endpoints for load balancers:
- `GET /health/detailed`: Deep check of databases and services.
- Standard Docker health check included in `Dockerfile`.

## 3. Postman Collection
To test APIs with Postman:
1. Run `npm run export:postman`
2. Import `postman/FounderBrain.postman_collection.json` into Postman.
3. Configure `base_url` variable in Postman.
