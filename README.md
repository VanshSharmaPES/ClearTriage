# Glass-Box Intelligent Triage System

Goal: Build a scalable, explainable AI (XAI) hospital triage system using MERN + Python.
Target Outcome: A functional prototype + A research paper on "Operationalizing Trust in Medical AI."

## Project Structure (Monorepo)
- `client/`: React Frontend (Next.js + Tailwind CSS)
- `server/`: Node.js Backend (Express)
- `ml-service/`: Python Machine Learning Microservice (FastAPI)

## Quick Start

### Prerequisites
- Node.js
- Python 3.9+
- MongoDB Atlas account

### Setup
From the root directory, install all dependencies:
```bash
npm install
```
This will automatically install dependencies for the root, client, server, and setup the Python virtual environment for ml-service.

### Environment Variables
Create a `.env` file in the root with:
```
MONGO_URI=your_mongodb_atlas_connection_string
PORT=3000
```

### Run Development Servers
Start all servers concurrently from the root directory:
```bash
npm run dev
```
This runs:
- Next.js Frontend on `http://localhost:3001`
- Node Express Server on `http://localhost:3000`
- Python FastAPI Server on `http://localhost:8000`
