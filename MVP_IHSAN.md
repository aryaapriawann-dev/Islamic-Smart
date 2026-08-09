# MVP SPECIFICATION — IHSAN.ID

---

## 1. Project Overview

| Komponen | Deskripsi |
|---|---|
| **Nama (sementara)** | Ihsan.id |
| **Konsep Inti** | Asisten digital masjid yang membantu kesesuaian pakaian jamaah, mengingatkan kelebihan rakaat secara privat, dan menghitung jumlah pengunjung harian — dengan privasi & martabat jamaah sebagai prioritas utama. |
| **Frontend** | Next.js (Web App) |
| **Backend & Database** | Supabase (PostgreSQL, Auth, Storage, auto-generated API) |
| **Service Deteksi (Computer Vision)** | Python + FastAPI, berjalan sebagai microservice terpisah, berkomunikasi ke Supabase via REST |
| **Monetization** | Tidak ada di MVP — ini alat bantu operasional masjid, bukan produk komersial. |

---

## 2. Arsitektur Sistem

```
[Kamera Kiosk Pintu Masuk] ---> [Python/FastAPI: Aurat Detection Service] ---> [Supabase: simpan hasil agregat]
[Kamera Kiosk Personal]    ---> [Python/FastAPI: Rakaat Detection Service] ---> [Supabase: simpan hasil agregat]
[Kamera Titik Akses]       ---> [Python/FastAPI: Visitor Counting Service] ---> [Supabase: simpan hitungan]

[Next.js Web App] <---> [Supabase API] (dashboard admin, laporan PDF, konfigurasi)
```

**Prinsip penting:** ketiga service Python di atas TIDAK mengirim gambar/video ke Supabase. Yang dikirim hanya **hasil akhir** (status/angka). Pemrosesan gambar terjadi sepenuhnya di sisi service Python secara real-time lalu frame dibuang.

---

## 3. Fokus Pengembangan (Fase)

| Fase | Deskripsi |
|---|---|
| **Fase 1 — Prioritas Saat Ini** | Modul Penghitung Pengunjung (paling feasible secara teknis) + Modul Deteksi Aurat (kiosk single-point) + Panel Admin dasar (login, dashboard, unduh PDF). |
| **Fase 2 — Menyusul** | Riset kelayakan & implementasi Modul Deteksi Rakaat untuk skenario personal/opt-in. |
| **Fase 3 — Menyusul** | Perluasan & analitik lanjutan, tergantung hasil validasi Fase 1 & 2. |

---

## 4. MVP Feature Specifications

### 4.1. Modul Penghitung Pengunjung
- Kamera di titik akses masjid melakukan **people counting** (deteksi + hitung orang yang melewati garis virtual), TANPA identifikasi wajah.
- Data dikirim ke Supabase sebagai angka teragregasi per timestamp (misalnya per 15 menit), lalu di-roll-up menjadi ringkasan per waktu sholat/per hari.
- Dashboard admin menampilkan grafik kunjungan harian/mingguan.
- Tombol "Unduh Laporan PDF" dengan pilihan rentang tanggal — laporan berisi tabel jumlah pengunjung per waktu sholat per hari dalam rentang yang dipilih.

### 4.2. Modul Deteksi Kesesuaian Pakaian (Aurat)
- Kiosk/layar di pintu masuk menyalakan kamera saat jamaah berdiri di depannya (dipicu manual dengan tombol "Cek", bukan otomatis merekam terus-menerus, untuk menghormati privasi).
- Frame diproses oleh service Python (model computer vision untuk klasifikasi kesesuaian pakaian).
- Hasil ditampilkan HANYA di layar kiosk yang sedang dihadapi jamaah tersebut, dengan bahasa yang sopan dan tidak menghakimi.
- Setelah hasil ditampilkan (durasi singkat, misal 5 detik), frame kamera dibuang. Tidak ada penyimpanan gambar.
- Admin dapat melihat statistik AGREGAT (misalnya "berapa persen kunjungan hari ini yang mendapat pengingat pakaian"), tanpa detail siapa orangnya.

