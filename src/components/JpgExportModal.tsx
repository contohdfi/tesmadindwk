import React, { useEffect, useRef, useState } from 'react';
import { X, Download, Image as ImageIcon } from 'lucide-react';
import { AppDatabase, StaffCategory, SyncConfig } from '../types';
import {
  downloadCanvasAsJpg,
  renderDailyWhatsAppCard,
  renderMonthlyWhatsAppCard,
} from '../utils/jpgExporter';

interface JpgExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'DAILY' | 'MONTHLY';
  initialDate: string;
  initialMonth: string;
  initialSessionId: string;
  db: AppDatabase;
  syncConfig: SyncConfig;
}

export const JpgExportModal: React.FC<JpgExportModalProps> = ({
  isOpen,
  onClose,
  initialMode,
  initialDate,
  initialMonth,
  initialSessionId,
  db,
  syncConfig,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [mode, setMode] = useState<'DAILY' | 'MONTHLY'>(initialMode);
  const [date, setDate] = useState(initialDate);
  const [yearMonth, setYearMonth] = useState(initialMonth);
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [dailyCategory, setDailyCategory] = useState<'ALL' | 'PENGAJAR' | 'KARYAWAN'>('ALL');
  const [monthlyCategory, setMonthlyCategory] = useState<'ALL' | StaffCategory>('ALL');
  const [showAllPresentNames, setShowAllPresentNames] = useState<boolean>(true);
  const [includeBadalNotes, setIncludeBadalNotes] = useState<boolean>(true);
  const [customCatatanAdmin, setCustomCatatanAdmin] = useState<string>('');

  useEffect(() => {
    setMode(initialMode);
    setDate(initialDate);
    setYearMonth(initialMonth);
    setSessionId(initialSessionId);
  }, [initialMode, initialDate, initialMonth, initialSessionId, isOpen]);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    if (mode === 'DAILY') {
      renderDailyWhatsAppCard(canvasRef.current, db, syncConfig, {
        date,
        sessionId,
        categoryFilter: dailyCategory,
        showAllPresentNames,
        includeBadalNotes,
        customCatatanAdmin,
      });
    } else {
      renderMonthlyWhatsAppCard(canvasRef.current, db, syncConfig, {
        yearMonth,
        categoryFilter: monthlyCategory,
        sessionIdFilter: sessionId,
        includeBadalRecapSection: true,
        customCatatanAdmin,
      });
    }
  }, [
    isOpen,
    mode,
    date,
    yearMonth,
    sessionId,
    dailyCategory,
    monthlyCategory,
    showAllPresentNames,
    includeBadalNotes,
    customCatatanAdmin,
    db,
    syncConfig,
  ]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!canvasRef.current) return;
    if (mode === 'DAILY') {
      const ses = db.sessions.find((s) => s.id === sessionId);
      const sesSlug = ses ? ses.code : 'SemuaSesi';
      downloadCanvasAsJpg(
        canvasRef.current,
        `Laporan_Harian_MD_Darul_Lughah_${date}_${sesSlug}.jpg`
      );
    } else {
      downloadCanvasAsJpg(
        canvasRef.current,
        `Rekap_Bulanan_MD_Darul_Lughah_${yearMonth}_${monthlyCategory}.jpg`
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden shadow-xl">
        {/* Top Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-5 h-5 text-emerald-800" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Studio Ekspor Kartu Laporan JPG (Siap Bagikan ke Grup WhatsApp)
              </h2>
              <p className="text-xs text-slate-500">
                Resolusi Tinggi (2x Retina) · Madrasah Diniyah Darul Lughah Wal Karomah
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content: Left Controls, Right Live Canvas Preview */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Left 4 Cols: Customization Controls */}
          <div className="lg:col-span-4 p-5 space-y-4 bg-white">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jenis Kartu Laporan JPG
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setMode('DAILY')}
                  className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    mode === 'DAILY'
                      ? 'bg-emerald-800 text-white'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  Harian (Per-KBM)
                </button>
                <button
                  type="button"
                  onClick={() => setMode('MONTHLY')}
                  className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    mode === 'MONTHLY'
                      ? 'bg-emerald-800 text-white'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  Rekap Bulanan
                </button>
              </div>
            </div>

            {mode === 'DAILY' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Laporan Harian
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sesi KBM / Jam Kerja
                  </label>
                  <select
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="ALL">Semua Sesi KBM (Gabungan Harian)</option>
                    {db.sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} · {s.name} ({s.timeRange})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Personel
                  </label>
                  <select
                    value={dailyCategory}
                    onChange={(e) =>
                      setDailyCategory(e.target.value as 'ALL' | 'PENGAJAR' | 'KARYAWAN')
                    }
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="ALL">Pengajar & Karyawan</option>
                    <option value="PENGAJAR">Khusus Pengajar (Asatidz)</option>
                    <option value="KARYAWAN">Khusus Karyawan & TU</option>
                  </select>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showAllPresentNames}
                      onChange={(e) => setShowAllPresentNames(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-700"
                    />
                    <span>Tampilkan seluruh daftar nama (Termasuk yang Hadir)</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeBadalNotes}
                      onChange={(e) => setIncludeBadalNotes(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-700"
                    />
                    <span>Sertakan Blok Petugas Badal & Keterangan Harian</span>
                  </label>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Periode Bulan Rekapitulasi
                  </label>
                  <input
                    type="month"
                    value={yearMonth}
                    onChange={(e) => setYearMonth(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Filter Kategori SDM
                  </label>
                  <select
                    value={monthlyCategory}
                    onChange={(e) => setMonthlyCategory(e.target.value as 'ALL' | StaffCategory)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="ALL">Semua Kategori (Pengajar, Karyawan, Badal)</option>
                    <option value="PENGAJAR">Khusus Pengajar (Asatidz)</option>
                    <option value="KARYAWAN">Khusus Karyawan & TU</option>
                    <option value="BADAL">Khusus Tim Pengajar Badal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Filter Sesi KBM
                  </label>
                  <select
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="ALL">Semua Sesi KBM</option>
                    {db.sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} · {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Tambahan Staf Administrasi (Opsional)
              </label>
              <textarea
                rows={2}
                value={customCatatanAdmin}
                onChange={(e) => setCustomCatatanAdmin(e.target.value)}
                placeholder="Contoh: Mohon bagi asatidz yang berhalangan hadir dapat mengonfirmasi ke piket KBM 30 menit sebelum jam dimulai."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
              />
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Gambar Laporan (.JPG)</span>
              </button>
            </div>
          </div>

          {/* Right 8 Cols: Live Canvas Preview */}
          <div className="lg:col-span-8 p-6 bg-slate-100 flex flex-col items-center justify-start overflow-y-auto">
            <div className="w-full max-w-[720px] bg-white rounded-xl p-2 border border-slate-300 shadow-sm">
              <canvas
                ref={canvasRef}
                className="w-full h-auto block rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
