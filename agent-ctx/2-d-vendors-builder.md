# Task 2-d: Vendors Management Page Component

## Agent: vendors-builder

## Task
Build a Vendors management page component for the MobiTrack Mobile Shop Installment System.

## File Created
- `/home/z/my-project/src/components/vendors.tsx`

## Files Modified
- `/home/z/my-project/src/app/page.tsx` - Updated to render VendorsPage component
- `/home/z/my-project/worklog.md` - Appended work record

## Implementation Summary

### Component: `VendorsPage` ('use client')
Complete vendor management with full CRUD, payment recording, and contract/installment details.

### Features Implemented
1. **Summary Cards** - Total Vendors, Total Purchases, Balance Due
2. **Search** - Filters by name, company, or phone
3. **Table View** - Expand toggle, Name, Company, Phone, Total Purchases, Total Paid, Balance Due (badge), Items count, Actions
4. **Add Vendor** - Dialog with Name* (required), Company, Phone, Address
5. **Edit Vendor** - Dialog pre-filled with vendor data
6. **Delete Vendor** - AlertDialog with confirmation warning
7. **Pay Vendor** - Dialog with Amount*, Date*, Method (Cash/Bank Transfer/EasyPaisa), Receipt Number; shows current balance due
8. **Pay Installment** - Dialog with Contract select (Running only), Amount*, Date*, Method; handles vendor installment payments
9. **Vendor Detail Expansion** - Expanded row shows:
   - Vendor info (address, company, phone, balance)
   - Vendor Contracts with item details, purchase price, paid, remaining, status
   - Installment payments per contract
   - Payment History with date, method badge, receipt, amount
   - Inventory Items with brand/model, purchase price, status

### API Endpoints Used
- GET `/api/vendors` - Fetch all vendors with included relations
- POST `/api/vendors` - Create vendor
- PUT `/api/vendors/[id]` - Update vendor
- DELETE `/api/vendors/[id]` - Delete vendor
- POST `/api/vendor-payments` - Record vendor payment (updates vendor.totalPaid)
- POST `/api/vendor-installments` - Record installment payment (updates contract and vendor totals)

### Styling
- shadcn/ui components: Card, Table, Button, Dialog, Input, Label, Select, Badge, AlertDialog
- Lucide icons: Plus, Pencil, Trash2, Search, Store, DollarSign, CreditCard, FileText, ChevronDown, ChevronRight
- PKR currency formatting with Intl.NumberFormat
- No indigo or blue as primary colors
- Responsive layout with mobile-first approach
- Toast notifications via useToast hook

### Quality Checks
- ESLint: 0 errors
- Dev server: Page compiles and loads successfully
- API endpoint: GET /api/vendors returns 200 with vendor data
