# Financial Calculator Project Roadmap

A comprehensive task list for implementing improvements to the financial-calc project, organized by phases with specific file paths, implementation steps, time estimates, and dependencies.

---

## Phase 1: Critical Fixes (Week 1-2)

Priority: High | Duration: 2 weeks

### 1.1 Fix Accessibility Issues

**Status:** 🔴 Critical  
**Estimated Time:** 12-16 hours  
**Files to Modify:**
- `src/app/layout.tsx`
- `src/components/layout/app-layout.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/app/*/page.tsx` (all page files)

**Implementation Steps:**

#### 1.1.1 Add Skip Links
1. Create new component `src/components/ui/skip-link.tsx`
   - Implement skip to main content link
   - Style with `sr-only focus:not-sr-only` classes
   - Add keyboard focus styles

2. Update `src/components/layout/app-layout.tsx`
   - Add SkipLink component at the top of the layout
   - Ensure it links to `<main id="main-content">`

3. Update `src/app/layout.tsx`
   - Add `id="main-content"` to main element
   - Add `tabIndex={-1}` to main for programmatic focus

#### 1.1.2 Add aria-live Regions for Dynamic Content
1. Update `src/app/equity/page.tsx`
   - Wrap result displays in `aria-live="polite"` containers
   - Add `aria-atomic="true"` for complete announcements
   - Example implementation:
     ```tsx
     <div aria-live="polite" aria-atomic="true">
       <div className="text-5xl font-bold text-primary tracking-tighter">
         {(capmResult * 100).toFixed(2)}%
       </div>
     </div>
     ```

2. Update `src/app/bonds/page.tsx`
   - Add aria-live regions for all four metric cards
   - Include loading state announcements

3. Update `src/app/tvm/page.tsx`
   - Add aria-live regions for calculation results
   - Add aria-describedby linking inputs to results

#### 1.1.3 Associate Error Messages with Inputs
1. Update `src/components/ui/input.tsx`
   - Add support for `aria-describedby` prop
   - Add `aria-invalid` when error exists
   - Add `aria-errormessage` for error association

2. Update `src/components/ui/label.tsx`
   - Ensure `htmlFor` attribute is properly linked
   - Add `id` prop support for error message association

3. Update all calculator pages to link errors:
   ```tsx
   <Label htmlFor="rf">Risk-free Rate</Label>
   <Input 
     id="rf" 
     aria-describedby="rf-error rf-help"
     aria-invalid={!!rfError}
   />
   <p id="rf-error" role="alert">{rfError}</p>
   <p id="rf-help" className="sr-only">Enter as percentage (e.g., 3.5 for 3.5%)</p>
   ```

#### 1.1.4 Add Screen Reader Only Text
1. Update `src/lib/i18n.tsx`
   - Add aria-label translations for all inputs
   - Add descriptive text for complex calculations

2. Update calculator pages
   - Add `<span className="sr-only">` for icon-only buttons
   - Add descriptive labels for chart elements

**Dependencies:** None  
**Testing:** Use NVDA/VoiceOver to verify announcements

---

### 1.2 Add XSS Protection for Displayed User Inputs

**Status:** 🔴 Critical  
**Estimated Time:** 8-12 hours  
**Files to Modify:**
- `src/lib/utils.ts`
- `src/app/*/page.tsx` (all pages with user input display)
- `src/components/ui/error-display.tsx`

**Implementation Steps:**

#### 1.2.1 Create HTML Escaping Utility
1. Update `src/lib/utils.ts`
   - Add `escapeHtml()` function:
     ```typescript
     export function escapeHtml(unsafe: string): string {
       return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
     }
     ```

2. Add `sanitizeNumber()` function:
   ```typescript
   export function sanitizeNumber(value: string): string {
     // Remove any non-numeric characters except decimal point and minus
     return value.replace(/[^0-9.-]/g, "");
   }
   ```

#### 1.2.2 Update Input Components
1. Update `src/components/ui/input.tsx`
   - Sanitize value on change before setting state
   - Prevent XSS in input value attribute

2. Update all calculator pages to use sanitization:
   ```tsx
   onChange={(e) => {
     const sanitized = sanitizeNumber(e.target.value);
     setRf(sanitized);
   }}
   ```

#### 1.2.3 Update Display Components
1. Update `src/components/ui/error-display.tsx`
   - Escape error messages before display
   - Use dangerouslySetInnerHTML safely if needed

2. Update result displays in all pages:
   ```tsx
   // Before (vulnerable)
   <div>{userInput}</div>
   
   // After (safe)
   <div>{escapeHtml(userInput)}</div>
   ```

**Dependencies:** None  
**Testing:** Try injecting `<script>alert('xss')</script>` in inputs

---

### 1.3 Implement Calculation Memoization on Equity and Bonds Pages

**Status:** 🟡 Important  
**Estimated Time:** 6-8 hours  
**Files to Modify:**
- `src/app/equity/page.tsx`
- `src/app/bonds/page.tsx`

**Implementation Steps:**

#### 1.3.1 Add useMemo to Equity Page
1. Update `src/app/equity/page.tsx`
   - Wrap CAPM calculation in useMemo:
     ```tsx
     const capmResult = useMemo(() => {
       return Finance.capm(
         parseFloat(rf) / 100 || 0, 
         parseFloat(beta) || 0, 
         parseFloat(rm) / 100 || 0
       );
     }, [rf, beta, rm]);
     ```

   - Wrap WACC calculation in useMemo:
     ```tsx
     const waccResult = useMemo(() => {
       return Finance.wacc(
         parseFloat(equity) || 0,
         parseFloat(debt) || 0,
         (parseFloat(costEquity) || 0) / 100,
         (parseFloat(costDebt) || 0) / 100,
         (parseFloat(taxRate) || 0) / 100
       );
     }, [equity, debt, costEquity, costDebt, taxRate]);
     ```

   - Wrap DDM calculation in useMemo:
     ```tsx
     const ddmResult = useMemo(() => {
       return Finance.ddm(
         parseFloat(div) || 0,
         (parseFloat(reqReturn) || 0) / 100,
         (parseFloat(growth) || 0) / 100
       );
     }, [div, reqReturn, growth]);
     ```

