# Task 2 - Installment Builder Agent

## Task
Create a comprehensive **Installments page** component at `/home/z/my-project/src/components/installments.tsx`.

## What Was Done

### 1. Created `/home/z/my-project/src/components/installments.tsx`
A full-featured InstallmentsPage component with:

- **Summary Cards (top row)**: 
  - Total Outstanding Balance (sum of remaining amounts across all Running contracts)
  - Installments Paid (total paid installments / total installments)
  - Overdue Installments (count of contracts where nextDueDate < today and status is Running)
  - Collected This Month (sum of payments this month)

- **Filters/Controls**:
  - Search by customer name, contract number, or item brand/model
  - Filter by status: All, Running, Completed, Defaulted, Overdue
  - Filter by frequency: All, Monthly, Weekly, Bi-weekly

- **Installment Schedule Table**:
  - Contract # (clickable, navigates to contract-detail)
  - Customer Name + Phone
  - Item (brand model variant)
  - Installment Plan: "10 × ₨15,000 (Monthly)"
  - Progress: visual progress bar + "3/10 paid" text
  - Total Price / Total Paid / Remaining
  - Next Due Date (with overdue badge if past due)
  - Status Badge (Running/Completed/Defaulted/Overdue)
  - Expand button to show installment schedule detail

- **Expanded Row - Installment Schedule**:
  - Full installment schedule table with: Installment #, Expected Date, Expected Amount, Amount Paid, Date Collected, Method, Status
  - Color coding: Green for PAID, Red for OVERDUE, Gray for UPCOMING

- **Quick Pay Action**:
  - Button on each Running contract row to quickly record a payment
  - Opens dialog with pre-filled amount, date, method, receipt number
  - After payment, refreshes both contracts and payments data

### 2. Updated Store (`/home/z/my-project/src/lib/store.ts`)
- Added `'installments'` to the `Page` type union

### 3. Updated Main Page (`/home/z/my-project/src/app/page.tsx`)
- Imported `InstallmentsPage` and `CalendarClock` icon
- Added 'Installments' nav item with CalendarClock icon (between Contracts and Payments)
- Added `case 'installments': return <InstallmentsPage />` to PageContent switch

## Key Helper Functions
- `addPeriod()`: Adds periods (months/weeks/bi-weekly) to a date
- `buildInstallmentSchedule()`: Builds full installment schedule for a contract with PAID/OVERDUE/UPCOMING status
- `getContractDisplayStatus()`: Computes display status (adds Overdue for Running contracts past due)

## Technical Details
- Uses `'use client'` directive
- Fetches from `/api/contracts` and `/api/payments`
- Uses shadcn/ui components: Card, Table, Badge, Button, Input, Select, Dialog, Progress
- Uses lucide-react icons
- Format currency as PKR with ₨ symbol
- Format dates in 'en-GB' format
- Responsive (mobile-first) with hidden columns on smaller screens
- Matches existing emerald color scheme
- Lint passes cleanly
