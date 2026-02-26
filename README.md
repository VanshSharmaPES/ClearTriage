# Glass-Box Intelligent Triage System

Goal: Build a scalable, explainable AI (XAI) hospital triage system using MERN + Python.
Target Outcome: A functional prototype + A research paper on "Operationalizing Trust in Medical AI."

## Project Structure (Monorepo)
- `client/`: React Frontend (Vite)
- `server/`: Node.js Backend (Express)
- `ml-service/`: Python Machine Learning Microservice (FastAPI)

## Quick Start

### Prerequisites
- Node.js
- Python 3.9+

### Setup
From the root directory, install all dependencies:
```bash
npm install
```
This will automatically install dependencies for the root, client, server, and setup the Python virtual environment for ml-service.

### Run Development Servers
Start all servers concurrently from the root directory:
```bash
npm run dev
```
This runs:
- React Frontend on `http://localhost:5173`
- Node Express Server on `http://localhost:3000`
- Python FastAPI Server on `http://localhost:8000`

---

## React + Vite Frontend Details

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

### React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

### Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