#### 1.3.2 Verify Bonds Page Memoization
1. Review `src/app/bonds/page.tsx`
   - Already has useMemo for metrics (line 21) ✓
   - Already has useMemo for chartData (line 36) ✓
   - Document the existing implementation

**Dependencies:** None  
**Testing:** Add console.log in Finance functions to verify memoization

---

### 1.4 Add Missing Return Types to Finance-Math Functions

**Status:** 🟡 Important  
**Estimated Time:** 4-6 hours  
**Files to Modify:**
- `src/lib/finance-math.ts`

**Implementation Steps:**

#### 1.4.1 Define Return Type Interfaces
1. Add at top of `src/lib/finance-math.ts`:
   ```typescript
   // Return type interfaces
   interface AmortizationEntry {
     period: number;
     payment: number;
     principal: number;
     interest: number;
     balance: number;
   }

   interface BondDuration {
     macDuration: number;
     modDuration: number;
   }

   interface Greeks {
     delta: number;
     gamma: number;
     theta: number;
     vega: number;
     rho: number;
   }
   ```

#### 1.4.2 Add Return Types to Functions
1. Update amortizationSchedule:
   ```typescript
   amortizationSchedule: (
     principal: number, 
     rate: number, 
     nper: number, 
     method: "CPM" | "CAM" = "CPM"
   ): AmortizationEntry[] => { ... }
   ```

2. Update bondPrice:
   ```typescript
   bondPrice: (
     faceValue: number, 
     couponRate: number, 
     yearsToMaturity: number, 
     ytm: number, 
     frequency: number = 2
   ): number => { ... }
   ```

3. Update bondDuration:
   ```typescript
   bondDuration: (
     faceValue: number,
     couponRate: number,
     yearsToMaturity: number,
     ytm: number,
     frequency: number = 2
   ): BondDuration => { ... }
   ```

4. Update bondConvexity:
   ```typescript
   bondConvexity: (
     faceValue: number,
     couponRate: number,
     yearsToMaturity: number,
     ytm: number,
     frequency: number = 2
   ): number => { ... }
   ```

5. Update blackScholes:
   ```typescript
   blackScholes: (
     type: "call" | "put", 
     S: number, 
     K: number, 
     t: number, 
     r: number, 
     sigma: number
   ): number => { ... }
   ```

6. Update greeks:
   ```typescript
   greeks: (
     type: "call" | "put", 
     S: number, 
     K: number, 
     t: number, 
     r: number, 
     sigma: number
   ): Greeks => { ... }
   ```

7. Export interfaces for external use:
   ```typescript
   export type { AmortizationEntry, BondDuration, Greeks };
   ```

**Dependencies:** None  
**Testing:** Run `npx tsc --noEmit` to verify no type errors

---

### 1.5 Remove Backup/Patch Files from Repository

**Status:** 🔴 Critical  
**Estimated Time:** 1-2 hours  
**Files to Delete:**
- `src/lib/finance-math.ts.backup`

**Implementation Steps:**

#### 1.5.1 Remove Backup Files
1. Delete backup file:
   ```bash
   rm src/lib/finance-math.ts.backup
   ```

#### 1.5.2 Update .gitignore
1. Update `.gitignore` at project root:
   ```gitignore
   # Backup files
   *.backup
   *.bak
   *.orig
   *.rej
   *~
   
   # Patch files
   *.patch
   *.diff
   
   # Temp files
   .DS_Store
   Thumbs.db
   ```

#### 1.5.3 Add Pre-commit Hook Check (Optional)
1. Update `.husky/pre-commit` if exists:
   ```bash
   # Check for backup files
   if git diff --cached --name-only | grep -E '\.(backup|bak|orig)$'; then
     echo "Error: Backup files should not be committed"
     exit 1
   fi
   ```

**Dependencies:** None  
**Testing:** Verify backup file is gone and .gitignore works

---

## Phase 1 Summary

| Task | Priority | Est. Hours | Dependencies |
|------|----------|------------|--------------|
| 1.1 Accessibility fixes | Critical | 12-16 | None |
| 1.2 XSS protection | Critical | 8-12 | None |
| 1.3 Memoization | Important | 6-8 | None |
| 1.4 Return types | Important | 4-6 | None |
| 1.5 Remove backup files | Critical | 1-2 | None |
| **Total** | | **31-44 hours** | |

---

## Phase 2: Quality Improvements (Week 3-4)

Priority: High | Duration: 2 weeks

### 2.1 Split Finance-Math.ts into Domain Modules

**Status:** 🟡 Important  
**Estimated Time:** 16-20 hours  
**Files to Create:**
- `src/lib/finance/tvm.ts`
- `src/lib/finance/bonds.ts`
- `src/lib/finance/equity.ts`
- `src/lib/finance/options.ts`
- `src/lib/finance/macro.ts`
- `src/lib/finance/index.ts`
- `src/lib/finance/types.ts`

**Files to Modify:**
- `src/lib/finance-math.ts` (deprecate, create re-exports)
- All import statements across project

**Implementation Steps:**

#### 2.1.1 Create Shared Types Module
1. Create `src/lib/finance/types.ts`:
   ```typescript
   export interface AmortizationEntry {
     period: number;
     payment: number;
     principal: number;
     interest: number;
     balance: number;
   }

   export interface BondDuration {
     macDuration: number;
     modDuration: number;
   }

   export interface Greeks {
     delta: number;
     gamma: number;
     theta: number;
     vega: number;
     rho: number;
   }

   export type OptionType = "call" | "put";
   export type AmortizationMethod = "CPM" | "CAM";
   ```

#### 2.1.2 Create Domain Modules
1. Create `src/lib/finance/tvm.ts`:
   ```typescript
   import { isValid } from "./utils";
   
   export function pv(rate: number, nper: number, pmt: number, fv = 0, type: 0 | 1 = 0): number { ... }
   export function fv(rate: number, nper: number, pmt: number, pv: number, type: 0 | 1 = 0): number { ... }
   // ... other TVM functions
   ```

