# PRD — IHSAN.ID
### Product Requirement Document
*(Nama "Ihsan.id" bersifat sementara — silakan diganti sesuai brand yang diinginkan)*

---

## 1. Problem Statement

Masjid sering mengandalkan pengawasan manual oleh petugas/takmir untuk beberapa hal yang sebenarnya berulang dan melelahkan untuk dipantau terus-menerus:

- **Kesesuaian pakaian (aurat)** jamaah yang masuk ke area masjid — saat ini biasanya diingatkan langsung oleh petugas secara lisan, yang bisa terasa canggung/memalukan bagi jamaah dan tidak konsisten antar petugas.
- **Jumlah rakaat sholat** — jamaah yang lupa jumlah rakaat (kelebihan/kekurangan) biasanya baru sadar setelah selesai atau tidak sadar sama sekali, sehingga berpotensi salah dalam ibadahnya.
- **Data kunjungan harian** — masjid umumnya tidak punya catatan sistematis berapa banyak jamaah yang hadir per waktu sholat, padahal data ini berguna untuk perencanaan (kapasitas, kebutuhan logistik, evaluasi program masjid).

Solusi manual untuk ketiga hal ini tidak scalable, terutama saat momen ramai (Ramadan, sholat Jumat, hari raya), dan berisiko menimbulkan ketidaknyamanan sosial jika dilakukan dengan cara yang kurang tepat (misalnya teguran terbuka).

**Ihsan.id** hadir sebagai asisten digital yang membantu tiga hal ini secara lebih konsisten, tetap **menjaga privasi dan kenyamanan jamaah** sebagai prioritas utama — bukan sistem pengawasan yang menghakimi secara terbuka.

---

## 2. Goals

### Goals Produk (MVP)
- Membantu jamaah menyadari kesesuaian pakaian sebelum masuk area sholat, dengan feedback yang **privat** (hanya diketahui orang itu sendiri).
- Membantu jamaah yang sholat sendiri/di area personal mengetahui jika rakaatnya melebihi batas, lewat notifikasi yang **privat**, tanpa mengganggu kekhusyukan atau menimbulkan rasa malu.
- Menyediakan data jumlah pengunjung harian secara otomatis dan akurat, termasuk laporan yang bisa diunduh dalam format PDF oleh pengurus masjid.

### Prinsip Desain (Non-Negotiable)
- **Privasi dan martabat jamaah di atas segalanya.** Sistem ini bersifat *membantu*, bukan *mengawasi/menghakimi secara publik*.
- Tidak ada penyimpanan identitas pribadi yang dikaitkan dengan hasil deteksi aurat atau rakaat.
- Tidak ada notifikasi/teguran yang terlihat oleh orang lain selain yang bersangkutan.

### Non-Goals (di luar cakupan MVP)
- Sistem pengenalan wajah / identifikasi personal jamaah.
- Penyimpanan foto/video jamaah secara permanen.
- Deteksi rakaat untuk seluruh jamaah dalam satu shaf/kerumunan sholat berjamaah sekaligus (lihat catatan teknis di bagian 7).
- Fitur pembayaran, donasi online, atau integrasi media sosial.

---

## 3. Target User

### 3.1 Jamaah (Pengunjung Masjid)
- Individu yang datang untuk sholat, baik sendiri maupun berjamaah.
- Ingin diingatkan dengan cara yang sopan dan privat, bukan dipermalukan di depan umum.

### 3.2 Takmir / Pengurus Masjid (Admin)
- Bertanggung jawab atas operasional masjid, ingin data kunjungan untuk perencanaan dan pelaporan.
- Mengelola konfigurasi sistem (misalnya ambang batas deteksi, jadwal aktif kamera).

### 3.3 Petugas Penerima Tamu (opsional, pendukung)
- Tetap menjadi pihak yang berinteraksi langsung dengan jamaah jika diperlukan; sistem ini adalah alat bantu, bukan pengganti kebijaksanaan manusia.

---

## 4. User Stories

### Jamaah
- Sebagai jamaah, saya ingin tahu secara privat jika pakaian saya belum sesuai sebelum masuk area sholat, agar saya bisa memperbaikinya tanpa merasa malu di depan orang lain.
- Sebagai jamaah yang sholat di area personal, saya ingin diberi tahu secara halus jika rakaat saya sudah melebihi batas, agar saya bisa menyelesaikan sholat dengan benar (termasuk kemungkinan perlu sujud sahwi).
- Sebagai jamaah, saya ingin yakin bahwa wajah/identitas saya tidak disimpan atau dikaitkan dengan data apa pun oleh sistem ini.

