from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
import requests
import os

bearer_scheme = HTTPBearer()
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Fetch Supabase JWKs to validate JWT
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
jwks = requests.get(JWKS_URL).json()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, jwks, algorithms=["RS256"], audience=None)
        user_id = payload.get("sub")
        return user_id
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")