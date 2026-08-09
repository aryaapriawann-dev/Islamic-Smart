# DEFINITION OF DONE — IHSAN.ID

> Mention file ini (`@DEFINITION_OF_DONE_IHSAN.md`) di SETIAP prompt yang meminta agent membangun atau mengubah fitur.

---

## 1. Masalah yang Ingin Dicegah

- Fitur yang "kelihatan jalan" di UI tapi logic-nya belum benar-benar terhubung/berfungsi.
- Fitur deteksi (CV) yang "berhasil" di satu kondisi tapi belum dicoba di kondisi lain (pencahayaan berbeda, sudut kamera berbeda, dsb).
- **Khusus project ini:** fitur yang secara teknis berjalan tapi melanggar prinsip privasi (misalnya diam-diam menyimpan foto, atau menampilkan hasil deteksi ke pihak lain selain yang bersangkutan).

**Aturan dasar: UI tanpa fungsi yang benar-benar bekerja BUKAN fitur selesai. Dan fitur yang bekerja tapi melanggar privasi jamaah BUKAN fitur selesai — itu bug kritis.**

---

## 2. Definisi "Selesai" — Checklist Umum

- [ ] Setiap tombol/menu/kiosk-flow yang terlihat di UI benar-benar terhubung ke logic yang bekerja.
- [ ] Sudah benar-benar dijalankan/di-test oleh agent, bukan hanya ditulis kodenya.
- [ ] Semua state ditangani: loading, kosong, error, sukses, DAN kondisi kamera/service down (lihat NFR "Graceful Degradation" di `MVP_IHSAN.md`).
- [ ] Sudah dicoba dengan skenario gagal (misalnya kamera tidak mendeteksi apa pun, koneksi ke Supabase terputus).
- [ ] Tidak ada TODO/placeholder tersisa untuk fitur yang diklaim selesai.
- [ ] Konsisten dengan struktur/style project yang sudah ada.

---

## 3. Checklist Khusus Privasi (WAJIB untuk fitur deteksi aurat & rakaat)

Sebuah fitur deteksi TIDAK boleh dilaporkan "selesai" kalau salah satu ini belum terpenuhi:

- [ ] **Tidak ada frame kamera/gambar yang disimpan ke disk atau database secara permanen.** Agent harus bisa menunjukkan di kode bahwa frame diproses in-memory lalu dibuang, bukan ditulis ke storage.
- [ ] **Hasil deteksi hanya ditampilkan ke orang yang bersangkutan.** Tidak ada endpoint/log yang membocorkan hasil deteksi personal ke user lain atau ke admin dengan identitas yang bisa ditelusuri ke individu tertentu.
- [ ] **Bahasa/copy di UI sudah diverifikasi tidak menghakimi.** Cek ulang teks yang ditampilkan ke jamaah — harus terasa sebagai pengingat yang sopan, bukan teguran/label negatif (lihat NFR-3 di `PRD_IHSAN.md`).
- [ ] **Data yang disimpan ke Supabase sudah dicek benar-benar teragregasi/anonim**, bukan menyimpan detail yang bisa mengidentifikasi individu, kecuali fitur tersebut memang secara eksplisit dirancang untuk personal login (misalnya sesi rakaat pribadi milik akun jamaah sendiri).
- [ ] Fitur kamera punya cara untuk **dimatikan/di-nonaktifkan admin** kapan saja (tombol emergency-off), dan ini sudah dicoba benar-benar berfungsi.

Kalau satu saja dari checklist ini belum bisa dibuktikan, status WAJIB "Belum Selesai" — walaupun secara fungsional fitur "kelihatan jalan".

---

## 4. Larangan

- Jangan melaporkan fitur "selesai" tanpa benar-benar menjalankannya.
- Jangan mengerjakan modul deteksi (CV) tanpa menyebutkan secara eksplisit bagaimana privasi datanya ditangani — ini bukan detail teknis biasa, ini syarat kelulusan fitur.
- Jangan diam-diam menambahkan penyimpanan gambar "untuk debugging" tanpa memberi tahu saya — walau niatnya sementara.
- Jangan melewati skenario "kamera/service gagal" — sistem harus tetap membiarkan jamaah masuk masjid tanpa hambatan meskipun fitur deteksi sedang error (lihat NFR "Graceful Degradation").

---

## 5. Format Laporan Wajib

```
STATUS: [Selesai / Belum Selesai / Sebagian]

Yang sudah bekerja dan sudah diverifikasi:
- ...

Checklist privasi (khusus fitur deteksi aurat/rakaat):
- Frame disimpan permanen? [Ya/Tidak — jelaskan]
- Hasil bocor ke pihak lain? [Ya/Tidak — jelaskan]
- Bahasa UI sudah tidak menghakimi? [Ya/Tidak]

Yang BELUM bekerja / belum diverifikasi:
- ...

Cara saya memverifikasi ini:
- ...

Langkah berikutnya:
- ...
```

Kalau kolom checklist privasi tidak bisa dijawab dengan jelas dan jujur, STATUS wajib "Belum Selesai".
