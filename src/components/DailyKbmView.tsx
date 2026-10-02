import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Search,
  UserCheck,
  Plus,
  Trash2,
  ImageDown,
  Calendar,
  Clock,
  FileText,
} from 'lucide-react';
import {
  AppDatabase,
  AttendanceStatus,
  BadalDailyEntry,
  StaffCategory,
} from '../types';
import { formatIndonesianDate } from '../utils/jpgExporter';

interface DailyKbmViewProps {
  db: AppDatabase;
  selectedDate: string;
  onChangeDate: (date: string) => void;
  selectedSessionId: string;
  onChangeSessionId: (sessionId: string) => void;
  onUpsertAttendance: (
    date: string,
    sessionId: string,
    staffId: string,
    category: StaffCategory,
    status: AttendanceStatus,
    note: string
  ) => void;
  onMarkAllPresent: (date: string, sessionId: string, staffIds: { id: string; category: StaffCategory }[]) => void;
  onAddBadalEntry: (entry: Omit<BadalDailyEntry, 'id' | 'updatedAt'>) => void;
  onDeleteBadalEntry: (id: string) => void;
  onOpenJpgModal: (mode: 'DAILY', date: string, sessionId: string) => void;
}

export const DailyKbmView: React.FC<DailyKbmViewProps> = ({
  db,
  selectedDate,
  onChangeDate,
  selectedSessionId,
  onChangeSessionId,
  onUpsertAttendance,
  onMarkAllPresent,
  onAddBadalEntry,
  onDeleteBadalEntry,
  onOpenJpgModal,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'PENGAJAR' | 'KARYAWAN'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state for Badal entry (Opsi 2 & Opsi 3)
  const [selectedBadalStaffId, setSelectedBadalStaffId] = useState<string>('');
  const [customBadalName, setCustomBadalName] = useState<string>('');
  const [kelasOrKitab, setKelasOrKitab] = useState<string>('');
  const [badalKeterangan, setBadalKeterangan] = useState<string>('');
  const [countInMonthlyRecap, setCountInMonthlyRecap] = useState<boolean>(true);

  const sortedSessions = useMemo(
    () => [...db.sessions].sort((a, b) => a.sortOrder - b.sortOrder),
    [db.sessions]
  );

  const currentSession = useMemo(
    () => sortedSessions.find((s) => s.id === selectedSessionId) || sortedSessions[0],
    [sortedSessions, selectedSessionId]
  );

  // Filter eligible staff for the selected KBM session and category
  const eligibleStaff = useMemo(() => {
    return db.staff.filter((s) => {
      if (!s.active) return false;
      if (s.category === 'BADAL') return false; // Badal dicatat di panel Badal tersendiri (Opsi 2 & 3)
      if (categoryFilter !== 'ALL' && s.category !== categoryFilter) return false;
      if (currentSession && !s.defaultSessionIds.includes(currentSession.id)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.niy.toLowerCase().includes(q) ||
          s.roleOrKitab.toLowerCase().includes(q) ||
          s.unitOrKelas.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [db.staff, categoryFilter, currentSession, searchQuery]);

  // Attendance map for selectedDate + currentSession
  const sessionAttendanceMap = useMemo(() => {
    const map = new Map<string, { status: AttendanceStatus; note: string }>();
    if (!currentSession) return map;
    db.attendance.forEach((rec) => {
      if (rec.date === selectedDate && rec.sessionId === currentSession.id) {
        map.set(rec.staffId, { status: rec.status, note: rec.note });
      }
    });
    return map;
  }, [db.attendance, selectedDate, currentSession]);

  // Badal entries for selectedDate + currentSession
  const sessionBadalEntries = useMemo(() => {
    if (!currentSession) return [];
    return db.badalEntries.filter(
      (b) => b.date === selectedDate && b.sessionId === currentSession.id
    );
  }, [db.badalEntries, selectedDate, currentSession]);

  // Badal pool (Badal category + Pengajar who can substitute)
  const badalPool = useMemo(() => {
    return db.staff.filter((s) => s.active && (s.category === 'BADAL' || s.category === 'PENGAJAR'));
  }, [db.staff]);

  // Compute summary metrics
  const stats = useMemo(() => {
    let h = 0;
    let i = 0;
    let s = 0;
    let a = 0;
    let unrecorded = 0;

    eligibleStaff.forEach((st) => {
      const rec = sessionAttendanceMap.get(st.id);
      if (!rec) {
        unrecorded++;
      } else if (rec.status === 'H') {
        h++;
      } else if (rec.status === 'I') {
        i++;
      } else if (rec.status === 'S') {
        s++;
      } else if (rec.status === 'A') {
        a++;
      }
    });

    const recorded = h + i + s + a;
    const pct = recorded > 0 ? Math.round((h / recorded) * 100) : 0;
    return { h, i, s, a, unrecorded, total: eligibleStaff.length, recorded, pct };
  }, [eligibleStaff, sessionAttendanceMap]);

  const handleAddBadal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSession) return;

    const chosenStaff = badalPool.find((p) => p.id === selectedBadalStaffId);
    const finalName =
      selectedBadalStaffId === 'CUSTOM'
        ? customBadalName.trim()
        : chosenStaff?.name || customBadalName.trim();

    if (!finalName) return;

    onAddBadalEntry({
      date: selectedDate,
      sessionId: currentSession.id,
      badalStaffId: chosenStaff ? chosenStaff.id : 'custom-badal',
      badalName: finalName,
      kelasOrKitab: kelasOrKitab.trim() || chosenStaff?.unitOrKelas || 'Kelas Madin',
      keterangan: badalKeterangan.trim() || 'Hadir membadal KBM',
      countInMonthlyRecap,
    });

    setCustomBadalName('');
    setKelasOrKitab('');
    setBadalKeterangan('');
  };

  return (
    <div className="space-y-6">
      {/* Top Control Bar: Date, Session Tabs, Category Filter, and Export JPG */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Laporan & Input Kehadiran Harian (Per-KBM)
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              <span>{formatIndonesianDate(selectedDate)}</span>
              <span className="mx-2 text-slate-400">·</span>
              <span>Sesi Aktif: {currentSession ? `${currentSession.name} (${currentSession.timeRange})` : '-'}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2">
              <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
              <label htmlFor="daily-date-picker" className="text-xs font-medium text-slate-600 whitespace-nowrap">
                Tanggal KBM:
              </label>
              <input
                id="daily-date-picker"
                type="date"
                value={selectedDate}
                onChange={(e) => onChangeDate(e.target.value)}
                className="text-sm font-mono font-medium text-slate-900 bg-transparent focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                onOpenJpgModal('DAILY', selectedDate, currentSession ? currentSession.id : 'ALL')
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <ImageDown className="w-4 h-4" />
              <span>Ekspor JPG Sesi Ini (WhatsApp)</span>
            </button>
          </div>
        </div>

        {/* Sesi KBM Segmented Selector */}
        <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Pilih Sesi Jam KBM / Shift Harian:
            </span>
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
              {sortedSessions.map((ses) => {
                const isActive = currentSession?.id === ses.id;
                return (
                  <button
                    key={ses.id}
                    type="button"
                    onClick={() => onChangeSessionId(ses.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-emerald-800 text-white font-semibold'
                        : 'text-slate-700 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    {ses.code} · {ses.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 block">Filter Kategori SDM:</span>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
              {(['ALL', 'PENGAJAR', 'KARYAWAN'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat === 'ALL' ? 'Semua SDM' : cat === 'PENGAJAR' ? 'Pengajar' : 'Karyawan'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Metric Grid (Tabular Numerals, Single-Level Border) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Total Terjadwal</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {stats.total}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Belum diinput: <span className="font-mono font-semibold">{stats.unrecorded}</span>
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-emerald-700">Hadir (H)</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
            {stats.h}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Capaian: <span className="font-mono font-semibold text-emerald-700">{stats.pct}%</span>
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-blue-700">Izin (I)</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-blue-700 mt-1">
            {stats.i}
          </p>
          <p className="text-xs text-slate-500 mt-1">Ada konfirmasi udzur</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-amber-700">Sakit (S)</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1">
            {stats.s}
          </p>
          <p className="text-xs text-slate-500 mt-1">Istirahat / pemulihan</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-red-700">Alpa (A)</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-red-700 mt-1">
            {stats.a}
          </p>
          <p className="text-xs text-slate-500 mt-1">Tanpa keterangan</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-indigo-700">Petugas Badal</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-indigo-700 mt-1">
            {sessionBadalEntries.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Tercatat di sesi ini</p>
        </div>
      </div>

      {/* Main Two-Column Operational Area: Left = Tabel Kehadiran, Right = Panel Badal & Keterangan Harian */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns: Attendance Input Table */}
        <div className="xl:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama ustadz, karyawan, kelas, atau kitab..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (!currentSession) return;
                onMarkAllPresent(
                  selectedDate,
                  currentSession.id,
                  eligibleStaff.map((s) => ({ id: s.id, category: s.category }))
                );
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Tandai Semua Hadir (H)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 w-12">No</th>
                  <th className="py-3 px-4">Nama Pengajar / Karyawan</th>
                  <th className="py-3 px-4">Status Kehadiran (Klik Cepat)</th>
                  <th className="py-3 px-4 min-w-[210px]">Catatan / Keterangan Sesi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {eligibleStaff.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 px-4 text-center text-slate-500">
                      Tidak ada daftar personel yang cocok untuk sesi atau pencarian ini.
                    </td>
                  </tr>
                ) : (
                  eligibleStaff.map((staff, idx) => {
                    const rec = sessionAttendanceMap.get(staff.id);
                    const currentStatus = rec?.status;
                    const currentNote = rec?.note ?? '';

                    const statusButtons: {
                      code: AttendanceStatus;
                      label: string;
                      activeClass: string;
                    }[] = [
                      {
                        code: 'H',
                        label: 'H · Hadir',
                        activeClass: 'bg-emerald-700 text-white border-emerald-700',
                      },
                      {
                        code: 'I',
                        label: 'I · Izin',
                        activeClass: 'bg-blue-700 text-white border-blue-700',
                      },
                      {
                        code: 'S',
                        label: 'S · Sakit',
                        activeClass: 'bg-amber-600 text-white border-amber-600',
                      },
                      {
                        code: 'A',
                        label: 'A · Alpa',
                        activeClass: 'bg-red-700 text-white border-red-700',
                      },
                    ];

                    return (
                      <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-500">
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{staff.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            <span>{staff.category}</span>
                            <span className="mx-1.5">·</span>
                            <span>{staff.unitOrKelas}</span>
                            <span className="mx-1.5">·</span>
                            <span>{staff.roleOrKitab}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            {statusButtons.map((btn) => {
                              const isSelected = currentStatus === btn.code;
                              return (
                                <button
                                  key={btn.code}
                                  type="button"
                                  onClick={() => {
                                    if (!currentSession) return;
                                    onUpsertAttendance(
                                      selectedDate,
                                      currentSession.id,
                                      staff.id,
                                      staff.category,
                                      btn.code,
                                      currentNote
                                    );
                                  }}
                                  className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
                                    isSelected
                                      ? btn.activeClass
                                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                  }`}
                                >
                                  {btn.label}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={currentNote}
                            placeholder="Ketik keterangan (opsional)..."
                            onChange={(e) => {
                              if (!currentSession) return;
                              onUpsertAttendance(
                                selectedDate,
                                currentSession.id,
                                staff.id,
                                staff.category,
                                currentStatus || 'H',
                                e.target.value
                              );
                            }}
                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-emerald-700 focus:outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 4 Columns: Pencatatan Badal Mandiri & Keterangan Harian (Opsi 2 & 3) */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-700" />
                  <span>Pencatatan Badal & Keterangan KBM</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Entri mandiri untuk rekap bulanan Badal sekaligus catatan laporan harian
                </p>
              </div>
            </div>

            <form onSubmit={handleAddBadal} className="space-y-3.5 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Pengajar Badal / Piket
                </label>
                <select
                  value={selectedBadalStaffId}
                  onChange={(e) => setSelectedBadalStaffId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                  required
                >
                  <option value="">-- Pilih Nama Pengajar Badal --</option>
                  <optgroup label="Tim Pengajar Badal (Khusus)">
                    {badalPool
                      .filter((s) => s.category === 'BADAL')
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.roleOrKitab})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Asatidz / Pengajar Tetap">
                    {badalPool
                      .filter((s) => s.category === 'PENGAJAR')
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.unitOrKelas})
                        </option>
                      ))}
                  </optgroup>
                  <option value="CUSTOM">+ Ketik Nama Badal Lainnya Secara Manual</option>
                </select>
              </div>

              {selectedBadalStaffId === 'CUSTOM' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Petugas Badal
                  </label>
                  <input
                    type="text"
                    value={customBadalName}
                    onChange={(e) => setCustomBadalName(e.target.value)}
                    placeholder="Contoh: Ust. Ahmad Zaini"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kelas & Kitab / Mata Pelajaran yang Dibadal
                </label>
                <input
                  type="text"
                  value={kelasOrKitab}
                  onChange={(e) => setKelasOrKitab(e.target.value)}
                  placeholder="Contoh: Kelas 1 Wustho B · Fathul Qorib"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan Laporan Harian
                </label>
                <textarea
                  rows={2}
                  value={badalKeterangan}
                  onChange={(e) => setBadalKeterangan(e.target.value)}
                  placeholder="Contoh: Mengisi materi Bab Thaharah & sorogan santri"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                />
              </div>

              <label className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={countInMonthlyRecap}
                  onChange={(e) => setCountInMonthlyRecap(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                />
                <span className="text-xs text-slate-700 leading-relaxed">
                  <strong>Hitung di Rekap Bulanan Badal</strong> (Selain tampil sebagai keterangan di laporan harian KBM, tambahkan +1 poin hadir badal pada rekap bulanan)
                </span>
              </label>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-600 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan Catatan Badal Sesi Ini</span>
              </button>
            </form>

            {/* Daftar Badal Sesi Ini */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Daftar Badal Tercatat ({sessionBadalEntries.length})
                </span>
              </div>

              {sessionBadalEntries.length === 0 ? (
                <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                  Belum ada catatan badal pada sesi {currentSession?.code || 'ini'}.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {sessionBadalEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-slate-900">
                          {entry.badalName}
                        </div>
                        <div className="text-xs text-indigo-700 font-medium">
                          {entry.kelasOrKitab}
                        </div>
                        <div className="text-xs text-slate-600">{entry.keterangan}</div>
                        <div className="text-[11px] text-slate-500 pt-0.5">
                          {entry.countInMonthlyRecap
                            ? 'Masuk Rekap Bulanan · Tampil di Laporan Harian'
                            : 'Hanya Keterangan Laporan Harian'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteBadalEntry(entry.id)}
                        title="Hapus catatan badal"
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