2. Create `src/lib/finance/bonds.ts`:
   ```typescript
   import { isValid } from "./utils";
   import type { BondDuration } from "./types";
   
   export function bondPrice(...): number { ... }
   export function bondDuration(...): BondDuration { ... }
   export function bondConvexity(...): number { ... }
   ```

3. Create `src/lib/finance/equity.ts`:
   ```typescript
   import { isValid } from "./utils";
   
   export function capm(rf: number, beta: number, rm: number): number { ... }
   export function wacc(...): number { ... }
   export function ddm(d1: number, r: number, g: number): number { ... }
   ```

4. Create `src/lib/finance/options.ts`:
   ```typescript
   import { isValid } from "./utils";
   import type { OptionType, Greeks } from "./types";
   
   export function normCDF(x: number): number { ... }
   export function normPDF(x: number): number { ... }
   export function blackScholes(type: OptionType, ...): number { ... }
   export function greeks(type: OptionType, ...): Greeks { ... }
   ```

5. Create `src/lib/finance/macro.ts`:
   ```typescript
   import { isValid } from "./utils";
   
   export function inflationRate(...): number { ... }
   export function purchasingPower(...): number { ... }
   // ... other macro functions
   ```

6. Create `src/lib/finance/utils.ts`:
   ```typescript
   export const isValid = (n: number): boolean => 
     Number.isFinite(n) && !Number.isNaN(n);
   ```

#### 2.1.3 Create Index Module
1. Create `src/lib/finance/index.ts`:
   ```typescript
   // Re-export all functions
   export * from "./tvm";
   export * from "./bonds";
   export * from "./equity";
   export * from "./options";
   export * from "./macro";
   export * from "./types";
   
   // Maintain backward compatibility with Finance object
   import * as tvm from "./tvm";
   import * as bonds from "./bonds";
   import * as equity from "./equity";
   import * as options from "./options";
   import * as macro from "./macro";
   
   export const Finance = {
     ...tvm,
     ...bonds,
     ...equity,
     ...options,
     ...macro,
   };
   ```

#### 2.1.4 Deprecate Old Module
1. Update `src/lib/finance-math.ts`:
   ```typescript
   /**
    * @deprecated Use @/lib/finance instead
    * This file is kept for backward compatibility
    */
   export * from "./finance";
   export { Finance } from "./finance";
   ```

2. Create codemod script `scripts/migrate-imports.js`:
   ```javascript
   // Script to update imports across the codebase
   // Run: node scripts/migrate-imports.js
   ```

**Dependencies:** Phase 1.4 (return types)  
**Testing:** All existing tests must pass, no breaking changes

---

### 2.2 Add Comprehensive Page Component Tests

**Status:** 🟡 Important  
**Estimated Time:** 20-24 hours  
**Files to Create:**
- `src/app/equity/page.test.tsx`
- `src/app/bonds/page.test.tsx`
- `src/app/tvm/page.test.tsx`
- `src/app/loans/page.test.tsx`
- `src/app/options/page.test.tsx`
- `src/app/macro/page.test.tsx`
- `src/app/portfolio/page.test.tsx`
- `src/app/risk/page.test.tsx`
- `src/app/cash-flow/page.test.tsx`
- `src/test/test-utils.tsx` (shared test utilities)

**Files to Modify:**
- `vitest.config.ts`
- `src/test/setup.ts`

**Implementation Steps:**

#### 2.2.1 Setup Test Infrastructure
1. Update `vitest.config.ts`:
   ```typescript
   export default defineConfig({
     plugins: [react()],
     test: {
       environment: "jsdom",
       setupFiles: ["./src/test/setup.ts"],
       globals: true,
       coverage: {
         provider: "v8",
         reporter: ["text", "html"],
         exclude: [
           "node_modules/",
           "src/test/",
           "**/*.d.ts",
         ],
       },
     },
   });
   ```

2. Update `src/test/setup.ts`:
   ```typescript
   import "@testing-library/jest-dom";
   import { cleanup } from "@testing-library/react";
   import { afterEach } from "vitest";
   
   afterEach(() => {
     cleanup();
   });
   ```

3. Create `src/test/test-utils.tsx`:
   ```typescript
   import { render as rtlRender, RenderOptions } from "@testing-library/react";
   import { ReactElement } from "react";
   import { LanguageProvider } from "@/lib/i18n";
   
   function Providers({ children }: { children: React.ReactNode }) {
     return (
       <LanguageProvider>
         {children}
       </LanguageProvider>
     );
   }
   
   export function render(ui: ReactElement, options?: RenderOptions) {
     return rtlRender(ui, { wrapper: Providers, ...options });
   }
   
   export * from "@testing-library/react";
   ```

#### 2.2.2 Write Page Tests
1. Create `src/app/equity/page.test.tsx`:
   ```typescript
   import { describe, it, expect } from "vitest";
   import { render, screen, fireEvent } from "@/test/test-utils";
   import EquityPage from "./page";
   
   describe("EquityPage", () => {
     it("renders all tabs", () => {
       render(<EquityPage />);
       expect(screen.getByRole("tab", { name: /capm/i })).toBeInTheDocument();
       expect(screen.getByRole("tab", { name: /wacc/i })).toBeInTheDocument();
       expect(screen.getByRole("tab", { name: /ddm/i })).toBeInTheDocument();
     });
     
     it("calculates CAPM correctly", () => {
       render(<EquityPage />);
       const rfInput = screen.getByLabelText(/risk-free rate/i);
       const betaInput = screen.getByLabelText(/beta/i);
       const rmInput = screen.getByLabelText(/market return/i);
       
       fireEvent.change(rfInput, { target: { value: "3.5" } });
       fireEvent.change(betaInput, { target: { value: "1.2" } });
       fireEvent.change(rmInput, { target: { value: "10" } });
       
       expect(screen.getByText("10.30%")).toBeInTheDocument();
     });
     
     it("switches between tabs", async () => {
       render(<EquityPage />);
       const waccTab = screen.getByRole("tab", { name: /wacc/i });
       fireEvent.click(waccTab);
       expect(screen.getByLabelText(/equity value/i)).toBeInTheDocument();
     });
   });
   ```

