"""Custom exception types for BD CR7 API."""

class AuthError(Exception):
    """Raised when authentication/registration fails."""
    pass


class RoleNotFoundError(AuthError):
    """Raised when required role is missing."""
    pass


class MetadataError(AuthError):
    """Raised when user metadata is invalid or missing."""
    pass


class AccountError(Exception):
    """Raised when account operation fails."""
    pass


class AccountNotFoundError(AccountError):
    """Raised when account does not exist."""
    pass


class AccountLockedError(AccountError):
    """Raised when account is locked."""
    pass


class InsufficientFundsError(AccountError):
    """Raised when account balance is insufficient."""
    pass


class TransferError(Exception):
    """Raised when fund transfer fails."""
    pass


class TransferValidationError(TransferError):
    """Raised when transfer validation fails (same account, invalid amount, etc)."""
    pass


class TransferExecutionError(TransferError):
    """Raised when transfer RPC execution fails."""
    pass


class ExpenseError(Exception):
    """Raised when expense operation fails."""
    pass


class ApprovalError(Exception):
    """Raised when approval operation fails."""
    pass
