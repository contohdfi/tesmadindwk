import { AppDatabase, KbmSession, StaffMember, AttendanceRecord, BadalDailyEntry, SyncConfig } from '../types';

export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  scriptUrl: '',
  autoSync: true,
  lastSyncedAt: null,
  syncStatus: 'idle',
  lastSyncMessage: 'Mode Penyimpanan Lokal Aktif (Hubungkan URL Apps Script untuk sinkronisasi Spreadsheet real-time)',
  institutionSubtitle: 'Pondok Pesantren Darul Lughah Wal Karomah · Tahun Ajaran 1447/1448 H',
  adminName: 'Staf Administrasi Madin',
};

export const INITIAL_SESSIONS: KbmSession[] = [
  {
    id: 'sesi-jam-1',
    code: 'KBM-1',
    name: 'KBM Jam Ke-1 (Siang)',
    timeRange: '13.45 – 14.45 WIB',
    scope: 'PENGAJAR',
    sortOrder: 1,
  },
  {
    id: 'sesi-jam-2',
    code: 'KBM-2',
    name: 'KBM Jam Ke-2 (Sore)',
    timeRange: '15.15 – 16.15 WIB',
    scope: 'PENGAJAR',
    sortOrder: 2,
  },
  {
    id: 'sesi-malam',
    code: 'KBM-MLM',
    name: 'KBM Sesi Malam (Musyawarah/Kitab)',
    timeRange: '20.00 – 21.15 WIB',
    scope: 'PENGAJAR',
    sortOrder: 3,
  },
  {
    id: 'sesi-karyawan',
    code: 'KRY-HR',
    name: 'Kehadiran Harian Karyawan & TU',
    timeRange: '13.00 – 21.30 WIB',
    scope: 'KARYAWAN',
    sortOrder: 4,
  },
];

