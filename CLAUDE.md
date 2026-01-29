# CLAUDE.md - Rick & Share-ah

This file provides context for AI assistants working on this codebase.

## Project Overview

**Rick & Share-ah** is a "brutalist-cute" expense splitting web app for couples. It allows two partners to track who paid for what, split expenses flexibly, and settle up when needed.

### Core Features
- **Dashboard**: Running balance between partners with recent activity
- **Expense Tracking**: Add expenses with flexible splitting (50/50, percentage, exact amounts)
- **Receipt Scanning**: AI-powered receipt OCR using AWS Textract to auto-fill expense forms
- **Line Item Assignment**: Assign individual receipt items to specific partners
- **Settlements**: Record payments between partners to settle the balance
- **Activity History**: Search, filter, and paginate through expense/settlement history
- **Themes**: 8 interior design-inspired color themes with per-user persistence
- **Couple Pairing**: Invite code system for partner 2 to join

## Tech Stack

### Frontend
- **React 19** + **TypeScript 5.9**
- **Vite 7** for build/dev server
- **Tailwind CSS 4** with custom brutalist theme
- **React Router 7** for routing

### Backend (AWS Amplify)
- **AWS Cognito**: User authentication (email/password with verification)
- **AWS AppSync**: GraphQL API with owner-based authorization
- **AWS DynamoDB**: Data storage for Couples, Expenses, Settlements, UserPreferences
- **AWS S3**: Receipt image storage (protected per-user paths)
- **AWS Lambda**: `processReceipt` function for Textract OCR
- **AWS Textract**: AnalyzeExpense API for receipt parsing

## Project Structure

```
rickandshareah/
├── amplify/                    # AWS Amplify backend
│   └── backend/
│       ├── api/rickshareah/    # GraphQL schema & resolvers
│       │   └── schema.graphql  # Data models (Couple, Expense, Settlement, etc.)
│       ├── auth/               # Cognito user pool config
│       ├── function/processReceipt/  # Lambda for receipt OCR
│       │   └── src/index.js    # Textract AnalyzeExpense handler
│       └── storage/receipts/   # S3 bucket for receipt images
├── src/
│   ├── App.tsx                 # Route definitions with auth guards
│   ├── main.tsx                # Entry point, Amplify config
│   ├── index.css               # Tailwind + brutalist theme CSS variables
│   ├── components/
│   │   ├── auth/AuthForms.tsx          # Login/signup/confirm flows
│   │   ├── couple/CoupleSetup.tsx      # Create/join couple
│   │   ├── dashboard/BalanceDisplay.tsx
│   │   ├── expenses/
│   │   │   ├── ExpenseForm.tsx         # Add/edit expense with receipt scanner
│   │   │   ├── ExpenseCard.tsx         # Expense list item
│   │   │   ├── ReceiptScanner.tsx      # Camera/file capture + OCR flow
│   │   │   ├── ScanOverlay.tsx         # Camera/file picker UI
│   │   │   ├── ScanResults.tsx         # OCR results with overrides
│   │   │   ├── LineItemAssigner.tsx    # Per-item partner assignment
│   │   │   └── CSVUploader.tsx         # Bulk import expenses
│   │   ├── settlements/
│   │   │   ├── SettlementForm.tsx
│   │   │   ├── SettlementCard.tsx
│   │   │   └── SettleUpModal.tsx
│   │   ├── settings/ThemeSelector.tsx  # Theme picker with live preview
│   │   ├── layout/Layout.tsx           # Header + bottom nav
│   │   └── ui/                         # Reusable UI components (Button, Card, etc.)
│   ├── context/
│   │   ├── AppContext.tsx              # Global state: auth, couple, expenses, settlements
│   │   └── ThemeContext.tsx            # Theme state with backend sync
│   ├── pages/
│   │   ├── Dashboard.tsx               # Balance + recent activity
│   │   ├── AddExpense.tsx              # ExpenseForm wrapper
│   │   ├── History.tsx                 # Full activity with filters/search/pagination
│   │   ├── Statistics.tsx              # Spending analytics (placeholder)
│   │   └── Settings.tsx                # Account, couple info, CSV import, themes
│   ├── graphql/
│   │   ├── queries.js/mutations.js     # Auto-generated Amplify GraphQL
│   │   └── customQueries.ts            # Custom queries for user preferences
│   ├── hooks/
│   │   ├── useReceiptScan.ts           # S3 upload + processReceipt mutation
│   │   └── useCamera.ts                # Camera stream management
│   ├── themes/index.ts                 # Theme definitions (8 themes)
│   ├── types/index.ts                  # TypeScript interfaces
│   └── utils/
│       ├── helpers.ts                  # Currency, dates, balance calculation
│       ├── receiptParser.ts            # Date normalization for OCR results
│       ├── categoryMatcher.ts          # Merchant → category suggestions
│       └── csvParser.ts                # CSV import parsing
└── scripts/                            # Dev utilities
```

## Key Concepts

### Data Models (GraphQL Schema)

