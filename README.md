# Perang Dunia (prototipe)

Game strategi turn-based: perang diselesaikan dengan hitungan angka (tipe pasukan, counter, terrain, moral, pengalaman, jenderal, suplai, kelelahan).

## Jalankan lokal
Buka folder di VS Code, klik kanan `index.html` > **Open with Live Server**. (Jangan klik dua kali file-nya, karena data JSON dimuat lewat `fetch`.)

## Deploy
1. Upload semua isi folder ini ke repo GitHub (file `index.html` harus ada di root repo).
2. Di vercel.com: Add New > Project > pilih repo > Framework Preset: **Other** > Deploy.

## Menambah konten
- Faksi: `data/factions.json`
- Provinsi (posisi grid `c`,`r`): `data/provinces.json`
- Unit: `data/units.json`