### 4.3. Modul Deteksi Rakaat Berlebih (Fase 2)
- Kiosk personal terpisah dari kiosk aurat, khusus untuk 1 orang per sesi, sifatnya **opt-in** (jamaah aktif memilih menggunakan fitur ini).
- Jamaah memilih jenis sholat sebelum mulai, sistem tahu batas rakaat maksimal.
- Service Python melakukan pose estimation untuk mendeteksi transisi berdiri–rukuk–sujud–duduk sebagai satu siklus rakaat.
- Jika rakaat terhitung melebihi batas, sistem mengirim sinyal privat (getar ke perangkat pribadi jamaah yang terhubung via Bluetooth/web push, atau indikator visual kecil di kiosk).
- Fitur ini TIDAK aktif secara default untuk sholat berjamaah di ruang utama — hanya untuk area kiosk personal yang disediakan khusus.

### 4.4. Panel Admin (Next.js + Supabase Auth)
- Login admin (email/password via Supabase Auth).
- Dashboard: grafik pengunjung, statistik agregat deteksi pakaian.
- Halaman pengaturan: ambang batas deteksi, jadwal aktif kamera per waktu sholat.
- Halaman laporan: filter rentang tanggal, tombol unduh PDF.

---

## 5. Backend & Infrastructure

- **Supabase:**
  - Tabel `visitor_counts` (timestamp, count, prayer_time_label).
  - Tabel `attire_check_logs` (timestamp, result_status — TANPA foto/identitas).
  - Tabel `rakaat_sessions` (session_id, prayer_type, max_rakaat, detected_rakaat, exceeded_boolean, timestamp — TANPA identitas personal kecuali jamaah login untuk keperluan pribadi opsional).
  - Supabase Auth untuk admin.
  - Supabase Storage HANYA untuk aset non-personal (misalnya logo, ikon), bukan untuk foto jamaah.
- **Python/FastAPI Service(s):**
  - Endpoint `/detect/attire` — menerima stream/frame, mengembalikan status, tidak menyimpan frame.
  - Endpoint `/detect/rakaat/start` dan `/detect/rakaat/status` — mengelola sesi personal.
  - Endpoint `/count/visitor` — menerima event deteksi orang lewat, mengirim hitungan ke Supabase.
  - Endpoint `/report/pdf` (atau digenerate di sisi Next.js menggunakan data dari Supabase) — generate PDF laporan kunjungan.

---

## 6. System Flow (Contoh: Modul Penghitung Pengunjung)

1. Kamera di titik akses menangkap video stream secara terus-menerus selama jam operasional masjid (dijadwalkan admin).
2. Service Python memproses stream, mendeteksi orang yang melewati garis virtual, menambah counter.
3. Setiap interval waktu tertentu (misalnya 15 menit), counter dikirim ke Supabase sebagai satu baris data.
4. Dashboard Next.js mengambil data dari Supabase secara real-time/berkala untuk menampilkan grafik.
5. Admin memilih rentang tanggal di halaman laporan → sistem generate PDF → admin unduh.

---

## 7. Non-Functional Requirements & Optimizations

- **Privacy-First Processing:** Semua pemrosesan gambar wajah/tubuh terjadi secara real-time di service Python dan tidak pernah disimpan ke disk/database secara permanen.
- **Low Latency:** Target respons deteksi di bawah 1-2 detik agar tidak menciptakan antrean di pintu masjid.
- **Graceful Degradation:** Jika service deteksi (Python) sedang down, kiosk tetap menampilkan pesan yang sopan (misalnya "Sistem sedang tidak aktif, silakan langsung masuk") — TIDAK memblokir akses jamaah ke masjid dalam kondisi apa pun.
- **Data Retention:** Data agregat (angka kunjungan, status pengingat) disimpan sesuai kebijakan retensi yang ditentukan admin (misalnya maksimal 1 tahun), bukan disimpan selamanya tanpa batas.
