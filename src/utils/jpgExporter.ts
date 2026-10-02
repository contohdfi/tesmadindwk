import { AppDatabase, StaffCategory, SyncConfig } from '../types';

export interface DailyCardOptions {
  date: string;
  sessionId: string; // 'ALL' or specific sessionId
  categoryFilter: 'ALL' | 'PENGAJAR' | 'KARYAWAN';
  showAllPresentNames: boolean;
  includeBadalNotes: boolean;
  customCatatanAdmin: string;
}

export interface MonthlyCardOptions {
  yearMonth: string; // YYYY-MM
  categoryFilter: 'ALL' | StaffCategory;
  sessionIdFilter: string; // 'ALL' or specific sessionId
  includeBadalRecapSection: boolean;
  customCatatanAdmin: string;
}

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const INDONESIAN_DAYS = [
  'Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

export function formatIndonesianDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  const dt = new Date(year, month, day);
  const dayName = INDONESIAN_DAYS[dt.getDay()] || '';
  const monthName = INDONESIAN_MONTHS[month] || '';
  return `${dayName}, ${day} ${monthName} ${year}`;
}

export function formatIndonesianMonth(yearMonth: string): string {
  const parts = yearMonth.split('-');
  if (parts.length !== 2) return yearMonth;
  const year = parts[0];
  const monthIndex = Number(parts[1]) - 1;
  return `${INDONESIAN_MONTHS[monthIndex] || parts[1]} ${year}`;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let clipped = text;
  while (clipped.length > 0 && ctx.measureText(clipped + '…').width > maxWidth) {
    clipped = clipped.slice(0, -1);
  }
  return clipped + '…';
}

