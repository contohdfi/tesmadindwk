# Sistem Rekapitulasi Kehadiran Madrasah Diniyah Darul Lughah Wal Karomah

Aplikasi web administrasi terpusat untuk mengelola, merekap, dan menyinkronkan data kehadiran **Pengajar**, **Karyawan**, dan **Badal** di lingkungan **Madrasah Diniyah Darul Lughah Wal Karomah** secara real-time dengan database Google Spreadsheet (melalui Google Apps Script API) serta fitur ekspor laporan visual berformat **JPG** siap bagikan ke grup WhatsApp.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Berikut adalah keputusan utama yang telah dikonfirmasi dari diskusi awal dan akan diterapkan langsung ke dalam arsitektur aplikasi:

- **Struktur Sesi KBM Harian (Dikonfirmasi)**: Mendukung multi-jam atau sesi KBM kustom (misalnya: *Jam Ke-1, Jam Ke-2, Sesi Sore, Sesi Malam*) yang dapat disesuaikan oleh Staf Administrasi, dilengkapi filter per sesi KBM maupun gabungan harian.
- **Pencatatan Pengajar Badal (Dikonfirmasi — Kombinasi Opsi 2 & 3)**:
  1. **Entri Terpisah**: Kehadiran pengajar Badal dicatat sebagai entri mandiri tanpa memotong otomatis kuota guru tertentu secara kaku, sehingga fleksibel direkap dalam laporan harian maupun akumulasi bulanan.
  2. **Catatan & Keterangan Laporan Harian**: Tersedia kolom/bagian keterangan khusus Badal pada laporan harian per-KBM (mencatat siapa yang membadal, kelas/kitab, dan keterangan ringkas) yang tampil langsung pada kartu ekspor JPG.
- **Integrasi Google Apps Script & Spreadsheet (Dikonfirmasi)**: Menyediakan panel pengaturan URL Web App API (`exec`), indikator sinkronisasi real-time dua arah (*Pull & Push*), serta **Generator Kode Google Apps Script (`Code.gs`) siap salin** lengkap dengan panduan instalasi langkah demi langkah dan kompatibilitas hosting statis GitHub.
- **Desain Ekspor Laporan JPG (Dikonfirmasi)**: Menggunakan tata letak **Kartu Ringkasan Visual khusus WhatsApp** beresolusi tinggi (tajam saat dibuka di layar ponsel), memuat identitas resmi *Madrasah Diniyah Darul Lughah Wal Karomah*, ringkasan metrik kehadiran, rincian per sesi KBM (Pengajar, Karyawan, serta keterangan Badal), dan tabel rekapitulasi bulanan yang bersih.

---

## 1. Overview & Core Concept

- **What It Does**: Menyediakan ruang kerja digital bagi Staf Administrasi Madrasah Diniyah Darul Lughah Wal Karomah untuk menginput absensi harian per sesi KBM (Hadir, Izin, Sakit, Alpa/Tanpa Keterangan), mencatat penugasan Badal beserta keterangan hariannya, melihat kalkulasi rekapitulasi bulanan secara otomatis, menyinkronkan seluruh data secara real-time ke Google Spreadsheet, dan mengunduh laporan harian maupun bulanan dalam bentuk gambar **JPG**.
- **Target Audience / Persona**: Staf Administrasi Madrasah Diniyah yang membutuhkan kecepatan input data harian, akurasi rekap bulanan untuk pelaporan/bisyaroh, serta kemudahan membagikan laporan ke pimpinan dan grup WhatsApp pengajar.
- **Key Value**: Menghilangkan rekap manual berulang di buku/lembar kerja terpisah; cukup satu kali input oleh admin, data langsung tersimpan di Spreadsheet dan siap diekspor menjadi kartu gambar JPG yang rapi dalam hitungan detik.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Input & Rekap Harian (Per-KBM)**:
   - Admin memilih tanggal, tingkatan/unit (atau semua unit), dan **Sesi KBM** (misal: *Jam 1, Jam 2, Sore, Malam*, atau *Karyawan Harian*).
   - Admin menandai status kehadiran cepat (*Hadir, Izin, Sakit, Alpa*) dalam tabel berdensitas tinggi, termasuk tombol *Tandai Semua Hadir* untuk mempercepat input rutin.
   - Admin menambahkan **Entri Badal & Keterangan Harian** pada sesi KBM terkait (nama badal, kelas/jam, dan catatan keterangan).
   - Setiap perubahan disimpan otomatis secara lokal dan langsung disinkronkan ke Google Spreadsheet apabila URL API aktif.