### Takmir / Admin
- Sebagai admin, saya ingin melihat jumlah pengunjung masjid per waktu sholat dan per hari, agar saya bisa merencanakan kebutuhan operasional masjid.
- Sebagai admin, saya ingin mengunduh laporan kunjungan dalam format PDF, agar saya bisa mengarsipkan atau melaporkannya ke pihak lain (misalnya yayasan/DKM).
- Sebagai admin, saya ingin mengatur ambang batas (misalnya jumlah rakaat maksimal per jenis sholat) agar sistem sesuai kebutuhan masjid saya.

---

## 5. Functional Requirements

### 5.1 Modul Deteksi Kesesuaian Pakaian (Aurat)
- **FR-1:** Sistem harus mendeteksi kesesuaian pakaian jamaah secara real-time melalui kamera di titik masuk (misalnya kiosk/layar di pintu masjid).
- **FR-2:** Hasil deteksi HANYA ditampilkan secara privat kepada jamaah yang bersangkutan (misalnya di layar kiosk yang hanya terlihat oleh orang di depannya), tidak diumumkan, tidak dikirim ke petugas dengan identitas.
- **FR-3:** Sistem tidak boleh menyimpan gambar/video wajah jamaah secara permanen. Frame kamera diproses secara real-time dan langsung dibuang setelah hasil deteksi didapat (lihat NFR-1).
- **FR-4:** Admin dapat mengatur kriteria/ambang batas deteksi (misalnya bagian tubuh yang dinilai) melalui panel admin.

### 5.2 Modul Deteksi Rakaat Berlebih
- **FR-5:** Sistem harus menyediakan area/kiosk personal (1 orang per sesi) di mana jamaah dapat memilih untuk diawasi rakaatnya secara opt-in (jamaah yang tidak ingin menggunakan fitur ini tetap bisa sholat seperti biasa tanpa terpantau).
- **FR-6:** Sistem menghitung siklus gerakan sholat (berdiri–rukuk–sujud–duduk) dan membandingkan dengan jumlah rakaat maksimal sesuai jenis sholat yang dipilih jamaah di awal sesi.
- **FR-7:** Jika rakaat terdeteksi melebihi batas, sistem memberikan notifikasi privat (contoh: getaran di perangkat pribadi jamaah, atau indikator visual kecil yang hanya terlihat oleh jamaah itu sendiri) — **bukan** suara/pengumuman yang terdengar orang lain.
- **FR-8:** Jamaah dapat memilih jenis sholat (Subuh/Dzuhur/Ashar/Maghrib/Isya/sholat sunnah lain) di awal sesi agar batas rakaat sesuai.

### 5.3 Modul Penghitung Pengunjung
- **FR-9:** Sistem harus menghitung jumlah orang yang masuk melalui titik akses masjid secara real-time menggunakan kamera, tanpa mengidentifikasi individu (hanya menghitung, bukan mengenali siapa).
- **FR-10:** Data jumlah pengunjung disimpan teragregasi per jam/per waktu sholat/per hari di Supabase.
- **FR-11:** Admin dapat melihat dashboard jumlah pengunjung (harian, mingguan, per waktu sholat) di panel admin.
- **FR-12:** Admin dapat mengunduh laporan kunjungan dalam format PDF untuk rentang tanggal yang dipilih.

### 5.4 Panel Admin
- **FR-13:** Admin dapat login secara aman untuk mengakses dashboard dan pengaturan sistem.
- **FR-14:** Admin dapat mengatur jadwal aktif kamera (misalnya hanya aktif menjelang & selama waktu sholat, tidak 24 jam, untuk menghemat resource dan menjaga privasi di luar waktu ibadah).

---

## 6. Non-Functional Requirements

