"""
WebSocket authentication middleware for JWT.
"""
from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from ninja_jwt.tokens import AccessToken
from ninja_jwt.exceptions import TokenError, InvalidToken


@database_sync_to_async
def get_user_from_token(token_str: str):
    """Validate JWT token and return user."""
    from users.models import User
    
    try:
        # Decode the token
        token = AccessToken(token_str)
        user_id = token.get('user_id')
        
        if not user_id:
            return AnonymousUser()
        
        # Get the user
        user = User.objects.get(id=user_id)
        if not user.is_active:
            return AnonymousUser()
        
        return user
        
    except (TokenError, InvalidToken, User.DoesNotExist):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom middleware that authenticates WebSocket connections using JWT.
    Token can be passed via query string: ?token=<jwt>
    """
    
    async def __call__(self, scope, receive, send):
        # Get token from query string
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token_list = query_params.get('token', [])
        
        if token_list:
            token = token_list[0]
            scope['user'] = await get_user_from_token(token)
        else:
            scope['user'] = AnonymousUser()
        
        return await super().__call__(scope, receive, send)
