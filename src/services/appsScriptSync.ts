import {
  AppDatabase,
  AttendanceRecord,
  AttendanceStatus,
  BadalDailyEntry,
  KbmSession,
  StaffCategory,
  StaffMember,
  SyncConfig,
} from '../types';
import { createInitialDatabase, DEFAULT_SYNC_CONFIG, getTodayIso } from '../data/initialData';

const DB_STORAGE_KEY = 'md_dwk_absensi_db_v1';
const CONFIG_STORAGE_KEY = 'md_dwk_sync_config_v1';

export function loadLocalDatabase(): AppDatabase {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if (!raw) {
      const initial = createInitialDatabase();
      saveLocalDatabase(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as AppDatabase;
    if (!parsed.sessions || !parsed.staff || !parsed.attendance || !parsed.badalEntries) {
      const initial = createInitialDatabase();
      saveLocalDatabase(initial);
      return initial;
    }
    return parsed;
  } catch {
    return createInitialDatabase();
  }
}

export function saveLocalDatabase(db: AppDatabase): void {
  try {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.error('Gagal menyimpan ke penyimpanan lokal:', err);
  }
}

export function loadSyncConfig(): SyncConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_SYNC_CONFIG;
    return { ...DEFAULT_SYNC_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SYNC_CONFIG;
  }
}

export function saveSyncConfig(config: SyncConfig): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Gagal menyimpan konfigurasi sinkronisasi:', err);
  }
}

/**
 * Menormalkan format tanggal dari Google Spreadsheet (termasuk objek Date yang terserialisasi ISO UTC
 * seperti "2026-10-01T17:00:00.000Z" atau "DD/MM/YYYY") menjadi string "YYYY-MM-DD" waktu lokal.
 */
export function normalizeSpreadsheetDate(rawDate: unknown): string {
  if (!rawDate) return getTodayIso();
  const str = String(rawDate).trim();

  // Jika sudah YYYY-MM-DD murni
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Jika format DD/MM/YYYY atau DD-MM-YYYY dari input manual di Spreadsheet Indonesia
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Jika berupa ISO timestamp dari objek Date Google Sheets (contoh: 2026-10-01T17:00:00.000Z)
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return str.slice(0, 10);
}

function normalizeBoolean(val: unknown, defaultVal = true): boolean {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'boolean') return val;
  const s = String(val).trim().toLowerCase();
  if (s === 'false' || s === '0' || s === 'tidak' || s === 'nonaktif') return false;
  return true;
}

function normalizeCategory(val: unknown): StaffCategory {
  const s = String(val || '').trim().toUpperCase();
  if (s === 'KARYAWAN') return 'KARYAWAN';
  if (s === 'BADAL') return 'BADAL';
  return 'PENGAJAR';
}

function normalizeStatus(val: unknown): AttendanceStatus {
  const s = String(val || '').trim().toUpperCase();
  if (s === 'I' || s === 'IZIN') return 'I';
  if (s === 'S' || s === 'SAKIT') return 'S';
  if (s === 'A' || s === 'ALPA' || s === 'ALPHA') return 'A';
  return 'H';
}

/**
 * Menormalkan seluruh baris yang ditarik dari Google Spreadsheet agar perubahan manual
 * langsung di tabel Spreadsheet (tanpa ID, format tanggal otomatis Sheet, dsb.) selalu terbaca.
 */
