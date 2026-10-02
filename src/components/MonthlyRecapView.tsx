import React, { useState, useMemo } from 'react';
import {
  CalendarRange,
  Download,
  ImageDown,
  Search,
  UserCheck,
} from 'lucide-react';
import { AppDatabase, StaffCategory } from '../types';
import { formatIndonesianDate, formatIndonesianMonth } from '../utils/jpgExporter';

interface MonthlyRecapViewProps {
  db: AppDatabase;
  selectedYearMonth: string; // YYYY-MM
  onChangeYearMonth: (ym: string) => void;
  onOpenJpgModal: (mode: 'MONTHLY', dateOrMonth: string, sessionId: string) => void;
}

export const MonthlyRecapView: React.FC<MonthlyRecapViewProps> = ({
  db,
  selectedYearMonth,
  onChangeYearMonth,
  onOpenJpgModal,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | StaffCategory>('ALL');
  const [sessionFilter, setSessionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const sortedSessions = useMemo(
    () => [...db.sessions].sort((a, b) => a.sortOrder - b.sortOrder),
    [db.sessions]
  );

  // Filter attendance & badal records in the selected month
  const monthAttendance = useMemo(() => {
    return db.attendance.filter((a) => {
      if (!a.date.startsWith(selectedYearMonth)) return false;
      if (sessionFilter !== 'ALL' && a.sessionId !== sessionFilter) return false;
      return true;
    });
  }, [db.attendance, selectedYearMonth, sessionFilter]);

  const monthBadalEntries = useMemo(() => {
    return db.badalEntries.filter((b) => {
      if (!b.date.startsWith(selectedYearMonth)) return false;
      if (sessionFilter !== 'ALL' && b.sessionId !== sessionFilter) return false;
      return true;
    });
  }, [db.badalEntries, selectedYearMonth, sessionFilter]);

  // Build recap rows per staff member
  const recapRows = useMemo(() => {
    return db.staff
      .filter((s) => {
        if (!s.active) return false;
        if (categoryFilter !== 'ALL' && s.category !== categoryFilter) return false;
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
      })
      .map((staff) => {
        const records = monthAttendance.filter((a) => a.staffId === staff.id);
        const h = records.filter((r) => r.status === 'H').length;
        const i = records.filter((r) => r.status === 'I').length;
        const s = records.filter((r) => r.status === 'S').length;
        const a = records.filter((r) => r.status === 'A').length;
        const totalReguler = h + i + s + a;

        const badalCount = monthBadalEntries.filter(
          (b) =>
            b.countInMonthlyRecap &&
            (b.badalStaffId === staff.id ||
              b.badalName.toLowerCase() === staff.name.toLowerCase())
        ).length;

        const pct =
          totalReguler > 0
            ? Math.round((h / totalReguler) * 100)
            : staff.category === 'BADAL' && badalCount > 0
            ? 100
            : 0;

        return {
          staff,
          h,
          i,
          s,
          a,
          totalReguler,
          badalCount,
          totalAktif: h + badalCount,
          pct,
        };
      });
  }, [db.staff, categoryFilter, searchQuery, monthAttendance, monthBadalEntries]);

  const totals = useMemo(() => {
    const sumH = recapRows.reduce((acc, r) => acc + r.h, 0);
    const sumI = recapRows.reduce((acc, r) => acc + r.i, 0);
    const sumS = recapRows.reduce((acc, r) => acc + r.s, 0);
    const sumA = recapRows.reduce((acc, r) => acc + r.a, 0);
    const sumReguler = sumH + sumI + sumS + sumA;
    const avgPct = sumReguler > 0 ? Math.round((sumH / sumReguler) * 100) : 0;
    const sumBadal = monthBadalEntries.filter((b) => b.countInMonthlyRecap).length;
    return { sumH, sumI, sumS, sumA, sumReguler, avgPct, sumBadal };
  }, [recapRows, monthBadalEntries]);

  const handleExportCsv = () => {
    const headers = [
      'No',
      'NIY',
      'Nama Personel',
      'Kategori',
      'Unit/Kelas',
      'Kitab/Jabatan',
      'Hadir (H)',
      'Izin (I)',
      'Sakit (S)',
      'Alpa (A)',
      'Total Sesi Reguler',
      'Sesi Badal',
      'Total Kehadiran + Badal',
      'Persentase (%)',
    ];
    const rows = recapRows.map((r, idx) => [
      idx + 1,
      `"${r.staff.niy}"`,
      `"${r.staff.name}"`,
      r.staff.category,
      `"${r.staff.unitOrKelas}"`,
      `"${r.staff.roleOrKitab}"`,
      r.h,
      r.i,
      r.s,
      r.a,
      r.totalReguler,
      r.badalCount,
      r.totalAktif,
      `${r.pct}%`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Rekap_Bulanan_MD_Darul_Lughah_${selectedYearMonth}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Laporan & Rekapitulasi Kehadiran Bulanan
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              <span>Periode Rekap: {formatIndonesianMonth(selectedYearMonth)}</span>
              <span className="mx-2 text-slate-400">·</span>
              <span>Akumulasi otomatis untuk Pengajar, Karyawan, dan Badal</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2">
              <CalendarRange className="w-4 h-4 text-slate-500 shrink-0" />
              <label htmlFor="month-picker" className="text-xs font-medium text-slate-600 whitespace-nowrap">
                Bulan:
              </label>
              <input
                id="month-picker"
                type="month"
                value={selectedYearMonth}
                onChange={(e) => onChangeYearMonth(e.target.value)}
                className="text-sm font-mono font-medium text-slate-900 bg-transparent focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh CSV</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenJpgModal('MONTHLY', selectedYearMonth, sessionFilter)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <ImageDown className="w-4 h-4" />
              <span>Ekspor JPG Bulanan (WhatsApp)</span>
            </button>
          </div>
        </div>

        {/* Category & Session Filters */}
        <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 block">
              Filter Kategori Personel:
            </span>
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
              {(['ALL', 'PENGAJAR', 'KARYAWAN', 'BADAL'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-emerald-800 text-white font-semibold'
                      : 'text-slate-700 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  {cat === 'ALL'
                    ? 'Semua Kategori'
                    : cat === 'PENGAJAR'
                    ? 'Pengajar (Asatidz)'
                    : cat === 'KARYAWAN'
                    ? 'Karyawan & TU'
                    : 'Tim Badal'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 block">
              Filter Sesi KBM:
            </span>
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setSessionFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  sessionFilter === 'ALL'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Sesi KBM
              </button>
              {sortedSessions.map((ses) => (
                <button
                  key={ses.id}
                  type="button"
                  onClick={() => setSessionFilter(ses.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    sessionFilter === ses.id
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {ses.code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Rata-Rata Kehadiran</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {totals.avgPct}%
          </p>
          <p className="text-xs text-slate-500 mt-1">Dari {totals.sumReguler} sesi tercatat</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-emerald-700">Total Sesi Hadir (H)</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
            {totals.sumH}
          </p>
          <p className="text-xs text-slate-500 mt-1">Kehadiran reguler</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-blue-700">Total Sesi Izin (I)</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-blue-700 mt-1">
            {totals.sumI}
          </p>
          <p className="text-xs text-slate-500 mt-1">Izin terkonfirmasi</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-amber-700">Total Sesi Sakit (S)</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1">
            {totals.sumS}
          </p>
          <p className="text-xs text-slate-500 mt-1">Udzur sakit</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-red-700">Total Sesi Alpa (A)</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-red-700 mt-1">
            {totals.sumA}
          </p>
          <p className="text-xs text-slate-500 mt-1">Tanpa keterangan</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-indigo-700">Total Sesi Badal</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-indigo-700 mt-1">
            {totals.sumBadal}
          </p>
          <p className="text-xs text-slate-500 mt-1">Akumulasi badal bulan ini</p>
        </div>
      </div>

      {/* Main Monthly Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Tabel Matriks Akumulasi Kehadiran ({recapRows.length} Personel)
            </h2>
            <p className="text-xs text-slate-500">
              Menampilkan jumlah sesi Hadir, Izin, Sakit, Alpa, dan tambahan sesi Badal
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau NIY..."
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 w-12">No</th>
                <th className="py-3 px-4">Nama Personel</th>
                <th className="py-3 px-4">Kategori & Unit/Kelas</th>
                <th className="py-3 px-4 text-right">Hadir (H)</th>
                <th className="py-3 px-4 text-right">Izin (I)</th>
                <th className="py-3 px-4 text-right">Sakit (S)</th>
                <th className="py-3 px-4 text-right">Alpa (A)</th>
                <th className="py-3 px-4 text-right">Sesi Badal</th>
                <th className="py-3 px-4 text-right">Total Aktif</th>
                <th className="py-3 px-4 w-44">Tingkat Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {recapRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 px-4 text-center text-slate-500">
                    Tidak ada personel untuk filter yang dipilih.
                  </td>
                </tr>
              ) : (
                recapRows.map((row, idx) => (
                  <tr key={row.staff.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-500">
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{row.staff.name}</div>
                      <div className="text-xs font-mono text-slate-500">{row.staff.niy}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs font-medium text-slate-800">
                        <span>{row.staff.category}</span>
                        <span className="mx-1.5 text-slate-400">·</span>
                        <span>{row.staff.unitOrKelas}</span>
                      </div>
                      <div className="text-xs text-slate-500">{row.staff.roleOrKitab}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-emerald-700">
                      {row.h}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-blue-700">
                      {row.i}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-amber-700">
                      {row.s}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-red-700">
                      {row.a}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-indigo-700">
                      {row.badalCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                      {row.totalAktif}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              row.pct >= 85
                                ? 'bg-emerald-600'
                                : row.pct >= 65
                                ? 'bg-amber-500'
                                : 'bg-red-600'
                            }`}
                            style={{ width: `${Math.min(100, row.pct)}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono tabular-nums font-semibold text-slate-800 w-10 text-right">
                          {row.pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Rincian Penugasan Badal Bulan Ini */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-700" />
              <span>Rincian Log Kehadiran & Keterangan Badal ({formatIndonesianMonth(selectedYearMonth)})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar lengkap seluruh catatan badal harian selama bulan ini
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-indigo-700">
            Total: {monthBadalEntries.length} Catatan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-2.5 px-4 w-12">No</th>
                <th className="py-2.5 px-4">Tanggal</th>
                <th className="py-2.5 px-4">Sesi KBM</th>
                <th className="py-2.5 px-4">Nama Petugas Badal</th>
                <th className="py-2.5 px-4">Kelas & Kitab</th>
                <th className="py-2.5 px-4">Keterangan Harian</th>
                <th className="py-2.5 px-4">Status Rekap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {monthBadalEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 px-4 text-center text-slate-500">
                    Belum ada catatan badal pada bulan {formatIndonesianMonth(selectedYearMonth)}.
                  </td>
                </tr>
              ) : (
                monthBadalEntries.map((entry, idx) => {
                  const ses = db.sessions.find((s) => s.id === entry.sessionId);
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-mono tabular-nums text-xs text-slate-500">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-2.5 px-4 text-xs font-medium text-slate-800 whitespace-nowrap">
                        {formatIndonesianDate(entry.date)}
                      </td>
                      <td className="py-2.5 px-4 text-xs font-mono text-slate-700 whitespace-nowrap">
                        {ses ? `${ses.code} (${ses.name})` : entry.sessionId}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {entry.badalName}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-indigo-700 font-medium">
                        {entry.kelasOrKitab}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-slate-600">
                        {entry.keterangan}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {entry.countInMonthlyRecap ? 'Dihitung di Rekap Bulanan' : 'Keterangan Saja'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
