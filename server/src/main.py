from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def read_root():
    return {"Hello": "World"}  

@app.get("/healthz")
def read_api_health():
    return {"status": "ok"}
