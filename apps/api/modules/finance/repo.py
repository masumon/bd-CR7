"""
Finance Repository - Data Access Layer
Handles all database operations for finance module
"""

from typing import List, Dict, Optional
from decimal import Decimal
from datetime import datetime
from .schema import TransactionStatus


class FinanceRepository:
    """
    Repository pattern implementation for finance database operations.
    All DB queries go through this layer.
    """
    
    def __init__(self, db_client):
        self.db = db_client
    
    async def create_transaction(
        self,
        amount: Decimal,
        description: str,
        category: str,
        from_account_id: str,
        to_account_id: str,
        status: str,
        created_by: str
    ) -> Dict:
        """
        Insert a new transaction into fund_transactions table.
        Creates two ledger entries (debit and credit).
        """
        query = """
        WITH new_txn AS (
            INSERT INTO fund_transactions (amount, description, category, status, created_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, created_at
        ),
        debit_entry AS (
            INSERT INTO fund_accounts_ledger (account_id, transaction_id, entry_type, amount)
            SELECT $6, id, 'debit', $1 FROM new_txn
        ),
        credit_entry AS (
            INSERT INTO fund_accounts_ledger (account_id, transaction_id, entry_type, amount)
            SELECT $7, id, 'credit', $1 FROM new_txn
        )
        SELECT * FROM new_txn;
        """
        
        # TODO: Execute query and return result
        return {"id": "txn_123", "created_at": datetime.utcnow()}
    
    async def get_transaction_by_id(self, transaction_id: str) -> Optional[Dict]:
        """Retrieve a transaction by ID"""
        query = "SELECT * FROM fund_transactions WHERE id = $1"
        # TODO: Execute query
        return None
    
    async def get_account_balance(self, account_id: str) -> Decimal:
        """Calculate current balance for account using ledger"""
        query = """
        SELECT 
            COALESCE(SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE -amount END), 0) as balance
        FROM fund_accounts_ledger
        WHERE account_id = $1
        """
        # TODO: Execute query and return balance
        return Decimal("0.00")
    
    async def get_pending_approvals(self, approver_id: str) -> List[Dict]:
        """Get transactions pending approval by this user"""
        query = """
        SELECT 
            t.id, t.amount, t.description, t.category, t.created_at, t.created_by,
            pa.approval_level, pa.required_approver_id
        FROM fund_transactions t
        JOIN pending_approvals pa ON t.id = pa.transaction_id
        WHERE pa.required_approver_id = $1 AND pa.approved_at IS NULL
        ORDER BY t.created_at DESC
        """
        # TODO: Execute query
        return []
    
    async def approve_transaction(
        self,
        transaction_id: str,
        approved_by: str,
        approved: bool
    ) -> Dict:
        """Record approval decision"""
        query = """
        UPDATE pending_approvals 
        SET approved_at = NOW(), approved_by = $1, approved = $2
        WHERE transaction_id = $3
        RETURNING *
        """
        # TODO: Execute query
        return {"status": "approved"}
    
    async def post_transaction(self, transaction_id: str) -> Dict:
        """Move transaction from PENDING_APPROVAL to POSTED status"""
        query = """
        UPDATE fund_transactions
        SET status = 'posted', posted_at = NOW()
        WHERE id = $1
        RETURNING *
        """
        # TODO: Execute query
        return {"status": "posted"}


def get_finance_repository(db_client):
    """Factory function for repository"""
    return FinanceRepository(db_client)
