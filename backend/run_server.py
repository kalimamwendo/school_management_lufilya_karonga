import uvicorn
from pathlib import Path
import sys


if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000)