export const INITIAL_STAFF: StaffMember[] = [
  // PENGAJAR (ASATIDZ)
  {
    id: 'st-01',
    niy: 'MD-2019-001',
    name: 'Ust. H. Ahmad Fauzi, M.Pd.I',
    category: 'PENGAJAR',
    roleOrKitab: 'Fathul Mu’in & Ushul Fiqh',
    unitOrKelas: '3 Ulya A',
    defaultSessionIds: ['sesi-jam-1', 'sesi-malam'],
    active: true,
  },
  {
    id: 'st-02',
    niy: 'MD-2019-002',
    name: 'Ust. Muhammad Ridwan, S.Pd',
    category: 'PENGAJAR',
    roleOrKitab: 'Alfiyah Ibnu Malik',
    unitOrKelas: '2 Wustho A',
    defaultSessionIds: ['sesi-jam-1', 'sesi-jam-2', 'sesi-malam'],
    active: true,
  },
  {
    id: 'st-03',
    niy: 'MD-2020-003',
    name: 'Ust. Abdul Halim Mubarok',
    category: 'PENGAJAR',
    roleOrKitab: 'Fathul Qorib & Nahwu Jurumiyah',
    unitOrKelas: '1 Wustho B',
    defaultSessionIds: ['sesi-jam-1', 'sesi-jam-2'],
    active: true,
  },
  {
    id: 'st-04',
    niy: 'MD-2020-004',
    name: 'Ust. Syamsul Arifin, Lc.',
    category: 'PENGAJAR',
    roleOrKitab: 'Balaghah & Mantiq',
    unitOrKelas: '2 Ulya',
    defaultSessionIds: ['sesi-jam-1', 'sesi-jam-2', 'sesi-malam'],
    active: true,
  },
  {
    id: 'st-05',
    niy: 'MD-2021-005',
    name: 'Ust. M. Bahrul Ulum',
    category: 'PENGAJAR',
    roleOrKitab: 'Shorof Kailani & Amtsilah Tashrifiyah',
    unitOrKelas: '3 Ula A',
    defaultSessionIds: ['sesi-jam-1', 'sesi-jam-2'],
    active: true,
  },
  {
    id: 'st-06',
    niy: 'MD-2021-006',
    name: 'Ust. Khoirul Anam',
    category: 'PENGAJAR',
    roleOrKitab: 'Safinatun Najah & Aqidatul Awam',
    unitOrKelas: '2 Ula B',
    defaultSessionIds: ['sesi-jam-1', 'sesi-jam-2'],
    active: true,
  },
  {
    id: 'st-07',
    niy: 'MD-2022-007',
    name: 'Ust. Zainul Muttaqin',
    category: 'PENGAJAR',
    roleOrKitab: 'Imrithi & Ta’lim Muta’allim',
    unitOrKelas: '3 Wustho',
    defaultSessionIds: ['sesi-jam-1', 'sesi-jam-2', 'sesi-malam'],
    active: true,
  },
  {
    id: 'st-08',
    niy: 'MD-2022-008',
    name: 'Ustzh. Siti Aminah Zahro',
    category: 'PENGAJAR',
    roleOrKitab: 'Fiqh Nisa & Tajwid Tuhfatul Athfal',
    unitOrKelas: '1 Wustho Putri',
    defaultSessionIds: ['sesi-jam-1', 'sesi-jam-2'],
    active: true,
  },

  // KARYAWAN & STAF ADMINISTRASI
  {
    id: 'kr-01',
    niy: 'KR-2020-101',
    name: 'M. Lutfi Hakim, S.Kom',
    category: 'KARYAWAN',
    roleOrKitab: 'Kepala Tata Usaha & Operator Madin',
    unitOrKelas: 'Sekretariat Pusat',
    defaultSessionIds: ['sesi-karyawan'],
    active: true,
  },
  {
    id: 'kr-02',
    niy: 'KR-2021-102',
    name: 'Ahmad Baihaqi',
    category: 'KARYAWAN',
    roleOrKitab: 'Staf Keuangan & Bisyaroh',
    unitOrKelas: 'Keuangan Madin',
    defaultSessionIds: ['sesi-karyawan'],
    active: true,
  },
  {
    id: 'kr-03',
    niy: 'KR-2022-103',
    name: 'Rizky Ramadhan',
    category: 'KARYAWAN',
    roleOrKitab: 'Staf Akademik & Absensi KBM',
    unitOrKelas: 'Sekretariat Pusat',
    defaultSessionIds: ['sesi-karyawan'],
    active: true,
  },
  {
    id: 'kr-04',
    niy: 'KR-2023-104',
    name: 'Hasan Basri',
    category: 'KARYAWAN',
    roleOrKitab: 'Sarana Prasarana & Kebersihan Gedung',
    unitOrKelas: 'Gedung Madin Putra',
    defaultSessionIds: ['sesi-karyawan'],
    active: true,
  },

  // TIM PENGAJAR BADAL (PENGGANTI / PIKET KBM)
  {
    id: 'bd-01',
    niy: 'BD-2023-201',
    name: 'Ust. Fathurrahman Al-Hafidz',
    category: 'BADAL',
    roleOrKitab: 'Tim Piket Badal Kitab Fiqh & Nahwu',
    unitOrKelas: 'Lintas Kelas Wustho/Ulya',
    defaultSessionIds: ['sesi-jam-1', 'sesi-jam-2', 'sesi-malam'],
    active: true,
  },
  {
    id: 'bd-02',
    niy: 'BD-2023-202',
    name: 'Ust. Nabil Makarim',
    category: 'BADAL',
    roleOrKitab: 'Tim Piket Badal Shorof & I’lal',
    unitOrKelas: 'Lintas Kelas Ula/Wustho',
    defaultSessionIds: ['sesi-jam-1', 'sesi-jam-2'],
    active: true,
  },
  {
    id: 'bd-03',
    niy: 'BD-2024-203',
    name: 'Ust. Salman Al-Farisi',
    category: 'BADAL',
    roleOrKitab: 'Tim Piket Badal Umum & Takror Malam',
    unitOrKelas: 'Lintas Kelas',
    defaultSessionIds: ['sesi-jam-1', 'sesi-jam-2', 'sesi-malam'],
    active: true,
  },
];

