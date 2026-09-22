import React from 'react';
import { 
  CalendarDays, 
  Share2, 
  Globe, 
  ClipboardList, 
  DollarSign, 
  Sparkles, 
  Plus, 
  RefreshCw, 
  ShieldCheck, 
  BedDouble,
  Building2,
  Sparkle
} from 'lucide-react';

export type ActiveTab = 'tapechart' | 'channels' | 'booking_engine' | 'reservations' | 'ratematrix' | 'housekeeping' | 'analytics';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onNewReservation: () => void;
  onSyncAllChannels: () => void;
  isSyncing: boolean;
  activeChannelsCount: number;
  totalChannelsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onNewReservation,
  onSyncAllChannels,
  isSyncing,
  activeChannelsCount,
  totalChannelsCount,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top tier brand bar */}
      <div className="px-4 lg:px-6 py-2.5 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white font-black text-xl shadow-sm">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 tracking-tight text-lg">Cloudbeds</span>
              <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-full">
                PMS & Channel Manager
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Grand Lotus Boutique Hotel & Spa • Đà Nẵng (14 phòng)</p>
          </div>
        </div>

        {/* Status Indicators & Action buttons */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Overbooking shield badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Overbooking Shield: <strong>100% Khóa an toàn</strong></span>
          </div>

          {/* Channel Manager status button */}
          <button
            onClick={onSyncAllChannels}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer border border-slate-200"
            title="Đồng bộ lại lịch trống và giá phòng tức thì lên tất cả các kênh OTA"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
            <span className="hidden sm:inline">
              {isSyncing ? 'Đang đồng bộ OTA...' : `Đồng bộ OTA (${activeChannelsCount}/${totalChannelsCount})`}
            </span>
          </button>

          {/* New reservation trigger */}
          <button
            onClick={onNewReservation}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Đặt phòng mới</span>
          </button>
        </div>
      </div>

      {/* Navigation tabs row */}
      <nav className="px-4 lg:px-6 flex items-center gap-1 overflow-x-auto custom-scrollbar text-xs font-semibold text-slate-600">
        <button
          onClick={() => setActiveTab('tapechart')}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'tapechart'
              ? 'border-indigo-600 text-indigo-600 font-bold bg-indigo-50/50'
              : 'border-transparent hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Sơ đồ phòng (PMS Tape Chart)</span>
        </button>

        <button
          onClick={() => setActiveTab('channels')}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'channels'
              ? 'border-indigo-600 text-indigo-600 font-bold bg-indigo-50/50'
              : 'border-transparent hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Kênh phân phối (Channel Manager)</span>
          <span className="px-1.5 py-0.2 text-[10px] bg-blue-100 text-blue-700 rounded-full font-bold">5</span>
        </button>

        <button
          onClick={() => setActiveTab('booking_engine')}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'booking_engine'
              ? 'border-emerald-600 text-emerald-700 font-bold bg-emerald-50/60'
              : 'border-transparent text-emerald-700 hover:text-emerald-900 hover:border-emerald-300'
          }`}
        >
          <Globe className="w-4 h-4 text-emerald-600" />
          <span>Direct Booking Engine (Khách xem & đặt)</span>
          <span className="px-1.5 py-0.2 text-[10px] bg-emerald-100 text-emerald-800 rounded-full font-bold">0% Phí</span>
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'reservations'
              ? 'border-indigo-600 text-indigo-600 font-bold bg-indigo-50/50'
              : 'border-transparent hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Danh sách đặt phòng</span>
        </button>

        <button
          onClick={() => setActiveTab('ratematrix')}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'ratematrix'
              ? 'border-indigo-600 text-indigo-600 font-bold bg-indigo-50/50'
              : 'border-transparent hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Thiết lập Tồn kho & Giá OTA (Allotment)</span>
        </button>

        <button
          onClick={() => setActiveTab('housekeeping')}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'housekeeping'
              ? 'border-indigo-600 text-indigo-600 font-bold bg-indigo-50/50'
              : 'border-transparent hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <BedDouble className="w-4 h-4" />
          <span>Buồng phòng (Housekeeping)</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'analytics'
              ? 'border-indigo-600 text-indigo-600 font-bold bg-indigo-50/50'
              : 'border-transparent hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Doanh thu & AI Revenue Advisor</span>
        </button>
      </nav>
    </header>
  );
};
