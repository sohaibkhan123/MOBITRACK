# Task 2-a: Dashboard Page Component

## Summary
Built the DashboardPage client component for MobiTrack Mobile Shop Installment System.

## Files Created/Modified
- **Created**: `/src/components/dashboard.tsx` — Main dashboard component
- **Modified**: `/src/app/page.tsx` — Updated to render DashboardPage

## Component Details

### DashboardPage (`'use client'`)
- **Data fetching**: `useEffect` + `useState` fetching from `/api/dashboard`
- **Stats cards** (6 cards in responsive grid):
  - Customers (total / active) — emerald icon
  - Contracts (active / total) — amber icon, overdue badge if applicable
  - Outstanding (PKR total / overdue PKR) — rose if overdue, emerald if clean
  - Inventory (available / sold) — teal icon
  - Collected This Month (PKR) — emerald icon
  - Vendors (count) — amber icon
- **Collection chart**: Recharts BarChart via shadcn/ui ChartContainer, last 7 days, emerald bars, PKR formatting
- **Recent Payments table**: Last 5 payments with customer, item, amount, date, method
- **Upcoming Due Payments table**: Next 10 due installments with customer, item, due date, amount, overdue badges
- **Loading states**: Skeleton loaders for cards, chart, and tables
- **Error state**: Alert card with error message

### Color Palette (no indigo/blue)
- Emerald/green → positive values
- Rose/red → overdue/negative
- Amber/yellow → warnings
- Teal → inventory

### Lint & Runtime
- ESLint: 0 errors
- Dev server: GET /api/dashboard 200 OK, data renders correctly
