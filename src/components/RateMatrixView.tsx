import React, { useState, useMemo, useCallback } from 'react';
import { 
  DollarSign, 
  ShieldAlert, 
  Check, 
  RefreshCw, 
  Sliders, 
  Calendar, 
  Zap, 
  AlertTriangle,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  Lock,
  Unlock,
  Info,
  Clock,
  Globe,
  Share2,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Play
} from 'lucide-react';
import { 
  RoomType, 
  Room, 
  Reservation, 
  ChannelConnection, 
  ChannelType, 
  SyncLogEvent,
  BulkOtaUpdatePayload 
} from '../types';
import { BulkOtaToolModal } from './BulkOtaToolModal';

interface RateMatrixViewProps {
  roomTypes: RoomType[];
  rooms?: Room[];
  reservations?: Reservation[];
  channels?: ChannelConnection[];
  onTriggerSync: () => void;
  onAddSyncLog?: (log: SyncLogEvent) => void;
  onUpdateMarkup?: (channelIdentifier: string, newMarkup: number) => void;
  isSyncing: boolean;
}

interface LastBulkSummary {
  timestamp: string;
  channelDesc: string;
  roomTypesCount: number;
  startDate: string;
  endDate: string;
  slotsUpdated: number;
  allotmentDesc: string;
  rateDesc: string;
}

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const ALL_OTA_CHANNELS: ChannelType[] = ['Booking.com', 'Agoda', 'Expedia', 'Airbnb', 'Direct'];

