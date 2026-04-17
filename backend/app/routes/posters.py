from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def list_posters():
    return {"posters": [], "count": 0}
