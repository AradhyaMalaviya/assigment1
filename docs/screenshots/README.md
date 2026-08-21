# Visual Documentation & Workspace Screenshots

This directory contains visual documentation assets and screen mockups illustrating the key application workspaces of the **Bulk Email Sender** SvelteKit migration project.

---

## 📸 Workspace Assets Overview

| Asset | File | Description |
| :--- | :--- | :--- |
| **01. Authentication** | [`01-login-workspace.svg`](01-login-workspace.svg) | Secure user login and registration interface featuring Argon2id password hashing, HTTP-only session cookies, and declarative `(auth)` layout guards. |
| **02. Operations Dashboard** | [`02-dashboard-active-batch.svg`](02-dashboard-active-batch.svg) | Live operations dashboard with adaptive polling (3s active batch / 10s running scheduled / 30s pending / 0s idle), live progress bar, sent/failed metrics, next-batch countdown timer, pause/resume/cancel controls, upcoming scheduled queue, and persisted activity timeline. |
| **03. Campaign Composer** | [`03-campaign-composer.svg`](03-campaign-composer.svg) | Campaign composition workspace at `/send` featuring SMTP selector with provider rate limits, Excel contact parsing (`POST /parse-excel`), 1-based to 0-based recipient range arithmetic, TipTap WYSIWYG rich-text editor with image support, HTML template uploader with precedence handling, and live preview modal. |
| **04. SMTP Configurations** | [`04-smtp-configurations.svg`](04-smtp-configurations.svg) | Outbound email server management at `/configs` with full CRUD, default config toggling, live SMTP connection testing, Gmail 16-character app password guidance, and password masking. |
| **05. Scheduled Jobs Queue** | [`05-scheduled-jobs-queue.svg`](05-scheduled-jobs-queue.svg) | Automated campaign queue at `/scheduled` with local IANA timezone localization, 60s scheduler cadence notice, search/status filters, and cancellation protection with locked controls for running jobs. |
| **06. Reports & Analytics** | [`06-reports-and-analytics.svg`](06-reports-and-analytics.svg) | Delivery reporting and audit workspace at `/reports` with 4 headline stat cards (Total, Sent, Failed, Errors), debounced client-side search, status & date filters, 8-column sortable table, CSV/JSON blob exports, and confirmation-guarded log clearing. |
| **07. Mobile Responsive View** | [`07-mobile-responsive-view.svg`](07-mobile-responsive-view.svg) | Verified 375px mobile viewport layout demonstrating responsive navigation drawer, stacked metric cards, and responsive stacked report cards. |

---

## 🎨 Visual Design System

The SvelteKit application uses a modern, high-contrast dark palette configured with **Tailwind CSS v4** design tokens:
- **Backgrounds**: Slate 900 (`#0f172a`), Slate 800 (`#1e293b`), Slate 700 (`#334155`)
- **Primary / Brand**: Indigo 600 (`#4f46e5`), Indigo 500 (`#6366f1`), Indigo 400 (`#818cf8`)
- **Success / Sent**: Emerald 500 (`#10b981`), Emerald 400 (`#34d399`)
- **Warning / Paused**: Amber 500 (`#f59e0b`), Yellow 500 (`#eab308`)
- **Danger / Failed**: Rose 500 (`#f43f5e`), Red 600 (`#dc2626`)
- **Info / Scheduled**: Sky 500 (`#0284c7`), Light Blue (`#38bdf8`)