- **NFR-1 (Privacy by Design):** Frame kamera untuk deteksi aurat dan rakaat diproses secara real-time dan TIDAK disimpan permanen. Hanya hasil agregat (angka, status) yang disimpan ke database, bukan gambar/video individu.
- **NFR-2 (No Public Shaming):** Seluruh feedback dari sistem (aurat, rakaat) wajib bersifat privat — dapat dilihat/dirasakan HANYA oleh jamaah yang bersangkutan. Tidak ada mekanisme yang menampilkan hasil deteksi ke publik atau ke petugas dengan identitas personal.
- **NFR-3 (Akurasi & Batasan Sistem):** Sistem deteksi (computer vision) tidak akan 100% akurat. Antarmuka harus menyampaikan hasil sebagai *pengingat*, bukan *keputusan final/menghakimi* (contoh copy: "Yuk, sesuaikan pakaian sebelum masuk" bukan "Pakaian Anda tidak sesuai").
- **NFR-4 (Anonymity untuk Data Kunjungan):** Data penghitung pengunjung wajib teragregasi (angka saja), tidak boleh menyimpan data yang bisa mengidentifikasi individu.
- **NFR-5 (Performance):** Deteksi real-time di titik masuk harus responsif (target di bawah 1-2 detik) agar tidak menciptakan antrean di pintu masjid.
- **NFR-6 (Resilience):** Modul penghitung pengunjung harus tetap berfungsi (menyimpan data lokal sementara) jika koneksi internet terputus, lalu sinkron ke Supabase saat koneksi kembali.
- **NFR-7 (Aksesibilitas):** Notifikasi privat sebaiknya tersedia dalam lebih dari satu bentuk (visual + getar) agar tetap dapat diakses jamaah dengan keterbatasan pendengaran/penglihatan.
- **NFR-8 (Simplicity):** Backend menggunakan Supabase (database + auth + storage + API standar) dan satu service Python (FastAPI) khusus untuk logic deteksi CV — tanpa bahasa/database tambahan lain, untuk menjaga kompleksitas tetap rendah di tahap MVP.

---

## 7. Scope

### In Scope (Fase 1 — MVP)
- Modul penghitung pengunjung (paling matang secara teknis, prioritas utama untuk dikerjakan dan divalidasi lebih dulu).
- Modul deteksi kesesuaian pakaian di titik masuk (kiosk single-point, feedback privat).
- Panel admin dasar: login, dashboard jumlah pengunjung, unduh laporan PDF.

### In Scope (Fase 2 — Menyusul, butuh riset kelayakan teknis lebih dulu)
- Modul deteksi rakaat berlebih — **dimulai dari skenario personal/kiosk single-user (opt-in)**, bukan mendeteksi seluruh jamaah dalam satu shaf sekaligus (lihat catatan teknis di bawah).
- Pengaturan ambang batas & jadwal kamera yang lebih detail di panel admin.

### In Scope (Fase 3 — Menyusul)
- Perluasan modul rakaat ke skenario multi-orang (jika riset kelayakan Fase 2 menunjukkan hasil yang cukup akurat).
- Analitik lanjutan (tren kunjungan, perbandingan antar waktu sholat/bulan).

### Out of Scope
- Sistem pengenalan wajah / identifikasi personal jamaah.
- Penyimpanan foto/video jamaah secara permanen.
- Notifikasi/teguran yang terlihat/terdengar oleh orang lain selain jamaah bersangkutan.
- Fitur pembayaran/donasi online.

### Catatan Teknis & Pertanyaan Terbuka
- **Kelayakan deteksi rakaat multi-orang belum terbukti.** Mendeteksi rakaat tiap individu dalam kerumunan jamaah sholat berjamaah adalah masalah computer vision yang sangat sulit (banyak orang saling menutupi pandangan kamera, kecepatan gerakan berbeda-beda terutama makmum yang datang terlambat/masbuk). MVP membatasi fitur ini ke skenario personal dulu.
- Apakah fitur deteksi aurat & rakaat bersifat **wajib** atau **opt-in** bagi jamaah? PRD ini mengasumsikan **opt-in** untuk rakaat, tapi untuk deteksi aurat di pintu masuk perlu didiskusikan lagi apakah semua orang otomatis "dipindai" saat lewat kiosk atau ada mekanisme consent eksplisit.
- Bagaimana masjid menyampaikan ke jamaah bahwa ada sistem kamera ini beroperasi (perlu ada papan pemberitahuan/signage sebagai bentuk transparansi, ini di luar cakupan teknis tapi penting secara etis)?
- Siapa yang berwenang mengubah ambang batas deteksi (misalnya definisi "kurang menutup aurat")? Ini keputusan sensitif yang sebaiknya melibatkan pengurus/ulama masjid, bukan keputusan teknis semata.
