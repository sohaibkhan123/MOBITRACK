# Task 3-a: Due Tracking Page Component

## Summary
Built the DueTrackingPage component for the MobiTrack Mobile Shop Installment System.

## Files Created/Modified
- **Created**: `/src/components/due-tracking.tsx` — Main DueTrackingPage component
- **Modified**: `/src/lib/store.ts` — Added 'due-tracking' page type
- **Modified**: `/src/app/page.tsx` — Added Due Tracking navigation and routing

## Features Implemented
1. **Overdue Installments Section**: Cards with red border-left, days overdue badge, Call Now (tel: link) and Remind buttons, customer/item info, PKR formatting
2. **Due Today Section**: Cards with teal border-left, "Due Today" badge, installment amount, phone, call/remind actions
3. **Excel Export**: "Export Pending" (overdue only) and "Export All" buttons using xlsx library with 20 columns
4. **Summary Cards**: Overdue count, Overdue Amount, Due Today count, Due Today Amount
5. **Empty States**: Illustrated empty states for both sections
6. **Responsive Grid**: 1 col mobile, 2 cols tablet, 3 cols desktop

## Styling
- Red/rose for overdue, teal for due today
- shadcn/ui Card, Button, Badge
- Lucide icons: AlertCircle, Clock, Calendar, Phone, CheckCircle2, Download, Bell
- No indigo/blue colors used

## Verification
- ESLint passes with 0 errors
- Dev server running successfully
