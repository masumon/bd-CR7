"""
Finance Policy - Business Rules and Approval Workflows
Enforces dual-approval, category rules, and financial policies
"""

from typing import Dict, List, Optional
from decimal import Decimal
from enum import Enum


class ApprovalLevel(Enum):
    """Approval hierarchy levels"""
    LEVEL_1 = "level_1"  # Department supervisor
    LEVEL_2 = "level_2"  # Finance team
    LEVEL_3 = "level_3"  # CFO/Admin


class FinancePolicy:
    """
    Implements business rules for finance module.
    Determines which transactions require approval and at what level.
    """
    
    # Transaction amount thresholds (in USD)
    APPROVAL_THRESHOLDS = {
        ApprovalLevel.LEVEL_1: Decimal("5000.00"),    # < 5K: no approval
        ApprovalLevel.LEVEL_2: Decimal("25000.00"),   # 5K-25K: level 1 approval
        ApprovalLevel.LEVEL_3: Decimal("999999.00"),  # 25K+: level 2 approval
    }
    
    # Categories that always require approval
    ALWAYS_REQUIRES_APPROVAL = [
        "adjustment",  # Manual adjustments
        "reversal",    # Transaction reversals
    ]
    
    def __init__(self, db_client):
        self.db = db_client
    
    def get_required_approval_levels(
        self,
        amount: Decimal,
        category: str,
        created_by_role: str
    ) -> List[ApprovalLevel]:
        """
        Determine which approval levels are required for a transaction.
        
        Args:
            amount: Transaction amount
            category: Transaction category
            created_by_role: Role of transaction creator
            
        Returns:
            List of approval levels required (empty if no approval needed)
        """
        required_levels = []
        
        # Always-approval categories
        if category in self.ALWAYS_REQUIRES_APPROVAL:
            required_levels.extend([ApprovalLevel.LEVEL_1, ApprovalLevel.LEVEL_2])
            return required_levels
        
        # Threshold-based approval
        if amount >= self.APPROVAL_THRESHOLDS[ApprovalLevel.LEVEL_3]:
            required_levels.extend([
                ApprovalLevel.LEVEL_1,
                ApprovalLevel.LEVEL_2,
                ApprovalLevel.LEVEL_3
            ])
        elif amount >= self.APPROVAL_THRESHOLDS[ApprovalLevel.LEVEL_2]:
            required_levels.extend([
                ApprovalLevel.LEVEL_1,
                ApprovalLevel.LEVEL_2
            ])
        elif amount >= self.APPROVAL_THRESHOLDS[ApprovalLevel.LEVEL_1]:
            required_levels.append(ApprovalLevel.LEVEL_1)
        
        return required_levels
    
    async def create_approval_workflow(
        self,
        transaction_id: str,
        required_levels: List[ApprovalLevel]
    ) -> bool:
        """
        Create approval records for each required level.
        Each level gets assigned to default approvers from org structure.
        """
        query = """
        INSERT INTO pending_approvals (transaction_id, approval_level, created_at)
        VALUES ($1, $2, NOW())
        """
        
        # TODO: For each level, find default approver and insert record
        return True
    
    async def validate_policy_compliance(
        self,
        category: str,
        amount: Decimal,
        project_id: Optional[str] = None
    ) -> Dict:
        """
        Validate transaction against all policies.
        
        Returns:
            {
                "compliant": bool,
                "violations": [list of violation messages],
                "warnings": [list of warning messages]
            }
        """
        violations = []
        warnings = []
        
        # Category validation
        VALID_CATEGORIES = ["revenue", "expense", "transfer", "adjustment", "payment", "collection"]
        if category not in VALID_CATEGORIES:
            violations.append(f"Invalid category: {category}")
        
        # Amount validation
        if amount <= 0:
            violations.append("Amount must be positive")
        elif amount > Decimal("1000000.00"):
            warnings.append("Transaction exceeds $1M - flagged for additional review")
        
        # TODO: Check project-specific policies if project_id provided
        
        return {
            "compliant": len(violations) == 0,
            "violations": violations,
            "warnings": warnings
        }


def get_policy(db_client):
    """Factory function for policy service"""
    return FinancePolicy(db_client)