2. **Laporan & Rekapitulasi Bulanan**:
   - Admin memilih periode Bulan & Tahun serta kategori (*Pengajar, Karyawan, atau Badal*).
   - Sistem menyajikan tabel matriks akumulasi kehadiran (*Total KBM/Hari Kerja, Hadir, Izin, Sakit, Alpa, Persentase Kehadiran, dan Total Sesi Badal*) dengan angka tabular yang sejajar rapi.
3. **Studio Ekspor Kartu JPG (WhatsApp-Ready)**:
   - Dari halaman Laporan Harian (per-KBM) maupun Laporan Bulanan, admin menekan tombol **Ekspor JPG**.
   - Pratinjau kartu visual ditampilkan secara interaktif (rasio potret/kompak yang nyaman dibaca di WhatsApp tanpa perlu zoom berlebihan), menampilkan Kop Madrasah Diniyah Darul Lughah Wal Karomah, tanggal/sesi KBM, statistik ringkas, daftar kehadiran/ketidakhadiran, serta blok keterangan Badal.
   - Admin menekan **Unduh Gambar (.JPG)** untuk menghasilkan file `.jpg` beresolusi tinggi (`2x` retina scale).
4. **Manajemen Data Master & Integrasi Spreadsheet**:
   - Admin mengelola daftar **Pengajar, Karyawan, Pengajar Badal**, serta daftar **Sesi KBM**.
   - Pada tab **Integrasi Apps Script & GitHub**, admin menempelkan URL Web App Google Apps Script, menguji koneksi, melakukan sinkronisasi paksa (*Tarik Data dari Sheet* / *Kirim Semua ke Sheet*), atau menyalin kode `Code.gs` siap pakai yang otomatis membuat lembar kerja di Google Spreadsheet.

### Visual Identity & Theme
- **Aesthetic Direction**: *Clean Institutional Workspace* — memadukan kewibawaan lembaga pendidikan Islam pesantren (aksen hijau zamrud tua khas madrasah) dengan ketajaman antarmuka SaaS spreadsheet modern.
- **Color Palette & Mood (60-30-10 Discipline)**:
  - **60% Dominant Neutral Canvas**: Latar utama putih bersih dan abu-abu sejuk lembut (`#F8FAFC` / `slate-50`) dengan kontras permukaan kartu putih (`#FFFFFF`).
  - **30% Structural Surfaces**: Garis pembatas tipis (`1px solid #E2E8F0`), header tabel (`#F1F5F9`), dan teks struktural (`#0F172A` untuk judul utama, `#475569` untuk metadata).
  - **10% Accent & Semantic Budget**:
    - Primary Institutional Accent: **Deep Madrasah Emerald** (`#065F46` / `#047857`) untuk aksi utama dan identitas kop laporan.
    - Status Kehadiran (selalu dipasangkan dengan label teks jelas):
      - *Hadir*: Hijau (`#16A34A`)
      - *Izin*: Biru (`#2563EB`)
      - *Sakit*: Amber (`#D97706`)
      - *Alpa*: Merah Crimson (`#DC2626`)
      - *Badal*: Ungu/Indigo (`#4F46E5`)
- **Typography & Hierarchy (2+1 Font Rule)**:
  - *Display & Navigation*: `Plus Jakarta Sans` (SemiBold 600 / Bold 700) untuk struktur header dan kartu ekspor WhatsApp.
  - *Body & Form Controls*: `Plus Jakarta Sans` (Regular 400 / Medium 500) untuk keterbacaan tinggi pada tabel panjang.
  - *Tabular Data & Metrics*: `JetBrains Mono` / `tabular-nums` untuk seluruh angka rekap, persentase kehadiran, jam KBM, dan tanggal agar lurus secara vertikal.