2. Create tests for other pages following the same pattern

**Dependencies:** Phase 2.1 (domain modules) recommended  
**Testing:** Run `npm run test` - all tests should pass

---

### 2.3 Implement Keyboard Shortcuts and Input Persistence

**Status:** 🟡 Important  
**Estimated Time:** 12-16 hours  
**Files to Create:**
- `src/hooks/use-keyboard-shortcuts.ts`
- `src/hooks/use-persisted-state.ts`
- `src/components/keyboard-shortcuts-help.tsx`

**Files to Modify:**
- `src/app/layout.tsx`
- `src/app/*/page.tsx` (all calculator pages)

**Implementation Steps:**

#### 2.3.1 Create Keyboard Shortcuts Hook
1. Create `src/hooks/use-keyboard-shortcuts.ts`:
   ```typescript
   import { useEffect, useCallback } from "react";
   
   interface Shortcut {
     key: string;
     ctrl?: boolean;
     shift?: boolean;
     alt?: boolean;
     action: () => void;
     description: string;
   }
   
   export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
     const handleKeyDown = useCallback((event: KeyboardEvent) => {
       const shortcut = shortcuts.find(s => {
         if (s.key.toLowerCase() !== event.key.toLowerCase()) return false;
         if (s.ctrl && !event.ctrlKey && !event.metaKey) return false;
         if (s.shift && !event.shiftKey) return false;
         if (s.alt && !event.altKey) return false;
         return true;
       });
       
       if (shortcut) {
         event.preventDefault();
         shortcut.action();
       }
     }, [shortcuts]);
     
     useEffect(() => {
       window.addEventListener("keydown", handleKeyDown);
       return () => window.removeEventListener("keydown", handleKeyDown);
     }, [handleKeyDown]);
   }
   ```

#### 2.3.2 Create Persistence Hook
1. Create `src/hooks/use-persisted-state.ts`:
   ```typescript
   import { useState, useEffect } from "react";
   
   export function usePersistedState<T>(
     key: string, 
     initialValue: T
   ): [T, (value: T | ((prev: T) => T)) => void] {
     const [state, setState] = useState<T>(() => {
       if (typeof window === "undefined") return initialValue;
       try {
         const item = window.localStorage.getItem(key);
         return item ? JSON.parse(item) : initialValue;
       } catch {
         return initialValue;
       }
     });
     
     useEffect(() => {
       try {
         window.localStorage.setItem(key, JSON.stringify(state));
       } catch (e) {
         console.error("Failed to persist state:", e);
       }
     }, [key, state]);
     
     return [state, setState];
   }
   ```

#### 2.3.3 Implement on Calculator Pages
1. Update `src/app/equity/page.tsx`:
   ```typescript
   import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
   import { usePersistedState } from "@/hooks/use-persisted-state";
   
   export default function EquityPage() {
     const [rf, setRf] = usePersistedState("equity.capm.rf", "3.5");
     // ... other persisted states
     
     useKeyboardShortcuts([
       { key: "r", ctrl: true, action: () => resetAll(), description: "Reset all inputs" },
       { key: "c", ctrl: true, action: () => copyResults(), description: "Copy results" },
       { key: "?", action: () => setShowHelp(true), description: "Show keyboard shortcuts" },
     ]);
     
     // ... rest of component
   }
   ```

#### 2.3.4 Create Help Component
1. Create `src/components/keyboard-shortcuts-help.tsx`:
   ```typescript
   export function KeyboardShortcutsHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
     const shortcuts = [
       { key: "Ctrl + R", description: "Reset all inputs" },
       { key: "Ctrl + C", description: "Copy results to clipboard" },
       { key: "Ctrl + S", description: "Save calculation" },
       { key: "?", description: "Show this help" },
     ];
     
     return (
       <Dialog open={open} onOpenChange={onClose}>
         <DialogContent>
           <DialogTitle>Keyboard Shortcuts</DialogTitle>
           <div className="space-y-2">
             {shortcuts.map(s => (
               <div key={s.key} className="flex justify-between">
                 <kbd className="px-2 py-1 bg-muted rounded">{s.key}</kbd>
                 <span>{s.description}</span>
               </div>
             ))}
           </div>
         </DialogContent>
       </Dialog>
     );
   }
   ```

**Dependencies:** None  
**Testing:** Verify shortcuts work, persistence survives page reload

---

### 2.4 Add Shareable URLs with State Encoding

**Status:** 🟡 Important  
**Estimated Time:** 10-14 hours  
**Files to Create:**
- `src/lib/url-state.ts`
- `src/hooks/use-url-state.ts`
- `src/components/share-button.tsx`

**Files to Modify:**
- `src/app/*/page.tsx` (all calculator pages)

**Implementation Steps:**

#### 2.4.1 Create URL State Utilities
1. Create `src/lib/url-state.ts`:
   ```typescript
   export function encodeState(state: Record<string, string>): string {
     const params = new URLSearchParams();
     Object.entries(state).forEach(([key, value]) => {
       if (value) params.set(key, value);
     });
     return params.toString();
   }
   
   export function decodeState(searchParams: string): Record<string, string> {
     const params = new URLSearchParams(searchParams);
     const state: Record<string, string> = {};
     params.forEach((value, key) => {
       state[key] = value;
     });
     return state;
   }
   
   export function compressState(state: Record<string, string>): string {
     // Use base64 encoding for shorter URLs
     const json = JSON.stringify(state);
     return btoa(json);
   }
   
   export function decompressState(compressed: string): Record<string, string> {
     try {
       const json = atob(compressed);
       return JSON.parse(json);
     } catch {
       return {};
     }
   }
   ```