```graphql
type Couple {
  id: ID!
  name: String!
  partner1Id: String!    # Cognito user ID
  partner1Name: String!
  partner2Id: String     # null until partner joins
  partner2Name: String
  inviteCode: String     # 6-char code for joining
  defaultSplitPercent: Int!
}

type Expense {
  id: ID!
  coupleId: ID!
  description: String!
  amount: Int!           # Always in CENTS
  paidBy: String!        # "partner1" or "partner2"
  splitType: String!     # "equal", "percentage", "exact"
  partner1Share: Int!    # Percentage (0-100) or cents depending on splitType
  partner2Share: Int!
  category: String!      # food, groceries, transport, home, etc.
  date: AWSDate!
}

type Settlement {
  id: ID!
  coupleId: ID!
  amount: Int!           # cents
  paidBy: String!        # who paid
  paidTo: String!        # who received
  date: AWSDate!
}

type UserPreferences {
  id: ID!
  userId: String!
  theme: String          # Theme ID like "brutalist-cute"
}
```

### Money Handling
- **All amounts are stored and manipulated in CENTS** (integers)
- Use `formatCurrency(cents)` to display as "$X.XX"
- Use `parseCurrencyInput(string)` to convert user input to cents

### Balance Calculation
- Positive balance: Partner 2 owes Partner 1
- Negative balance: Partner 1 owes Partner 2
- Settlements reduce the debt of the payer

### Receipt Scanning Flow
1. User captures/selects image via `ScanOverlay`
2. Image uploaded to S3 via `useReceiptScan` hook
3. `processReceipt` Lambda triggered via GraphQL mutation
4. Textract AnalyzeExpense extracts: merchant, total, date, line items
5. `ScanResults` shows parsed data with edit capability
6. `LineItemAssigner` allows per-item partner assignment
7. Data applied to `ExpenseForm` with visual AI-filled indicator

### Theme System
- 8 themes defined in `src/themes/index.ts`
- CSS variables in `:root` and `[data-theme="..."]` selectors
- `ThemeContext` syncs to localStorage (instant) and backend (async)
- Theme applies via `data-theme` attribute on `<html>`

## Development

### Commands
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Vite)
npm run build        # TypeScript check + Vite build
npm run lint         # ESLint
npm run preview      # Preview production build
```

### Amplify Commands
```bash
amplify status       # Check deployed resources
amplify push         # Deploy backend changes
amplify pull         # Pull latest backend config
amplify mock api     # Local GraphQL testing
```

### Key Files to Modify

| Task | Files |
|------|-------|
| Add new expense field | `schema.graphql`, `types/index.ts`, `ExpenseForm.tsx`, `ExpenseCard.tsx` |
| Add new category | `types/index.ts` (CATEGORIES array) |
| Modify balance logic | `utils/helpers.ts` (calculateBalance) |
| Add new theme | `themes/index.ts`, `index.css` |
| Modify receipt parsing | `amplify/backend/function/processReceipt/src/index.js` |
| Add new page | `App.tsx`, `pages/NewPage.tsx`, `Layout.tsx` (nav) |

## Coding Conventions

### TypeScript
- Strict mode enabled
- Use `type` imports: `import type { Expense } from '../types'`
- Define interfaces in `types/index.ts` for shared types

### React
- Functional components only
- Use `useApp()` hook for global state
- Use `useTheme()` for theme state
- Wrap money display with `formatCurrency()`

### CSS/Styling
- Use Tailwind utility classes
- Use CSS variables for theme colors: `var(--color-coral)`, etc.
- Brutalist components use `.card-brutal`, `.btn-brutal`, `.input-brutal` classes
- Animation classes: `.animate-bounce-in`, `.animate-slide-up`, `.ai-filled`

### Logging
- Frontend uses `console.log('[module-name] action.detail', { data })`
- Lambda uses structured JSON logging via `log(level, message, meta)`
- Log prefixes help with filtering: `[receipt-scan]`, `[csv-import]`, `[ThemeContext]`

## Common Patterns

### Adding a GraphQL Query/Mutation
1. Update `schema.graphql` if schema changes needed
2. Run `amplify push` to regenerate types
3. Import from `../graphql/queries` or `../graphql/mutations`
4. Use `getClient().graphql({ query, variables })`

### Protected Routes
```tsx
<ProtectedRoute>
  <RequireCouple>
    <Layout>
      <YourPage />
    </Layout>
  </RequireCouple>
</ProtectedRoute>
```

### Form State with AI-Fill
```tsx
const [aiFilled, setAiFilled] = useState<Record<string, boolean>>({});
// Mark field as AI-filled
setAiFilled(prev => ({ ...prev, description: true }));
// Apply class for animation
className={aiFilled.description ? 'ai-filled' : ''}
```

## Known Issues / TODOs

- [ ] "Clear All Data" in Settings is not implemented (needs batch delete)
- [ ] Statistics page is a placeholder
- [ ] PWA support not yet added
- [ ] No real-time sync between partners (refresh required)
- [ ] Export to CSV not implemented

## Testing Notes

- No formal test suite currently
- Manual testing via dev server
- Amplify mock can test GraphQL locally
- Receipt scanning requires deployed Lambda + Textract permissions

## Deployment

The app deploys to AWS Amplify Hosting:
1. Push to connected Git repo
2. Amplify auto-builds using `npm run build`
3. Frontend served from CloudFront
4. Backend (API, Auth, Storage, Lambda) managed by Amplify
