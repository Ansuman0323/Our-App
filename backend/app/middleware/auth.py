import jwt
from jwt import PyJWKClient
import logging
from functools import wraps
from flask import request, jsonify, g, current_app
from app.models.user import User

logger = logging.getLogger(__name__)

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Unauthorized", "message": "Missing authorization header"}), 401
        
        token = auth_header.split(" ")[1]
        
        try:
            unverified_header = jwt.get_unverified_header(token)
            alg = unverified_header.get('alg', 'HS256')
            
            if alg in ['RS256', 'ES256']:
                supabase_url = current_app.config.get("SUPABASE_URL")
                jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
                
                jwks_client = PyJWKClient(jwks_url, cache_keys=True)
                signing_key = jwks_client.get_signing_key_from_jwt(token)
                secret_or_key = signing_key.key
            else:
                secret_or_key = current_app.config.get("SUPABASE_JWT_SECRET")

            # Update: Explicitly disable 'iat' verification to completely bypass local clock skew
            payload = jwt.decode(
                token,
                secret_or_key,
                algorithms=[alg],
                audience="authenticated",
                options={"verify_iat": False} 
            )
            
            supabase_uid = payload["sub"]
            g.supabase_uid = supabase_uid
            
            user = User.query.filter_by(supabase_uid=supabase_uid).first()
            
            if not user and request.endpoint != 'auth.sync_user':
                logger.warning(f"User {supabase_uid} missing in PostgreSQL. Denying {request.endpoint}")
                return jsonify({"error": "Unauthorized", "message": "User not synchronized with database"}), 401
                
            g.current_user = user
            
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Unauthorized", "message": "Token expired"}), 401
        except Exception as e:
            logger.error(f"JWT Verification Error: {str(e)}")
            return jsonify({"error": "Unauthorized", "message": "Invalid token"}), 401
            
        return f(*args, **kwargs)
    return decorated