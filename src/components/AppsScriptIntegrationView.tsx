import React, { useState } from 'react';
import {
  CloudUpload,
  CloudDownload,
  Copy,
  Check,
  Database,
  RefreshCw,
  FileJson,
  Upload,
  RotateCcw,
} from 'lucide-react';
import { AppDatabase, SyncConfig } from '../types';
import { APPS_SCRIPT_TEMPLATE } from '../data/initialData';

interface AppsScriptIntegrationViewProps {
  db: AppDatabase;
  syncConfig: SyncConfig;
  onUpdateSyncConfig: (patch: Partial<SyncConfig>) => void;
  onPushToSpreadsheet: () => Promise<void>;
  onPullFromSpreadsheet: () => Promise<void>;
  onImportDatabaseJson: (newDb: AppDatabase) => void;
  onResetToDemoData: () => void;
}

export const AppsScriptIntegrationView: React.FC<AppsScriptIntegrationViewProps> = ({
  db,
  syncConfig,
  onUpdateSyncConfig,
  onPushToSpreadsheet,
  onPullFromSpreadsheet,
  onImportDatabaseJson,
  onResetToDemoData,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [urlInput, setUrlInput] = useState(syncConfig.scriptUrl);
  const [subtitleInput, setSubtitleInput] = useState(syncConfig.institutionSubtitle);
  const [adminNameInput, setAdminNameInput] = useState(syncConfig.adminName);
  const [saveBanner, setSaveBanner] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSyncConfig({
      scriptUrl: urlInput.trim(),
      institutionSubtitle: subtitleInput.trim(),
      adminName: adminNameInput.trim(),
    });
    setSaveBanner(true);
    setTimeout(() => setSaveBanner(false), 3000);
  };

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_DB_MD_Darul_Lughah_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result)) as AppDatabase;
        if (parsed.staff && parsed.sessions && parsed.attendance) {
          onImportDatabaseJson(parsed);
        }
      } catch (err) {
        console.error('File JSON tidak valid:', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Integrasi Database Spreadsheet, Apps Script API & GitHub
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Hubungkan webapp dengan Google Spreadsheet melalui Google Apps Script untuk sinkronisasi real-time dua arah
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 6 Columns: Konfigurasi Endpoint API & Sinkronisasi */}
        <div className="xl:col-span-6 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-200 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-700" />
              <span>Pengaturan Koneksi Google Apps Script API</span>
            </h2>

            <form onSubmit={handleSaveSettings} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Web App Google Apps Script (Berakhiran /exec)
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Saat URL diisi dan disimpan, setiap perubahan absensi harian maupun badal akan disinkronkan secara otomatis ke Spreadsheet.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Staf Administrasi (Tercetak di JPG)
                  </label>
                  <input
                    type="text"
                    value={adminNameInput}
                    onChange={(e) => setAdminNameInput(e.target.value)}
                    placeholder="Contoh: Ust. M. Lutfi Hakim"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subjudul Kop Laporan JPG
                  </label>
                  <input
                    type="text"
                    value={subtitleInput}
                    onChange={(e) => setSubtitleInput(e.target.value)}
                    placeholder="Pondok Pesantren Darul Lughah Wal Karomah"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncConfig.autoSync}
                  onChange={(e) => onUpdateSyncConfig({ autoSync: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                />
                <span className="text-xs font-medium text-slate-800">
                  Aktifkan Sinkronisasi Real-Time Otomatis setiap kali Admin mengubah data kehadiran
                </span>
              </label>

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="submit"
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                >
                  Simpan Pengaturan API & Identitas
                </button>

                {saveBanner && (
                  <span className="text-xs font-semibold text-emerald-700">
                    Pengaturan berhasil disimpan!
                  </span>
                )}
              </div>
            </form>

            {/* Manual Sync Controls & Status */}
            <div className="mt-6 pt-5 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Kontrol Sinkronisasi Dua Arah (Manual & Real-Time)
                </span>
                <span className="text-xs font-mono text-slate-500">
                  Status: {syncConfig.syncStatus.toUpperCase()}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                <div>{syncConfig.lastSyncMessage}</div>
                {syncConfig.lastSyncedAt && (
                  <div className="text-slate-500 font-mono mt-1">
                    Terakhir sinkron: {new Date(syncConfig.lastSyncedAt).toLocaleString('id-ID')}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onPushToSpreadsheet}
                  disabled={syncConfig.syncStatus === 'syncing'}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                >
                  {syncConfig.syncStatus === 'syncing' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CloudUpload className="w-4 h-4" />
                  )}
                  <span>Kirim Data ke Spreadsheet (Push)</span>
                </button>

                <button
                  type="button"
                  onClick={onPullFromSpreadsheet}
                  disabled={syncConfig.syncStatus === 'syncing'}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                >
                  <CloudDownload className="w-4 h-4" />
                  <span>Tarik Data dari Spreadsheet (Pull)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cadangan JSON & GitHub Repository Workflow */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-200">
              Cadangan Database Lokal & Deployment GitHub Pages
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Aplikasi ini dirancang dengan arsitektur statis yang siap di-deploy ke <strong>GitHub Pages</strong>, <strong>Vercel</strong>, atau <strong>Netlify</strong>. Seluruh data tersimpan di browser Staf Administrasi dan disinkronkan ke Google Spreadsheet melalui API Apps Script.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExportJson}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <FileJson className="w-4 h-4" />
                <span>Ekspor Backup Database (.JSON)</span>
              </button>

              <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Impor Backup (.JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={onResetToDemoData}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset ke Data Awal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 6 Columns: Generator Kode Google Apps Script (Code.gs) Siap Pakai */}
        <div className="xl:col-span-6 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Template Kode Google Apps Script (Code.gs) Siap Pakai
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Otomatis membuat 4 Sheet: Master_SDM, Sesi_KBM, Absensi_Harian, dan Catatan_Badal
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyScript}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Kode Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Kode Code.gs</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-2 text-xs text-slate-700 bg-emerald-50/70 border border-emerald-200 rounded-lg p-3.5">
            <p className="font-bold text-emerald-950">Panduan Singkat Menghubungkan Spreadsheet (2 Menit):</p>
            <ol className="list-decimal list-inside space-y-1 text-emerald-900">
              <li>Buka Google Spreadsheet baru di Google Drive khusus administrasi Madrasah Diniyah.</li>
              <li>Klik menu <strong>Extensions (Ekstensi) &rarr; Apps Script</strong>.</li>
              <li>Salin kode di bawah ini dan tempelkan menggantikan seluruh isi file <code>Code.gs</code>.</li>
              <li>Klik <strong>Deploy &rarr; New deployment</strong>, pilih jenis <strong>Web app</strong>.</li>
              <li>Atur <em>Who has access</em> ke <strong>Anyone (Siapa saja)</strong>, lalu salin URL <code>/exec</code> ke kolom di samping.</li>
            </ol>
          </div>

          <div className="relative">
            <pre className="w-full h-[420px] overflow-auto p-4 bg-slate-900 text-slate-100 text-xs font-mono rounded-lg leading-relaxed">
              <code>{APPS_SCRIPT_TEMPLATE}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
