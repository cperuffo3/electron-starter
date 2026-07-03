# Implementation Plan

This file breaks down your project into actionable phases and tasks. It helps AI assistants understand the development roadmap and implementation order.

## Purpose

An implementation plan helps AI assistants:

- Understand what has been completed vs. what remains
- Follow a logical build order
- Know which files to create or modify
- Avoid implementing features out of sequence

## Recommended Sections

### Phase Overview

Break your project into logical phases. Each phase should be completable independently and build on previous phases.

```markdown
## Phase 1: Project Setup

- Initialize project structure
- Configure build tools
- Set up development environment

## Phase 2: Core Data Layer

- Define TypeScript types
- Create IPC handlers
- Set up state management

## Phase 3: UI Implementation

- Build main layout
- Create feature components
- Implement navigation

## Phase 4: Feature Integration

- Connect UI to data layer
- Add business logic
- Implement user flows

## Phase 5: Polish

- Error handling
- Loading states
- Edge cases
```

### Task Checklists

Use checkboxes to track progress within each phase:

```markdown
## Phase 2: Core Data Layer

### Feature scaffold

- [ ] Run `pnpm new:feature user` (creates the main-process module and renderer feature)

### IPC Handlers (`src/main/core/user/`)

- [ ] Implement `handlers.ts`
- [ ] Define zod inputs in `schemas.ts`
- [ ] Confirm `src/main/core/router.ts` includes the new domain (auto-wired by the generator)

### Renderer feature (`src/renderer/features/user/`)

- [ ] Implement `actions/user-actions.ts` wrapper functions
- [ ] Wrap actions in TanStack Query hooks in `queries/user-queries.ts`
- [ ] Add types to `types/user.types.ts`
```

### File Inventory

List new files to create and existing files to modify:

```markdown
### New Files

| File                                                  | Purpose                |
| ----------------------------------------------------- | ---------------------- |
| `src/renderer/features/user/types/user.types.ts`      | User type definitions  |
| `src/main/core/user/handlers.ts`                      | User IPC handlers      |
| `src/renderer/features/user/components/user-card.tsx` | User display component |

### Modified Files

| File                      | Changes                  |
| ------------------------- | ------------------------ |
| `src/main/core/router.ts` | Add user handlers        |
| `src/renderer/app.tsx`    | Add UserProvider wrapper |
```

### Dependencies

Track any new dependencies needed:

```markdown
### Add to package.json

- `zod` - Schema validation
- `@tanstack/react-query` - Data fetching (already included)

### shadcn/ui Components to Add

npx shadcn@latest add card dialog input textarea
```

### Implementation Notes

Document important decisions or constraints:

```markdown
## Notes

- User data persists to local JSON file
- API calls require authentication token
- Dark mode uses system preference by default
```

---

## Tips

1. **Mark completed phases**: Use checkmarks or "COMPLETE" labels so AI knows what's done
2. **Order matters**: List tasks in the order they should be implemented
3. **Be specific about files**: Include full paths to avoid ambiguity
4. **Note dependencies**: If Task B requires Task A, make that clear
5. **Update as you go**: Keep this document current so AI assistants have accurate context