- **Component Styling & Layout**:
  - Mengikuti kontrak **Top Bar 3-Zona** (Identitas Lembaga di kiri, navigasi modul utama satu baris di tengah, dan tombol status sinkronisasi + Ekspor JPG di kanan).
  - Kedalaman satu tingkat (*single-elevation depth*) dengan garis tepi `1px` yang tegas dan tanpa *nested cards* yang berlebihan.
  - Metadata ditampilkan sebagai teks bersih dengan pemisah tipografis (`·`), sedangkan filter sesi KBM dan kategori menggunakan kontrol *segmented button* interaktif.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Sinkronisasi Hibrida (Offline-First Local Storage + Real-Time Apps Script API)**
  - *Chosen Approach*: Menyimpan perubahan secara instan di penyimpanan browser lokal sekaligus mengirim *payload* JSON ke endpoint Google Apps Script (`fetch` dengan mode yang kompatibel terhadap kebijakan redirect CORS Google Apps Script).
  - *Why*: Aplikasi berbasis GitHub Pages berjalan murni di sisi klien. Dengan pendekatan hibrida, admin tidak pernah kehilangan data meskipun koneksi internet pesantren sedang tidak stabil, dan dapat langsung mencoba seluruh fitur aplikasi bahkan sebelum URL Spreadsheet selesai dipasang.
- **Decision 2: Engine Render Kartu JPG Murni di Klien (HTML5 Canvas High-DPI)**
  - *Chosen Approach*: Membangun *renderer* kartu laporan khusus yang menggambar langsung ke elemen HTML5 Canvas beresolusi `2x` dan mengekspornya ke format `image/jpeg` kualitas tinggi (`0.95`).
  - *Why*: Menjamin hasil ekspor JPG 100% konsisten, tajam di WhatsApp, bebas dari masalah *font/CSS clipping* atau pemblokiran *cross-origin*, serta sangat cepat di perangkat laptop maupun ponsel admin.
- **Decision 3: Fleksibilitas Pencatatan Badal (Entri Mandiri + Catatan Laporan Harian)**
  - *Chosen Approach*: Menyediakan pencatatan kehadiran Badal sebagai entri mandiri yang terhitung di rekap bulanan Badal, sekaligus menyediakan daftar keterangan Badal harian pada laporan per-KBM.
  - *Why*: Sesuai kebutuhan administrasi madrasah, rekap jumlah kehadiran badal tetap tercatat rapi setiap bulan tanpa merumitkan rumus pemotongan guru utama, namun informasi siapa yang membadal pada KBM hari tersebut tetap tercetak jelas di kartu laporan harian WhatsApp.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│        WEBAPP REKAP KEHADIRAN - MADRASAH DINIYAH DARUL LUGHAH WAL KAROMAH    │
├──────────────────────────────────────────────────────────────────────────────┤
│  Top Bar (3-Zone Contract)                                                   │
│  [Brand: MD Darul Lughah Wal Karomah] ── [4 Nav Tabs] ── [Sync & Export JPG] │
└───────────────┬──────────────────────────────────────────────┬───────────────┘
                │                                              │
                ▼                                              ▼
┌───────────────────────────────────────────┐  ┌───────────────────────────────┐
│        MODUL OPERASIONAL ADMIN            │  │   STUDIO EKSPOR & INTEGRASI   │
├───────────────────────────────────────────┤  ├───────────────────────────────┤
│ 1. Rekap Harian (Per-KBM)                 │  │ 3. WhatsApp JPG Card Renderer │
│    ├─ Filter Tanggal, Sesi KBM & Kategori │  │    ├─ Mode Kartu Harian KBM   │
│    ├─ Tabel Input Cepat (H/I/S/A)         │  │    ├─ Mode Kartu Rekap Bulanan│
│    ├─ Pencatatan Entri & Keterangan Badal │  │    └─ High-DPI JPG Generator  │
│    └─ Ringkasan Statistik Sesi KBM        │  │                               │
│                                           │  │ 4. Pengaturan & Apps Script   │
│ 2. Rekapitulasi Bulanan                   │  │    ├─ Konfigurasi URL API     │
│    ├─ Filter Bulan, Tahun & Kategori SDM  │  │    ├─ Two-Way Sync (Pull/Push)│
│    ├─ Matriks Akumulasi (H, I, S, A, %)   │  │    ├─ Generator Kode Code.gs  │
│    └─ Rekap Khusus Kehadiran Badal        │  │    └─ Kelola Master SDM & KBM │
└─────────────────────┬─────────────────────┘  └───────────────┬───────────────┘
                      │                                        │
                      └───────────────────┬────────────────────┘
                                          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                  DATA & SYNC ENGINE (Local + Apps Script API)                │
