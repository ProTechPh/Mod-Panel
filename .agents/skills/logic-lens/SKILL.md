---
name: logic-lens
description: Performs deep, logic-driven code review using formal reasoning frameworks across 9 risk categories (null/undefined, type safety, concurrency, resource management, security injection, boundary conditions, algorithm correctness, state management, and API contracts).
risk: safe
source: community
date_added: '2026-09-14'
---

# Logic Lens

## Overview

Logic Lens is a skill that performs deep, logic-driven code review using formal reasoning frameworks. Unlike traditional linters that check syntax and style, Logic Lens analyzes your code for logical errors, race conditions, security vulnerabilities, type mismatches, and algorithmic flaws that only appear when you reason through the code's behavior.

Powered by structured AI analysis, Logic Lens applies systematic logical inspection across 9 risk categories: null/undefined handling, type safety, concurrency, resource management, security injection, boundary conditions, algorithm correctness, state management, and API contract violations.

## When to Use This Skill

- Use when you want a thorough logic review before merging a PR
- Use when a bug seems hard to find and standard linters aren't helping
- Use when reviewing security-sensitive code paths (auth, payments, file access)
- Use when refactoring complex business logic
- Use when onboarding to a new codebase and need to understand risk areas

## How It Works

Logic Lens uses reasoning capabilities to:

1. Parse code structure and build a mental model of data flow
2. Apply formal logic checks across 9 risk categories
3. Trace execution paths for edge cases and boundary conditions
4. Identify security anti-patterns (injection, privilege escalation, data leakage)
5. Report findings with severity levels and actionable fix suggestions

## The 9 Risk Categories

| Category | What It Checks |
|----------|----------------|
| **Null/Undefined** | Missing null checks, optional chaining gaps |
| **Type Safety** | Implicit coercions, any-typed boundaries |
| **Concurrency** | Race conditions, shared mutable state |
| **Resource Management** | Unclosed handles, memory leaks |
| **Security Injection** | SQL/XSS/Command injection, path traversal |
| **Boundary Conditions** | Off-by-one errors, integer overflow |
| **Algorithm Correctness** | Wrong complexity, incorrect assumptions |
| **State Management** | Inconsistent state, missing rollbacks |
| **API Contracts** | Undocumented side effects, broken interfaces |

## Review Procedures & Steps

1. **Scope the Review**: Determine the target files, modules, or git diffs to inspect.
2. **Path Tracing & Logic Mapping**:
   - Trace control flow from input to output across typical, edge-case, and failure paths.
   - Audit state transitions and verify invariants hold across async boundaries.
3. **Checklist Inspection (9 Risk Dimensions)**:
   - Verify non-nullable assumptions and fallback values.
   - Check mutexes, transactions, and race windows in concurrent or async code.
   - Audit data sanitation, auth token verification, and parameterized queries.
   - Verify array bounds, off-by-one loops, zero/negative bounds, and rate limiters.
4. **Synthesize Findings**:
   - Format findings with severity (`[CRITICAL]`, `[HIGH]`, `[MEDIUM]`, `[LOW]`), exact line references, root cause explanations, and concrete code remediations.

## Examples

### Example 1: Review a Single File

```
Review src/auth/login.ts for security issues and edge cases
```

**Logic Lens output:**
```
[CRITICAL] SQL Injection risk at line 42: user input concatenated into query string
[HIGH] Missing rate limiting on login attempts
[MEDIUM] Password comparison uses == instead of timing-safe comparison
[LOW] Error messages may leak valid usernames (user enumeration)
```

### Example 2: Full Repository Scan

```
Scan the entire codebase and prioritize findings by severity
```

### Example 3: Pre-PR Review

```
Review all files changed in this branch before opening a PR
```

## Best Practices

- Run Logic Lens on authentication and payment code before every release
- Combine with linting/validation for full coverage: style + logic
- Review the CRITICAL and HIGH findings first; LOW findings can be deferred
- Use Logic Lens on legacy code you are about to modify to understand risk surface

## Benchmark Results

Logic Lens is designed to catch issues typically missed by linters and basic static analysis:

- **Logic and semantic bugs** that compile cleanly but fail at runtime
- **Race conditions** in async code that static analysis misses
- **Security vulnerabilities** identified before deployment in CI pipeline

## Related Skills

- `security-scanning-security-hardening` — Specialized security-only deep scan and defense-in-depth
- `bug-hunt-swarm` — Use when logic-lens findings require deep multi-agent tracing and reproduction

## Additional Resources

- [GitHub Repository](https://github.com/hyhmrright/logic-lens)
- [Dev.to Article: Why AI Code Review Misses the Most Dangerous Bugs](https://dev.to/hyhmrright/why-ai-code-review-misses-the-most-dangerous-bugs-logic-lens-fixes-that-4a8l)

## Limitations

Use this skill only when the task clearly matches the scope described above (code review and logic analysis). Logic Lens provides AI-powered analysis and should be combined with human review and automated test suites for production-critical decisions. Do not treat the output as a substitute for environment-specific testing or security audits.
