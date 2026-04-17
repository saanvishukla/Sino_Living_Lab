from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def list_buildings():
    return {"buildings": [], "count": 0}