export function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getYesterdayIso(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function createInitialDatabase(): AppDatabase {
  const today = getTodayIso();
  const yesterday = getYesterdayIso();
  const nowIso = new Date().toISOString();

  const attendance: AttendanceRecord[] = [
    // Today - Jam Ke-1
    { id: `att-${today}-j1-1`, date: today, sessionId: 'sesi-jam-1', staffId: 'st-01', category: 'PENGAJAR', status: 'H', note: 'Tepat waktu', updatedAt: nowIso },
    { id: `att-${today}-j1-2`, date: today, sessionId: 'sesi-jam-1', staffId: 'st-02', category: 'PENGAJAR', status: 'H', note: '', updatedAt: nowIso },
    { id: `att-${today}-j1-3`, date: today, sessionId: 'sesi-jam-1', staffId: 'st-03', category: 'PENGAJAR', status: 'I', note: 'Udzur keluarga (Dibadal Ust. Fathurrahman)', updatedAt: nowIso },
    { id: `att-${today}-j1-4`, date: today, sessionId: 'sesi-jam-1', staffId: 'st-04', category: 'PENGAJAR', status: 'H', note: '', updatedAt: nowIso },
    { id: `att-${today}-j1-5`, date: today, sessionId: 'sesi-jam-1', staffId: 'st-05', category: 'PENGAJAR', status: 'H', note: '', updatedAt: nowIso },
    { id: `att-${today}-j1-6`, date: today, sessionId: 'sesi-jam-1', staffId: 'st-06', category: 'PENGAJAR', status: 'S', note: 'Istirahat di ndalem / klinik pesantren', updatedAt: nowIso },
    { id: `att-${today}-j1-7`, date: today, sessionId: 'sesi-jam-1', staffId: 'st-07', category: 'PENGAJAR', status: 'H', note: '', updatedAt: nowIso },
    { id: `att-${today}-j1-8`, date: today, sessionId: 'sesi-jam-1', staffId: 'st-08', category: 'PENGAJAR', status: 'H', note: '', updatedAt: nowIso },

    // Today - Jam Ke-2
    { id: `att-${today}-j2-2`, date: today, sessionId: 'sesi-jam-2', staffId: 'st-02', category: 'PENGAJAR', status: 'H', note: '', updatedAt: nowIso },
    { id: `att-${today}-j2-3`, date: today, sessionId: 'sesi-jam-2', staffId: 'st-03', category: 'PENGAJAR', status: 'I', note: 'Udzur keluarga', updatedAt: nowIso },
    { id: `att-${today}-j2-4`, date: today, sessionId: 'sesi-jam-2', staffId: 'st-04', category: 'PENGAJAR', status: 'H', note: '', updatedAt: nowIso },
    { id: `att-${today}-j2-5`, date: today, sessionId: 'sesi-jam-2', staffId: 'st-05', category: 'PENGAJAR', status: 'H', note: '', updatedAt: nowIso },
    { id: `att-${today}-j2-6`, date: today, sessionId: 'sesi-jam-2', staffId: 'st-06', category: 'PENGAJAR', status: 'S', note: 'Sakit demam', updatedAt: nowIso },
    { id: `att-${today}-j2-7`, date: today, sessionId: 'sesi-jam-2', staffId: 'st-07', category: 'PENGAJAR', status: 'H', note: '', updatedAt: nowIso },
    { id: `att-${today}-j2-8`, date: today, sessionId: 'sesi-jam-2', staffId: 'st-08', category: 'PENGAJAR', status: 'H', note: '', updatedAt: nowIso },

    // Today - Karyawan
    { id: `att-${today}-kr-1`, date: today, sessionId: 'sesi-karyawan', staffId: 'kr-01', category: 'KARYAWAN', status: 'H', note: 'Piket Sekretariat & Rekap', updatedAt: nowIso },
    { id: `att-${today}-kr-2`, date: today, sessionId: 'sesi-karyawan', staffId: 'kr-02', category: 'KARYAWAN', status: 'H', note: '', updatedAt: nowIso },
    { id: `att-${today}-kr-3`, date: today, sessionId: 'sesi-karyawan', staffId: 'kr-03', category: 'KARYAWAN', status: 'H', note: 'Keliling absen kelas', updatedAt: nowIso },
    { id: `att-${today}-kr-4`, date: today, sessionId: 'sesi-karyawan', staffId: 'kr-04', category: 'KARYAWAN', status: 'H', note: '', updatedAt: nowIso },

    // Yesterday - Jam Ke-1
    { id: `att-${yesterday}-j1-1`, date: yesterday, sessionId: 'sesi-jam-1', staffId: 'st-01', category: 'PENGAJAR', status: 'H', note: '', updatedAt: nowIso },
    { id: `att-${yesterday}-j1-2`, date: yesterday, sessionId: 'sesi-jam-1', staffId: 'st-02', category: 'PENGAJAR', status: 'H', note: '', updatedAt: nowIso },
    { id: `att-${yesterday}-j1-3`, date: yesterday, sessionId: 'sesi-jam-1', staffId: 'st-03', category: 'PENGAJAR', status: 'H', note: '', updatedAt: nowIso },
    { id: `att-${yesterday}-j1-4`, date: yesterday, sessionId: 'sesi-jam-1', staffId: 'st-04', category: 'PENGAJAR', status: 'A', note: 'Belum konfirmasi', updatedAt: nowIso },
    { id: `att-${yesterday}-j1-5`, date: yesterday, sessionId: 'sesi-jam-1', staffId: 'st-05', category: 'PENGAJAR', status: 'H', note: '', updatedAt: nowIso },
    { id: `att-${yesterday}-j1-6`, date: yesterday, sessionId: 'sesi-jam-1', staffId: 'st-06', category: 'PENGAJAR', status: 'H', note: '', updatedAt: nowIso },
    { id: `att-${yesterday}-j1-7`, date: yesterday, sessionId: 'sesi-jam-1', staffId: 'st-07', category: 'PENGAJAR', status: 'H', note: '', updatedAt: nowIso },
    { id: `att-${yesterday}-j1-8`, date: yesterday, sessionId: 'sesi-jam-1', staffId: 'st-08', category: 'PENGAJAR', status: 'H', note: '', updatedAt: nowIso },

    // Yesterday - Karyawan
    { id: `att-${yesterday}-kr-1`, date: yesterday, sessionId: 'sesi-karyawan', staffId: 'kr-01', category: 'KARYAWAN', status: 'H', note: '', updatedAt: nowIso },
    { id: `att-${yesterday}-kr-2`, date: yesterday, sessionId: 'sesi-karyawan', staffId: 'kr-02', category: 'KARYAWAN', status: 'H', note: '', updatedAt: nowIso },
    { id: `att-${yesterday}-kr-3`, date: yesterday, sessionId: 'sesi-karyawan', staffId: 'kr-03', category: 'KARYAWAN', status: 'H', note: '', updatedAt: nowIso },
    { id: `att-${yesterday}-kr-4`, date: yesterday, sessionId: 'sesi-karyawan', staffId: 'kr-04', category: 'KARYAWAN', status: 'I', note: 'Izin keperluan keluarga', updatedAt: nowIso },
  ];

  const badalEntries: BadalDailyEntry[] = [
    {
      id: `bd-entry-${today}-1`,
      date: today,
      sessionId: 'sesi-jam-1',
      badalStaffId: 'bd-01',
      badalName: 'Ust. Fathurrahman Al-Hafidz',
      kelasOrKitab: 'Kelas 1 Wustho B · Fathul Qorib',
      keterangan: 'Membadal kelas 1 Wustho B (Materi Bab Thaharah berjalan kondusif)',
      countInMonthlyRecap: true,
      updatedAt: nowIso,
    },
    {
      id: `bd-entry-${today}-2`,
      date: today,
      sessionId: 'sesi-jam-1',
      badalStaffId: 'bd-02',
      badalName: 'Ust. Nabil Makarim',
      kelasOrKitab: 'Kelas 2 Ula B · Safinatun Najah',
      keterangan: 'Membadal kelas 2 Ula B (Sorogan & hafalan nadzom Aqidatul Awam)',
      countInMonthlyRecap: true,
      updatedAt: nowIso,
    },
    {
      id: `bd-entry-${yesterday}-1`,
      date: yesterday,
      sessionId: 'sesi-jam-1',
      badalStaffId: 'bd-03',
      badalName: 'Ust. Salman Al-Farisi',
      kelasOrKitab: 'Kelas 2 Ulya · Balaghah',
      keterangan: 'Piket badal musyawarah kelas 2 Ulya',
      countInMonthlyRecap: true,
      updatedAt: nowIso,
    },
  ];

  return {
    sessions: INITIAL_SESSIONS,
    staff: INITIAL_STAFF,
    attendance,
    badalEntries,
  };
}

export const APPS_SCRIPT_TEMPLATE = `/**
 * ============================================================================
 * GOOGLE APPS SCRIPT API - MADRASAH DINIYAH DARUL LUGHAH WAL KAROMAH
 * ============================================================================
 * Cara Pemasangan:
 * 1. Buka Google Spreadsheet baru di Google Drive Anda.
 * 2. Klik menu "Extensions" (Ekstensi) -> "Apps Script".
 * 3. Hapus semua kode yang ada di Code.gs, lalu tempel (Paste) seluruh kode ini.
 * 4. Klik ikon Simpan (Ctrl+S), lalu jalankan fungsi "setupSheets" satu kali
 *    untuk membuat 4 tabel otomatis (atau biarkan otomatis saat sinkronisasi pertama).
 * 5. Klik tombol "Deploy" -> "New deployment" (Deployment baru).
 * 6. Pilih jenis "Web app":
 *    - Execute as: "Me" (Saya)
 *    - Who has access: "Anyone" (Siapa saja) -> Wajib agar Webapp GitHub bisa akses tanpa blokir CORS.
 * 7. Klik "Deploy", salin URL Web App (berakhiran /exec), dan tempelkan ke menu
 *    Pengaturan Sinkronisasi di Webapp Madrasah Diniyah Darul Lughah Wal Karomah.
 * ============================================================================
 */

const SHEET_NAMES = {
  STAFF: 'Master_SDM',
  SESSIONS: 'Sesi_KBM',
  ATTENDANCE: 'Absensi_Harian',
  BADAL: 'Catatan_Badal'
};

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  ensureSheet(ss, SHEET_NAMES.STAFF, [
    'id', 'niy', 'name', 'category', 'roleOrKitab', 'unitOrKelas', 'defaultSessionIds', 'active'
  ]);
  ensureSheet(ss, SHEET_NAMES.SESSIONS, [
    'id', 'code', 'name', 'timeRange', 'scope', 'sortOrder'
  ]);
  ensureSheet(ss, SHEET_NAMES.ATTENDANCE, [
    'id', 'date', 'sessionId', 'staffId', 'category', 'status', 'note', 'updatedAt'
  ]);
  ensureSheet(ss, SHEET_NAMES.BADAL, [
    'id', 'date', 'sessionId', 'badalStaffId', 'badalName', 'kelasOrKitab', 'keterangan', 'countInMonthlyRecap', 'updatedAt'
  ]);
}

function ensureSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#065f46').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doGet(e) {
  try {
    setupSheets();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const data = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      staff: readSheetData(ss.getSheetByName(SHEET_NAMES.STAFF)),
      sessions: readSheetData(ss.getSheetByName(SHEET_NAMES.SESSIONS)),
      attendance: readSheetData(ss.getSheetByName(SHEET_NAMES.ATTENDANCE)),
      badalEntries: readSheetData(ss.getSheetByName(SHEET_NAMES.BADAL))
    };
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    setupSheets();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const payload = JSON.parse(e.postData.contents);

    if (payload.action === 'syncAll' && payload.database) {
      const db = payload.database;
      if (Array.isArray(db.staff)) {
        writeSheetData(ss.getSheetByName(SHEET_NAMES.STAFF), [
          'id', 'niy', 'name', 'category', 'roleOrKitab', 'unitOrKelas', 'defaultSessionIds', 'active'
        ], db.staff);
      }
      if (Array.isArray(db.sessions)) {
        writeSheetData(ss.getSheetByName(SHEET_NAMES.SESSIONS), [
          'id', 'code', 'name', 'timeRange', 'scope', 'sortOrder'
        ], db.sessions);
      }
      if (Array.isArray(db.attendance)) {
        writeSheetData(ss.getSheetByName(SHEET_NAMES.ATTENDANCE), [
          'id', 'date', 'sessionId', 'staffId', 'category', 'status', 'note', 'updatedAt'
        ], db.attendance);
      }
      if (Array.isArray(db.badalEntries)) {
        writeSheetData(ss.getSheetByName(SHEET_NAMES.BADAL), [
          'id', 'date', 'sessionId', 'badalStaffId', 'badalName', 'kelasOrKitab', 'keterangan', 'countInMonthlyRecap', 'updatedAt'
        ], db.badalEntries);
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'ok',
        syncedAt: new Date().toISOString(),
        message: 'Sinkronisasi ke Google Spreadsheet berhasil'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function readSheetData(sheet) {
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  const headers = rows[0];
  const result = [];
  for (let i = 1; i < rows.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      let val = rows[i][j];
      if (headers[j] === 'defaultSessionIds' && typeof val === 'string') {
        try { val = JSON.parse(val); } catch (_) { val = val ? val.split(',') : []; }
      }
      if (headers[j] === 'active' || headers[j] === 'countInMonthlyRecap') {
        val = val === true || val === 'TRUE' || val === 'true';
      }
      if (headers[j] === 'sortOrder') {
        val = Number(val) || 1;
      }
      obj[headers[j]] = val;
    }
    if (obj.id) result.push(obj);
  }
  return result;
}

function writeSheetData(sheet, headers, items) {
  sheet.clearContents();
  const matrix = [headers];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const row = headers.map(function(h) {
      const val = item[h];
      if (Array.isArray(val)) return JSON.stringify(val);
      if (val === undefined || val === null) return '';
      return val;
    });
    matrix.push(row);
  }
  sheet.getRange(1, 1, matrix.length, headers.length).setValues(matrix);
}
`;
