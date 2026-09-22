import React, { useState } from 'react';
import { 
  Sliders, 
  X, 
  Check, 
  Calendar, 
  DollarSign, 
  Layers, 
  ShieldAlert, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  Info,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ChannelType, RoomType, BulkOtaUpdatePayload } from '../types';

interface BulkOtaToolModalProps {
  roomTypes: RoomType[];
  onClose: () => void;
  onApply: (payload: BulkOtaUpdatePayload) => void;
  isSyncing: boolean;
}

const AVAILABLE_CHANNELS: { id: ChannelType | 'ALL'; name: string; badge: string; color: string }[] = [
  { id: 'ALL', name: 'Toàn bộ kênh phân phối (All Channels)', badge: 'Master Pool', color: 'bg-indigo-600 text-white' },
  { id: 'Booking.com', name: 'Booking.com', badge: '+15% Markup', color: 'bg-blue-700 text-white' },
  { id: 'Agoda', name: 'Agoda', badge: '+18% Markup', color: 'bg-sky-600 text-white' },
  { id: 'Expedia', name: 'Expedia', badge: '+15% Markup', color: 'bg-amber-600 text-white' },
  { id: 'Airbnb', name: 'Airbnb', badge: '+10% Markup', color: 'bg-rose-600 text-white' },
  { id: 'Direct', name: 'Direct Booking Engine', badge: '0% Phí', color: 'bg-emerald-600 text-white' },
];

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const BulkOtaToolModal: React.FC<BulkOtaToolModalProps> = ({
  roomTypes,
  onClose,
  onApply,
  isSyncing,
}) => {
  // 1. Channel selection
  const [selectedChannels, setSelectedChannels] = useState<(ChannelType | 'ALL')[]>(['ALL']);

  // 2. Room types selection
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>(roomTypes.map((rt) => rt.id));

  // 3. Date range
  const today = new Date();
  const defaultEnd = new Date();
  defaultEnd.setDate(defaultEnd.getDate() + 14);

  const [startDate, setStartDate] = useState<string>(formatLocalDate(today));
  const [endDate, setEndDate] = useState<string>(formatLocalDate(defaultEnd));
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // 0=CN, 1=T2,...

  // 4. Inventory / Allotment Mode
  const [allotmentMode, setAllotmentMode] = useState<'keep' | 'max_available' | 'fixed'>('max_available');
  const [fixedAllotment, setFixedAllotment] = useState<number>(2);

  // 5. Rate setting
  const [rateMode, setRateMode] = useState<'keep' | 'percentage_adjust' | 'fixed'>('percentage_adjust');
  const [rateAdjustmentPercent, setRateAdjustmentPercent] = useState<number>(15);
  const [fixedRateVnd, setFixedRateVnd] = useState<number>(1500000);

  // 6. Restrictions
  const [stopSellOption, setStopSellOption] = useState<'keep' | 'open' | 'stop'>('keep');
  const [minStayOption, setMinStayOption] = useState<number | 'keep'>('keep');

  // Quick Date presets
  const handleDatePreset = (days: number) => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);
    setStartDate(formatLocalDate(start));
    setEndDate(formatLocalDate(end));
  };

  // Day of week toggles
  const toggleDayOfWeek = (dayIndex: number) => {
    if (selectedDaysOfWeek.includes(dayIndex)) {
      if (selectedDaysOfWeek.length > 1) {
        setSelectedDaysOfWeek(selectedDaysOfWeek.filter((d) => d !== dayIndex));
      }
    } else {
      setSelectedDaysOfWeek([...selectedDaysOfWeek, dayIndex].sort());
    }
  };

  // Channel toggle
  const toggleChannel = (chId: ChannelType | 'ALL') => {
    if (chId === 'ALL') {
      setSelectedChannels(['ALL']);
      return;
    }
    const withoutAll = selectedChannels.filter((c) => c !== 'ALL');
    if (withoutAll.includes(chId)) {
      const next = withoutAll.filter((c) => c !== chId);
      setSelectedChannels(next.length === 0 ? ['ALL'] : next);
    } else {
      setSelectedChannels([...withoutAll, chId]);
    }
  };

  // Room type toggle
  const toggleRoomType = (rtId: string) => {
    if (selectedRoomTypes.includes(rtId)) {
      if (selectedRoomTypes.length > 1) {
        setSelectedRoomTypes(selectedRoomTypes.filter((id) => id !== rtId));
      }
    } else {
      setSelectedRoomTypes([...selectedRoomTypes, rtId]);
    }
  };

  const selectAllRoomTypes = () => {
    setSelectedRoomTypes(roomTypes.map((rt) => rt.id));
  };

  // Preset quick test configuration
  const handleLoadTestPreset = () => {
    setSelectedChannels(['ALL']);
    setSelectedRoomTypes(roomTypes.map((rt) => rt.id));
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 10);
    setStartDate(formatLocalDate(now));
    setEndDate(formatLocalDate(future));
    setSelectedDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
    setAllotmentMode('fixed');
    setFixedAllotment(2);
    setRateMode('percentage_adjust');
    setRateAdjustmentPercent(20);
    setStopSellOption('open');
    setMinStayOption(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: BulkOtaUpdatePayload = {
      channels: selectedChannels,
      roomTypeIds: selectedRoomTypes,
      startDate,
      endDate,
      daysOfWeek: selectedDaysOfWeek,
      allotmentMode,
      allotment: allotmentMode === 'fixed' ? fixedAllotment : undefined,
      rateMode,
      fixedRate: rateMode === 'fixed' ? fixedRateVnd : undefined,
      rateAdjustmentPercent: rateMode === 'percentage_adjust' ? rateAdjustmentPercent : undefined,
      stopSell: stopSellOption === 'keep' ? undefined : stopSellOption === 'stop',
      minStay: minStayOption === 'keep' ? undefined : minStayOption,
    };

    onApply(payload);
  };

  // Day names for VN
  const daysMeta = [
    { idx: 1, label: 'Thứ 2' },
    { idx: 2, label: 'Thứ 3' },
    { idx: 3, label: 'Thứ 4' },
    { idx: 4, label: 'Thứ 5' },
    { idx: 5, label: 'Thứ 6' },
    { idx: 6, label: 'Thứ 7', weekend: true },
    { idx: 0, label: 'Chủ Nhật', weekend: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        id="bulk-ota-tool-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl flex flex-col h-[90vh] max-h-[850px] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Thiết lập Hàng loạt Tồn kho & Giá OTA</span>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-400/30">
                  Bulk Updater
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Cập nhật số lượng phòng mở bán (Allotment) & giá cho nhiều ngày và nhiều kênh phân phối.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Container with Scrollable Body and Sticky Footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            {/* Quick Test Preset Helper Notice */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Bạn muốn kiểm tra nhanh hiệu lực thiết lập hàng loạt?</span>
              </div>
              <button
                type="button"
                onClick={handleLoadTestPreset}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-extrabold text-[11px] transition shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Nạp cấu hình mẫu test (+20% giá, 2 phòng)</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Section 1: Channel selection */}
            <div className="space-y-2">
              <label className="font-bold text-slate-800 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[11px]">1</span>
                  <span>Kênh OTA áp dụng</span>
                </span>
                <span className="text-slate-500 text-[11px]">
                  {selectedChannels.includes('ALL') ? 'Đang áp dụng toàn bộ 5 kênh' : `Đã chọn ${selectedChannels.length} kênh`}
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AVAILABLE_CHANNELS.map((ch) => {
                  const isSelected = selectedChannels.includes(ch.id);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => toggleChannel(ch.id)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{ch.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{ch.badge}</div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Room types selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[11px]">2</span>
                  <span>Hạng phòng áp dụng</span>
                </label>
                <button
                  type="button"
                  onClick={selectAllRoomTypes}
                  className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] cursor-pointer"
                >
                  Chọn tất cả ({roomTypes.length})
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {roomTypes.map((rt) => {
                  const isSelected = selectedRoomTypes.includes(rt.id);
                  return (
                    <button
                      key={rt.id}
                      type="button"
                      onClick={() => toggleRoomType(rt.id)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{rt.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {rt.totalRooms} phòng • Giá gốc: {rt.basePrice.toLocaleString('vi-VN')} đ
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Date range & Days of week */}
            <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[11px]">3</span>
                  <span>Khoảng ngày & Thứ trong tuần</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDatePreset(7)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    7 ngày
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDatePreset(14)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    14 ngày
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDatePreset(30)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    30 ngày
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-600 font-medium block mb-1">Từ ngày (Start date):</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-600 font-medium block mb-1">Đến ngày (End date):</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Days of week selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-slate-600 font-medium">Áp dụng cho các ngày:</span>
                  <div className="flex items-center gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setSelectedDaysOfWeek([1, 2, 3, 4, 5])}
                      className="text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      Ngày trong tuần (T2-T6)
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedDaysOfWeek([6, 0])}
                      className="text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      Cuối tuần (T7-CN)
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedDaysOfWeek([0, 1, 2, 3, 4, 5, 6])}
                      className="text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      Cả tuần
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {daysMeta.map((d) => {
                    const isSelected = selectedDaysOfWeek.includes(d.idx);
                    return (
                      <button
                        key={d.idx}
                        type="button"
                        onClick={() => toggleDayOfWeek(d.idx)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? d.weekend
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-indigo-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section 4: Allotment (Số lượng phòng mở bán) */}
            <div className="space-y-2">
              <label className="font-bold text-slate-800 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[11px]">4</span>
                  <span>Số lượng phòng mở bán (Room Inventory / Allotment)</span>
                </span>
                <span className="text-emerald-700 font-bold text-[11px]">Tự động chống Overbooking</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                  allotmentMode === 'max_available'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}>
                  <div className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="allotmentMode"
                      checked={allotmentMode === 'max_available'}
                      onChange={() => setAllotmentMode('max_available')}
                      className="mt-0.5 text-indigo-600 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Tối đa theo PMS</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Mở bán đúng số phòng thực tế còn trống (Master Pool).
                      </div>
                    </div>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                  allotmentMode === 'fixed'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}>
                  <div className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="allotmentMode"
                      checked={allotmentMode === 'fixed'}
                      onChange={() => setAllotmentMode('fixed')}
                      className="mt-0.5 text-indigo-600 cursor-pointer"
                    />
                    <div className="w-full">
                      <div className="font-bold text-slate-900 text-xs">Hạn ngạch cố định</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Giới hạn số phòng bán trên kênh này.
                      </div>
                      {allotmentMode === 'fixed' && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={fixedAllotment}
                            onChange={(e) => setFixedAllotment(Math.max(0, Number(e.target.value)))}
                            className="w-16 bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-xs"
                          />
                          <span className="text-[11px] text-slate-600">phòng / ngày</span>
                        </div>
                      )}
                    </div>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                  allotmentMode === 'keep'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}>
                  <div className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="allotmentMode"
                      checked={allotmentMode === 'keep'}
                      onChange={() => setAllotmentMode('keep')}
                      className="mt-0.5 text-indigo-600 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Không đổi tồn kho</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Giữ nguyên số lượng hiện tại đã thiết lập.
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Section 5: Rate Strategy (Giá bán theo kênh) */}
            <div className="space-y-2">
              <label className="font-bold text-slate-800 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[11px]">5</span>
                  <span>Giá bán phòng (Dynamic Rates & Channel Pricing)</span>
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                  rateMode === 'percentage_adjust'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}>
                  <div className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="rateMode"
                      checked={rateMode === 'percentage_adjust'}
                      onChange={() => setRateMode('percentage_adjust')}
                      className="mt-0.5 text-indigo-600 cursor-pointer"
                    />
                    <div className="w-full">
                      <div className="font-bold text-slate-900 text-xs">Điều chỉnh theo %</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Tăng/giảm bù đắp hoa hồng OTA.
                      </div>
                      {rateMode === 'percentage_adjust' && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <input
                            type="number"
                            step="5"
                            value={rateAdjustmentPercent}
                            onChange={(e) => setRateAdjustmentPercent(Number(e.target.value))}
                            className="w-16 bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-xs"
                          />
                          <span className="text-[11px] text-indigo-700 font-bold">% so với giá sàn</span>
                        </div>
                      )}
                    </div>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                  rateMode === 'fixed'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}>
                  <div className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="rateMode"
                      checked={rateMode === 'fixed'}
                      onChange={() => setRateMode('fixed')}
                      className="mt-0.5 text-indigo-600 cursor-pointer"
                    />
                    <div className="w-full">
                      <div className="font-bold text-slate-900 text-xs">Mức giá cố định (VNĐ)</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Áp dụng mức giá cụ thể.
                      </div>
                      {rateMode === 'fixed' && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <input
                            type="number"
                            step="50000"
                            value={fixedRateVnd}
                            onChange={(e) => setFixedRateVnd(Number(e.target.value))}
                            className="w-28 bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-xs"
                          />
                          <span className="text-[11px] text-slate-600">đ / đêm</span>
                        </div>
                      )}
                    </div>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                  rateMode === 'keep'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}>
                  <div className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="rateMode"
                      checked={rateMode === 'keep'}
                      onChange={() => setRateMode('keep')}
                      className="mt-0.5 text-indigo-600 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Giữ nguyên biểu giá</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Không thay đổi giá bán hiện có.
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Section 6: Stop Sell & Min Stay */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[11px]">6</span>
                  <span>Khóa bán phòng (Stop Sell)</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStopSellOption('keep')}
                    className={`py-1.5 px-2 rounded-lg border text-center font-bold text-xs transition cursor-pointer ${
                      stopSellOption === 'keep'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    Không đổi
                  </button>
                  <button
                    type="button"
                    onClick={() => setStopSellOption('open')}
                    className={`py-1.5 px-2 rounded-lg border text-center font-bold text-xs transition cursor-pointer ${
                      stopSellOption === 'open'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    Mở bán
                  </button>
                  <button
                    type="button"
                    onClick={() => setStopSellOption('stop')}
                    className={`py-1.5 px-2 rounded-lg border text-center font-bold text-xs transition cursor-pointer ${
                      stopSellOption === 'stop'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    Khóa bán
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5 mb-1.5">
                  <span>Số đêm tối thiểu (Min Stay)</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMinStayOption('keep')}
                    className={`py-1.5 px-2 rounded-lg border text-center font-bold text-xs transition cursor-pointer ${
                      minStayOption === 'keep'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    Không đổi
                  </button>
                  <button
                    type="button"
                    onClick={() => setMinStayOption(1)}
                    className={`py-1.5 px-2 rounded-lg border text-center font-bold text-xs transition cursor-pointer ${
                      minStayOption === 1
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    1 đêm
                  </button>
                  <button
                    type="button"
                    onClick={() => setMinStayOption(2)}
                    className={`py-1.5 px-2 rounded-lg border text-center font-bold text-xs transition cursor-pointer ${
                      minStayOption === 2
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    2 đêm
                  </button>
                  <button
                    type="button"
                    onClick={() => setMinStayOption(3)}
                    className={`py-1.5 px-2 rounded-lg border text-center font-bold text-xs transition cursor-pointer ${
                      minStayOption === 3
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    3 đêm
                  </button>
                </div>
              </div>
            </div>

            {/* Quick info note */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 text-slate-700">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong>Cơ chế đẩy kênh (Channel Push):</strong> Sau khi nhấn áp dụng, hệ thống PMS sẽ tự động tính toán lại ma trận tồn kho và gọi API Webhook đẩy giá & lịch trống mới lên các kênh OTA đã chọn trong thời gian dưới 300ms.
              </div>
            </div>
          </div>

          {/* Sticky Modal Footer - Always visible! */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="text-[11px] text-slate-600">
              <span className="font-extrabold text-slate-900">Sẵn sàng thiết lập: </span>
              <span>{selectedRoomTypes.length} hạng phòng • </span>
              <span>{selectedChannels.includes('ALL') ? 'Toàn bộ 5 kênh' : `${selectedChannels.length} kênh`} • </span>
              <span className="font-bold text-indigo-700">{startDate} → {endDate}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl transition cursor-pointer text-xs"
              >
                Đóng lại
              </button>
              <button
                type="submit"
                disabled={isSyncing}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Đang đồng bộ OTA...' : 'Áp dụng & Đẩy lên OTA ngay'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