export function normalizePulledDatabase(raw: Record<string, unknown>, fallbackDb: AppDatabase): AppDatabase {
  const rawSessions = Array.isArray(raw.sessions) ? raw.sessions : [];
  const sessions: KbmSession[] =
    rawSessions.length > 0
      ? rawSessions
          .filter((item: Record<string, unknown>) => item && (item.id || item.name || item.code))
          .map((item: Record<string, unknown>, idx: number) => ({
            id: String(item.id || `sesi-sheet-${idx + 1}`).trim(),
            code: String(item.code || `KBM-${idx + 1}`).trim(),
            name: String(item.name || `Sesi KBM ${idx + 1}`).trim(),
            timeRange: String(item.timeRange || '14.00 – 15.00 WIB').trim(),
            scope:
              String(item.scope || '').toUpperCase() === 'KARYAWAN'
                ? 'KARYAWAN'
                : String(item.scope || '').toUpperCase() === 'ALL'
                ? 'ALL'
                : 'PENGAJAR',
            sortOrder: Number(item.sortOrder) || idx + 1,
          }))
      : fallbackDb.sessions;

  const allSessionIds = sessions.map((s) => s.id);

  const rawStaff = Array.isArray(raw.staff) ? raw.staff : [];
  const staff: StaffMember[] = rawStaff
    .filter((item: Record<string, unknown>) => item && (item.name || item.id))
    .map((item: Record<string, unknown>, idx: number) => {
      const cat = normalizeCategory(item.category);
      let parsedSessionIds: string[] = [];

      if (Array.isArray(item.defaultSessionIds)) {
        parsedSessionIds = item.defaultSessionIds.map((x) => String(x).trim()).filter(Boolean);
      } else if (typeof item.defaultSessionIds === 'string' && item.defaultSessionIds.trim()) {
        const str = item.defaultSessionIds.trim();
        if (str.startsWith('[')) {
          try {
            const arr = JSON.parse(str);
            if (Array.isArray(arr)) parsedSessionIds = arr.map((x) => String(x).trim());
          } catch {
            parsedSessionIds = str.split(',').map((x) => x.trim()).filter(Boolean);
          }
        } else {
          parsedSessionIds = str.split(',').map((x) => x.trim()).filter(Boolean);
        }
      }

      // Jika kolom defaultSessionIds dikosongkan saat tambah manual di Spreadsheet, otomatis isi sesi yang sesuai
      if (parsedSessionIds.length === 0) {
        const matchingSessions = sessions
          .filter((s) => s.scope === 'ALL' || s.scope === cat || (cat === 'BADAL' && s.scope === 'PENGAJAR'))
          .map((s) => s.id);
        parsedSessionIds = matchingSessions.length > 0 ? matchingSessions : allSessionIds;
      }

      return {
        id: String(item.id || `st-sheet-${idx + 1}`).trim(),
        niy: String(item.niy || `MD-SH-${String(idx + 1).padStart(3, '0')}`).trim(),
        name: String(item.name || `Personel ${idx + 1}`).trim(),
        category: cat,
        roleOrKitab: String(item.roleOrKitab || '-').trim(),
        unitOrKelas: String(item.unitOrKelas || '-').trim(),
        defaultSessionIds: parsedSessionIds,
        active: normalizeBoolean(item.active, true),
      };
    });

  const rawAttendance = Array.isArray(raw.attendance) ? raw.attendance : [];
  const attendance: AttendanceRecord[] = rawAttendance
    .filter((item: Record<string, unknown>) => item && (item.staffId || item.id))
    .map((item: Record<string, unknown>, idx: number) => {
      const normDate = normalizeSpreadsheetDate(item.date);
      const sessionId = String(item.sessionId || sessions[0]?.id || 'sesi-jam-1').trim();
      const staffId = String(item.staffId || '').trim();
      return {
        id: String(item.id || `att-${normDate}-${sessionId}-${staffId || idx}`).trim(),
        date: normDate,
        sessionId,
        staffId,
        category: normalizeCategory(item.category),
        status: normalizeStatus(item.status),
        note: String(item.note ?? '').trim(),
        updatedAt: String(item.updatedAt || new Date().toISOString()),
      };
    });

  const rawBadal = Array.isArray(raw.badalEntries) ? raw.badalEntries : [];
  const badalEntries: BadalDailyEntry[] = rawBadal
    .filter((item: Record<string, unknown>) => item && (item.badalName || item.id))
    .map((item: Record<string, unknown>, idx: number) => {
      const normDate = normalizeSpreadsheetDate(item.date);
      const sessionId = String(item.sessionId || sessions[0]?.id || 'sesi-jam-1').trim();
      return {
        id: String(item.id || `bd-${normDate}-${idx + 1}`).trim(),
        date: normDate,
        sessionId,
        badalStaffId: String(item.badalStaffId || 'custom-badal').trim(),
        badalName: String(item.badalName || 'Petugas Badal').trim(),
        kelasOrKitab: String(item.kelasOrKitab || '-').trim(),
        keterangan: String(item.keterangan || '').trim(),
        countInMonthlyRecap: normalizeBoolean(item.countInMonthlyRecap, true),
        updatedAt: String(item.updatedAt || new Date().toISOString()),
      };
    });

  return {
    sessions,
    staff: staff.length > 0 ? staff : fallbackDb.staff,
    attendance,
    badalEntries,
  };
}

export async function pushDatabaseToSpreadsheet(
  scriptUrl: string,
  database: AppDatabase
): Promise<{ ok: boolean; message: string; syncedAt: string }> {
  const cleanUrl = scriptUrl.trim();
  if (!cleanUrl) {
    return {
      ok: false,
      message: 'URL Web App Google Apps Script belum diisi.',
      syncedAt: new Date().toISOString(),
    };
  }

  try {
    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'syncAll',
        database,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    if (result.status === 'ok') {
      return {
        ok: true,
        message: result.message || 'Data berhasil dikirim (Push) ke Google Spreadsheet.',
        syncedAt: result.syncedAt || new Date().toISOString(),
      };
    } else {
      throw new Error(result.message || 'Respons Apps Script tidak valid.');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Koneksi gagal';
    return {
      ok: false,
      message: `Gagal kirim ke Spreadsheet (${msg}). Pastikan akses Web App disetel ke "Anyone".`,
      syncedAt: new Date().toISOString(),
    };
  }
}

export async function pullDatabaseFromSpreadsheet(
  scriptUrl: string,
  fallbackDb?: AppDatabase
): Promise<{ ok: boolean; database?: AppDatabase; message: string; syncedAt: string }> {
  const cleanUrl = scriptUrl.trim();
  if (!cleanUrl) {
    return {
      ok: false,
      message: 'URL Web App Google Apps Script belum diisi.',
      syncedAt: new Date().toISOString(),
    };
  }

  try {
    const separator = cleanUrl.includes('?') ? '&' : '?';
    const response = await fetch(`${cleanUrl}${separator}action=readAll&_t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.status === 'ok') {
      const baseDb = fallbackDb || loadLocalDatabase();
      const normalizedDb = normalizePulledDatabase(data, baseDb);
      return {
        ok: true,
        database: normalizedDb,
        message: 'Data terbaru dari Google Spreadsheet berhasil dimuat ke Webapp.',
        syncedAt: data.timestamp || new Date().toISOString(),
      };
    } else {
      throw new Error(data.message || 'Format JSON Spreadsheet tidak sesuai.');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Koneksi gagal';
    return {
      ok: false,
      message: `Gagal menarik data dari Spreadsheet (${msg}). Pastikan URL berakhiran /exec dan akses "Anyone".`,
      syncedAt: new Date().toISOString(),
    };
  }
}
