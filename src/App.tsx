/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, ImageDown } from 'lucide-react';
import {
  AppDatabase,
  AttendanceStatus,
  BadalDailyEntry,
  KbmSession,
  StaffCategory,
  StaffMember,
  SyncConfig,
} from './types';
import { createInitialDatabase, getTodayIso } from './data/initialData';
import {
  loadLocalDatabase,
  saveLocalDatabase,
  loadSyncConfig,
  saveSyncConfig,
  pushDatabaseToSpreadsheet,
  pullDatabaseFromSpreadsheet,
} from './services/appsScriptSync';
import { DailyKbmView } from './components/DailyKbmView';
import { MonthlyRecapView } from './components/MonthlyRecapView';
import { MasterDataView } from './components/MasterDataView';
import { AppsScriptIntegrationView } from './components/AppsScriptIntegrationView';
import { JpgExportModal } from './components/JpgExportModal';

type ActiveTab = 'DAILY' | 'MONTHLY' | 'MASTER' | 'INTEGRATION';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('DAILY');
  const [db, setDb] = useState<AppDatabase>(() => loadLocalDatabase());
  const [syncConfig, setSyncConfig] = useState<SyncConfig>(() => loadSyncConfig());

  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayIso());
  const [selectedYearMonth, setSelectedYearMonth] = useState<string>(() =>
    getTodayIso().slice(0, 7)
  );
  const [selectedSessionId, setSelectedSessionId] = useState<string>(() => {
    const initial = loadLocalDatabase();
    return initial.sessions[0]?.id || 'sesi-jam-1';
  });

  // JPG Export Modal State
  const [jpgModalOpen, setJpgModalOpen] = useState<boolean>(false);
  const [jpgModalMode, setJpgModalMode] = useState<'DAILY' | 'MONTHLY'>('DAILY');
  const [jpgModalSessionId, setJpgModalSessionId] = useState<string>('ALL');

  const syncTimeoutRef = useRef<number | null>(null);

  const updateSyncConfig = useCallback((patch: Partial<SyncConfig>) => {
    setSyncConfig((prev) => {
      const next = { ...prev, ...patch };
      saveSyncConfig(next);
      return next;
    });
  }, []);

  // Trigger automatic push to Google Apps Script when database mutates and URL is configured
  const scheduleRealtimeSync = useCallback(
    (nextDb: AppDatabase) => {
      saveLocalDatabase(nextDb);
      if (!syncConfig.scriptUrl.trim() || !syncConfig.autoSync) return;

      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current);
      }

      updateSyncConfig({
        syncStatus: 'syncing',
        lastSyncMessage: 'Menyinkronkan perubahan ke Google Spreadsheet...',
      });

      syncTimeoutRef.current = window.setTimeout(async () => {
        const res = await pushDatabaseToSpreadsheet(syncConfig.scriptUrl, nextDb);
        updateSyncConfig({
          syncStatus: res.ok ? 'success' : 'error',
          lastSyncedAt: res.ok ? res.syncedAt : syncConfig.lastSyncedAt,
          lastSyncMessage: res.message,
        });
      }, 900);
    },
    [syncConfig.scriptUrl, syncConfig.autoSync, syncConfig.lastSyncedAt, updateSyncConfig]
  );

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  const handleManualPush = async () => {
    if (!syncConfig.scriptUrl.trim()) {
      setActiveTab('INTEGRATION');
      updateSyncConfig({
        syncStatus: 'error',
        lastSyncMessage: 'Silakan masukkan URL Web App Google Apps Script terlebih dahulu.',
      });
      return;
    }

    updateSyncConfig({
      syncStatus: 'syncing',
      lastSyncMessage: 'Mengirim seluruh data ke Google Spreadsheet...',
    });

    const res = await pushDatabaseToSpreadsheet(syncConfig.scriptUrl, db);
    updateSyncConfig({
      syncStatus: res.ok ? 'success' : 'error',
      lastSyncedAt: res.ok ? res.syncedAt : syncConfig.lastSyncedAt,
      lastSyncMessage: res.message,
    });
  };

  const handleManualPull = async () => {
    if (!syncConfig.scriptUrl.trim()) {
      setActiveTab('INTEGRATION');
      updateSyncConfig({
        syncStatus: 'error',
        lastSyncMessage: 'Silakan masukkan URL Web App Google Apps Script terlebih dahulu.',
      });
      return;
    }

    updateSyncConfig({
      syncStatus: 'syncing',
      lastSyncMessage: 'Menarik data terbaru dari Google Spreadsheet...',
    });

    const res = await pullDatabaseFromSpreadsheet(syncConfig.scriptUrl);
    if (res.ok && res.database) {
      const mergedDb: AppDatabase = {
        sessions: res.database.sessions.length > 0 ? res.database.sessions : db.sessions,
        staff: res.database.staff.length > 0 ? res.database.staff : db.staff,
        attendance: res.database.attendance,
        badalEntries: res.database.badalEntries,
      };
      setDb(mergedDb);
      saveLocalDatabase(mergedDb);
      updateSyncConfig({
        syncStatus: 'success',
        lastSyncedAt: res.syncedAt,
        lastSyncMessage: res.message,
      });
    } else {
      updateSyncConfig({
        syncStatus: 'error',
        lastSyncMessage: res.message,
      });
    }
  };

  // Attendance Handlers
  const handleUpsertAttendance = (
    date: string,
    sessionId: string,
    staffId: string,
    category: StaffCategory,
    status: AttendanceStatus,
    note: string
  ) => {
    setDb((prev) => {
      const existingIdx = prev.attendance.findIndex(
        (a) => a.date === date && a.sessionId === sessionId && a.staffId === staffId
      );
      const nowIso = new Date().toISOString();
      let nextAttendance = [...prev.attendance];

      if (existingIdx >= 0) {
        nextAttendance[existingIdx] = {
          ...nextAttendance[existingIdx],
          status,
          note,
          updatedAt: nowIso,
        };
      } else {
        nextAttendance.push({
          id: `att-${date}-${sessionId}-${staffId}`,
          date,
          sessionId,
          staffId,
          category,
          status,
          note,
          updatedAt: nowIso,
        });
      }

      const nextDb = { ...prev, attendance: nextAttendance };
      scheduleRealtimeSync(nextDb);
      return nextDb;
    });
  };

  const handleMarkAllPresent = (
    date: string,
    sessionId: string,
    staffList: { id: string; category: StaffCategory }[]
  ) => {
    setDb((prev) => {
      const nowIso = new Date().toISOString();
      const nextAttendance = [...prev.attendance];

      staffList.forEach(({ id, category }) => {
        const idx = nextAttendance.findIndex(
          (a) => a.date === date && a.sessionId === sessionId && a.staffId === id
        );
        if (idx === -1) {
          nextAttendance.push({
            id: `att-${date}-${sessionId}-${id}`,
            date,
            sessionId,
            staffId: id,
            category,
            status: 'H',
            note: '',
            updatedAt: nowIso,
          });
        }
      });

      const nextDb = { ...prev, attendance: nextAttendance };
      scheduleRealtimeSync(nextDb);
      return nextDb;
    });
  };

  // Badal Handlers
  const handleAddBadalEntry = (entry: Omit<BadalDailyEntry, 'id' | 'updatedAt'>) => {
    setDb((prev) => {
      const newEntry: BadalDailyEntry = {
        ...entry,
        id: `bd-${Date.now()}`,
        updatedAt: new Date().toISOString(),
      };
      const nextDb = {
        ...prev,
        badalEntries: [newEntry, ...prev.badalEntries],
      };
      scheduleRealtimeSync(nextDb);
      return nextDb;
    });
  };

  const handleDeleteBadalEntry = (id: string) => {
    setDb((prev) => {
      const nextDb = {
        ...prev,
        badalEntries: prev.badalEntries.filter((b) => b.id !== id),
      };
      scheduleRealtimeSync(nextDb);
      return nextDb;
    });
  };

  // Master Data Handlers
  const handleAddStaff = (staffData: Omit<StaffMember, 'id'>) => {
    setDb((prev) => {
      const newStaff: StaffMember = {
        ...staffData,
        id: `st-${Date.now()}`,
      };
      const nextDb = {
        ...prev,
        staff: [...prev.staff, newStaff],
      };
      scheduleRealtimeSync(nextDb);
      return nextDb;
    });
  };

  const handleDeleteStaff = (id: string) => {
    setDb((prev) => {
      const nextDb = {
        ...prev,
        staff: prev.staff.filter((s) => s.id !== id),
      };
      scheduleRealtimeSync(nextDb);
      return nextDb;
    });
  };

  const handleToggleStaffSession = (staffId: string, sessionId: string) => {
    setDb((prev) => {
      const nextStaff = prev.staff.map((s) => {
        if (s.id !== staffId) return s;
        const exists = s.defaultSessionIds.includes(sessionId);
        const nextIds = exists
          ? s.defaultSessionIds.filter((id) => id !== sessionId)
          : [...s.defaultSessionIds, sessionId];
        return { ...s, defaultSessionIds: nextIds };
      });
      const nextDb = { ...prev, staff: nextStaff };
      scheduleRealtimeSync(nextDb);
      return nextDb;
    });
  };

  const handleAddSession = (sessionData: Omit<KbmSession, 'id'>) => {
    setDb((prev) => {
      const newSession: KbmSession = {
        ...sessionData,
        id: `ses-${Date.now()}`,
      };
      const nextDb = {
        ...prev,
        sessions: [...prev.sessions, newSession],
      };
      scheduleRealtimeSync(nextDb);
      return nextDb;
    });
  };

  const handleDeleteSession = (id: string) => {
    setDb((prev) => {
      if (prev.sessions.length <= 1) return prev;
      const nextSessions = prev.sessions.filter((s) => s.id !== id);
      const nextDb = { ...prev, sessions: nextSessions };
      if (selectedSessionId === id && nextSessions[0]) {
        setSelectedSessionId(nextSessions[0].id);
      }
      scheduleRealtimeSync(nextDb);
      return nextDb;
    });
  };

  const handleOpenJpgModal = (
    mode: 'DAILY' | 'MONTHLY',
    dateOrMonth: string,
    sessionId: string
  ) => {
    setJpgModalMode(mode);
    if (mode === 'DAILY') {
      setSelectedDate(dateOrMonth);
    } else {
      setSelectedYearMonth(dateOrMonth);
    }
    setJpgModalSessionId(sessionId);
    setJpgModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: Strictly 3 Zones (1. Single-element Brand Wordmark, 2. 4 Nav Links, 3. 2 Primary Actions) */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#daily"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('DAILY');
          }}
          className="text-base sm:text-lg font-bold tracking-tight text-emerald-950 whitespace-nowrap"
        >
          MD Darul Lughah Wal Karomah
        </a>

        {/* Zone 2: 4 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('DAILY')}
            className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'DAILY'
                ? 'text-emerald-800 font-semibold underline underline-offset-8 decoration-2 decoration-emerald-700'
                : 'hover:text-slate-900'
            }`}
          >
            Laporan Harian KBM
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MONTHLY')}
            className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'MONTHLY'
                ? 'text-emerald-800 font-semibold underline underline-offset-8 decoration-2 decoration-emerald-700'
                : 'hover:text-slate-900'
            }`}
          >
            Rekap Bulanan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MASTER')}
            className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'MASTER'
                ? 'text-emerald-800 font-semibold underline underline-offset-8 decoration-2 decoration-emerald-700'
                : 'hover:text-slate-900'
            }`}
          >
            Master SDM & KBM
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('INTEGRATION')}
            className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'INTEGRATION'
                ? 'text-emerald-800 font-semibold underline underline-offset-8 decoration-2 decoration-emerald-700'
                : 'hover:text-slate-900'
            }`}
          >
            Integrasi Spreadsheet
          </button>
        </nav>

        {/* Zone 3: 1-2 Primary Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleManualPush}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                syncConfig.syncStatus === 'syncing' ? 'animate-spin text-emerald-700' : ''
              }`}
            />
            <span>Sinkronisasi</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleOpenJpgModal(
                activeTab === 'MONTHLY' ? 'MONTHLY' : 'DAILY',
                activeTab === 'MONTHLY' ? selectedYearMonth : selectedDate,
                selectedSessionId
              )
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <ImageDown className="w-3.5 h-3.5" />
            <span>Studio JPG</span>
          </button>
        </div>
      </header>

      {/* Mobile Navigation Tabs (Visible only on small screens) */}
      <div className="md:hidden flex items-center gap-1 px-4 py-2 bg-white border-b border-slate-200 overflow-x-auto">
        {(
          [
            { id: 'DAILY', label: 'Harian KBM' },
            { id: 'MONTHLY', label: 'Rekap Bulanan' },
            { id: 'MASTER', label: 'Master SDM' },
            { id: 'INTEGRATION', label: 'Spreadsheet API' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-emerald-800 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Container (1440px max-w desktop presence) */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'DAILY' && (
          <DailyKbmView
            db={db}
            selectedDate={selectedDate}
            onChangeDate={setSelectedDate}
            selectedSessionId={selectedSessionId}
            onChangeSessionId={setSelectedSessionId}
            onUpsertAttendance={handleUpsertAttendance}
            onMarkAllPresent={handleMarkAllPresent}
            onAddBadalEntry={handleAddBadalEntry}
            onDeleteBadalEntry={handleDeleteBadalEntry}
            onOpenJpgModal={handleOpenJpgModal}
          />
        )}

        {activeTab === 'MONTHLY' && (
          <MonthlyRecapView
            db={db}
            selectedYearMonth={selectedYearMonth}
            onChangeYearMonth={setSelectedYearMonth}
            onOpenJpgModal={handleOpenJpgModal}
          />
        )}

        {activeTab === 'MASTER' && (
          <MasterDataView
            db={db}
            onAddStaff={handleAddStaff}
            onDeleteStaff={handleDeleteStaff}
            onToggleStaffSession={handleToggleStaffSession}
            onAddSession={handleAddSession}
            onDeleteSession={handleDeleteSession}
          />
        )}

        {activeTab === 'INTEGRATION' && (
          <AppsScriptIntegrationView
            db={db}
            syncConfig={syncConfig}
            onUpdateSyncConfig={updateSyncConfig}
            onPushToSpreadsheet={handleManualPush}
            onPullFromSpreadsheet={handleManualPull}
            onImportDatabaseJson={(imported) => {
              setDb(imported);
              saveLocalDatabase(imported);
            }}
            onResetToDemoData={() => {
              const reset = createInitialDatabase();
              setDb(reset);
              saveLocalDatabase(reset);
            }}
          />
        )}
      </main>

      {/* Quiet Institutional Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 mt-12">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            <span>Sistem Rekapitulasi Kehadiran · Madrasah Diniyah Darul Lughah Wal Karomah</span>
            <span className="mx-2">·</span>
            <span>Khusus Staf Administrasi</span>
          </div>
          <div>
            <span>{syncConfig.lastSyncMessage}</span>
          </div>
        </div>
      </footer>

      {/* WhatsApp JPG Export Modal */}
      <JpgExportModal
        isOpen={jpgModalOpen}
        onClose={() => setJpgModalOpen(false)}
        initialMode={jpgModalMode}
        initialDate={selectedDate}
        initialMonth={selectedYearMonth}
        initialSessionId={jpgModalSessionId}
        db={db}
        syncConfig={syncConfig}
      />
    </div>
  );
}
