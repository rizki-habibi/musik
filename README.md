# Musika Studio

Studio musik AI berbasis Next.js + TypeScript dengan PWA, editor stem, piano roll, lirik, mixer, penyimpanan proyek lokal, dan engine pemisahan audio Python.

## Frontend
Jalankan `npm install` lalu `npm run dev`.

## Engine stem
Gunakan Python 3.11. Jalankan virtual environment, `pip install -r requirements.txt`, lalu `uvicorn server:app --reload --port 8000`. Buat `.env.local` berisi `AUDIO_ENGINE_URL=http://127.0.0.1:8000`.

## Fitur
- Upload MP3/WAV/M4A/OGG
- Pemisahan Demucs 6-stem
- Vocal 1–3 dan Musik 1–5
- Label sumber terdeteksi
- Arrangement, Piano Roll, Lirik, Mixer
- Mute, Solo, Volume, BPM
- Simpan proyek lokal
- Ekspor MIDI
- API proxy Next.js ke engine Python

Demucs adalah proses berat dan sebaiknya dijalankan di server terpisah untuk produksi.