#### 2.4.2 Create URL State Hook
1. Create `src/hooks/use-url-state.ts`:
   ```typescript
   import { useState, useEffect } from "react";
   import { useSearchParams, useRouter } from "next/navigation";
   import { encodeState, decodeState } from "@/lib/url-state";
   
   export function useUrlState(prefix: string) {
     const router = useRouter();
     const searchParams = useSearchParams();
     const [isInitialized, setIsInitialized] = useState(false);
     
     const getParam = (key: string): string | null => {
       return searchParams.get(`${prefix}.${key}`);
     };
     
     const setParams = (updates: Record<string, string>) => {
       const params = new URLSearchParams(searchParams.toString());
       Object.entries(updates).forEach(([key, value]) => {
         const fullKey = `${prefix}.${key}`;
         if (value) {
           params.set(fullKey, value);
         } else {
           params.delete(fullKey);
         }
       });
       router.replace(`?${params.toString()}`, { scroll: false });
     };
     
     return { getParam, setParams, isInitialized };
   }
   ```

#### 2.4.3 Implement on Calculator Pages
1. Update `src/app/equity/page.tsx`:
   ```typescript
   import { useUrlState } from "@/hooks/use-url-state";
   
   export default function EquityPage() {
     const { getParam, setParams } = useUrlState("equity");
     
     const [rf, setRf] = useState(getParam("capm.rf") || "3.5");
     
     useEffect(() => {
       setParams({ "capm.rf": rf });
     }, [rf]);
     
     // ... rest of component
   }
   ```

#### 2.4.4 Create Share Button
1. Create `src/components/share-button.tsx`:
   ```typescript
   import { Button } from "@/components/ui/button";
   import { Share2, Check } from "lucide-react";
   import { useState } from "react";
   
   export function ShareButton() {
     const [copied, setCopied] = useState(false);
     
     const handleShare = async () => {
       const url = window.location.href;
       await navigator.clipboard.writeText(url);
       setCopied(true);
       setTimeout(() => setCopied(false), 2000);
     };
     
     return (
       <Button onClick={handleShare} variant="outline" size="sm">
         {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
         {copied ? "Copied!" : "Share"}
       </Button>
     );
   }
   ```

**Dependencies:** Phase 2.3 (persistence) - can reuse some logic  
**Testing:** Verify URL updates, sharing works across browsers

---

### 2.5 Create Component Documentation with Storybook

**Status:** 🟢 Nice to have  
**Estimated Time:** 16-20 hours  
**Files to Create:**
- `.storybook/main.ts`
- `.storybook/preview.tsx`
- `src/components/ui/*.stories.tsx` (for each UI component)

**Files to Modify:**
- `package.json` (add Storybook scripts and deps)
- `.gitignore` (add Storybook build output)

**Implementation Steps:**

#### 2.5.1 Install and Configure Storybook
1. Initialize Storybook:
   ```bash
   npx storybook@latest init
   ```

2. Update `.storybook/main.ts`:
   ```typescript
   import type { StorybookConfig } from "@storybook/nextjs";
   
   const config: StorybookConfig = {
     stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
     addons: [
       "@storybook/addon-onboarding",
       "@storybook/addon-essentials",
       "@chromatic-com/storybook",
       "@storybook/addon-interactions",
       "@storybook/addon-a11y",
     ],
     framework: {
       name: "@storybook/nextjs",
       options: {},
     },
   };
   
   export default config;
   ```

3. Update `.storybook/preview.tsx`:
   ```typescript
   import type { Preview } from "@storybook/react";
   import "../src/app/globals.css";
   
   const preview: Preview = {
     parameters: {
       controls: {
         matchers: {
           color: /(background|color)$/i,
           date: /Date$/i,
         },
       },
       a11y: {
         // Accessibility testing
         config: {
           rules: [],
         },
       },
     },
   };
   
   export default preview;
   ```

#### 2.5.2 Create Component Stories
1. Create `src/components/ui/button.stories.tsx`:
   ```typescript
   import type { Meta, StoryObj } from "@storybook/react";
   import { Button } from "./button";
   
   const meta: Meta<typeof Button> = {
     title: "UI/Button",
     component: Button,
     parameters: {
       layout: "centered",
     },
     tags: ["autodocs"],
   };
   
   export default meta;
   type Story = StoryObj<typeof meta>;
   
   export const Primary: Story = {
     args: {
       children: "Button",
       variant: "default",
     },
   };
   
   export const Secondary: Story = {
     args: {
       children: "Button",
       variant: "secondary",
     },
   };
   
   export const Destructive: Story = {
     args: {
       children: "Delete",
       variant: "destructive",
     },
   };
   ```

2. Create stories for other UI components (Input, Card, Select, etc.)

#### 2.5.3 Add Storybook Scripts
1. Update `package.json`:
   ```json
   {
     "scripts": {
       "storybook": "storybook dev -p 6006",
       "build-storybook": "storybook build"
     }
   }
   ```

**Dependencies:** None  
**Testing:** Run `npm run storybook` and verify all stories load

---

## Phase 2 Summary

| Task | Priority | Est. Hours | Dependencies |
|------|----------|------------|--------------|
| 2.1 Split finance modules | Important | 16-20 | Phase 1.4 |
| 2.2 Page component tests | Important | 20-24 | Phase 2.1 (recommended) |
| 2.3 Keyboard shortcuts | Important | 12-16 | None |
| 2.4 Shareable URLs | Important | 10-14 | Phase 2.3 |
| 2.5 Storybook docs | Nice to have | 16-20 | None |
| **Total** | | **74-94 hours** | |

---

## Phase 3: Feature Enhancement (Week 5-6)

Priority: Medium | Duration: 2 weeks

### 3.1 Add Calculation History with LocalStorage

**Status:** 🟡 Important  
**Estimated Time:** 14-18 hours  
**Files to Create:**
- `src/lib/history.ts`
- `src/hooks/use-calculation-history.ts`
- `src/components/history-panel.tsx`
- `src/components/history-item.tsx`

**Files to Modify:**
- `src/app/*/page.tsx` (all calculator pages)
- `src/components/layout/sidebar.tsx` (add history button)

**Implementation Steps:**