├──────────────────────────────────────────────────────────────────────────────┤
│  [Local Persistence Store]  ◄──── Auto/Manual Sync ────► [Google Apps Script]│
│  (Instant UI & Offline Ready)     (JSON REST Payload)            │           │
│                                                                  ▼           │
│                                                       [Google Spreadsheet DB]│
│                                                       ├─ Sheet: Master_SDM   │
│                                                       ├─ Sheet: Sesi_KBM     │
│                                                       ├─ Sheet: Absensi_KBM  │
│                                                       └─ Sheet: Catatan_Badal│
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State
1. **Master SDM (`StaffMember`)**:
   - `id`, `nip`, `name`, `category` (`'PENGAJAR' | 'KARYAWAN' | 'BADAL'`), `jabatanOrMapel` (Kitab/Mapel atau Jabatan), `kelasOrUnit` (misal: *Ula, Wustho, Ulya, Sekretariat*), `defaultSessionIds`, `active`.
2. **Sesi KBM (`KbmSession`)**:
   - `id`, `name` (misal: *Jam Ke-1 (14.00 - 15.00)*, *Jam Ke-2 (15.30 - 16.30)*, *Sesi Malam (20.00 - 21.30)*, *Shift Karyawan*), `categoryScope` (`'PENGAJAR' | 'KARYAWAN' | 'ALL'`), `sortOrder`.
3. **Catatan Kehadiran Harian (`AttendanceRecord`)**:
   - `id`, `date` (`YYYY-MM-DD`), `sessionId`, `staffId`, `category`, `status` (`'H' | 'I' | 'S' | 'A'`), `note` (keterangan singkat).
4. **Entri & Keterangan Badal Harian (`BadalDailyNote`)**:
   - `id`, `date` (`YYYY-MM-DD`), `sessionId`, `badalName` (bisa dipilih dari daftar SDM Badal/Pengajar atau ketik langsung), `kelasOrKitab`, `keterangan` (catatan bebas untuk ditampilkan di laporan harian & kartu JPG), `countedInMonthlyRecap` (boolean).
5. **Konfigurasi Sinkronisasi (`SyncConfig`)**:
   - `scriptUrl` (URL Web App Google Apps Script), `autoSync` (boolean), `lastSyncedAt` (timestamp), `syncStatus` (`'idle' | 'syncing' | 'success' | 'error'`), `madrasahSubtitle` (Alamat/Tahun Ajaran untuk header kartu JPG).

### Interactive Component & State Mapping
- **Tabel Kehadiran Harian Per-KBM**:
  - Mengubah tanggal atau tab Sesi KBM langsung memfilter daftar personel yang relevan beserta rekap jumlah *Hadir, Izin, Sakit, Alpa* pada sesi tersebut.
  - Klik tombol status (`H`, `I`, `S`, `A`) pada baris personel langsung memperbarui state, menghitung ulang persentase kehadiran sesi secara *real-time*, dan memicu antrean sinkronisasi ke Apps Script.
  - Tombol **Tandai Semua Hadir** mengisi status `H` untuk seluruh personel pada sesi KBM aktif yang belum memiliki status.
- **Panel Badal & Keterangan Harian**:
  - Form tambah cepat untuk mencatat pengajar Badal pada tanggal dan sesi KBM yang sedang dibuka, lengkap dengan opsi apakah entri tersebut dihitung ke akumulasi rekap bulanan Badal serta teks keterangan untuk laporan harian.
- **Generator Kartu JPG WhatsApp**:
  - Modal/panel pratinjau langsung menggambar ulang kartu visual saat pengguna mengganti mode (*Laporan Harian Per-KBM* vs *Laporan Rekap Bulanan*), memilih tema aksen kartu, atau menyertakan/menyembunyikan rincian nama.
  - Tombol **Unduh Gambar JPG** mengekspor kanvas ke file `.jpg` dengan nama file terstruktur (`Laporan_KBM_MD_Darul_Lughah_YYYY-MM-DD_Sesi.jpg`).
- **Sinkronisasi Google Apps Script**:
  - Menggunakan permintaan HTTP `GET ?action=readAll` untuk menarik data dari Spreadsheet dan `POST` (`text/plain;charset=utf-8` payload JSON untuk melewati kendala preflight CORS standar Google Apps Script) dengan aksi `syncAll` agar dapat berjalan mulus dari domain GitHub Pages maupun AI Studio.
