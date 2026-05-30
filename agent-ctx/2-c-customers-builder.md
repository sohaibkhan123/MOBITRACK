# Task 2-c: Customers Management Page

## Summary
Built the `CustomersPage` component at `/home/z/my-project/src/components/customers.tsx` with full CRUD functionality for the MobiTrack Mobile Shop Installment System.

## Files Created/Modified
- **Created:** `/home/z/my-project/src/components/customers.tsx` — Main component (CustomersPage)
- **Modified:** `/home/z/my-project/src/app/page.tsx` — Updated to render CustomersPage

## Features Implemented
1. **Stats Cards:** Total Customers, Active Customers, Outstanding Amount
2. **Search Bar:** Filter by name, CNIC, phone, father name, city
3. **Table View:** Name, Father Name, CNIC, Phone, City, Status, Contracts, Payments, Actions
4. **Expandable Rows:** Click to see full details including contracts summary and payments table
5. **Add Customer Dialog:** 3-section form (Personal, Address/Occupation, Guarantor/Status)
6. **Edit Customer Dialog:** Same form pre-filled with existing data
7. **Delete Confirmation:** AlertDialog with cascading warning
8. **Status Badges:** Active = emerald, Inactive = gray
9. **Contract Badges:** Completed = emerald, Overdue = red, Running = amber
10. **PKR Formatting:** All monetary values formatted as PKR
11. **Responsive Design:** Columns hide progressively on smaller screens
12. **Toast Notifications:** Success/error feedback for all operations
13. **Loading/Empty States:** Spinner while loading, icon + message when no data

## API Endpoints Used
- `GET /api/customers` — Fetch all customers with contracts and payments
- `POST /api/customers` — Create new customer
- `PUT /api/customers/[id]` — Update existing customer
- `DELETE /api/customers/[id]` — Delete customer

## Lint Status
✅ ESLint passes with zero errors
