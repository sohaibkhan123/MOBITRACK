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