export const RateMatrixView: React.FC<RateMatrixViewProps> = ({
  roomTypes,
  rooms = [],
  reservations = [],
  channels = [],
  onTriggerSync,
  onAddSyncLog,
  onUpdateMarkup,
  isSyncing,
}) => {
  // Days count and offset pagination
  const [daysOffset, setDaysOffset] = useState<number>(0);
  const daysCount = 10;

  // Selected Channel filter: 'ALL' or specific ChannelType
  const [selectedChannel, setSelectedChannel] = useState<ChannelType | 'ALL'>('ALL');

  // Key format: `${channel}__${rtId}__${dateStr}`
  const [allotmentMap, setAllotmentMap] = useState<Record<string, number>>({});
  const [ratesMap, setRatesMap] = useState<Record<string, number>>({});
  const [stopSellMap, setStopSellMap] = useState<Record<string, boolean>>({});
  const [minStayMap, setMinStayMap] = useState<Record<string, number>>({});

  // Bulk Modal state & Live Execution status
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'warn' } | null>(null);
  const [lastBulkSummary, setLastBulkSummary] = useState<LastBulkSummary | null>(null);

  // Generate Date Columns
  const dateColumns = useMemo(() => {
    const list = [];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    for (let i = 0; i < daysCount; i++) {
      const d = new Date();
      d.setDate(d.getDate() + daysOffset + i);
      const dateStr = formatLocalDate(d);
      list.push({
        dateStr,
        dayName: dayNames[d.getDay()],
        dayNum: d.getDate(),
        monthNum: d.getMonth() + 1,
        dayOfWeek: d.getDay(),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        isToday: daysOffset === 0 && i === 0,
      });
    }
    return list;
  }, [daysOffset, daysCount]);

  // Helper key generators
  const getKey = (ch: ChannelType | 'ALL', rtId: string, dateStr: string) => `${ch}__${rtId}__${dateStr}`;

  // Calculate actual physical availability from rooms and active reservations
  const getPhysicalAvailableRooms = useCallback((rtId: string, dateStr: string): number => {
    const matchingRooms = rooms.filter(
      (r) => r.roomTypeId === rtId && r.status !== 'maintenance'
    );
    const totalPhysical = matchingRooms.length > 0 ? matchingRooms.length : (roomTypes.find((t) => t.id === rtId)?.totalRooms || 3);

    const bookedCount = reservations.filter((res) => {
      if (res.status === 'cancelled') return false;
      if (res.roomTypeId !== rtId) return false;
      return res.checkIn <= dateStr && dateStr < res.checkOut;
    }).length;

    return Math.max(0, totalPhysical - bookedCount);
  }, [rooms, reservations, roomTypes]);

  // Channel markup helper
  const getChannelMarkupPercent = useCallback((ch: ChannelType | 'ALL'): number => {
    if (ch === 'ALL') return 0;
    const conn = channels.find((c) => c.name === ch);
    if (conn) return conn.markupPercent;
    if (ch === 'Booking.com') return 15;
    if (ch === 'Agoda') return 18;
    if (ch === 'Expedia') return 15;
    if (ch === 'Airbnb') return 10;
    if (ch === 'Direct') return -10;
    return 0;
  }, [channels]);

  // Get current Rate
  const getRate = useCallback((rt: RoomType, dateStr: string, isWeekend: boolean, ch: ChannelType | 'ALL'): number => {
    const key = getKey(ch, rt.id, dateStr);
    if (ratesMap[key] !== undefined) return ratesMap[key];

    // Master ALL fallback
    const masterKey = getKey('ALL', rt.id, dateStr);
    const baseVal = ratesMap[masterKey] !== undefined 
      ? ratesMap[masterKey] 
      : (isWeekend ? Math.round(rt.basePrice * 1.1) : rt.basePrice);

    if (ch === 'ALL') {
      return baseVal;
    }

    // Apply channel markup on baseVal
    const markup = getChannelMarkupPercent(ch);
    return Math.round(baseVal * (1 + markup / 100));
  }, [ratesMap, getChannelMarkupPercent]);

  // Get current Allotment (Số lượng phòng mở bán)
  const getAllotment = useCallback((rt: RoomType, dateStr: string, ch: ChannelType | 'ALL'): number => {
    const key = getKey(ch, rt.id, dateStr);
    if (allotmentMap[key] !== undefined) return allotmentMap[key];

    // Check Master ALL
    const masterKey = getKey('ALL', rt.id, dateStr);
    if (allotmentMap[masterKey] !== undefined) return allotmentMap[masterKey];

    // Default: maximum available physical rooms
    return getPhysicalAvailableRooms(rt.id, dateStr);
  }, [allotmentMap, getPhysicalAvailableRooms]);

  // Stop Sell check
  const isStopSell = useCallback((rtId: string, dateStr: string, ch: ChannelType | 'ALL'): boolean => {
    const key = getKey(ch, rtId, dateStr);
    if (stopSellMap[key] !== undefined) return stopSellMap[key];
    const masterKey = getKey('ALL', rtId, dateStr);
    return !!stopSellMap[masterKey];
  }, [stopSellMap]);

  // Min stay check
  const getMinStay = useCallback((rtId: string, dateStr: string, ch: ChannelType | 'ALL'): number => {
    const key = getKey(ch, rtId, dateStr);
    if (minStayMap[key] !== undefined) return minStayMap[key];
    const masterKey = getKey('ALL', rtId, dateStr);
    return minStayMap[masterKey] || 1;
  }, [minStayMap]);

  // Updates
  const handleAllotmentChange = (rtId: string, dateStr: string, newAllotment: number) => {
    const key = getKey(selectedChannel, rtId, dateStr);
    setAllotmentMap((prev) => ({ ...prev, [key]: Math.max(0, newAllotment) }));
  };

  const handleRateChange = (rtId: string, dateStr: string, newRate: number) => {
    const key = getKey(selectedChannel, rtId, dateStr);
    setRatesMap((prev) => ({ ...prev, [key]: Math.max(0, newRate) }));
  };

  const toggleStopSell = (rtId: string, dateStr: string) => {
    const key = getKey(selectedChannel, rtId, dateStr);
    const current = isStopSell(rtId, dateStr, selectedChannel);
    setStopSellMap((prev) => ({ ...prev, [key]: !current }));
  };

  const handleMinStayChange = (rtId: string, dateStr: string, newStay: number) => {
    const key = getKey(selectedChannel, rtId, dateStr);
    setMinStayMap((prev) => ({ ...prev, [key]: newStay }));
  };

  // Quick Action: Reset Allotments to match real-time physical availability
  const handleResetToPhysical = () => {
    const newAllotments: Record<string, number> = { ...allotmentMap };
    roomTypes.forEach((rt) => {
      dateColumns.forEach((col) => {
        const key = getKey(selectedChannel, rt.id, col.dateStr);
        newAllotments[key] = getPhysicalAvailableRooms(rt.id, col.dateStr);
      });
    });
    setAllotmentMap(newAllotments);
    showNotice('Đã đồng bộ số lượng mở bán bằng 100% tồn kho thực tế của PMS.', 'success');
    onTriggerSync();
  };

  // Quick Action: Quick stop sell on weekends
  const handleQuickWeekendStopSell = () => {
    const newStopSell: Record<string, boolean> = { ...stopSellMap };
    roomTypes.forEach((rt) => {
      dateColumns.forEach((col) => {
        if (col.isWeekend) {
          const key = getKey(selectedChannel, rt.id, col.dateStr);
          newStopSell[key] = true;
        }
      });
    });
    setStopSellMap(newStopSell);
    showNotice('Đã bật Stop Sell (khóa bán) cho các ngày cuối tuần (T7 & CN).', 'warn');
    onTriggerSync();
  };

  // Bulk Apply Handler from BulkOtaToolModal
  const handleApplyBulk = (payload: BulkOtaUpdatePayload) => {
    const newRates = { ...ratesMap };
    const newAllotments = { ...allotmentMap };
    const newStopSell = { ...stopSellMap };
    const newMinStay = { ...minStayMap };

    // Parse date range in local time to avoid timezone drift
    const [sYear, sMonth, sDay] = payload.startDate.split('-').map(Number);
    const [eYear, eMonth, eDay] = payload.endDate.split('-').map(Number);
    const current = new Date(sYear, sMonth - 1, sDay, 12, 0, 0);
    const end = new Date(eYear, eMonth - 1, eDay, 12, 0, 0);

    let updatedSlotsCount = 0;

    // Target channels list: If 'ALL', update both 'ALL' and each specific channel
    const targetChannels: (ChannelType | 'ALL')[] = payload.channels.includes('ALL')
      ? ['ALL', ...ALL_OTA_CHANNELS]
      : payload.channels;

    // Update global channel markup in App.tsx / Channel Manager if rateMode is percentage_adjust
    if (payload.rateMode === 'percentage_adjust' && payload.rateAdjustmentPercent !== undefined && onUpdateMarkup) {
      if (payload.channels.includes('ALL')) {
        ALL_OTA_CHANNELS.forEach((chName) => {
          onUpdateMarkup(chName, payload.rateAdjustmentPercent!);
        });
      } else {
        payload.channels.forEach((chName) => {
          onUpdateMarkup(chName, payload.rateAdjustmentPercent!);
        });
      }
    }

    // Auto-focus selected channel tab so user immediately sees their targeted channel updates
    if (payload.channels.length === 1 && payload.channels[0] !== 'ALL') {
      setSelectedChannel(payload.channels[0]);
    }

    while (current <= end) {
      const dateStr = formatLocalDate(current);
      const dayOfWeek = current.getDay();

      if (payload.daysOfWeek.includes(dayOfWeek)) {
        targetChannels.forEach((ch) => {
          payload.roomTypeIds.forEach((rtId) => {
            const rt = roomTypes.find((t) => t.id === rtId);
            if (!rt) return;

            const key = getKey(ch, rtId, dateStr);
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            // 1. Allotment
            if (payload.allotmentMode === 'max_available') {
              newAllotments[key] = getPhysicalAvailableRooms(rtId, dateStr);
            } else if (payload.allotmentMode === 'fixed' && payload.allotment !== undefined) {
              newAllotments[key] = payload.allotment;
            }

            // 2. Rates
            if (payload.rateMode === 'fixed' && payload.fixedRate !== undefined) {
              newRates[key] = payload.fixedRate;
            } else if (payload.rateMode === 'percentage_adjust' && payload.rateAdjustmentPercent !== undefined) {
              // The rateAdjustmentPercent represents the channel's price markup relative to the PMS base price
              const targetMarkup = payload.rateAdjustmentPercent;
              const rateWithMarkup = Math.round(rt.basePrice * (1 + targetMarkup / 100));
              newRates[key] = isWeekend ? Math.round(rateWithMarkup * 1.1) : rateWithMarkup;
            }

            // 3. Stop Sell
            if (payload.stopSell !== undefined) {
              newStopSell[key] = payload.stopSell;
            }

            // 4. Min Stay
            if (payload.minStay !== undefined) {
              newMinStay[key] = payload.minStay;
            }

            updatedSlotsCount++;
          });
        });
      }

      current.setDate(current.getDate() + 1);
    }

    setRatesMap(newRates);
    setAllotmentMap(newAllotments);
    setStopSellMap(newStopSell);
    setMinStayMap(newMinStay);

    setShowBulkModal(false);

    const channelNames = payload.channels.includes('ALL') 
      ? 'Toàn bộ 5 kênh OTA (Master Pool)' 
      : payload.channels.join(', ');

    const allotmentText = payload.allotmentMode === 'max_available' 
      ? 'Tối đa theo PMS' 
      : payload.allotmentMode === 'fixed' 
      ? `Cố định ${payload.allotment} phòng/ngày` 
      : 'Không đổi';

    const rateText = payload.rateMode === 'percentage_adjust'
      ? `Tăng ${payload.rateAdjustmentPercent}%`
      : payload.rateMode === 'fixed'
      ? `Cố định ${payload.fixedRate?.toLocaleString('vi-VN')} đ`
      : 'Không đổi';

    setLastBulkSummary({
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour12: false }),
      channelDesc: channelNames,
      roomTypesCount: payload.roomTypeIds.length,
      startDate: payload.startDate,
      endDate: payload.endDate,
      slotsUpdated: updatedSlotsCount,
      allotmentDesc: allotmentText,
      rateDesc: rateText,
    });

    showNotice(
      `Đã áp dụng thành công thiết lập hàng loạt cho ${updatedSlotsCount} lượt ô dữ liệu (${channelNames}). Đang đồng bộ tự động lên OTA!`,
      'success'
    );

    // Call sync
    onTriggerSync();

    // Add log
    if (onAddSyncLog) {
      onAddSyncLog({
        id: `bulk-sync-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour12: false }),
        channel: payload.channels[0] === 'ALL' ? 'Booking.com' : (payload.channels[0] as ChannelType),
        eventType: 'rate_update',
        status: 'success',
        details: `[Bulk OTA Updater] Đã thiết lập hàng loạt ${updatedSlotsCount} chỉ số: Allotment (${allotmentText}), Giá (${rateText}) từ ${payload.startDate} đến ${payload.endDate} cho ${channelNames}.`,
      });
    }
  };

  // 1-Click Interactive Test Runner: Directly tests the bulk update feature with realistic sample data
  const handleRun1ClickTest = () => {
    const today = new Date();
    const tenDaysLater = new Date();
    tenDaysLater.setDate(tenDaysLater.getDate() + 10);

    const testPayload: BulkOtaUpdatePayload = {
      channels: ['ALL'],
      roomTypeIds: roomTypes.map((rt) => rt.id),
      startDate: formatLocalDate(today),
      endDate: formatLocalDate(tenDaysLater),
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      allotmentMode: 'fixed',
      allotment: 2,
      rateMode: 'percentage_adjust',
      rateAdjustmentPercent: 20,
      stopSell: false,
      minStay: 2,
    };

    handleApplyBulk(testPayload);
  };

  const showNotice = (text: string, type: 'success' | 'warn' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 6000);
  };

  // Dynamic Channels list with live markup badges
  const channelTabs = useMemo(() => {
    return [
      { id: 'ALL' as const, label: 'Tất cả kênh (Master Pool)', badge: 'Đồng bộ chung', color: 'bg-indigo-600' },
      { 
        id: 'Booking.com' as const, 
        label: 'Booking.com', 
        badge: `${getChannelMarkupPercent('Booking.com') >= 0 ? '+' : ''}${getChannelMarkupPercent('Booking.com')}%`, 
        color: 'bg-blue-700' 
      },
      { 
        id: 'Agoda' as const, 
        label: 'Agoda', 
        badge: `${getChannelMarkupPercent('Agoda') >= 0 ? '+' : ''}${getChannelMarkupPercent('Agoda')}%`, 
        color: 'bg-sky-600' 
      },
      { 
        id: 'Expedia' as const, 
        label: 'Expedia', 
        badge: `${getChannelMarkupPercent('Expedia') >= 0 ? '+' : ''}${getChannelMarkupPercent('Expedia')}%`, 
        color: 'bg-amber-600' 
      },
      { 
        id: 'Airbnb' as const, 
        label: 'Airbnb', 
        badge: `${getChannelMarkupPercent('Airbnb') >= 0 ? '+' : ''}${getChannelMarkupPercent('Airbnb')}%`, 
        color: 'bg-rose-600' 
      },
      { 
        id: 'Direct' as const, 
        label: 'Direct Booking Engine', 
        badge: `${getChannelMarkupPercent('Direct') >= 0 ? '+' : ''}${getChannelMarkupPercent('Direct')}%`, 
        color: 'bg-emerald-600' 
      },
    ];
  }, [getChannelMarkupPercent]);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Hero Title */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                OTA Allotment & Dynamic Pricing
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Overbooking Shield Bật
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Thiết lập Số lượng phòng (Allotment) & Giá bán trên các kênh OTA
            </h1>
            <p className="text-xs text-slate-500 max-w-3xl leading-relaxed mt-1">
              Quản lý số lượng phòng mở bán, biểu giá theo từng kênh phân phối (Booking.com, Agoda, Expedia, Direct), khóa phòng (Stop Sell) và số đêm tối thiểu (Min Stay). Hệ thống tự động so khớp với tồn kho thực tế của PMS để ngăn ngừa overbooking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* 1-Click Interactive Test Button */}
            <button
              onClick={handleRun1ClickTest}
              className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
              title="Chạy thử nghiệm thiết lập hàng loạt: Gán 2 phòng, tăng 20% giá, min stay 2 đêm cho 10 ngày tới trên tất cả kênh"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>Chạy Test Hàng loạt (1-Click)</span>
            </button>

            {/* Bulk tool trigger modal */}
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-indigo-200" />
              <span>Thiết lập Hàng loạt (Bulk Updater)</span>
            </button>

            {/* Direct sync button */}
            <button
              onClick={onTriggerSync}
              disabled={isSyncing}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{isSyncing ? 'Đang đẩy OTA...' : 'Đẩy toàn bộ lên OTA'}</span>
            </button>
          </div>
        </div>

        {/* Feedback message banner if triggered */}
        {feedbackMsg && (
          <div className={`mt-4 p-3 rounded-xl border flex items-center justify-between text-xs font-bold animate-in fade-in duration-200 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Last Bulk Update Execution Summary Card */}
        {lastBulkSummary && (
          <div className="mt-4 p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-indigo-950 flex items-center gap-2">
                  <span>HIỆU LỰC THIẾT LẬP HÀNG LOẠT VỪA CẬP NHẬT</span>
                  <span className="text-[10px] bg-indigo-200/70 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                    Lúc {lastBulkSummary.timestamp}
                  </span>
                </div>
                <div className="text-slate-600 text-[11px] mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span><strong>Kênh:</strong> {lastBulkSummary.channelDesc}</span>
                  <span>•</span>
                  <span><strong>Giai đoạn:</strong> {lastBulkSummary.startDate} → {lastBulkSummary.endDate}</span>
                  <span>•</span>
                  <span><strong>Tồn kho (Allotment):</strong> {lastBulkSummary.allotmentDesc}</span>
                  <span>•</span>
                  <span><strong>Giá bán:</strong> {lastBulkSummary.rateDesc}</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold">✓ {lastBulkSummary.slotsUpdated} lượt ô đã cập nhật</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Đã gửi API Webhook
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Channel Selector Tabs Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
            <Share2 className="w-4 h-4 text-indigo-600" />
            <span>Chọn Kênh phân phối để cấu hình giá & số lượng:</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {selectedChannel === 'ALL' 
              ? 'Chế độ Master Pool: Hiển thị & áp dụng cho tất cả kênh liên kết'
              : `Đang cấu hình riêng cho: ${selectedChannel} (Markup: ${getChannelMarkupPercent(selectedChannel)}%)`}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {channelTabs.map((ch) => {
            const isSelected = selectedChannel === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => setSelectedChannel(ch.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? `${ch.color} text-white shadow-sm ring-2 ring-indigo-200`
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{ch.label}</span>
                {ch.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {ch.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selectedChannel !== 'ALL' && onUpdateMarkup && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-medium">Markup hiện tại của kênh {selectedChannel}:</span>
              <span className="font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                +{getChannelMarkupPercent(selectedChannel)}%
              </span>
              <span className="text-[11px] text-slate-400">
                (Tự động tính giá bán = Giá sàn PMS + {getChannelMarkupPercent(selectedChannel)}%)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px] font-medium">Đổi nhanh % Markup:</span>
              {[5, 10, 15, 18, 20, 25].map((pct) => (
                <button
                  key={pct}
                  onClick={() => {
                    onUpdateMarkup(selectedChannel, pct);
                    showNotice(`Đã đổi Markup của kênh ${selectedChannel} thành +${pct}% và đồng bộ lại toàn bộ ma trận giá!`);
                    onTriggerSync();
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                    getChannelMarkupPercent(selectedChannel) === pct
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  +{pct}%
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Date Navigation & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Date Pager */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDaysOffset((prev) => prev - 7)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
            title="Lùi 7 ngày"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setDaysOffset(0)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              daysOffset === 0
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Hôm nay
          </button>

          <button
            onClick={() => setDaysOffset((prev) => prev + 7)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
            title="Tới 7 ngày"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-xs text-slate-600 font-semibold ml-2">
            Hiển thị {daysCount} ngày: {dateColumns[0]?.dayNum}/{dateColumns[0]?.monthNum} - {dateColumns[daysCount - 1]?.dayNum}/{dateColumns[daysCount - 1]?.monthNum}
          </span>
        </div>

        {/* Quick Helper Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleResetToPhysical}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            title="Gán số lượng phòng mở bán bằng đúng số phòng trống thực tế của khách sạn"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mở bán 100% Tồn kho thực</span>
          </button>

          <button
            onClick={handleQuickWeekendStopSell}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            title="Khóa bán nhanh toàn bộ phòng vào các ngày cuối tuần"
          >
            <Lock className="w-3.5 h-3.5 text-rose-600" />
            <span>Khóa bán Cuối tuần</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="p-3 font-bold w-60 sticky left-0 bg-slate-100 z-20 shadow-xs">
                  Hạng phòng & Thiết lập
                </th>
                <th className="p-3 font-bold w-28 border-r border-slate-200">
                  Chỉ số điều khiển
                </th>
                {dateColumns.map((col) => (
                  <th
                    key={col.dateStr}
                    className={`p-2 text-center min-w-[90px] border-r border-slate-200 ${
                      col.isToday
                        ? 'bg-amber-100/70 text-amber-950 font-extrabold'
                        : col.isWeekend
                        ? 'bg-indigo-50/70 font-bold text-indigo-950'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[10px] text-slate-500 uppercase">{col.dayName}</span>
                      {col.isToday && (
                        <span className="text-[9px] bg-amber-600 text-white px-1 py-0.1 rounded font-bold">
                          Nay
                        </span>
                      )}
                    </div>
                    <div className="font-black text-xs">{col.dayNum}/{col.monthNum}</div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y-2 divide-slate-200">
              {roomTypes.map((rt) => (
                <React.Fragment key={rt.id}>
                  {/* Row 1: Allotment (Số lượng phòng mở bán) */}
                  <tr className="hover:bg-slate-50/60 bg-white">
                    <td rowSpan={4} className="p-3.5 font-bold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-200 align-top shadow-xs">
                      <div className="text-sm font-black text-slate-900">{rt.name}</div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                        Tổng quy mô: <strong>{rt.totalRooms} phòng</strong>
                      </div>
                      <div className="text-[11px] text-indigo-700 font-semibold mt-0.5">
                        Giá sàn PMS: {rt.basePrice.toLocaleString('vi-VN')} đ
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-[10px] text-slate-400">
                        <Info className="w-3 h-3" />
                        <span>Kênh: {selectedChannel}</span>
                      </div>
                    </td>

                    <td className="p-2.5 font-bold text-indigo-950 bg-indigo-50/30 border-r border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-extrabold text-xs">Số phòng mở bán</div>
                        <div className="text-[10px] text-slate-500 font-normal">(Allotment)</div>
                      </div>
                    </td>

                    {dateColumns.map((col) => {
                      const allotment = getAllotment(rt, col.dateStr, selectedChannel);
                      const physicalAvail = getPhysicalAvailableRooms(rt.id, col.dateStr);
                      const isOverbookingRisk = allotment > physicalAvail;

                      return (
                        <td 
                          key={col.dateStr} 
                          className={`p-1.5 text-center border-r border-slate-200 ${
                            isOverbookingRisk 
                              ? 'bg-rose-50/80 ring-1 ring-rose-400' 
                              : col.isWeekend 
                              ? 'bg-indigo-50/20' 
                              : ''
                          }`}
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <input
                              type="number"
                              min="0"
                              max={rt.totalRooms * 2}
                              value={allotment}
                              onChange={(e) => handleAllotmentChange(rt.id, col.dateStr, Number(e.target.value))}
                              className={`w-14 text-center rounded px-1 py-1 font-mono font-bold text-xs border focus:outline-none focus:ring-1 ${
                                isOverbookingRisk
                                  ? 'bg-rose-100 border-rose-400 text-rose-900 font-black'
                                  : 'bg-white border-slate-300 text-slate-800 focus:ring-indigo-500'
                              }`}
                              title={isOverbookingRisk ? 'Cảnh báo: Số lượng mở bán vượt quá số phòng thực tế!' : 'Số phòng mở bán'}
                            />
                            <div className="text-[9px] text-slate-500 flex items-center gap-0.5">
                              <span>thực tế:</span>
                              <span className={`font-bold ${physicalAvail === 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                                {physicalAvail}
                              </span>
                            </div>
                            {isOverbookingRisk && (
                              <span className="text-[9px] bg-rose-600 text-white font-extrabold px-1 rounded">
                                ! Over
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row 2: Rate per room (Giá bán k VND) */}
                  <tr className="hover:bg-slate-50/60 bg-white">
                    <td className="p-2.5 font-bold text-slate-800 border-r border-slate-200">
                      <div>
                        <div className="font-extrabold text-xs">Giá bán (k VND)</div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          {selectedChannel === 'ALL' ? 'Giá chuẩn' : `Giá ${selectedChannel}`}
                        </div>
                      </div>
                    </td>

                    {dateColumns.map((col) => {
                      const rate = getRate(rt, col.dateStr, col.isWeekend, selectedChannel);
                      const rateInK = Math.round(rate / 1000);

                      return (
                        <td key={col.dateStr} className={`p-1.5 text-center border-r border-slate-200 ${col.isWeekend ? 'bg-indigo-50/20' : ''}`}>
                          <input
                            type="number"
                            step="10"
                            value={rateInK}
                            onChange={(e) => handleRateChange(rt.id, col.dateStr, Number(e.target.value) * 1000)}
                            className="w-16 text-center bg-slate-50 border border-slate-300 rounded px-1 py-1 font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row 3: Min Stay */}
                  <tr className="hover:bg-slate-50/60 bg-white">
                    <td className="p-2 font-medium text-slate-600 border-r border-slate-200 text-[11px]">
                      <div>Số đêm tối thiểu</div>
                      <div className="text-[10px] text-slate-400 font-normal">(Min Stay)</div>
                    </td>

                    {dateColumns.map((col) => {
                      const stay = getMinStay(rt.id, col.dateStr, selectedChannel);

                      return (
                        <td key={col.dateStr} className={`p-1 text-center border-r border-slate-200 ${col.isWeekend ? 'bg-indigo-50/20' : ''}`}>
                          <select
                            value={stay}
                            onChange={(e) => handleMinStayChange(rt.id, col.dateStr, Number(e.target.value))}
                            className="text-[11px] bg-white border border-slate-300 rounded px-1 py-0.5 font-bold text-slate-700 cursor-pointer"
                          >
                            <option value={1}>1 đêm</option>
                            <option value={2}>2 đêm</option>
                            <option value={3}>3 đêm</option>
                          </select>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row 4: Stop Sell toggle */}
                  <tr className="bg-slate-50/30 border-b-2 border-slate-200">
                    <td className="p-2 font-semibold text-slate-600 border-r border-slate-200 text-[11px]">
                      <div>Stop Sell (Khóa)</div>
                      <div className="text-[10px] text-slate-400 font-normal">Khóa mở bán</div>
                    </td>

                    {dateColumns.map((col) => {
                      const stopped = isStopSell(rt.id, col.dateStr, selectedChannel);

                      return (
                        <td key={col.dateStr} className={`p-1.5 text-center border-r border-slate-200 ${col.isWeekend ? 'bg-indigo-50/20' : ''}`}>
                          <button
                            onClick={() => toggleStopSell(rt.id, col.dateStr)}
                            className={`w-full py-1 rounded text-[10px] font-extrabold transition cursor-pointer flex items-center justify-center gap-1 ${
                              stopped
                                ? 'bg-rose-600 text-white shadow-2xs hover:bg-rose-700'
                                : 'bg-slate-200/90 hover:bg-slate-300 text-slate-700'
                            }`}
                            title={stopped ? 'Phòng đang BỊ KHÓA BÁN trên OTA' : 'Phòng ĐANG MỞ BÁN trên OTA'}
                          >
                            {stopped ? (
                              <>
                                <Lock className="w-2.5 h-2.5" />
                                <span>KHÓA</span>
                              </>
                            ) : (
                              <>
                                <Unlock className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Mở</span>
                              </>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend / Table Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-indigo-50 border border-indigo-200 inline-block" />
              <span>Cuối tuần (T7 & CN)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-rose-100 border border-rose-400 inline-block" />
              <span>Cảnh báo mở bán quá tồn kho</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-rose-600 inline-block" />
              <span>Stop Sell đang khóa</span>
            </span>
          </div>

          <div className="font-semibold text-indigo-700">
            * Thay đổi trên bảng được lưu tức thì và tự động kích hoạt đồng bộ 2 chiều lên các kênh OTA.
          </div>
        </div>
      </div>

      {/* Bulk OTA Updater Modal */}
      {showBulkModal && (
        <BulkOtaToolModal
          roomTypes={roomTypes}
          onClose={() => setShowBulkModal(false)}
          onApply={handleApplyBulk}
          isSyncing={isSyncing}
        />
      )}
    </div>
  );
};
