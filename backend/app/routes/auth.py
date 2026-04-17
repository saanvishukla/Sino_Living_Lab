from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_token, get_current_user, hash_password, verify_password
from app.db.base import get_db
from app.db.models import User, UserRole

router = APIRouter()


class SignupPayload(BaseModel):
    email: EmailStr
    name: str
    password: str


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    token: str
    user: UserOut


@router.post("/signup", response_model=AuthResponse)
async def signup(payload: SignupPayload, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # First user becomes admin; others default to designer
    count_q = await db.execute(select(User))
    is_first = count_q.scalars().first() is None

    user = User(
        email=payload.email,
        name=payload.name,
        password_hash=hash_password(payload.password),
        role=UserRole.ADMIN if is_first else UserRole.DESIGNER,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return AuthResponse(token=create_token(user.id), user=UserOut.model_validate(user))


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginPayload, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalars().first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return AuthResponse(token=create_token(user.id), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return user
