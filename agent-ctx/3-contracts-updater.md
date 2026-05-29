# Task 3: Contracts Page Update — Auto-calculation, Progress, Quick Pay

## Agent: contracts-updater

## Task
Update the contracts page (`/home/z/my-project/src/components/contracts.tsx`) with auto-calculation of nextDueDate, installment progress column, and Quick Pay button.

## Changes Made

### 1. Added `calculateNextDueDate` Helper Function
- Computes nextDueDate from saleDate + 1 period based on frequency
- Monthly: +1 month, Weekly: +7 days, Bi-weekly: +14 days
- Returns empty string if no saleDate provided

### 2. Updated `handleFieldChange` for Auto-calculation
- When `saleDate`, `frequency`, `downPayment`, or `installmentsCount` changes on a **new** contract (not editing), auto-calculates `nextDueDate`
- Only auto-calculates if user hasn't manually set `nextDueDate` (tracked via `nextDueDateManual` state)
- If `nextDueDate` field is manually edited, sets `nextDueDateManual = true` to prevent overwriting
- `openAddDialog` resets `nextDueDateManual` to false
- Shows hint text "Auto-calculated based on sale date & frequency" below the nextDueDate input when auto-calculated

### 3. Added Installment Progress Column
- New "Progress" column after "Installments" column (hidden below `lg` breakpoint)
- Shows a small emerald progress bar (16px wide, 8px tall) with percentage fill
- Text display: "paid/total" (e.g., "3/10")
- Paid installments calculated as `Math.min(installmentsCount, Math.round(totalPaid / installmentAmount))`
- Capped at installmentsCount to prevent overflow display

### 4. Added Quick Pay Button & Dialog
- "Pay" button appears on each Running contract row (emerald outline style, matching vendor-contracts pattern)
- Opens a Quick Pay dialog with:
  - Amount pre-filled with installmentAmount
  - Date pre-filled with today's date
  - Payment method selector (Cash/Bank Transfer/Cheque)
  - Receipt number input (optional)
  - Submit: POST to `/api/payments` with contractId, customerId, amount, date, method, receiptNumber
  - On success: refreshes contracts list, shows success toast
  - On error: shows destructive error toast

### 5. Added `CreditCard` Icon Import
- Imported from `lucide-react` for the Quick Pay button and dialog header

### 6. Updated colSpan Counts
- Empty state row: `colSpan={12}` (was 11, added Progress column)
- Expanded payment history row: `colSpan={12}` (was 11)

## Files Modified
- `/home/z/my-project/src/components/contracts.tsx`

## Lint Status
✅ ESLint passes with 0 errors

## Dev Server
✅ Running without errors