#### 3.1.1 Create History Management Module
1. Create `src/lib/history.ts`:
   ```typescript
   export interface HistoryEntry {
     id: string;
     timestamp: number;
     calculator: string;
     inputs: Record<string, string>;
     results: Record<string, number>;
     name?: string;
   }
   
   const STORAGE_KEY = "fincalc-history";
   const MAX_ENTRIES = 50;
   
   export function saveCalculation(entry: Omit<HistoryEntry, "id" | "timestamp">): void {
     const history = getHistory();
     const newEntry: HistoryEntry = {
       ...entry,
       id: crypto.randomUUID(),
       timestamp: Date.now(),
     };
     
     const updated = [newEntry, ...history].slice(0, MAX_ENTRIES);
     localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
   }
   
   export function getHistory(): HistoryEntry[] {
     if (typeof window === "undefined") return [];
     try {
       const stored = localStorage.getItem(STORAGE_KEY);
       return stored ? JSON.parse(stored) : [];
     } catch {
       return [];
     }
   }
   
   export function deleteHistoryEntry(id: string): void {
     const history = getHistory().filter(h => h.id !== id);
     localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
   }
   
   export function clearHistory(): void {
     localStorage.removeItem(STORAGE_KEY);
   }
   ```

#### 3.1.2 Create History Hook
1. Create `src/hooks/use-calculation-history.ts`:
   ```typescript
   import { useState, useEffect, useCallback } from "react";
   import { HistoryEntry, getHistory, saveCalculation, deleteHistoryEntry } from "@/lib/history";
   
   export function useCalculationHistory(calculator: string) {
     const [history, setHistory] = useState<HistoryEntry[]>([]);
     
     useEffect(() => {
       setHistory(getHistory());
     }, []);
     
     const save = useCallback((inputs: Record<string, string>, results: Record<string, number>) => {
       saveCalculation({ calculator, inputs, results });
       setHistory(getHistory());
     }, [calculator]);
     
     const remove = useCallback((id: string) => {
       deleteHistoryEntry(id);
       setHistory(getHistory());
     }, []);
     
     return { history, save, remove };
   }
   ```

#### 3.1.3 Create History Components
1. Create `src/components/history-panel.tsx` (collapsible side panel)
2. Create `src/components/history-item.tsx` (individual history entry)
3. Add "Save to History" button on each calculator page

**Dependencies:** None  
**Testing:** Verify persistence across sessions

---

### 3.2 Implement Data Export Functionality

**Status:** 🟡 Important  
**Estimated Time:** 10-14 hours  
**Files to Create:**
- `src/lib/export.ts`
- `src/components/export-menu.tsx`

**Files to Modify:**
- `src/app/*/page.tsx` (all calculator pages)

**Implementation Steps:**

