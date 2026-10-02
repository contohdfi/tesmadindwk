import React, { useState } from 'react';
import {
  Users,
  Clock,
  Plus,
  Trash2,
  CheckSquare,
  Square,
} from 'lucide-react';
import { AppDatabase, KbmSession, StaffCategory, StaffMember } from '../types';

interface MasterDataViewProps {
  db: AppDatabase;
  onAddStaff: (staff: Omit<StaffMember, 'id'>) => void;
  onDeleteStaff: (id: string) => void;
  onToggleStaffSession: (staffId: string, sessionId: string) => void;
  onAddSession: (session: Omit<KbmSession, 'id'>) => void;
  onDeleteSession: (id: string) => void;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  db,
  onAddStaff,
  onDeleteStaff,
  onToggleStaffSession,
  onAddSession,
  onDeleteSession,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'STAFF' | 'SESSIONS'>('STAFF');
  const [filterCat, setFilterCat] = useState<'ALL' | StaffCategory>('ALL');

  // New Staff Form State
  const [niy, setNiy] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<StaffCategory>('PENGAJAR');
  const [roleOrKitab, setRoleOrKitab] = useState('');
  const [unitOrKelas, setUnitOrKelas] = useState('');
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>(
    db.sessions.length > 0 ? [db.sessions[0].id] : []
  );

  // New Session Form State
  const [sesCode, setSesCode] = useState('');
  const [sesName, setSesName] = useState('');
  const [sesTimeRange, setSesTimeRange] = useState('');
  const [sesScope, setSesScope] = useState<'PENGAJAR' | 'KARYAWAN' | 'ALL'>('PENGAJAR');

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const autoNiy =
      niy.trim() ||
      `${category === 'PENGAJAR' ? 'MD' : category === 'KARYAWAN' ? 'KR' : 'BD'}-${new Date().getFullYear()}-${String(
        db.staff.length + 1
      ).padStart(3, '0')}`;

    onAddStaff({
      niy: autoNiy,
      name: name.trim(),
      category,
      roleOrKitab: roleOrKitab.trim() || 'Pengajar Kitab',
      unitOrKelas: unitOrKelas.trim() || 'Madrasah Diniyah',
      defaultSessionIds:
        selectedSessionIds.length > 0
          ? selectedSessionIds
          : db.sessions.map((s) => s.id),
      active: true,
    });

