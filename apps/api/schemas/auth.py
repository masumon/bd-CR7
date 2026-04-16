from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=120)
    role_name: str = Field(default="viewer", min_length=3, max_length=40)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str


class SecuritySettingsResponse(BaseModel):
    biometric_enabled: bool
    pin_enabled: bool
    pin_configured: bool
    pin_failed_attempts: int = 0
    pin_locked_until: str | None = None
    trusted_device_label: str | None = None
    current_device_trusted: bool = False
    credential_count: int = 0
    can_register_biometric: bool = False
    has_biometric_credentials: bool = False
    email_hint: EmailStr | None = None


class SecuritySettingsUpdateRequest(BaseModel):
    biometric_enabled: bool | None = None
    pin_enabled: bool | None = None


class PinSetRequest(BaseModel):
    pin: str = Field(min_length=4, max_length=8)
    confirm_pin: str = Field(min_length=4, max_length=8)


class PinVerifyRequest(BaseModel):
    email: EmailStr
    pin: str = Field(min_length=4, max_length=8)
