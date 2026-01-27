# Gym Track - Development Workflow Rules

## Overview

This project enforces a disciplined agent-driven development workflow. All contributors must follow these rules to ensure quality, consistency, and maintainability.

---

## Golden Rules

1. **Every change gets its own branch** - No direct commits to main
2. **Plan before you build** - Requirements first, then architecture, then code
3. **Review everything** - Code review after changes, security review before merge
4. **Document as you go** - Keep docs synchronized with code

---

## Development Workflow (6 Phases)

### Phase 1: Requirements Gathering (use `/plan` skill)

Before ANY implementation work begins:
- Use the `/plan` skill to brainstorm and capture requirements
- Identify all user stories and acceptance criteria
- Document edge cases and constraints
- Clarify scope and non-goals
- Save requirements to `docs/plans/[feature-name].md`

```
/plan
I want to add a feature that tracks workout streaks
```

**Output:** A requirements document with:
- Feature overview and goals
- User stories
- Acceptance criteria
- Edge cases
- Open questions resolved

---

### Phase 2: System Design (use `architect` agent)

After requirements are captured:
- Use the **architect agent** to design the system
- Base design on the requirements document from Phase 1
- Evaluate architectural trade-offs
- Document technical decisions with rationale
- Save architecture to `docs/architecture/[feature-name].md`

```
Use the architect agent to design the streak tracking system based on docs/plans/streak-tracking.md
```

**Output:** Architecture document with:
- System design and data flow
- Database schema changes
- API contracts
- Component structure
- Technical trade-offs considered

---

### Phase 3: Implementation Planning (use `planner` agent)

After architecture is approved:
- Use the **planner agent** to create detailed implementation steps
- Reference both requirements and architecture documents
- Break down into small, testable increments
- Include testing strategy

```
Use the planner agent to create implementation plan based on the architecture document
```

**Output:** Step-by-step implementation plan with:
- Numbered tasks (10-20 steps)
- Files to create/modify
- Testing approach per step
- Verification criteria

---

### Phase 4: Implementation

**BEFORE writing any code:**
```bash
git checkout -b feature/[descriptive-name]
# or
git checkout -b fix/[descriptive-name]
```

Then implement following the plan from Phase 3.

**Branch naming conventions:**
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation only
- `perf/` - Performance improvements

---

### Phase 5: Code Review (use `code-reviewer` agent)

After ANY code changes:
- Use the **code-reviewer agent** immediately
- Address all critical and warning issues
- Do not proceed until review passes

```
Use the code-reviewer agent to review the changes I just made
```

**Must pass before proceeding:**
- No critical issues
- All warnings addressed or justified
- Code follows project patterns

---

### Phase 6: Pre-Merge (use `security-reviewer` agent)

Before merging to main:
- Use the **security-reviewer agent**
- Check for vulnerabilities, exposed secrets, injection risks
- Fix all security issues

```
Use the security-reviewer agent to check for security issues before merging
```

**Then merge:**
```bash
git checkout main
git merge [branch-name] --no-ff
git branch -d [branch-name]
git push
```

---

### Ongoing: Documentation (use `doc-updater` agent)

As features are implemented:
- Use the **doc-updater agent** to keep docs current
- Update codemaps, README, CHANGELOG
- Run after significant changes

```
Use the doc-updater agent to update documentation for the new feature
```

---

## Workflow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│  1. REQUIREMENTS (/plan skill)                                  │
│     └─> docs/plans/[feature].md                                 │
├─────────────────────────────────────────────────────────────────┤
│  2. ARCHITECTURE (architect agent)                              │
│     └─> docs/architecture/[feature].md                          │
├─────────────────────────────────────────────────────────────────┤
│  3. PLANNING (planner agent)                                    │
│     └─> Step-by-step implementation plan                        │
├─────────────────────────────────────────────────────────────────┤
│  4. IMPLEMENTATION                                              │
│     └─> git checkout -b feature/[name]                          │
│     └─> Write code following the plan                           │
├─────────────────────────────────────────────────────────────────┤
│  5. CODE REVIEW (code-reviewer agent)                           │
│     └─> Fix all issues before proceeding                        │
├─────────────────────────────────────────────────────────────────┤
│  6. SECURITY REVIEW (security-reviewer agent)                   │
│     └─> Fix vulnerabilities before merge                        │
├─────────────────────────────────────────────────────────────────┤
│  7. MERGE & DOCUMENT                                            │
│     └─> Merge to main, delete branch, push                      │
│     └─> Update docs (doc-updater agent)                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference

| Phase | Tool | Output |
|-------|------|--------|
| Requirements | `/plan` skill | `docs/plans/[feature].md` |
| Architecture | `architect` agent | `docs/architecture/[feature].md` |
| Planning | `planner` agent | Implementation steps |
| Implementation | Git branch | Code changes |
| Code Review | `code-reviewer` agent | Review report |
| Security | `security-reviewer` agent | Security report |
| Documentation | `doc-updater` agent | Updated docs |

---

## When to Skip Steps

| Scenario | Can Skip |
|----------|----------|
| Typo/formatting fix | Skip requirements, architecture, planning |
| Small bug fix | Skip architecture (still need requirements + review) |
| Documentation only | Skip architecture, security review |
| Emergency hotfix | Compress timeline, but follow all steps |

**Never skip:** Branch creation, code review, security review (for code changes)

---

## Project Standards

### Code Style
- TypeScript with strict mode
- React functional components with hooks
- Drizzle ORM for database queries
- Follow existing patterns in codebase

### Testing
- Write tests for new functionality
- Run `npx tsc --noEmit` before committing
- Test on iOS simulator before merging

### Commits
- Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `perf:`
- Include `Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>` when AI-assisted
- Reference issue numbers when applicable

---

## Directory Structure

```
gym-track/
├── CLAUDE.md                    # This file - workflow rules
├── docs/
│   ├── plans/                   # Requirements documents
│   ├── architecture/            # System design documents
│   ├── CODEMAPS/               # Auto-generated code maps
│   └── API.md                  # API documentation
├── .claude/
│   ├── settings.json           # Hooks configuration
│   └── agents/                 # Custom agent configurations
```
