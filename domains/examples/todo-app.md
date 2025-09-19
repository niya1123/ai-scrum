# Domain: ToDo App MVP

## Overview
- Users can create, list, toggle, and delete tasks.
- Persist in memory (initial), later swappable storage.

## Primary Entities
- Task: { id, title, done, createdAt }

## API (suggested)
- GET /api/tasks -> Task[]
- POST /api/tasks { title } -> Task
- PATCH /api/tasks/:id { done } -> Task
- DELETE /api/tasks/:id -> { ok: true }

## UI (suggested)
- Input: #new_task
- List region: role=list name=tasks

## Acceptance Style
- Use AC IDs with prefix TDA-, e.g. TDA-001.