export function renderDailyWhatsAppCard(
  canvas: HTMLCanvasElement,
  db: AppDatabase,
  syncConfig: SyncConfig,
  options: DailyCardOptions
): void {
  const scale = 2; // High-DPI Retina for crisp WhatsApp viewing
  const width = 840;

  const activeStaff = db.staff.filter((s) => {
    if (!s.active) return false;
    if (s.category === 'BADAL') return false; // Badal ditampilkan di blok khusus Badal
    if (options.categoryFilter !== 'ALL' && s.category !== options.categoryFilter) return false;
    if (options.sessionId !== 'ALL' && !s.defaultSessionIds.includes(options.sessionId)) return false;
    return true;
  });

  const dayAttendance = db.attendance.filter((a) => {
    if (a.date !== options.date) return false;
    if (options.sessionId !== 'ALL' && a.sessionId !== options.sessionId) return false;
    if (options.categoryFilter !== 'ALL' && a.category !== options.categoryFilter) return false;
    return true;
  });

  // Map staff status for this date/session
  const staffRows = activeStaff.map((staff) => {
    const records = dayAttendance.filter((r) => r.staffId === staff.id);
    const latest = records[0];
    const sessionObj = latest
      ? db.sessions.find((s) => s.id === latest.sessionId)
      : db.sessions.find((s) => s.id === options.sessionId);

    return {
      staff,
      status: latest ? latest.status : ('H' as const),
      hasExplicitRecord: Boolean(latest),
      note: latest?.note || '',
      sessionCode: sessionObj?.code || 'KBM',
    };
  });

  const hadirCount = staffRows.filter((r) => r.hasExplicitRecord && r.status === 'H').length;
  const izinCount = staffRows.filter((r) => r.hasExplicitRecord && r.status === 'I').length;
  const sakitCount = staffRows.filter((r) => r.hasExplicitRecord && r.status === 'S').length;
  const alpaCount = staffRows.filter((r) => r.hasExplicitRecord && r.status === 'A').length;
  const totalRecorded = hadirCount + izinCount + sakitCount + alpaCount;
  const attendancePct = totalRecorded > 0 ? Math.round((hadirCount / totalRecorded) * 100) : 0;

  const nonPresentRows = staffRows.filter(
    (r) => r.hasExplicitRecord && (r.status === 'I' || r.status === 'S' || r.status === 'A')
  );
  const displayedStaffRows = options.showAllPresentNames
    ? staffRows.filter((r) => r.hasExplicitRecord)
    : nonPresentRows;

  const badalNotes = db.badalEntries.filter((b) => {
    if (b.date !== options.date) return false;
    if (options.sessionId !== 'ALL' && b.sessionId !== options.sessionId) return false;
    return true;
  });

  // Calculate dynamic canvas height
  const headerHeight = 162;
  const metaStripHeight = 56;
  const statGridHeight = 112;
  const staffRowHeight = 38;
  const staffSectionHeader = 48;
  const staffListHeight =
    displayedStaffRows.length > 0
      ? displayedStaffRows.length * staffRowHeight + 20
      : 54;

  const badalRowHeight = 54;
  const badalSectionHeight = options.includeBadalNotes
    ? 52 + (badalNotes.length > 0 ? badalNotes.length * badalRowHeight + 16 : 48)
    : 0;

  const adminNoteHeight = options.customCatatanAdmin.trim() ? 72 : 0;
  const footerHeight = 76;

  const totalHeight =
    headerHeight +
    metaStripHeight +
    statGridHeight +
    staffSectionHeader +
    staffListHeight +
    badalSectionHeight +
    adminNoteHeight +
    footerHeight +
    48;

  canvas.width = width * scale;
  canvas.height = totalHeight * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(scale, scale);

  // Background Canvas
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, width, totalHeight);

  // Outer Card Frame
  drawRoundedRect(ctx, 16, 16, width - 32, totalHeight - 32, 16);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#CBD5E1';
  ctx.stroke();

  // Top Header Banner (Deep Madrasah Emerald)
  ctx.save();
  drawRoundedRect(ctx, 16, 16, width - 32, headerHeight, 16);
  ctx.clip();
  const grad = ctx.createLinearGradient(16, 16, width - 16, headerHeight);
  grad.addColorStop(0, '#064E3B');
  grad.addColorStop(1, '#047857');
  ctx.fillStyle = grad;
  ctx.fillRect(16, 16, width - 32, headerHeight);

  // Subtle geometric accent lines in header
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(width - 220 + i * 35, 16);
    ctx.lineTo(width - 120 + i * 35, headerHeight + 16);
    ctx.stroke();
  }
  ctx.restore();

  // Header Typography
  ctx.fillStyle = '#A7F3D0';
  ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('LAPORAN HARIAN KEHADIRAN KBM & ADMINISTRASI', 44, 54);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 23px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('MADRASAH DINIYAH DARUL LUGHAH WAL KAROMAH', 44, 86);

  ctx.fillStyle = '#D1FAE5';
  ctx.font = '400 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    truncateText(ctx, syncConfig.institutionSubtitle || 'Pondok Pesantren Darul Lughah Wal Karomah', width - 88),
    44,
    112
  );

  // Session & Date Strip inside Header Bottom
  const selectedSession = db.sessions.find((s) => s.id === options.sessionId);
  const sessionLabel = selectedSession
    ? `${selectedSession.name} (${selectedSession.timeRange})`
    : 'Semua Sesi KBM & Jam Kerja Harian';

  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  drawRoundedRect(ctx, 44, 126, width - 88, 34, 8);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Tanggal: ${formatIndonesianDate(options.date)}`, 58, 148);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#ECFDF5';
  ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(truncateText(ctx, sessionLabel, 380), width - 58, 148);
  ctx.textAlign = 'left';

  let cursorY = 16 + headerHeight + 20;

  // Category & Percentage Info Row
  const catLabel =
    options.categoryFilter === 'ALL'
      ? 'Pengajar & Karyawan'
      : options.categoryFilter === 'PENGAJAR'
      ? 'Khusus Pengajar (Asatidz)'
      : 'Khusus Karyawan & Staf';

  ctx.fillStyle = '#0F172A';
  ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Ringkasan Kehadiran · ${catLabel}`, 44, cursorY + 16);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#047857';
  ctx.font = '700 15px "JetBrains Mono", monospace';
  ctx.fillText(`Tingkat Hadir: ${attendancePct}% (${hadirCount}/${totalRecorded})`, width - 44, cursorY + 16);
  ctx.textAlign = 'left';

  cursorY += 34;

  // 4 Stat Boxes (Hadir, Izin, Sakit, Alpa)
  const statItems = [
    { label: 'HADIR (H)', value: hadirCount, bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' },
    { label: 'IZIN (I)', value: izinCount, bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' },
    { label: 'SAKIT (S)', value: sakitCount, bg: '#FFFBEB', border: '#FDE68A', text: '#B45309' },
    { label: 'ALPA (A)', value: alpaCount, bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C' },
  ];

  const boxGap = 14;
  const totalBoxWidth = width - 88;
  const singleBoxWidth = (totalBoxWidth - boxGap * 3) / 4;

  statItems.forEach((st, idx) => {
    const bx = 44 + idx * (singleBoxWidth + boxGap);
    drawRoundedRect(ctx, bx, cursorY, singleBoxWidth, 84, 10);
    ctx.fillStyle = st.bg;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = st.border;
    ctx.stroke();

    ctx.fillStyle = st.text;
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(st.label, bx + 16, cursorY + 28);

    ctx.font = '700 28px "JetBrains Mono", monospace';
    ctx.fillText(String(st.value), bx + 16, cursorY + 64);
  });

  cursorY += 108;

  // Section 1: Daftar Kehadiran / Berhalangan
  ctx.fillStyle = '#0F172A';
  ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    options.showAllPresentNames
      ? 'Rincian Status Kehadiran Personel'
      : 'Daftar Pengajar / Karyawan Berhalangan (Izin / Sakit / Alpa)',
    44,
    cursorY + 16
  );

  cursorY += 28;

  if (displayedStaffRows.length === 0) {
    drawRoundedRect(ctx, 44, cursorY, width - 88, 44, 8);
    ctx.fillStyle = '#F8FAFC';
    ctx.fill();
    ctx.strokeStyle = '#E2E8F0';
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      totalRecorded === 0
        ? 'Belum ada data kehadiran yang diinput pada sesi ini.'
        : 'Alhamdulillah, seluruh pengajar dan karyawan hadir lengkap (Nihil Izin/Sakit/Alpa).',
      60,
      cursorY + 27
    );
    cursorY += 60;
  } else {
    // Table Header
    drawRoundedRect(ctx, 44, cursorY, width - 88, 32, 6);
    ctx.fillStyle = '#F1F5F9';
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('NO', 56, cursorY + 20);
    ctx.fillText('NAMA PERSONEL', 92, cursorY + 20);
    ctx.fillText('KELAS / JABATAN', 340, cursorY + 20);
    ctx.fillText('STATUS', 560, cursorY + 20);
    ctx.fillText('KETERANGAN', 635, cursorY + 20);

    cursorY += 36;

    displayedStaffRows.forEach((row, idx) => {
      if (idx % 2 === 1) {
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(44, cursorY - 4, width - 88, staffRowHeight);
      }

      ctx.fillStyle = '#64748B';
      ctx.font = '500 12px "JetBrains Mono", monospace';
      ctx.fillText(String(idx + 1).padStart(2, '0'), 56, cursorY + 20);

      ctx.fillStyle = '#0F172A';
      ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(truncateText(ctx, row.staff.name, 235), 92, cursorY + 20);

      ctx.fillStyle = '#475569';
      ctx.font = '400 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        truncateText(ctx, `${row.staff.unitOrKelas} · ${row.staff.roleOrKitab}`, 205),
        340,
        cursorY + 20
      );

      // Status text label
      const statusMap = {
        H: { label: 'HADIR', color: '#15803D' },
        I: { label: 'IZIN', color: '#1D4ED8' },
        S: { label: 'SAKIT', color: '#B45309' },
        A: { label: 'ALPA', color: '#B91C1C' },
      };
      const stInfo = statusMap[row.status];
      ctx.fillStyle = stInfo.color;
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.fillText(stInfo.label, 560, cursorY + 20);

      ctx.fillStyle = '#475569';
      ctx.font = '400 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(truncateText(ctx, row.note || '—', 150), 635, cursorY + 20);

      // Hairline divider
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(44, cursorY + staffRowHeight - 4);
      ctx.lineTo(width - 44, cursorY + staffRowHeight - 4);
      ctx.stroke();

      cursorY += staffRowHeight;
    });

    cursorY += 14;
  }

  // Section 2: Catatan & Penugasan Pengajar Badal Harian
  if (options.includeBadalNotes) {
    ctx.fillStyle = '#0F172A';
    ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Petugas Badal & Keterangan KBM Harian (${badalNotes.length} Sesi)`, 44, cursorY + 18);
    cursorY += 30;

    if (badalNotes.length === 0) {
      drawRoundedRect(ctx, 44, cursorY, width - 88, 42, 8);
      ctx.fillStyle = '#F8FAFC';
      ctx.fill();
      ctx.strokeStyle = '#E2E8F0';
      ctx.stroke();

      ctx.fillStyle = '#64748B';
      ctx.font = '400 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Tidak ada penugasan pengajar badal pada sesi ini.', 60, cursorY + 26);
      cursorY += 56;
    } else {
      badalNotes.forEach((b, idx) => {
        drawRoundedRect(ctx, 44, cursorY, width - 88, 46, 8);
        ctx.fillStyle = '#F5F3FF';
        ctx.fill();
        ctx.strokeStyle = '#DDD6FE';
        ctx.stroke();

        const ses = db.sessions.find((s) => s.id === b.sessionId);
        const sesCode = ses ? ses.code : 'KBM';

        ctx.fillStyle = '#4338CA';
        ctx.font = '700 12px "JetBrains Mono", monospace';
        ctx.fillText(`${idx + 1}. [${sesCode}]`, 58, cursorY + 20);

        ctx.fillStyle = '#0F172A';
        ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(truncateText(ctx, b.badalName, 240), 132, cursorY + 20);

        ctx.fillStyle = '#475569';
        ctx.font = '500 12px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(truncateText(ctx, b.kelasOrKitab, 380), 380, cursorY + 20);

        ctx.fillStyle = '#334155';
        ctx.font = '400 12px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(
          truncateText(ctx, `Keterangan: ${b.keterangan || '-'}`, width - 120),
          58,
          cursorY + 38
        );

        cursorY += badalRowHeight;
      });
      cursorY += 8;
    }
  }

  // Optional Admin Custom Note
  if (options.customCatatanAdmin.trim()) {
    drawRoundedRect(ctx, 44, cursorY, width - 88, 56, 8);
    ctx.fillStyle = '#FFFBEB';
    ctx.fill();
    ctx.strokeStyle = '#FDE68A';
    ctx.stroke();

    ctx.fillStyle = '#92400E';
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('CATATAN ADMINISTRASI MADRASAH:', 58, cursorY + 22);

    ctx.fillStyle = '#78350F';
    ctx.font = '400 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(truncateText(ctx, options.customCatatanAdmin.trim(), width - 120), 58, cursorY + 42);

    cursorY += 72;
  }

  // Footer
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(44, totalHeight - 68);
  ctx.lineTo(width - 44, totalHeight - 68);
  ctx.stroke();

  ctx.fillStyle = '#64748B';
  ctx.font = '400 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    `Dicetak otomatis oleh Sistem Rekap Kehadiran · ${new Date().toLocaleString('id-ID')}`,
    44,
    totalHeight - 40
  );

  ctx.textAlign = 'right';
  ctx.fillStyle = '#0F172A';
  ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    `Diolah oleh: ${syncConfig.adminName || 'Staf Administrasi'}`,
    width - 44,
    totalHeight - 40
  );
  ctx.textAlign = 'left';
}

export function renderMonthlyWhatsAppCard(
  canvas: HTMLCanvasElement,
  db: AppDatabase,
  syncConfig: SyncConfig,
  options: MonthlyCardOptions
): void {
  const scale = 2;
  const width = 880;

  const filteredStaff = db.staff.filter((s) => {
    if (!s.active) return false;
    if (options.categoryFilter !== 'ALL' && s.category !== options.categoryFilter) return false;
    return true;
  });

  const monthAttendance = db.attendance.filter((a) => {
    if (!a.date.startsWith(options.yearMonth)) return false;
    if (options.sessionIdFilter !== 'ALL' && a.sessionId !== options.sessionIdFilter) return false;
    return true;
  });

  const monthBadal = db.badalEntries.filter((b) => {
    if (!b.date.startsWith(options.yearMonth)) return false;
    if (options.sessionIdFilter !== 'ALL' && b.sessionId !== options.sessionIdFilter) return false;
    return b.countInMonthlyRecap;
  });

  const recapRows = filteredStaff.map((staff) => {
    const records = monthAttendance.filter((a) => a.staffId === staff.id);
    const h = records.filter((r) => r.status === 'H').length;
    const i = records.filter((r) => r.status === 'I').length;
    const s = records.filter((r) => r.status === 'S').length;
    const a = records.filter((r) => r.status === 'A').length;
    const total = h + i + s + a;
    const badalCount = monthBadal.filter(
      (b) => b.badalStaffId === staff.id || b.badalName.toLowerCase() === staff.name.toLowerCase()
    ).length;
    const pct = total > 0 ? Math.round((h / total) * 100) : staff.category === 'BADAL' && badalCount > 0 ? 100 : 0;

    return {
      staff,
      h,
      i,
      s,
      a,
      total,
      badalCount,
      pct,
    };
  });

  const rowHeight = 38;
  const headerHeight = 160;
  const summaryHeight = 104;
  const tableHeaderHeight = 40;
  const tableBodyHeight = Math.max(1, recapRows.length) * rowHeight + 24;
  const adminNoteHeight = options.customCatatanAdmin.trim() ? 70 : 0;
  const footerHeight = 76;

  const totalHeight =
    headerHeight + summaryHeight + tableHeaderHeight + tableBodyHeight + adminNoteHeight + footerHeight + 52;

  canvas.width = width * scale;
  canvas.height = totalHeight * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(scale, scale);

  // Canvas Background
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, width, totalHeight);

  // Card Container
  drawRoundedRect(ctx, 16, 16, width - 32, totalHeight - 32, 16);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#CBD5E1';
  ctx.stroke();

  // Header Banner
  ctx.save();
  drawRoundedRect(ctx, 16, 16, width - 32, headerHeight, 16);
  ctx.clip();
  const grad = ctx.createLinearGradient(16, 16, width - 16, headerHeight);
  grad.addColorStop(0, '#064E3B');
  grad.addColorStop(1, '#047857');
  ctx.fillStyle = grad;
  ctx.fillRect(16, 16, width - 32, headerHeight);
  ctx.restore();

  ctx.fillStyle = '#A7F3D0';
  ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('LAPORAN REKAPITULASI KEHADIRAN BULANAN', 44, 52);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 23px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('MADRASAH DINIYAH DARUL LUGHAH WAL KAROMAH', 44, 84);

  ctx.fillStyle = '#D1FAE5';
  ctx.font = '400 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    truncateText(ctx, syncConfig.institutionSubtitle || 'Pondok Pesantren Darul Lughah Wal Karomah', width - 88),
    44,
    110
  );

  // Period Strip
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  drawRoundedRect(ctx, 44, 124, width - 88, 34, 8);
  ctx.fill();

  const catTitle =
    options.categoryFilter === 'ALL'
      ? 'Semua Kategori (Pengajar, Karyawan & Badal)'
      : `Kategori: ${options.categoryFilter}`;

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Periode: ${formatIndonesianMonth(options.yearMonth)}`, 58, 146);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#ECFDF5';
  ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(catTitle, width - 58, 146);
  ctx.textAlign = 'left';

  let cursorY = 16 + headerHeight + 22;

  // Aggregate metrics
  const sumH = recapRows.reduce((acc, r) => acc + r.h, 0);
  const sumI = recapRows.reduce((acc, r) => acc + r.i, 0);
  const sumS = recapRows.reduce((acc, r) => acc + r.s, 0);
  const sumA = recapRows.reduce((acc, r) => acc + r.a, 0);
  const sumBadal = monthBadal.length;

  const summaryBoxes = [
    { label: 'TOTAL HADIR', value: sumH, color: '#15803D', bg: '#F0FDF4' },
    { label: 'TOTAL IZIN', value: sumI, color: '#1D4ED8', bg: '#EFF6FF' },
    { label: 'TOTAL SAKIT', value: sumS, color: '#B45309', bg: '#FFFBEB' },
    { label: 'TOTAL ALPA', value: sumA, color: '#B91C1C', bg: '#FEF2F2' },
    { label: 'SESI BADAL', value: sumBadal, color: '#4338CA', bg: '#F5F3FF' },
  ];

  const gap = 12;
  const boxW = (width - 88 - gap * 4) / 5;
  summaryBoxes.forEach((b, idx) => {
    const bx = 44 + idx * (boxW + gap);
    drawRoundedRect(ctx, bx, cursorY, boxW, 74, 8);
    ctx.fillStyle = b.bg;
    ctx.fill();
    ctx.strokeStyle = '#E2E8F0';
    ctx.stroke();

    ctx.fillStyle = b.color;
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(b.label, bx + 14, cursorY + 25);

    ctx.font = '700 24px "JetBrains Mono", monospace';
    ctx.fillText(String(b.value), bx + 14, cursorY + 56);
  });

  cursorY += 96;

  // Table Header
  drawRoundedRect(ctx, 44, cursorY, width - 88, 34, 6);
  ctx.fillStyle = '#0F172A';
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('NO', 56, cursorY + 21);
  ctx.fillText('NAMA PERSONEL', 90, cursorY + 21);
  ctx.fillText('KATEGORI / UNIT', 330, cursorY + 21);
  ctx.textAlign = 'right';
  ctx.fillText('HADIR', 560, cursorY + 21);
  ctx.fillText('IZIN', 615, cursorY + 21);
  ctx.fillText('SAKIT', 670, cursorY + 21);
  ctx.fillText('ALPA', 725, cursorY + 21);
  ctx.fillText('BADAL', 780, cursorY + 21);
  ctx.fillText('%', 825, cursorY + 21);
  ctx.textAlign = 'left';

  cursorY += 38;

  recapRows.forEach((row, idx) => {
    if (idx % 2 === 1) {
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(44, cursorY - 4, width - 88, rowHeight);
    }

    ctx.fillStyle = '#64748B';
    ctx.font = '500 12px "JetBrains Mono", monospace';
    ctx.fillText(String(idx + 1).padStart(2, '0'), 56, cursorY + 20);

    ctx.fillStyle = '#0F172A';
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(truncateText(ctx, row.staff.name, 230), 90, cursorY + 20);

    ctx.fillStyle = '#475569';
    ctx.font = '400 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      truncateText(ctx, `${row.staff.category} · ${row.staff.unitOrKelas}`, 175),
      330,
      cursorY + 20
    );

    ctx.textAlign = 'right';
    ctx.font = '600 13px "JetBrains Mono", monospace';

    ctx.fillStyle = '#15803D';
    ctx.fillText(String(row.h), 560, cursorY + 20);

    ctx.fillStyle = '#1D4ED8';
    ctx.fillText(String(row.i), 615, cursorY + 20);

    ctx.fillStyle = '#B45309';
    ctx.fillText(String(row.s), 670, cursorY + 20);

    ctx.fillStyle = '#B91C1C';
    ctx.fillText(String(row.a), 725, cursorY + 20);

    ctx.fillStyle = '#4338CA';
    ctx.fillText(String(row.badalCount), 780, cursorY + 20);

    ctx.fillStyle = '#0F172A';
    ctx.fillText(`${row.pct}%`, 825, cursorY + 20);
    ctx.textAlign = 'left';

    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(44, cursorY + rowHeight - 4);
    ctx.lineTo(width - 44, cursorY + rowHeight - 4);
    ctx.stroke();

    cursorY += rowHeight;
  });

  cursorY += 16;

  if (options.customCatatanAdmin.trim()) {
    drawRoundedRect(ctx, 44, cursorY, width - 88, 54, 8);
    ctx.fillStyle = '#FFFBEB';
    ctx.fill();
    ctx.strokeStyle = '#FDE68A';
    ctx.stroke();

    ctx.fillStyle = '#92400E';
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('CATATAN REKAP BULANAN:', 58, cursorY + 20);

    ctx.fillStyle = '#78350F';
    ctx.font = '400 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(truncateText(ctx, options.customCatatanAdmin.trim(), width - 120), 58, cursorY + 40);

    cursorY += 68;
  }

  // Footer
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(44, totalHeight - 68);
  ctx.lineTo(width - 44, totalHeight - 68);
  ctx.stroke();

  ctx.fillStyle = '#64748B';
  ctx.font = '400 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    `Rekap Bulanan SIM-Absensi MD Darul Lughah Wal Karomah · Dicetak ${new Date().toLocaleDateString('id-ID')}`,
    44,
    totalHeight - 40
  );

  ctx.textAlign = 'right';
  ctx.fillStyle = '#0F172A';
  ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    `Staf Administrasi: ${syncConfig.adminName || 'Admin Madin'}`,
    width - 44,
    totalHeight - 40
  );
  ctx.textAlign = 'left';
}

export function downloadCanvasAsJpg(canvas: HTMLCanvasElement, filename: string): void {
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const link = document.createElement('a');
  link.download = filename.endsWith('.jpg') ? filename : `${filename}.jpg`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
