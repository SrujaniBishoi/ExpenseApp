# Expense App 📊

A modern, responsive, and private web-based expense tracker with **Daily Journaling**, configurable payment methods, and live exchange rate conversion starting from **January 2026**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSrujaniBishoi%2FResponseapp)

## 🚀 Getting Started

Simply double-click the **`ExpenseApp`** shortcut on your Desktop or open `index.html` directly:

```powershell
Start-Process "C:\Users\my\.gemini\antigravity\scratch\expense-app\index.html"
```

> **Desktop Shortcut**: Created at `C:\Users\my\Desktop\ExpenseApp.lnk`.

---

## ✨ Features & Recent Updates

### 1. 🇮🇳 INR (₹) Default Currency with Live Exchange Rates
- **Base Currency**: Stored and managed in Indian Rupees (**INR ₹**) with Indian number formatting (`₹25,000.00`).
- **Live Forex Integration**: Real-time exchange rate engine (with offline fallback) supports switching display currency to **USD ($)**, **EUR (€)**, **GBP (£)**, **AED (د.إ)**, **CAD (C$)**, **AUD (A$)**, or **JPY (¥)**.
- **Automatic Conversion**: Switching currency instantly converts all metrics, category totals, chart bars, and table amounts using the live exchange rate.
- **Foreign Transaction Entry**: In the Add Expense modal, you can select foreign transaction currencies (e.g., paid $50 USD while traveling), and the app shows the real-time INR conversion preview before saving.

### 2. 📖 Daily Journal with Full Monthly Calendar Navigation
- **Interactive Monthly Calendar Grid**: A full 7-column calendar navigation widget (`Su` to `Sa`) for each month.
  - **1-Click Day Selection**: Click any day of the month to immediately view and edit notes for that date.
  - **Visual Status Dots**:
    - 🟣 **Purple Dot**: Daily journal note exists for this day.
    - 🟢 **Green Dot**: Expenses recorded on this day.
    - 🟠 **Orange Dot**: Both notes and expenses exist for this day.
  - **Month Navigation Controls**: Fast `<` and `>` buttons to jump between months directly from the calendar, plus a `Today` quick-jump button.
- **Daily Spend Summary**: Live counter showing how much money was spent on that specific day and across how many transactions.
- **Clickable Table Date Links**: Clicking any date in the expense table directly selects and highlights that day on the calendar.
- **Auto-saved**: Journal saves automatically as you type into local storage.

### 3. 📅 Multi-Year Timeline Starting from January 2026
- Clear **`<`** and **`>`** navigation buttons to decrement and increment the year.
- Timeline strictly starts from **January 2026**.
- Add future years anytime with the `+ Add Year` button.
- 12-Month horizontal pill bar with live monthly totals in the active currency.
- **Annual Summary Tab**: 12-month comparison table and SVG bar chart.

### 4. 💳 Credit Cards Billing Cycles, Payments & Due Date Management
- **True Billing Cycle Calculation Rule**:
  - Rather than artificially cutting off at calendar month boundaries (`1st to 30th/31st`), each credit card's bill strictly encompasses **spendings from the day after the previous due date until the next due date**:
    - *Example (HDFC Diners, Due Day = 20th)*:
      - **October Bill (Due Oct 20)**: Covers charges from **21 September** to **20 October**.
      - An expense incurred on **22 September** is automatically and correctly grouped into the bill due on **20 October**!
      - **September Bill (Due Sep 20)**: Covers charges from **21 August** to **20 September**.
- **Dual-Cycle Range Selector Tabs in Modal**:
  - **`[ 📅 Bill Due in {Month} ]`**: Shows all transactions and payments for the bill due in the selected month (from previous due date + 1 to current due date).
  - **`[ 🔄 Active / Post-Due Cycle ]`**: Shows all rolling transactions incurred after this month's due date (which will be billed in the following month's statement).
- **Post-Due Unbilled Spends Banner**:
  - If you are viewing a month and have incurred charges after that month's due date (e.g. spent on 22 Sept after the 20 Sept due date), the card displays an alert chip:
    `⚡ 1 post-due expense (₹4,500.00) incurred in Sep after due date (20th). Billed in Oct (due 20 Oct). [View in Next Cycle →]`
- **Collapsible Charges Inspection**:
  - Click **`Charges (N) ▾`** on any card to immediately view the itemized breakdown of expenses included in that billing cycle without leaving the dialog.
- **Clickable Dashboard Card**:
  - Total net credit card spend for the active billing cycle.
  - Remaining amount payable at the due date (deducting recorded payments).
  - Shows unbilled post-due amounts if any charges occurred in that calendar month after the due date.
- **Interactive Credit Card Dues & Billing Modal**:
  - **Net Credit Cards Spent**: Total charges billed in the cycle.
  - **Total Payments Made**: Total payments recorded towards credit card bills (highlighted in success green).
  - **Remaining Due / Payable**: Net balance still owed (`Spent - Payments Made`).
  - **Card-by-Card Billing Breakdown**:
    - Exact cycle date tags: `🗓️ Cycle: 2026-09-21 to 2026-10-20 • Due: 2026-10-20`.
    - **`+ Record Payment` Button**: Record payments made towards any card's bill with payment date, amount, reference mode, and automatic linkage to the billing cycle.
    - **Payment History Log**: Complete audit log of payments made with date, amount, and notes.
    - **Inline Due Date Configuration**: Update due day (`1-31`) directly for each card with instant recalculation.
    - **Dynamic Due Status Badges**:
      - `✅ Fully Paid`: Bill completely cleared!
      - `🟡 Partially Paid`: Balance remaining with countdown to due date.
      - `🔴 Unpaid / Past Due / Due Today`: Clear alerts before bills become overdue.
- **Daily Journal Integration**:
  - Days with credit card bill payments reflect the payment in the day's financial summary and monthly calendar tooltip (e.g., `💳 ₹1,200.00 bill payment made towards ICICI VISA Credit Card`).

### 5. 🏷️ Configurable & Editable Payment Methods
- Configured payment methods: **UPI / GPay / PhonePe**, **ICICI VISA Credit Card**, **HDFC Diners Credit Card**, **Debit Card**, **Cash**, **Net Banking / NEFT**, and **Amex Card**.
- **Edit & Rename**: Click the pencil icon on any payment method card to change its name, category, color badge, and billing due day.
- **Due Date Setting**: When selecting or editing a method of type `Credit Card`, an input field allows configuring its recurring monthly due day (`1-31`).
- **Add & Delete**: Create new custom payment methods or delete unneeded ones.
- Payment method breakdown chart dynamically colored to match your custom badges.

### 6. 🔒 Complete Privacy & Data Ownership
- 100% client-side: all data stays in your browser's `localStorage`.
- Full JSON backup and restore.
- CSV export for current month or entire annual dataset.
