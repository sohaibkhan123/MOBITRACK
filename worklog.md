---
Task ID: 1
Agent: main
Task: Fix React key prop error, installment adding, and inventory adding issues

Work Log:
- Read contracts.tsx - confirmed Fragment key fix was already in place (line 583: `<Fragment key={contract.id}>`)
- Read installments.tsx - confirmed Quick Pay dialog is working with proper API call to POST /api/payments
- Read inventory.tsx - identified missing vendor installment fields that exist in API route but not in UI
- Added vendor installment fields (advancePaid, installmentsCount, installmentAmount) to inventory FormData interface and emptyForm defaults
- Added UI section in inventory dialog: "Vendor Purchase Installment" section appears conditionally when a vendor is selected and creating new item
- Section includes Advance Paid, # of Installments, and Installment Amount fields with auto-calculated remaining display
- These fields match the API route (/api/inventory/route.ts) which creates vendor contracts automatically when installmentsCount > 1
- Restarted dev server (was failing with EADDRINUSE), confirmed working with 200 response
- Ran lint check - passes with no errors
- Verified API endpoints working correctly

Stage Summary:
- React key prop error: Already fixed in previous session with `<Fragment key={contract.id}>`
- Installment adding: Works via Quick Pay dialog in both contracts and installments pages
- Inventory adding: Added vendor installment fields to match API route capabilities
- Dev server is running and all pages compile successfully

---
Task ID: 2
Agent: main
Task: Fix customers.tsx Fragment data-state error and add customer installment Quick Pay

Work Log:
- Fixed React Fragment data-state error in customers.tsx line 481: Replaced `<Collapsible asChild>` wrapping `<>` Fragment with simple `<Fragment key={customer.id}>` pattern and conditional rendering
- Removed Collapsible/CollapsibleContent imports (no longer needed in customers.tsx)
- Added Fragment import from React
- Used conditional rendering `{isExpanded && (...)}` instead of CollapsibleContent
- Added Quick Pay installment recording to customer-detail.tsx:
  - Added Contract.customerId and Contract.payments fields to Contract interface
  - Added Quick Pay state variables (payDialogOpen, payContract, payForm, paySubmitting)
  - Added calculateNextDueDate, getTodayStr, openQuickPay, handleQuickPay functions
  - Added Dialog, DialogDescription, DialogFooter imports
  - Added Input, Label, Select components imports
  - Updated contracts table headers: Added "Paid / Remaining" and "Next Due" columns
  - Added "Pay" button for each running contract with Quick Pay dialog
  - Added Quick Pay dialog with amount, date, method, receipt number fields
  - Payment recording calls POST /api/payments and refreshes customer data
- Ran lint check - passes with no errors
- Verified dev server compiles successfully

Stage Summary:
- Fixed Fragment data-state console error in customers.tsx
- Added Quick Pay installment recording directly from customer detail page
- Customer detail page now shows paid/remaining amounts and next due date for each contract
- Running contracts have a "Pay" button to quickly record installment payments
- All Fragment usages now have proper key props
- Inventory add functionality verified working
