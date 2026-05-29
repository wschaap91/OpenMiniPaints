---
version: 2
status: deferred
date: 2026-05-27
author: /review
previous: prd-v1.md
---

# Deferred Findings

Review findings that scored 50-79 — real but below the noise threshold. These inform the next planning cycle.

## PR #20 — feat: v1 paint catalog pipeline (2026-05-27)

### Pattern: code-quality (2 findings)

| Score | File | Finding | Suggestion |
|-------|------|---------|------------|
| 76 | scripts/enrich/hex-extractor.ts:123 | `parseInt(cursor, 10)` silently produces NaN for malformed cursor input, coerces to 0, returns first page with no error signal | Validate cursor before use: `if (cursor && (isNaN(Number(cursor)) || Number(cursor) < 0)) throw new Error(...)` |
| 62 | scripts/enrich/hex-extractor.ts:83-90 | `--brand` flag with no value passes `undefined` to processBrand; validation catches it incidentally via `KNOWN_BRANDS.includes(undefined)` being false | Add explicit guard: `const brandArg = args[brandIdx + 1]; if (!brandArg || !KNOWN_BRANDS.includes(brandArg)) { ... }` |

### Pattern: silent-failure-hunter (1 finding)

| Score | File | Finding | Suggestion |
|-------|------|---------|------------|
| 76 | scripts/scrape/army-painter.ts:59, proacryl.ts:59 | Bare `catch {}` swallows HTML/JSON parse errors with no log — operator can't distinguish network error from parse bug from site structure change | Add `catch (e) { console.warn('[army-painter] live parse failed, using seed:', e) }` |

### Pattern: comment-analyzer (1 finding)

| Score | File | Finding | Suggestion |
|-------|------|---------|------------|
| 52 | scripts/import.ts:59 | Comment says "stay within Convex's 32k document-read limit" but actual reason is per-mutation argument size and execution time budget | Rewrite: `// Split into batches to stay within Convex's per-mutation argument size and execution time limits.` |

## PR #23 — fix: PRD v2 deferred quality fixes — error logging and flag validation (2026-05-29)

### Pattern: code-simplifier (1 finding)

| Score | File | Finding | Suggestion |
|-------|------|---------|------------|
| 50 | scripts/enrich/hex-extractor.ts:96-108 | `brandIdx !== -1` checked 3 times across 5 lines; `as string` cast and `!` non-null assertion needed only because `brandArg` is declared in outer scope before guard exits | Collapse into single `if (brandIdx !== -1)` block — declare `brandArg` inside, `let brands = KNOWN_BRANDS` outside; eliminates cast, assertion, and repeated sentinel |