#### 3.2.1 Create Export Utilities
1. Create `src/lib/export.ts`:
   ```typescript
   export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
     if (data.length === 0) return;
     
     const headers = Object.keys(data[0]);
     const csvContent = [
       headers.join(","),
       ...data.map(row => 
         headers.map(h => {
           const value = row[h];
           // Escape values with commas or quotes
           const stringValue = String(value ?? "");
           if (stringValue.includes(",") || stringValue.includes('"')) {
             return `"${stringValue.replace(/"/g, '""')}"`;
           }
           return stringValue;
         }).join(",")
       ),
     ].join("\n");
     
     downloadFile(csvContent, `${filename}.csv`, "text/csv");
   }
   
   export function exportToJSON(data: unknown, filename: string): void {
     const jsonContent = JSON.stringify(data, null, 2);
     downloadFile(jsonContent, `${filename}.json`, "application/json");
   }
   
   function downloadFile(content: string, filename: string, type: string): void {
     const blob = new Blob([content], { type });
     const url = URL.createObjectURL(blob);
     const link = document.createElement("a");
     link.href = url;
     link.download = filename;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
     URL.revokeObjectURL(url);
   }
   ```

#### 3.2.2 Add Export to Calculator Pages
1. Add export button to loans page (amortization schedule)
2. Add export button to bonds page (price-yield data)
3. Add export button to history panel

**Dependencies:** Phase 3.1 (history)  
**Testing:** Verify exports work in different browsers

---

### 3.3 Add Sensitivity Analysis Features

**Status:** 🟢 Nice to have  
**Estimated Time:** 18-24 hours  
**Files to Create:**
- `src/lib/sensitivity.ts`
- `src/components/sensitivity-table.tsx`
- `src/components/sensitivity-chart.tsx`

**Files to Modify:**
- `src/app/tvm/page.tsx`
- `src/app/equity/page.tsx`
- `src/app/bonds/page.tsx`

**Implementation Steps:**

#### 3.3.1 Create Sensitivity Analysis Module
1. Create `src/lib/sensitivity.ts`:
   ```typescript
   export interface SensitivityPoint {
     variableValue: number;
     result: number;
   }
   
   export interface SensitivityAnalysis {
     variable: string;
     range: [number, number];
     step: number;
     data: SensitivityPoint[];
   }
   
   export function calculateSensitivity(
     baseInputs: Record<string, number>,
     variableName: string,
     range: [number, number],
     step: number,
     calculate: (inputs: Record<string, number>) => number
   ): SensitivityAnalysis {
     const data: SensitivityPoint[] = [];
     
     for (let value = range[0]; value <= range[1]; value += step) {
       const inputs = { ...baseInputs, [variableName]: value };
       const result = calculate(inputs);
       data.push({ variableValue: value, result });
     }
     
     return { variable: variableName, range, step, data };
   }
   ```

#### 3.3.2 Add Sensitivity UI to Calculators
1. Add "Sensitivity Analysis" tab to relevant calculators
2. Allow users to select variable and range
3. Display results as table and chart

**Dependencies:** None  
**Testing:** Verify calculations are correct across ranges

---

### 3.4 Create PWA Capabilities for Offline Use

**Status:** 🟢 Nice to have  
**Estimated Time:** 12-16 hours  
**Files to Create:**
- `public/manifest.json`
- `public/sw.js` (service worker)
- `src/lib/pwa.ts`

**Files to Modify:**
- `src/app/layout.tsx`
- `next.config.ts`

**Implementation Steps:**

#### 3.4.1 Create Web App Manifest
1. Create `public/manifest.json`:
   ```json
   {
     "name": "FinCalc Pro",
     "short_name": "FinCalc",
     "description": "Professional Financial Calculator",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#ffffff",
     "theme_color": "#10b981",
     "orientation": "portrait",
     "icons": [
       {
         "src": "/icon-192x192.png",
         "sizes": "192x192",
         "type": "image/png"
       },
       {
         "src": "/icon-512x512.png",
         "sizes": "512x512",
         "type": "image/png"
       }
     ]
   }
   ```

#### 3.4.2 Create Service Worker
1. Create `public/sw.js`:
   ```javascript
   const CACHE_NAME = "fincalc-v1";
   const urlsToCache = [
     "/",
     "/tvm",
     "/equity",
     "/bonds",
     // ... other routes
   ];
   
   self.addEventListener("install", (event) => {
     event.waitUntil(
       caches.open(CACHE_NAME).then((cache) => {
         return cache.addAll(urlsToCache);
       })
     );
   });
   
   self.addEventListener("fetch", (event) => {
     event.respondWith(
       caches.match(event.request).then((response) => {
         if (response) {
           return response;
         }
         return fetch(event.request);
       })
     );
   });
   ```

#### 3.4.3 Register Service Worker
1. Update `src/app/layout.tsx` to register SW

**Dependencies:** None  
**Testing:** Test offline functionality in Chrome DevTools

---

### 3.5 Add Comprehensive E2E Test Suite

**Status:** 🟡 Important  
**Estimated Time:** 20-24 hours  
**Files to Create:**
- `e2e/setup.ts`
- `e2e/calculators/tvm.spec.ts`
- `e2e/calculators/equity.spec.ts`
- `e2e/calculators/bonds.spec.ts`
- `e2e/calculators/loans.spec.ts`
- `e2e/accessibility.spec.ts`
- `e2e/navigation.spec.ts`

**Files to Modify:**
- `package.json`
- `.github/workflows/ci.yml` (if exists)

**Implementation Steps:**

#### 3.5.1 Install Playwright
1. Initialize Playwright:
   ```bash
   npm init playwright@latest
   ```

2. Configure `playwright.config.ts`:
   ```typescript
   import { defineConfig, devices } from "@playwright/test";
   
   export default defineConfig({
     testDir: "./e2e",
     fullyParallel: true,
     forbidOnly: !!process.env.CI,
     retries: process.env.CI ? 2 : 0,
     workers: process.env.CI ? 1 : undefined,
     reporter: "html",
     use: {
       baseURL: "http://localhost:3000",
       trace: "on-first-retry",
     },
     projects: [
       { name: "chromium", use: { ...devices["Desktop Chrome"] } },
       { name: "firefox", use: { ...devices["Desktop Firefox"] } },
       { name: "webkit", use: { ...devices["Desktop Safari"] } },
     ],
     webServer: {
       command: "npm run build && npm run start",
       url: "http://localhost:3000",
       reuseExistingServer: !process.env.CI,
     },
   });
   ```

#### 3.5.2 Write E2E Tests
1. Create `e2e/calculators/tvm.spec.ts`:
   ```typescript
   import { test, expect } from "@playwright/test";
   
   test.describe("TVM Calculator", () => {
     test.beforeEach(async ({ page }) => {
       await page.goto("/tvm");
     });
     
     test("calculates present value correctly", async ({ page }) => {
       await page.fill('input[name="rate"]', "5");
       await page.fill('input[name="nper"]', "10");
       await page.fill('input[name="pmt"]', "-100");
       
       await expect(page.locator('[data-testid="pv-result"]')).toContainText("$772.17");
     });
     
     test("switches calculation modes", async ({ page }) => {
       await page.click('button:has-text("FV")');
       await expect(page.locator('input[name="pv"]')).toBeVisible();
     });
   });
   ```

2. Create accessibility tests with Axe

**Dependencies:** None  
**Testing:** Run `npx playwright test`

---

## Phase 3 Summary

| Task | Priority | Est. Hours | Dependencies |
|------|----------|------------|--------------|
| 3.1 Calculation history | Important | 14-18 | None |
| 3.2 Data export | Important | 10-14 | Phase 3.1 |
| 3.3 Sensitivity analysis | Nice to have | 18-24 | None |
| 3.4 PWA capabilities | Nice to have | 12-16 | None |
| 3.5 E2E test suite | Important | 20-24 | None |
| **Total** | | **74-96 hours** | |

---

## Phase 4: Polish (Week 7-8)

Priority: Low | Duration: 2 weeks

### 4.1 Performance Optimization

**Status:** 🟡 Important  
**Estimated Time:** 16-20 hours  
**Files to Create:**
- `src/lib/worker-pool.ts`
- `src/hooks/use-virtual-list.ts`

**Files to Modify:**
- `src/app/loans/page.tsx` (virtualize amortization table)
- `src/workers/monte-carlo.worker.ts` (enhance)

**Implementation Steps:**

#### 4.1.1 Implement Worker Pool
1. Create `src/lib/worker-pool.ts`:
   ```typescript
   class WorkerPool {
     private workers: Worker[] = [];
     private queue: Array<{ task: unknown; resolve: Function; reject: Function }> = [];
     
     constructor(private size: number, private workerScript: string) {
       for (let i = 0; i < size; i++) {
         this.workers.push(new Worker(workerScript));
       }
     }
     
     async execute(task: unknown): Promise<unknown> {
       return new Promise((resolve, reject) => {
         this.queue.push({ task, resolve, reject });
         this.processQueue();
       });
     }
     
     private processQueue() {
       // Implementation
     }
   }
   ```

#### 4.1.2 Add Virtual Scrolling
1. Implement for large amortization schedules
2. Use `react-window` or custom implementation

**Dependencies:** None  
**Testing:** Use Chrome DevTools Performance tab

---

### 4.2 Add Print Styles and PDF Export

**Status:** 🟢 Nice to have  
**Estimated Time:** 8-12 hours  
**Files to Create:**
- `src/app/print.css`

**Files to Modify:**
- `src/app/globals.css`
- `src/app/layout.tsx`

**Implementation Steps:**

#### 4.2.1 Create Print Styles
1. Add to `src/app/globals.css`:
   ```css
   @media print {
     .no-print {
       display: none !important;
     }
     
     body {
       background: white;
     }
     
     .print-only {
       display: block !important;
     }
     
     /* Ensure charts print properly */
     svg {
       max-width: 100%;
     }
   }
   ```

#### 4.2.2 Add PDF Export Button
1. Use `html2canvas` + `jspdf` for PDF generation
2. Add print-friendly layouts

**Dependencies:** None  
**Testing:** Print preview in Chrome

---

### 4.3 Implement Advanced Features

**Status:** 🟢 Nice to have  
**Estimated Time:** 20-24 hours  
**Features:**
- Batch calculations (upload CSV, process multiple scenarios)
- Comparison mode (side-by-side results)
- Scenario saving/loading

**Dependencies:** Phase 3.1 (history), Phase 3.2 (export)

---

### 4.4 Complete Accessibility Audit and Remediation

**Status:** 🔴 Critical  
**Estimated Time:** 12-16 hours  
**Tools:**
- axe DevTools
- WAVE
- Lighthouse

**Implementation Steps:**
1. Run automated audits
2. Manual keyboard navigation testing
3. Screen reader testing (NVDA, VoiceOver)
4. Fix all issues found

**Dependencies:** Phase 1.1 (accessibility fixes)

---

### 4.5 Final Documentation and Security Review

**Status:** 🟡 Important  
**Estimated Time:** 8-12 hours  
**Deliverables:**
- API documentation (auto-generated)
- User guide
- Security checklist completion
- Performance budget verification

---

## Phase 4 Summary

| Task | Priority | Est. Hours | Dependencies |
|------|----------|------------|--------------|
| 4.1 Performance optimization | Important | 16-20 | None |
| 4.2 Print/PDF export | Nice to have | 8-12 | None |
| 4.3 Advanced features | Nice to have | 20-24 | Phase 3.1, 3.2 |
| 4.4 Accessibility audit | Critical | 12-16 | Phase 1.1 |
| 4.5 Documentation | Important | 8-12 | All previous |
| **Total** | | **64-84 hours** | |

---

## Overall Project Summary

| Phase | Duration | Est. Hours | Key Deliverables |
|-------|----------|------------|------------------|
| Phase 1 | Week 1-2 | 31-44 | Accessibility, XSS protection, cleanup |
| Phase 2 | Week 3-4 | 74-94 | Modularization, testing, documentation |
| Phase 3 | Week 5-6 | 74-96 | History, export, PWA, E2E tests |
| Phase 4 | Week 7-8 | 64-84 | Performance, polish, documentation |
| **Total** | **8 weeks** | **243-318 hours** | |

---

## Quick Reference: File Change Summary

### Phase 1
- ✅ Create: `src/components/ui/skip-link.tsx`
- ✅ Modify: `src/app/layout.tsx`, `src/components/layout/app-layout.tsx`
- ✅ Modify: `src/components/ui/input.tsx`, `src/components/ui/label.tsx`
- ✅ Modify: All calculator pages (accessibility updates)
- ✅ Modify: `src/lib/utils.ts` (XSS utilities)
- ✅ Modify: `src/app/equity/page.tsx` (memoization)
- ✅ Modify: `src/lib/finance-math.ts` (return types)
- ✅ Delete: `src/lib/finance-math.ts.backup`
- ✅ Modify: `.gitignore`

### Phase 2
- ✅ Create: `src/lib/finance/` directory with domain modules
- ✅ Create: All `*.test.tsx` files for pages
- ✅ Create: `src/test/test-utils.tsx`
- ✅ Create: `src/hooks/use-keyboard-shortcuts.ts`
- ✅ Create: `src/hooks/use-persisted-state.ts`
- ✅ Create: `src/hooks/use-url-state.ts`
- ✅ Create: `src/lib/url-state.ts`
- ✅ Create: `.storybook/` configuration
- ✅ Modify: All calculator pages (shortcuts, persistence, URLs)

### Phase 3
- ✅ Create: `src/lib/history.ts`, `src/hooks/use-calculation-history.ts`
- ✅ Create: History panel components
- ✅ Create: `src/lib/export.ts`, export components
- ✅ Create: `src/lib/sensitivity.ts`, sensitivity components
- ✅ Create: `public/manifest.json`, `public/sw.js`
- ✅ Create: `e2e/` directory with Playwright tests

### Phase 4
- ✅ Create: `src/lib/worker-pool.ts`, `src/hooks/use-virtual-list.ts`
- ✅ Create: Print styles
- ✅ Modify: All performance-critical components

---

## Success Criteria

### Phase 1 Completion
- [ ] All accessibility issues resolved (axe audit: 0 violations)
- [ ] XSS protection validated (manual penetration testing)
- [ ] All calculations memoized (no unnecessary re-renders)
- [ ] TypeScript strict mode passes (npx tsc --noEmit)
- [ ] No backup files in repository

### Phase 2 Completion
- [ ] Finance modules split and all tests passing
- [ ] 80%+ test coverage for page components
- [ ] Keyboard shortcuts working on all pages
- [ ] Shareable URLs functional
- [ ] Storybook deployed (optional)

### Phase 3 Completion
- [ ] History persists across sessions
- [ ] Export works for CSV and JSON
- [ ] Sensitivity analysis on TVM/Equity/Bonds
- [ ] PWA installable and works offline
- [ ] All E2E tests passing

### Phase 4 Completion
- [ ] Lighthouse score 90+ (Performance, Accessibility, Best Practices, SEO)
- [ ] Print styles functional
- [ ] All accessibility issues resolved
- [ ] Documentation complete
- [ ] Security checklist verified

---

## Dependencies Graph

```
Phase 1.4 (Return Types)
    ↓
Phase 2.1 (Module Split)
    ↓
Phase 2.2 (Page Tests) ←── Optional dependency

Phase 2.3 (Keyboard/Persistence)
    ↓
Phase 2.4 (Shareable URLs)

Phase 3.1 (History)
    ↓
Phase 3.2 (Export)
    ↓
Phase 4.3 (Advanced Features)

Phase 1.1 (Accessibility)
    ↓
Phase 4.4 (Accessibility Audit)
```

---

**Last Updated:** March 27, 2026  
**Next Review:** After Phase 1 completion
