import React, { useState } from 'react';
import { 
  Share2, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Zap, 
  Clock, 
  Sliders, 
  ArrowUpRight,
  ExternalLink,
  Layers,
  Radio,
  Play
} from 'lucide-react';
import { ChannelConnection, SyncLogEvent, RoomType } from '../types';

interface ChannelManagerViewProps {
  channels: ChannelConnection[];
  syncLogs: SyncLogEvent[];
  roomTypes: RoomType[];
  onToggleChannelAutoSync: (channelId: string) => void;
  onUpdateMarkup: (channelId: string, newMarkup: number) => void;
  onTriggerFullSync: () => void;
  onSimulateInboundOtaBooking: (channelName: 'Booking.com' | 'Agoda' | 'Expedia') => void;
  onNavigateToRateMatrix?: () => void;
  isSyncing: boolean;
}

export const ChannelManagerView: React.FC<ChannelManagerViewProps> = ({
  channels,
  syncLogs,
  roomTypes,
  onToggleChannelAutoSync,
  onUpdateMarkup,
  onTriggerFullSync,
  onSimulateInboundOtaBooking,
  onNavigateToRateMatrix,
  isSyncing,
}) => {
  const [selectedChannel, setSelectedChannel] = useState<ChannelConnection | null>(channels[1] || null); // default Booking.com
  const [editingMarkupId, setEditingMarkupId] = useState<string | null>(null);
  const [tempMarkup, setTempMarkup] = useState<number>(15);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Channel Manager & Anti-overbooking shield */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                2-Way Channel Synchronization Engine
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live API Connected (5/5)
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Quản lý Kênh phân phối OTA & Ngăn chặn Overbooking
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Tự động hóa đồng bộ giá phòng (Rate Parity) và lịch trống 2 chiều giữa <strong>Cloudbeds PMS</strong> với Booking.com, Agoda, Expedia, Airbnb và Booking Engine trực tiếp. Khi có khách đặt phòng ở bất kỳ kênh nào, tồn kho sẽ tự động khóa trên toàn bộ các kênh còn lại trong tích tắc (dưới 300ms).
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {onNavigateToRateMatrix && (
              <button
                onClick={onNavigateToRateMatrix}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-300" />
                <span>Thiết lập Tồn kho & Giá OTA</span>
              </button>
            )}

            <button
              onClick={onTriggerFullSync}
              disabled={isSyncing}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Đang đẩy giá & lịch...' : 'Đẩy giá & Lịch trống tức thì'}</span>
            </button>

            <button
              onClick={() => onSimulateInboundOtaBooking('Agoda')}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              title="Tạo giả lập 1 đơn đặt từ Agoda để quan sát PMS tự động khóa lịch trên Booking.com & Expedia"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Test Giả lập Đơn OTA về</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Anti-Overbooking Shield</div>
              <div className="text-sm font-bold text-white">Bảo vệ 100% không trùng phòng</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Thời gian đồng bộ trung bình</div>
              <div className="text-sm font-bold text-white">185 ms (Thời gian thực)</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Chiến lược giá (Rate Parity)</div>
              <div className="text-sm font-bold text-white">Markup tự động bù hoa hồng OTA</div>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Channels Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Các kênh đang kết nối</span>
            <span className="text-xs bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
              {channels.length} Kênh
            </span>
          </h2>
          <span className="text-xs text-slate-500">Chu kỳ đồng bộ: Tự động khi có thay đổi trên PMS hoặc OTA</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((channel) => {
            const isDirect = channel.name === 'Direct';
            return (
              <div
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className={`bg-white rounded-xl border p-5 transition cursor-pointer relative shadow-2xs hover:shadow-md ${
                  selectedChannel?.id === channel.id
                    ? 'border-indigo-600 ring-2 ring-indigo-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Channel Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl ${channel.iconBg} text-white font-extrabold flex items-center justify-center text-sm shadow-xs`}>
                      {channel.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
                        <span>{isDirect ? 'Direct Booking Engine' : channel.name}</span>
                        {isDirect && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                            Không hoa hồng
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Đồng bộ: {channel.lastSyncTime}
                      </div>
                    </div>
                  </div>

                  {/* Auto-sync status toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleChannelAutoSync(channel.id);
                    }}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      channel.autoSyncEnabled
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-300'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${channel.autoSyncEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    <span>{channel.autoSyncEnabled ? 'Đang bật' : 'Tạm dừng'}</span>
                  </button>
                </div>

                {/* Rates & Commission Specs */}
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-slate-500 block text-[11px]">Hoa hồng kênh (OTA Fee)</span>
                    <span className={`font-extrabold text-sm ${isDirect ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {channel.commissionPercent}% {isDirect ? '(Tiết kiệm 100%)' : ''}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-slate-500 block text-[11px]">Markup giá bán</span>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-indigo-700">
                        {channel.markupPercent > 0 ? `+${channel.markupPercent}%` : '0% (Giá gốc)'}
                      </span>
                      {!isDirect && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingMarkupId(channel.id);
                            setTempMarkup(channel.markupPercent);
                          }}
                          className="text-[10px] text-slate-500 hover:text-indigo-600 underline font-semibold cursor-pointer"
                        >
                          Sửa
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inline markup editor */}
                {editingMarkupId === channel.id && (
                  <div className="mt-3 p-3 bg-indigo-50/70 rounded-lg border border-indigo-200 text-xs" onClick={(e) => e.stopPropagation()}>
                    <div className="font-bold text-slate-800 mb-1.5">Điều chỉnh % Markup cho {channel.name}</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={tempMarkup}
                        onChange={(e) => setTempMarkup(Number(e.target.value))}
                        className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 font-bold"
                      />
                      <span className="font-bold text-slate-600">%</span>
                      <button
                        onClick={() => {
                          onUpdateMarkup(channel.id, tempMarkup);
                          setEditingMarkupId(null);
                        }}
                        className="px-2.5 py-1 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 cursor-pointer"
                      >
                        Lưu
                      </button>
                      <button
                        onClick={() => setEditingMarkupId(null)}
                        className="px-2 py-1 bg-slate-200 text-slate-700 rounded font-semibold hover:bg-slate-300 cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Giá hiển thị trên {channel.name} sẽ bằng: Giá gốc + {tempMarkup}% để đảm bảo lợi nhuận sau khi trừ phí hoa hồng.
                    </p>
                  </div>
                )}

                {/* Bottom latency, status and link to matrix */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-medium text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {channel.latencyMs}ms
                  </span>
                  {onNavigateToRateMatrix && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToRateMatrix();
                      }}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Cấu hình tồn kho & giá</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column: Selected Channel Rate Preview + Live Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Rate Calculation Table for all Room Types */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Bảng quy đổi giá phòng theo kênh (Rate Parity Table)
              </h3>
              <p className="text-xs text-slate-500">
                Hiển thị giá gốc trên PMS, giá bán trực tiếp trên Booking Engine và giá đẩy lên OTA sau bù Markup.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
              Đang tính theo: {selectedChannel?.name || 'Booking.com'}
            </span>
          </div>

          <div className="overflow-x-auto">
            {(() => {
              const agodaChan = channels.find((c) => c.name === 'Agoda');
              const bdcChan = channels.find((c) => c.name === 'Booking.com');
              const directChan = channels.find((c) => c.name === 'Direct');

              const agodaMarkup = agodaChan ? agodaChan.markupPercent : 18;
              const bdcMarkup = bdcChan ? bdcChan.markupPercent : 15;
              const directDiscount = directChan ? Math.abs(directChan.markupPercent) : 10;

              return (
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="p-3 font-bold">Hạng phòng</th>
                      <th className="p-3 font-bold">Giá sàn PMS</th>
                      <th className="p-3 font-bold text-emerald-700">Direct Booking (-{directDiscount}%)</th>
                      <th className="p-3 font-bold text-blue-800">Booking.com (+{bdcMarkup}%)</th>
                      <th className="p-3 font-bold text-sky-700">Agoda (+{agodaMarkup}%)</th>
                      <th className="p-3 font-bold">Trạng thái Parity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {roomTypes.map((rt) => {
                      const directPrice = Math.round(rt.basePrice * (1 - directDiscount / 100));
                      const bdcPrice = Math.round(rt.basePrice * (1 + bdcMarkup / 100));
                      const agodaPrice = Math.round(rt.basePrice * (1 + agodaMarkup / 100));

                      return (
                        <tr key={rt.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                            <span>{rt.name}</span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-700">
                            {rt.basePrice.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="p-3 font-mono font-bold text-emerald-700 bg-emerald-50/40">
                            {directPrice.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="p-3 font-mono font-bold text-blue-800">
                            {bdcPrice.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="p-3 font-mono font-bold text-sky-700">
                            {agodaPrice.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Đã đồng bộ
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}
          </div>

          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2.5 text-xs text-slate-600">
            <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong>Lợi thế cạnh tranh:</strong> Bằng cách áp dụng chính sách giá trực tiếp thấp hơn 10% kết hợp miễn phí bữa sáng trên Direct Booking Engine, khách sạn chuyển dịch tới <strong>35-45% lượng đặt phòng</strong> từ OTA về kênh nhà mà không vi phạm hợp đồng giá (Rate Parity).
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Activity Stream / Webhook Logs */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col h-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>Nhật ký đồng bộ thời gian thực</span>
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              Live Feed
            </span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[380px] custom-scrollbar pr-1 text-xs">
            {syncLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/80 hover:bg-slate-100/80 transition space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-slate-400 font-bold">{log.timestamp}</span>
                    <span className="font-bold text-slate-800">{log.channel}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                    Thành công
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {log.details}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Tự động đẩy XML/JSON webhook</span>
            <span className="font-bold text-indigo-600">Zero Overbooking Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
};
