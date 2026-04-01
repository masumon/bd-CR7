# BD CR7 System User Guide

## Overview
BD CR7 is an enterprise management system integrating HR, Finance, POS (Point of Sale), and AI-driven risk analysis. This guide walks through core features.

## Authentication

### Login
1. Open the application and navigate to the Auth panel.
2. Enter your registered email and password.
3. Click **Sign In** – the system validates credentials with Supabase.
4. Upon success, your role (Admin, Manager, Operator) is displayed at the top of the dashboard.
5. Your JWT token is stored securely for subsequent API requests.

### Register
1. In the Auth panel, fill in:
   - **Email**: Must be unique (verified by Supabase).
   - **Full Name**: Your display name.
   - **Password**: Minimum 6 characters recommended.
2. Click **Register** – the system creates your user record and syncs your profile to the local `users` table.
3. You are assigned the **Operator** role by default; Admins can modify roles via the database.
4. Upon registration, you are automatically logged in.

### Logout
- Click **Sign Out** from the Auth panel or session display.
- Your JWT token is cleared, and all UI state is reset.

---

## Finance Management

### Viewing Accounts
1. Navigate to the **Finance** panel.
2. Your accessible accounts are listed under "Your Accounts" based on your role and ownership.
   - **Admins** see all accounts.
   - **Makers/Checkers** see accounts they own or have been granted access to.
   - **Operators** see accounts assigned to them via `account_access` rules.

### Creating Expenses
1. In the Finance panel, fill out the expense form:
   - **Description**: Brief purpose (max 100 characters).
   - **Amount**: Decimal value (e.g., 1250.50); validated ≥ 0.
   - **Account**: Select the account to charge the expense to.
   - **Category**: Choose from predefined categories (e.g., Travel, Supplies, Other).
2. Click **Submit** – the system:
   - Calculates a risk score based on amount, category, and user history.
   - Records the expense as **Pending** if reviewer approval is required.
   - Notifies the assigned checker to review.
3. Recent expenses are visible in the Dashboard's "Recent Expenses" list.

### Approving/Rejecting Expenses
1. As a **Checker**, navigate to the Finance panel.
2. Under "Pending Expenses," review each:
   - Amount, Description, Requestor, Risk Score.
3. Click **Approve** to finalize the expense → balance is deducted.
4. Click **Reject** to cancel → expense is marked as rejected, balance unchanged.

### Transferring Funds
1. In the Finance panel, fill out the transfer form:
   - **From Account**: Your source account.
   - **To Account**: Destination account (must be different from source).
   - **Amount**: Non-zero, positive decimal.
   - **Reference**: Optional memo.
2. Click **Transfer** – the system:
   - Validates sender has sufficient balance.
   - Executes an atomic RPC transaction (both debit and credit succeed or both fail).
   - Returns updated balances for both accounts.
3. Transfers are instant and visible in both accounts' transaction history.

---

## User & Product Management

### Creating Users (Admin Only)
1. Navigate to the **Users** panel (requires Admin role).
2. Fill in:
   - **Email**: Unique identifier.
   - **Full Name**: Display name.
   - **Department**: Organizational grouping.
   - **Role**: Admin, Manager, Operator, or Checker.
3. Click **Create** – the user is added and sent invitation credentials via email.

### Managing Products
1. Navigate to the **Products** panel.
2. **Add Product**:
   - **Name**: Item name (max 100 chars).
   - **SKU**: Unique identifier (max 50 chars).
   - **Price**: Decimal value.
   - **Stock**: Current inventory count.
   - Click **Add** to create the product.
3. **Edit/Delete**: Click the pencil or trash icon next to any product row.

---

## Point of Sale (POS)

### Scanning & Checkout
1. Navigate to the **POS** panel.
2. Use your barcode scanner to scan products (or manually enter SKU).
3. Each scan adds the product to the **Cart**:
   - Product name, unit price, and quantity are displayed.
   - Total price automatically calculates at the bottom.
4. To **Remove** an item from the cart, click the **X** icon next to it.
5. **Checkout**:
   - Verify the total price is correct.
   - Click **Complete Sale** – the system:
     - Records the sale with timestamp, user ID, and line items.
     - Deducts inventory from each product.
     - Stores the receipt for audit/returns.

### Viewing Recent Sales
1. The Dashboard displays **Monthly Sales** (total revenue this month).
2. For detailed sales history, refer to the **Sales** panel (if available).

---

## AI Dashboard

### Metrics Overview
The Dashboard displays four key metrics:
- **Total Balance**: Sum of all account balances you have access to.
- **Monthly Sales**: Total POS revenue this calendar month.
- **Pending Expenses**: Count of expenses awaiting your approval (if you are a Checker).
- **Recent Expenses**: List of the last 5 expenses (sorted by date, newest first).

### Risk Scoring
When you submit an expense, the system assigns a **risk score** (0–100):
- **Low (0–33)**: Routine expense, auto-approved for small amounts.
- **Medium (34–66)**: Requires manager review.
- **High (67–100)**: Requires escalation to admin.

Risk score factors:
- **Amount**: Larger expenses score higher.
- **Category**: Travel and external payments score higher than supplies.
- **User History**: Repeat high-spend users may see higher scores over time.
- **Frequency**: Excessive expenses in short periods score higher.

Review the **Risk Score** displayed next to each pending expense in the Finance panel.

---

## Mobile Responsiveness
All panels are optimized for mobile devices:
- Buttons scaling for touch (48px+ height).
- Cards and forms stack vertically on screens < 768px.
- Overflow content is scrollable with `max-height` constraints.
- Text sizes adjust: headers 18px, body 14px on mobile.

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Login fails | Wrong credentials or user doesn't exist. | Verify email and password. Register if new. |
| Transfer declines | Insufficient balance or account locked. | Check balance in "Your Accounts" and retry. |
| Expense "Pending" forever | Checker unavailable or system lag. | Contact your admin; escalate if > 24 hours. |
| POS – product not found | Barcode not registered or stock = 0. | Add product first in Products panel. |
| Lost internet | Auto-queue stores actions offline. | Reconnect; queued actions sync automatically. |

---

## Security Notes
- **Passwords**: Never share your password. Admins cannot reset via UI; contact database admin.
- **Role Changes**: Inform users if their role changes; re-login to apply new permissions.
- **Tokens**: JWTs expire after 24 hours (configurable); auto-renew on next action.
- **Locked Accounts**: Only Admins can unlock accounts; contact admin if your account is locked.

---

## Support
For bugs or feature requests, contact the development team or submit an issue in the GitHub repository.
