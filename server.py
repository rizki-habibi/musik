from pathlib import Path
import shutil
import subprocess
import uuid
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.staticfiles import StaticFiles

ROOT = Path(__file__).parent
MEDIA = ROOT / "media"
UPLOADS = MEDIA / "uploads"
OUTPUTS = MEDIA / "stems"
UPLOADS.mkdir(parents=True, exist_ok=True)
OUTPUTS.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Musika Stem Engine")
app.mount("/media", StaticFiles(directory=MEDIA), name="media")

STEM_MAP = {
    "vocals": ("Vocal 1", "Vokal utama"),
    "guitar": ("Musik 1", "Gitar"),
    "piano": ("Musik 2", "Piano"),
    "drums": ("Musik 3", "Drum"),
    "bass": ("Musik 4", "Bass"),
    "other": ("Musik 5", "Sisa instrumen / efek"),
}

@app.get("/api/health")
def health():
    return {"ok": True, "engine": "Demucs htdemucs_6s"}

@app.post("/api/separate")
async def separate(file: UploadFile = File(...)):
    if not file.filename or not (file.content_type or "").startswith("audio/"):
        raise HTTPException(400, "File audio tidak valid")

    job = uuid.uuid4().hex
    safe_name = Path(file.filename).name
    source = UPLOADS / f"{job}_{safe_name}"
    with source.open("wb") as out:
        shutil.copyfileobj(file.file, out)

    job_dir = OUTPUTS / job
    job_dir.mkdir(parents=True, exist_ok=True)

    try:
        subprocess.run(
            ["python", "-m", "demucs.separate", "-n", "htdemucs_6s",
             "--out", str(job_dir), str(source)],
            check=True,
            capture_output=True,
            text=True,
            timeout=900,
        )
    except subprocess.CalledProcessError as exc:
        raise HTTPException(500, f"Mesin pemisahan gagal: {exc.stderr[-1200:]}")
    except subprocess.TimeoutExpired:
        raise HTTPException(504, "Pemisahan terlalu lama")

    model_dir = job_dir / "htdemucs_6s" / source.stem
    stems = []
    for key, (name, detected) in STEM_MAP.items():
        candidates = [model_dir / f"{key}.wav", model_dir / f"{key}.mp3"]
        path = next((p for p in candidates if p.exists()), None)
        if path:
            stems.append({
                "name": name,
                "detected": detected,
                "url": f"/media/stems/{job}/htdemucs_6s/{source.stem}/{path.name}",
            })

    return {"job": job, "stems": stems}
\n# Serve the studio itself after API routes so /api/* remains available.\napp.mount("/", StaticFiles(directory=ROOT, html=True), name="web")\n