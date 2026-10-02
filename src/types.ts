export type StaffCategory = 'PENGAJAR' | 'KARYAWAN' | 'BADAL';

export type AttendanceStatus = 'H' | 'I' | 'S' | 'A';

export interface KbmSession {
  id: string;
  code: string;
  name: string;
  timeRange: string;
  scope: 'PENGAJAR' | 'KARYAWAN' | 'ALL';
  sortOrder: number;
}

export interface StaffMember {
  id: string;
  niy: string;
  name: string;
  category: StaffCategory;
  roleOrKitab: string;
  unitOrKelas: string;
  defaultSessionIds: string[];
  active: boolean;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  sessionId: string;
  staffId: string;
  category: StaffCategory;
  status: AttendanceStatus;
  note: string;
  updatedAt: string;
}

export interface BadalDailyEntry {
  id: string;
  date: string; // YYYY-MM-DD
  sessionId: string;
  badalStaffId: string; // Links to a BADAL or PENGAJAR staffId, or custom
  badalName: string;
  kelasOrKitab: string;
  keterangan: string; // Catatan laporan harian (misal: "Membadal Kelas 2 Wustho - Fathul Qorib")
  countInMonthlyRecap: boolean; // Opsi 2 & 3: Dihitung di rekap bulanan Badal dan/atau tampil sebagai keterangan harian
  updatedAt: string;
}

export interface SyncConfig {
  scriptUrl: string;
  autoSync: boolean;
  lastSyncedAt: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncMessage: string;
  institutionSubtitle: string;
  adminName: string;
}

export interface AppDatabase {
  sessions: KbmSession[];
  staff: StaffMember[];
  attendance: AttendanceRecord[];
  badalEntries: BadalDailyEntry[];
}
