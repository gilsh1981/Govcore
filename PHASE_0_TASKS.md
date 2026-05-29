# Phase 0 — Stabilize & Secure the Foundation

**Goal:** make what already exists actually work and be safe. No new features in this phase.

## Tasks

- [x] Replace hardcoded "admin123" password with proper bcrypt authentication
- [x] Create seed data (organization + admin user giladin.sh@gmail.com)
- [ ] Fix bugs across committees, meetings, decisions, and tasks (ongoing — see BUGS_FOUND.md)
- [ ] Connect a real file storage backend so uploaded files are actually saved
- [x] Wire OrgSwitcher to real data instead of mock data
- [ ] Start background workers properly (sync, recurrence)
- [ ] Add a basic automated test suite

## Exit criteria

A clean install can be set up, a real user can log in securely, the core loop (committees → meetings → decisions → tasks) works end-to-end without crashing, and uploaded files persist.
