# Project Brief

This file provides a high-level overview of your project for AI assistants like Claude. It should answer the fundamental questions: **What are you building and why?**

## Purpose

A project brief helps AI assistants understand:

- The problem you're solving
- Who the users are
- What the core functionality should be
- Key constraints or requirements

## Recommended Sections

### Overview

A 2-3 sentence summary of what the application does and its primary purpose.

### Input Data

If your app processes data, describe:

- What data sources it uses (files, APIs, databases)
- The format and structure of input data
- Any data validation requirements

### Core User Flow

Describe the main user journey through your app:

1. What does the user do first?
2. What are the key interactions?
3. What is the end result?

### Technical Considerations

- External APIs or services used
- State management approach
- Data persistence strategy
- IPC handlers needed (for Electron apps)

### MVP Scope

List the minimum features needed for a working first version. This helps AI assistants prioritize and avoid over-engineering.

### Future Enhancements

Ideas for features to add after the MVP is complete. Keeping these separate helps maintain focus.

---

## Example

```markdown
# Task Manager App - Project Brief

## Overview

A desktop task management app that helps users organize their daily work with categories, due dates, and priority levels.

## Core User Flow

1. User creates task categories (Work, Personal, etc.)
2. User adds tasks with title, description, due date, and priority
3. User marks tasks complete or reschedules them
4. User views tasks filtered by category, date, or status

## Technical Considerations

- Local SQLite database for persistence
- IPC handlers for CRUD operations
- React Query for data fetching

## MVP Scope

- Create/edit/delete tasks
- Basic category support
- Due date filtering
- Local persistence

## Future Enhancements

- Cloud sync
- Recurring tasks
- Calendar integration
```
