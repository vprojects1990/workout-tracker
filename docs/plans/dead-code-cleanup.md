# Dead Code Cleanup Plan

## Constraint
- No functionality removed or altered. Only dead/unreachable code is touched.

---

## Step 1: Remove Expo template boilerplate files

These files are leftover from `create-expo-app` and are never used in the app:

| File | Reason |
|------|--------|
| `app/modal.tsx` | No code navigates to `/modal` |
| `components/EditScreenInfo.tsx` | Only used by `modal.tsx` |
| `components/StyledText.tsx` | Only used by `EditScreenInfo.tsx` and dead test |
| `components/ExternalLink.tsx` | Only used by `EditScreenInfo.tsx` |
| `components/__tests__/StyledText-test.js` | Tests dead `MonoText` component |

## Step 2: Remove unused web-only files

These files only apply to web builds, which the app does not target:

| File | Reason |
|------|--------|
| `app/+html.tsx` | Web-only HTML wrapper |
| `components/useClientOnlyValue.ts` | Never called by app code |
| `components/useClientOnlyValue.web.ts` | Never called by app code |
| `components/useColorScheme.web.ts` | Web platform variant, unused |

## Step 3: Remove unused insights components

The `components/insights/` directory is never imported by any screen:

| File | Reason |
|------|--------|
| `components/insights/index.ts` | Barrel file, never imported |
| `components/insights/SummaryStats.tsx` | Never imported outside folder |
| `components/insights/ProgressSparkline.tsx` | Never imported outside folder |

## Step 4: Remove unused exports

Remove exports that are never referenced outside their files. The functions/constants themselves remain if used internally.

| Export | File | Action |
|--------|------|--------|
| `getShadow` | `constants/Shadows.ts` | Remove function entirely (never called) |
| `FontFamilies` | `constants/Typography.ts` | Remove export keyword or constant (never used) |
| `FontWeights` | `constants/Typography.ts` | Remove export keyword or constant (never used) |
| `Gap` | `constants/Spacing.ts` | Remove export keyword or constant (never used) |
| `useThemeColor` | `components/Themed.tsx` | Keep function (used internally), remove `export` |
| `useIsDarkMode` | `components/Themed.tsx` | Remove function entirely (never called) |
| `withErrorBoundary` | `components/ErrorBoundary.tsx` | Remove HOC entirely (never called) |
| `ErrorFallback` | `components/ErrorBoundary.tsx` | Remove export keyword (used internally by ErrorBoundary) |

## Step 5: Remove unused dependencies

| Package | Type | Reason |
|---------|------|--------|
| `expo-web-browser` | dependency | Only imported in dead `ExternalLink.tsx` |
| `react-native-web` | dependency | No source imports; web not targeted |
| `react-dom` | dependency | No source imports; web not targeted |
| `react-test-renderer` | devDependency | Only used in dead `StyledText-test.js` |

**NOT removing** (needs verification):
- `expo-status-bar` — Expo may use it implicitly via the framework
- `sharp` — used by `scripts/generate-icons.mjs` utility script

## Out of scope (requires functional changes)

The following were identified but are **excluded** because they would alter functionality or architecture:

- **Duplicate "Add Exercise" modal** across 3 workout screens — extracting to a shared component is a refactor, not dead code removal
- **`useColorScheme` re-export chain** — simplifying the indirection changes the import structure

---

## Verification

After each step:
1. `npx tsc --noEmit` — ensure no type errors
2. `npm test` — ensure all 30 tests pass
3. Manual check that no import references the removed files
