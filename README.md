# LeetCode Coach — MVP

React (Vite) + Go minimal app that lists curated interview problems, lets you pick a problem *or paste your own*, select a language (Python default), and calls a model to get:
- solution code
- approach explanation
- Big-O (time/space) + explanation

## Quick start (local)

### 1) Backend (Go)
```bash
cd server
cp .env.example .env   # optional; set HF_TOKEN + MODEL_ID for real model calls
go run .
```
Server runs on :8080

### 2) Frontend (React/Vite)
```bash
cd web
npm i
npm run dev
```
App runs on http://localhost:5173 (proxy to backend /api/*).

> Without HF_TOKEN/ MODEL_ID we return a mock response so you can test end-to-end. 
> Set `MODEL_ID=Qwen/Qwen2.5-Coder-1.5B-Instruct` to enable real calls.

## Deploy on Render (free tier)
- Create a Web Service for `server/` (Go build). Set ENV: `HF_TOKEN`, `MODEL_ID`, `PORT` (Render injects).
- Create a Static Site for `web/` and set a proxy rule for `/api/*` to your web service URL, or serve built assets from Go.

## Data
`server/data/top300.json` contains a starter subset (5 items). Expand to 300 by following your sourcing pipeline.
