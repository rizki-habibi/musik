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