    setNiy('');
    setName('');
    setRoleOrKitab('');
    setUnitOrKelas('');
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sesCode.trim() || !sesName.trim()) return;

    onAddSession({
      code: sesCode.trim().toUpperCase(),
      name: sesName.trim(),
      timeRange: sesTimeRange.trim() || '14.00 – 15.00 WIB',
      scope: sesScope,
      sortOrder: db.sessions.length + 1,
    });

    setSesCode('');
    setSesName('');
    setSesTimeRange('');
  };

  const toggleFormSession = (id: string) => {
    setSelectedSessionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredStaff = db.staff.filter((s) =>
    filterCat === 'ALL' ? true : s.category === filterCat
  );

  return (
    <div className="space-y-6">
      {/* Header & Switcher */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Kelola Data Master SDM & Sesi KBM
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Atur daftar Pengajar, Karyawan, Tim Badal, serta jadwal sesi KBM harian Madrasah Diniyah
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 self-start">
          <button
            type="button"
            onClick={() => setActiveSubTab('STAFF')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeSubTab === 'STAFF'
                ? 'bg-emerald-800 text-white'
                : 'text-slate-700 hover:bg-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Data SDM ({db.staff.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('SESSIONS')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeSubTab === 'SESSIONS'
                ? 'bg-emerald-800 text-white'
                : 'text-slate-700 hover:bg-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Sesi Jam KBM ({db.sessions.length})</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'STAFF' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Form Tambah SDM */}
          <div className="xl:col-span-4 bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-200">
              Tambah Personel Baru
            </h2>

            <form onSubmit={handleCreateStaff} className="space-y-3.5 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Personel
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as StaffCategory)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                >
                  <option value="PENGAJAR">PENGAJAR (Ustadz / Ustadzah)</option>
                  <option value="KARYAWAN">KARYAWAN (Staf TU / Sarpras)</option>
                  <option value="BADAL">BADAL (Tim Pengajar Pengganti)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Ust. H. Mahrus Ali, M.Pd"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Induk Yayasan / NIY (Opsional)
                </label>
                <input
                  type="text"
                  value={niy}
                  onChange={(e) => setNiy(e.target.value)}
                  placeholder="Otomatis jika dikosongkan"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kelas / Unit Penugasan
                </label>
                <input
                  type="text"
                  value={unitOrKelas}
                  onChange={(e) => setUnitOrKelas(e.target.value)}
                  placeholder="Contoh: 2 Wustho A / Sekretariat"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kitab Ampuan / Jabatan
                </label>
                <input
                  type="text"
                  value={roleOrKitab}
                  onChange={(e) => setRoleOrKitab(e.target.value)}
                  placeholder="Contoh: Fathul Qorib & Nahwu"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Sesi KBM / Jam Kerja Terjadwal
                </label>
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {db.sessions.map((ses) => {
                    const checked = selectedSessionIds.includes(ses.id);
                    return (
                      <button
                        key={ses.id}
                        type="button"
                        onClick={() => toggleFormSession(ses.id)}
                        className="w-full flex items-center gap-2 text-left text-xs py-1 text-slate-700 hover:text-slate-900 cursor-pointer"
                      >
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="font-mono font-semibold">{ses.code}</span>
                        <span>·</span>
                        <span className="truncate">{ses.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambahkan ke Database SDM</span>
              </button>
            </form>
          </div>

          {/* Tabel Daftar SDM */}
          <div className="xl:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
              <span className="text-sm font-bold text-slate-900">
                Daftar Personel Aktif ({filteredStaff.length})
              </span>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                {(['ALL', 'PENGAJAR', 'KARYAWAN', 'BADAL'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFilterCat(cat)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      filterCat === cat
                        ? 'bg-white text-slate-900 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat === 'ALL' ? 'Semua' : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4 w-12">No</th>
                    <th className="py-3 px-4">Nama & NIY</th>
                    <th className="py-3 px-4">Kategori · Unit · Kitab</th>
                    <th className="py-3 px-4">Sesi KBM Aktif (Klik untuk Ubah)</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filteredStaff.map((staff, idx) => (
                    <tr key={staff.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-500">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{staff.name}</div>
                        <div className="text-xs font-mono text-slate-500">{staff.niy}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs font-semibold text-slate-800">
                          {staff.category} · {staff.unitOrKelas}
                        </div>
                        <div className="text-xs text-slate-500">{staff.roleOrKitab}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {db.sessions.map((ses) => {
                            const active = staff.defaultSessionIds.includes(ses.id);
                            return (
                              <button
                                key={ses.id}
                                type="button"
                                onClick={() => onToggleStaffSession(staff.id, ses.id)}
                                className={`px-2 py-1 text-xs font-mono rounded border transition-colors cursor-pointer ${
                                  active
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700'
                                }`}
                              >
                                {ses.code}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteStaff(staff.id)}
                          title="Hapus personel"
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Tambah Sesi KBM */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-200">
              Tambah Sesi KBM Baru
            </h2>
            <form onSubmit={handleCreateSession} className="space-y-3.5 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Singkat Sesi
                </label>
                <input
                  type="text"
                  value={sesCode}
                  onChange={(e) => setSesCode(e.target.value)}
                  placeholder="Contoh: KBM-3 atau SORE"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Sesi KBM / Jam Kerja
                </label>
                <input
                  type="text"
                  value={sesName}
                  onChange={(e) => setSesName(e.target.value)}
                  placeholder="Contoh: KBM Jam Ke-3 (Ashar)"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rentang Waktu
                </label>
                <input
                  type="text"
                  value={sesTimeRange}
                  onChange={(e) => setSesTimeRange(e.target.value)}
                  placeholder="Contoh: 16.00 – 17.00 WIB"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Peruntukan Sesi
                </label>
                <select
                  value={sesScope}
                  onChange={(e) =>
                    setSesScope(e.target.value as 'PENGAJAR' | 'KARYAWAN' | 'ALL')
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                >
                  <option value="PENGAJAR">Khusus Pengajar KBM</option>
                  <option value="KARYAWAN">Khusus Karyawan & TU</option>
                  <option value="ALL">Semua SDM</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan Sesi KBM</span>
              </button>
            </form>
          </div>

          {/* Tabel Daftar Sesi KBM */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/60">
              <h2 className="text-sm font-bold text-slate-900">
                Daftar Sesi KBM & Jam Kerja Harian ({db.sessions.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4 w-16">Urutan</th>
                    <th className="py-3 px-4">Kode</th>
                    <th className="py-3 px-4">Nama Sesi KBM</th>
                    <th className="py-3 px-4">Waktu Pelaksanaan</th>
                    <th className="py-3 px-4">Cakupan</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {db.sessions.map((ses) => (
                    <tr key={ses.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-500">
                        #{ses.sortOrder}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                        {ses.code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {ses.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">
                        {ses.timeRange}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">{ses.scope}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteSession(ses.id)}
                          disabled={db.sessions.length <= 1}
                          title="Hapus sesi KBM"
                          className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
