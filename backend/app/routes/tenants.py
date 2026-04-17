from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def list_tenants():
    return {"tenants": [], "count": 0}
