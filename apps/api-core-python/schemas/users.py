from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=120)
    role_name: str = Field(default="viewer", min_length=3, max_length=40)


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    role_name: str | None = Field(default=None, min_length=3, max_length=40)
    is_active: bool | None = None


class UserProfileUpdate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=32)


class WorkspacePreferencesPatch(BaseModel):
    theme: str | None = Field(default=None, pattern="^(dark|light)$")
    language: str | None = Field(default=None, pattern="^(en|bn)$")
    integrations: dict[str, bool] | None = None
