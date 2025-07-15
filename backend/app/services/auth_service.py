from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import secrets

from app.core.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT token"""
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        raise JWTError("Token non valido")


def create_reset_token() -> str:
    """Create a secure random token for password reset"""
    return secrets.token_urlsafe(32)


def verify_reset_token(token: str, stored_token: str, created_at: datetime) -> bool:
    """Verify password reset token"""
    # Token expires after 1 hour
    if datetime.utcnow() - created_at > timedelta(hours=1):
        return False
    
    return secrets.compare_digest(token, stored_token)


def is_strong_password(password: str) -> tuple[bool, list[str]]:
    """Check if password meets security requirements"""
    errors = []
    
    if len(password) < 6:
        errors.append("La password deve contenere almeno 6 caratteri")
    
    if len(password) > 100:
        errors.append("La password non può superare i 100 caratteri")
    
    if not any(c.islower() for c in password):
        errors.append("La password deve contenere almeno una lettera minuscola")
    
    if not any(c.isupper() for c in password):
        errors.append("La password deve contenere almeno una lettera maiuscola")
    
    if not any(c.isdigit() for c in password):
        errors.append("La password deve contenere almeno un numero")
    
    return len(errors) == 0, errors


def generate_secure_password(length: int = 12) -> str:
    """Generate a secure random password"""
    import string
    
    # Ensure we have at least one of each required character type
    password = [
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.digits),
        secrets.choice("!@#$%^&*")
    ]
    
    # Fill the rest with random characters
    all_chars = string.ascii_letters + string.digits + "!@#$%^&*"
    password.extend(secrets.choice(all_chars) for _ in range(length - 4))
    
    # Shuffle the password
    secrets.SystemRandom().shuffle(password)
    
    return ''.join(password) 