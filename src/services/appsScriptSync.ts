import { AppDatabase, SyncConfig } from '../types';
import { createInitialDatabase, DEFAULT_SYNC_CONFIG } from '../data/initialData';

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
    // Gunakan Content-Type text/plain agar terhindar dari blokir CORS preflight OPTIONS pada Google Apps Script
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
        message: result.message || 'Data berhasil disinkronkan ke Google Spreadsheet.',
        syncedAt: result.syncedAt || new Date().toISOString(),
      };
    } else {
      throw new Error(result.message || 'Respons Apps Script tidak valid.');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Koneksi gagal';
    return {
      ok: false,
      message: `Gagal sinkronisasi ke Spreadsheet (${msg}). Pastikan akses Web App disetel ke "Anyone".`,
      syncedAt: new Date().toISOString(),
    };
  }
}

export async function pullDatabaseFromSpreadsheet(
  scriptUrl: string
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
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.status === 'ok') {
      const db: AppDatabase = {
        staff: Array.isArray(data.staff) ? data.staff : [],
        sessions: Array.isArray(data.sessions) ? data.sessions : [],
        attendance: Array.isArray(data.attendance) ? data.attendance : [],
        badalEntries: Array.isArray(data.badalEntries) ? data.badalEntries : [],
      };
      return {
        ok: true,
        database: db,
        message: 'Data berhasil ditarik dari Google Spreadsheet.',
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
