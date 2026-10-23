# GEMINI.md

This file provides guidance to Gemini / Antigravity coding agents when working with code in the frontend application.

## Project Overview

**Hour Ledger System -- Frontend**

Vue 3 SPA for client hour tracking with a ledger-based model.

### Tech Stack

- **Framework**: Vue 3.5+ with Composition API
- **Build Tool**: Vite 7
- **Language**: TypeScript 5.9+
- **Styling**: TailwindCSS v4
- **Routing**: Vue Router 4
- **Code Style**: Prettier

## Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
vue-tsc -b
```

### Docker Commands

```bash
# From project root
docker compose --env-file .env.docker exec frontend npm install
docker compose --env-file .env.docker exec frontend npm run build
docker compose --env-file .env.docker exec frontend npx prettier --write src/
```

## Architecture

### Directory Structure

```
src/
├── assets/            # Static assets and CSS
├── components/        # Reusable UI components
├── composables/       # Reusable composition functions
├── layouts/           # Layout components
├── plugins/           # Vue plugins
├── router/            # Vue Router configuration
├── services/          # API communication (api.ts)
├── stores/            # Pinia stores
├── types/             # TypeScript interfaces
├── utils/             # Pure helper and formatter functions
├── views/             # Page components
├── App.vue            # Root component
└── main.ts            # Application entry point
```

### Key Patterns

**Composition API**: All components use `<script setup lang="ts">`

**Composables**: Data fetching and state management via composition functions

```typescript
const { clients, loading, error, fetchClients } = useClients();
```

**API Service**: Centralized API communication in `services/api.ts`

**TypeScript**: Strict typing for all entities and API responses

### Path Aliases

Configured in `vite.config.ts` and `tsconfig.app.json`:

- `@` or `@/` → `./src`
- `@@` or `@@/` → `./` (repository root)
- `@components` or `@components/` → `./src/components`
- `@composables` or `@composables/` → `./src/composables`
- `@views` or `@views/` → `./src/views`
- `@services` or `@services/` → `./src/services`
- `@types` or `@types/` → `./src/types`
- `@utils` or `@utils/` → `./src/utils`
- `@stores` or `@stores/` → `./src/stores`
- `@assets` or `@assets/` → `./src/assets`
- `@layouts` or `@layouts/` → `./src/layouts`

Always use these aliases instead of long relative paths like `../../../../`.

## Single Responsibility Principle & File Size Limits

- **Avoid Monolithic Files**: View and component files should not grow excessively large (target: under 300–400 lines).
- **Extract UI Components**: Decompose large view templates into small, focused sub-components inside `@components/` (e.g. modals, tables, summary cards, action panels).
- **Extract Composables**: Move state management, asynchronous data fetching, and business operations to dedicated composables in `@composables/`.
- **Extract Utility Functions**: Place pure formatting (currency, dates, badges), data transformations, and helpers into `@utils/`.
- **Single Responsibility**: Each component, composable, and utility file should have one clear purpose and responsibility.

## Vue.js Guidelines

### Conditional Classes

**Always use object syntax** instead of ternary operators:

```vue
<!-- ✅ Correct -->
<div :class="{ 'bg-blue-600': isActive, 'bg-gray-200': !isActive }"></div>

<!-- ❌ Wrong -->
<div :class="isActive ? 'bg-blue-600' : 'bg-gray-200'"></div>
```

### Combining Static and Conditional Classes

```vue
<div
    :class="[
        'px-4 py-2 rounded-lg',
        {
            'bg-blue-600 text-white': isActive,
            'bg-gray-200 text-gray-800': !isActive,
        },
    ]"
></div>
```

### Design System (MK Pay)

The application follows the **MK Pay Design System** defined in `frontend/design/design.json`.

Prefer reusable UI components:
- `CButton.vue`
- `CInput.vue`
- `CSelect.vue`
- `CTextarea.vue`
- `CDropZone.vue`

## Code Style Guideline (Mandatory)

All code generated, modified, or refactored **must strictly follow** the rules defined in:

**UNIVERSAL-CODE-STYLE-RULES.md**

### Enforcement Rules

- The rules in `UNIVERSAL-CODE-STYLE-RULES.md` are **authoritative and non-negotiable**
- No framework convention, language idiom, or AI default may override these rules
- Brevity, shortcuts, and one-liners are explicitly forbidden when they reduce clarity
- Explicit control flow, block scoping, and early returns are mandatory
- Logical sections must be separated by blank lines
- If multiple valid implementations exist, choose the **most explicit and readable**

### Conflict Resolution

If any instruction, suggestion, or generated code conflicts with the rules in
`UNIVERSAL-CODE-STYLE-RULES.md`, **that file always takes precedence**.

Any output that violates these rules must be considered **invalid and corrected**.

