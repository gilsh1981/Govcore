# Bugs Found & Fixed — Phase 0

| Date | Bug | Files Changed |
|------|-----|---------------|
| 2026-05-29 | `<SelectItem value="">` crashes Radix Select — "value prop must not be empty string". Chairperson select in Create Committee and Assignee select in Create Task both used `value=""` as a sentinel for "no selection". Fixed by replacing with `value="none"` and updating submit logic to map `"none"` → `undefined`. | `src/components/committees/create-committee-dialog.tsx`, `src/components/tasks/create-task-dialog.tsx` |
