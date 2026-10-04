# Musika Studio

Studio komposisi musik berbasis browser yang membuat **struktur lagu yang tetap bisa diedit**, bukan sekadar audio final.

## Fitur versi awal
- Prompt konsep lagu.
- Generator chord, melody, bass, dan drum tanpa API key.
- Piano roll untuk mengedit setiap not melody.
- Arrangement track dan struktur proyek.
- Editor lirik dengan section Verse/Chorus/Bridge.
- Tempo, key, scale, style, mood, mixer dasar.
- Playback langsung dengan Tone.js.
- Ekspor MIDI.
- Penyimpanan proyek otomatis ke LocalStorage.
- Siap deploy sebagai static site di Vercel.

## Arah pengembangan
Fondasi sengaja memisahkan **composition data** dari audio renderer agar nantinya dapat ditambah:
- AI lyric writer.
- AI melody transformer.
- MIDI import/export lanjutan.
- Stem audio dan sample library.
- Vocal synthesis.
- Supabase untuk akun, project cloud, version history, collaboration.
- WebAudio effects / automation.
- Model generatif server-side sebagai asisten, tetapi hasil tetap masuk ke editor sebagai data yang bisa diubah.

## Menjalankan
Buka `index.html` atau jalankan static server lokal. Tidak ada API key yang diperlukan untuk fitur dasar.


## Pemisahan stem lokal
Versi ini menambahkan UI **Stem Studio** dan engine Python opsional berbasis FastAPI + Demucs. Jalankan secara lokal:

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn server:app --host 127.0.0.1 --port 8000
```

Buka `http://127.0.0.1:8000`.

Model `htdemucs_6s` dapat menghasilkan sumber vokal, drum, bass, gitar, piano, dan other. Di UI hasilnya sengaja dibuat generik menjadi **Vocal 1–3** dan **Musik 1–5**, dengan label deteksi kecil agar tidak berantakan. Saat ini model memisahkan campuran vokal sebagai satu sumber; Vocal 2/3 disiapkan untuk tahap pemisahan vokal multi-penyanyi berikutnya. Suara seperti gelas dapat tetap berada di `Musik 5 / Sisa instrumen / efek` bila model tidak mampu mengisolasinya sendiri.
