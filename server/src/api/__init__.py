from fastapi import APIRouter
from .v1 import auth as auth, users, analytics, predictions

api_router = APIRouter()

# Authentication routes
api_router.include_router(
    auth.router, 
    prefix="/auth", 
    tags=["Authentication"],
    # responses={
    #     401: {"description": "Unauthorized"},
    #     403: {"description": "Forbidden"},
    #     422: {"description": "Validation Error"},
    # }
)

# User routes
api_router.include_router(
    users.router, 
    prefix="/users", 
    tags=["Users"],
    # responses={
    #     401: {"description": "Unauthorized"},
    #     403: {"description": "Forbidden"},
    #     422: {"description": "Validation Error"},
    # }
)

# Analytics routes
api_router.include_router(
    analytics.router, 
    prefix="/analytics", 
    tags=["Analytics"],
    # responses={
    #     401: {"description": "Unauthorized"},
    #     403: {"description": "Forbidden"},
    #     422: {"description": "Validation Error"},
    # }
)

# Predictions routes
api_router.include_router(
    predictions.router, 
    prefix="/predictions", 
    tags=["Predictions"],
    # responses={
    #     401: {"description": "Unauthorized"},
    #     403: {"description": "Forbidden"},
    #     422: {"description": "Validation Error"},
    # }
)

__all__ = ['api_router']
