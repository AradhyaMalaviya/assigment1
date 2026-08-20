# Contributing to Bulk Email Sender

Thank you for your interest in contributing to the Bulk Email Sender project! This document outlines guidelines and development workflows for contributing to both the Hono backend and the SvelteKit frontend.

---

## 🏗️ Architecture Overview

The project is structured into two independent packages:
- **Backend (`./` repository root)**: Hono API server running on Node.js with SQLite (`better-sqlite3`) and Nodemailer.
- **Frontend (`./frontend/`)**: SvelteKit 2 web application using Svelte 5, TypeScript, Tailwind CSS v4, TipTap editor, and `@sveltejs/adapter-node`.
- **API Communication**: The browser talks exclusively to the SvelteKit origin. SvelteKit proxies `/api/*` requests to the backend server via `routes/api/[...path]/+server.ts` (see `docs/adr/0001-frontend-backend-topology.md`).

---

## 🚀 Development Setup

### Prerequisites
- **Node.js**: >= 20.0.0
- **npm**: >= 10.0.0
- **Git**

### 1. Fork & Clone
```bash
git clone https://github.com/YOUR_USERNAME/bulk-email-sender.git
cd bulk-email-sender
```

### 2. Backend Setup
```bash
# Install backend dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start the backend development server (watches on port 3000)
npm run dev
```

### 3. Frontend Setup
```bash
# In a separate terminal, navigate to the frontend directory
cd frontend

# Install frontend dependencies
npm install

# Copy frontend environment configuration
cp .env.example .env

# Start the SvelteKit Vite development server (port 5173)
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🌿 Git Branching & Workflow

1. Create a descriptive feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/your-bug-fix-name
   ```

2. Branch naming conventions:
   - `feat/feature-name` — New features
   - `fix/bug-name` — Bug fixes
   - `docs/doc-update` — Documentation updates
   - `refactor/component-name` — Refactoring without behavior changes
   - `test/test-suite` — Tests & CI improvements

---

## 📝 Commit Message Convention

Follow the standard Conventional Commits specification:

```
<type>(<scope>): <short summary>

[optional body with details]

[optional footer(s)]
```

### Types:
- `feat`: A new user-facing feature
- `fix`: A bug fix
- `docs`: Documentation changes only
- `style`: Formatting, missing semi-colons, white-space changes (no code change)
- `refactor`: Code refactoring without changing functionality
- `test`: Adding or updating tests
- `chore`: Build scripts, dependencies, CI configuration

### Examples:
```
feat(email): add personalized template placeholder preview
fix(auth): handle expired session token cookie gracefully
docs(readme): add environment variables reference table
```

---

## 🧪 Quality Gates & Testing

Before submitting a Pull Request, all automated quality gates must pass for both packages.

### Backend Validation (Root)
```bash
# Typecheck TypeScript (tsc --noEmit)
npm run typecheck

# Run backend test runner
npm test
```

### Frontend Validation (`./frontend/`)
```bash
cd frontend

# Run SvelteKit typecheck (svelte-check)
npm run check

# Run ESLint
npm run lint

# Format code with Prettier
npm run format

# Run production build validation
npm run build
```

---

## 📐 Coding Standards

### General Principles
- **Clean and readable**: Write self-documenting code with clear variable and function names.
- **Strict TypeScript**: Avoid `any`; define explicit interfaces in `types.ts` (backend) or `frontend/src/lib/types/` (frontend).
- **No unused code**: Clean up debug `console.log` statements, unused imports, and commented-out blocks before submitting.
- **Indentation**: 2 spaces.

### Backend (Hono + Node.js)
- Maintain frozen business logic and database schema constraints.
- Use async/await for asynchronous operations.
- Place route handlers in `src/routes/` and business logic in `src/services/`.
- Handle errors gracefully and return structured JSON responses `{ success: boolean, message?: string, data?: any }`.

### Frontend (SvelteKit + Svelte 5 + Tailwind CSS v4)
- **Component-First Architecture**: Keep generic UI primitives in `lib/components/ui/` (never import feature stores or API modules in generic UI components).
- **Feature Components**: Group domain components in `lib/components/{email,config,dashboard,scheduled,reports}/`.
- **Central API Client**: Route all API requests through `lib/api/client.ts`. Never use raw `fetch()` in UI components.
- **Accessibility (a11y)**: Include explicit labels (`<label for="...">`), `aria-describedby` for field errors, keyboard navigation (`Enter`, `Space`, `Esc`), and non-color-only status indicators.
- **Responsiveness**: Verify designs at 375px (mobile), 768px (tablet), and 1440px (desktop).

---

## 📁 Repository Organization

```
bulk-email-sender/
├── .github/
│   ├── workflows/pr-checks.yml  # GitHub Actions CI workflow
│   └── labeler.yml              # PR label automation
├── data/                         # SQLite databases (runtime generated)
├── docs/
│   ├── adr/                     # Architectural Decision Records
│   ├── api-contract.md          # Frozen backend API contract
│   └── screenshots/             # Visual documentation assets
├── logs/                         # Application logs (runtime generated)
├── src/                          # Backend Source Code (Hono on Node.js)
│   ├── app.ts                   # Hono application entrypoint
│   ├── types.ts                 # Backend TypeScript interfaces
│   ├── middleware/              # Authentication middleware
│   ├── routes/                  # Hono route handlers (auth, config, send, report, dashboard)
│   └── services/                # Business logic services (email, batch, scheduler, user DB)
├── frontend/                     # SvelteKit Frontend Application
│   ├── src/
│   │   ├── routes/              # SvelteKit file-based routing
│   │   │   ├── (auth)/          # Unauthenticated routes (login, register)
│   │   │   ├── (app)/           # Protected app routes (dashboard, send, configs, scheduled, reports)
│   │   │   └── api/[...path]/   # Same-origin backend proxy
│   │   └── lib/
│   │       ├── api/             # Typed API client modules
│   │       ├── components/      # UI primitives & feature components
│   │       ├── stores/          # Svelte stores (auth, toast, activity, polling)
│   │       ├── types/           # Frontend TypeScript types
│   │       └── utils/           # Helper functions & utilities
│   ├── static/                  # Static assets & sample spreadsheet
│   ├── package.json             # Frontend dependencies & scripts
│   ├── svelte.config.js         # SvelteKit configuration
│   └── vite.config.ts           # Vite build configuration
├── package.json                 # Backend dependencies & scripts
├── tsconfig.json                # Backend TypeScript configuration
├── CONTRIBUTING.md              # Contributor guide (this file)
└── README.md                    # Main project documentation
```

---

## 📬 Pull Request Submission Checklist

- [ ] Backend typecheck passes (`npm run typecheck` in root).
- [ ] Backend test passes (`npm test` in root).
- [ ] Frontend check passes (`npm run check` in `frontend/`).
- [ ] Frontend lint passes (`npm run lint` in `frontend/`).
- [ ] Frontend production build succeeds (`npm run build` in `frontend/`).
- [ ] Commit history is clean and follows conventional commit format.
- [ ] Documentation updated if relevant.
- [ ] Screenshots or visual proof attached for UI changes.
