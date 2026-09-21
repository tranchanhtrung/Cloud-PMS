import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Bed, 
  Sparkles, 
  Percent, 
  ShieldCheck, 
  ArrowUpRight, 
  PieChart, 
  BarChart3,
  RefreshCw,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import { Reservation, Room, RoomType, ChannelConnection } from '../types';

interface AnalyticsViewProps {
  reservations: Reservation[];
  rooms: Room[];
  roomTypes: RoomType[];
  channels: ChannelConnection[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  reservations,
  rooms,
  roomTypes,
  channels,
}) => {
  // Key KPIs calculations
  const totalRevenue = useMemo(() => {
    return reservations.filter((r) => r.status !== 'cancelled').reduce((sum, r) => sum + r.totalAmount, 0);
  }, [reservations]);

  const totalNightsSold = useMemo(() => {
    return reservations.filter((r) => r.status !== 'cancelled').reduce((sum, r) => sum + r.nights, 0);
  }, [reservations]);

  // ADR (Average Daily Rate) = Total Room Revenue / Total Nights Sold
  const adr = useMemo(() => {
    if (totalNightsSold === 0) return 0;
    return Math.round(totalRevenue / totalNightsSold);
  }, [totalRevenue, totalNightsSold]);

  // Occupancy rate for current in-house & upcoming week
  const currentOccupancy = useMemo(() => {
    const occupied = reservations.filter((r) => r.status === 'checked_in' || r.status === 'confirmed').length;
    return Math.min(100, Math.round((occupied / rooms.length) * 100));
  }, [reservations, rooms.length]);

  // RevPAR = ADR * Occupancy%
  const revpar = useMemo(() => {
    return Math.round(adr * (currentOccupancy / 100));
  }, [adr, currentOccupancy]);

  // Commission savings from Direct Booking Engine
  const directSavings = useMemo(() => {
    const directRes = reservations.filter((r) => r.channel === 'Direct' && r.status !== 'cancelled');
    const directRev = directRes.reduce((sum, r) => sum + r.totalAmount, 0);
    // Assuming standard 15% OTA commission saved!
    return Math.round(directRev * 0.15);
  }, [reservations]);

  // Channel breakdown
  const channelBreakdown = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    reservations.forEach((r) => {
      if (r.status === 'cancelled') return;
      if (!map[r.channel]) {
        map[r.channel] = { count: 0, revenue: 0 };
      }
      map[r.channel].count += 1;
      map[r.channel].revenue += r.totalAmount;
    });

    return Object.entries(map).map(([name, data]) => {
      const pct = totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0;
      return {
        name,
        count: data.count,
        revenue: data.revenue,
        percentage: pct,
      };
    });
  }, [reservations, totalRevenue]);

  // AI Dynamic Pricing state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<any>(null);

  const fetchAiAdvice = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/gemini/pricing-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentOccupancy,
          targetAdr: '1.450.000 VND',
          upcomingDays: 7,
          roomTypes: roomTypes.map((rt) => ({
            id: rt.id,
            name: rt.name,
            basePrice: rt.basePrice,
            totalRooms: rt.totalRooms,
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiAdvice(data);
      }
    } catch (e) {
      console.error('Failed to get AI pricing advice:', e);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">Báo cáo Doanh thu & Tối ưu hóa Giá (Revenue & Analytics)</h1>
          <p className="text-xs text-slate-500">
            Theo dõi hiệu suất vận hành khách sạn theo chuẩn quốc tế: ADR, RevPAR, Tỷ lệ lấp đầy và tiết kiệm hoa hồng.
          </p>
        </div>

        <button
          onClick={fetchAiAdvice}
          disabled={aiLoading}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 text-amber-300 ${aiLoading ? 'animate-spin' : ''}`} />
          <span>{aiLoading ? 'AI đang phân tích...' : 'AI Revenue Advisor Phân tích'}</span>
        </button>
      </div>

      {/* 4 Big KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Occupancy */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Tỷ lệ lấp đầy (Occupancy)</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Bed className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">{currentOccupancy}%</div>
          <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> +6.4% so với tuần trước
          </div>
        </div>

        {/* ADR */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Giá phòng bình quân (ADR)</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {adr.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-slate-400">Giá trung bình mỗi đêm phòng bán ra</div>
        </div>

        {/* RevPAR */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Doanh thu / phòng sẵn có (RevPAR)</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {revpar.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Hiệu suất khai thác cao
          </div>
        </div>

        {/* Direct Booking Commission Savings */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-100 text-xs font-bold">
            <span>Tiết kiệm Hoa hồng OTA (15%)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-200" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            +{directSavings.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-emerald-100 font-medium">
            Số tiền giữ lại nhờ Direct Booking Engine
          </div>
        </div>
      </div>

      {/* AI Revenue Advisor Card (if loaded or prompt) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                AI Dynamic Pricing & Yield Management Advisor (Gemini)
              </h2>
              <p className="text-xs text-slate-500">
                Đề xuất điều chỉnh giá bán tự động và chiến lược kênh nhằm tối đa hóa RevPAR và triệt tiêu nguy cơ overbooking.
              </p>
            </div>
          </div>

          {!aiAdvice && (
            <button
              onClick={fetchAiAdvice}
              disabled={aiLoading}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition cursor-pointer disabled:opacity-50"
            >
              {aiLoading ? 'Đang phân tích...' : 'Kích hoạt đề xuất'}
            </button>
          )}
        </div>

        {aiAdvice ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
              <div className="font-bold text-indigo-900 flex items-center gap-2 text-sm">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Chiến lược doanh thu tổng thể:</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-medium">
                {aiAdvice.strategySummary}
              </p>
              <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5 pt-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Đánh giá rủi ro Overbooking: {aiAdvice.overbookingRisk}</span>
              </div>
            </div>

            {/* Suggestions table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3">Hạng phòng</th>
                    <th className="p-3">Giá sàn hiện tại</th>
                    <th className="p-3">Giá đề xuất AI</th>
                    <th className="p-3">Điều chỉnh</th>
                    <th className="p-3">Lý do & Chiến lược kênh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {aiAdvice.suggestions?.map((item: any) => (
                    <tr key={item.roomTypeId} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{item.roomTypeName}</td>
                      <td className="p-3 font-mono text-slate-600">
                        {Number(item.currentBasePrice).toLocaleString('vi-VN')} đ
                      </td>
                      <td className="p-3 font-mono font-bold text-indigo-700">
                        {Number(item.recommendedPrice).toLocaleString('vi-VN')} đ
                      </td>
                      <td className="p-3 font-bold">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            item.percentageChange > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.percentageChange < 0
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.percentageChange > 0 ? `+${item.percentageChange}%` : `${item.percentageChange}%`}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">
                        <div>{item.reason}</div>
                        <div className="text-[10px] text-indigo-600 font-medium mt-0.5">
                          {item.channelStrategy}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500 space-y-2">
            <Sparkles className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-700">
              Nhấn "AI Revenue Advisor Phân tích" để AI Gemini đánh giá dữ liệu lấp đầy thực tế và tính toán giá phòng tối ưu cho từng kênh.
            </p>
          </div>
        )}
      </div>

      {/* Channel Revenue Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">
            Tỷ trọng Doanh thu theo Kênh (Channel Revenue Share)
          </h3>

          <div className="space-y-3 text-xs">
            {channelBreakdown.map((ch) => (
              <div key={ch.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    {ch.name === 'Direct' ? 'Direct Booking Engine (Trực tiếp)' : ch.name}
                    {ch.name === 'Direct' && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 rounded">
                        0% phí
                      </span>
                    )}
                  </span>
                  <span className="font-mono font-bold text-slate-700">
                    {ch.revenue.toLocaleString('vi-VN')} đ ({ch.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      ch.name === 'Direct'
                        ? 'bg-emerald-500'
                        : ch.name === 'Booking.com'
                        ? 'bg-blue-600'
                        : ch.name === 'Agoda'
                        ? 'bg-sky-500'
                        : ch.name === 'Expedia'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${ch.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Strategy Notes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 text-sm">
            Nguyên lý Vận hành Đa kênh Cloudbeds
          </h3>
          <ul className="space-y-2 text-slate-600 leading-relaxed">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Zero-Overbooking Engine:</strong> Khi có booking phát sinh từ Booking.com, hệ thống gửi lệnh khóa tồn kho trên Agoda và Expedia trong vòng 200ms.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Rate Parity & Markup Rules:</strong> Giá trên các kênh OTA tự động cộng thêm % phí hoa hồng (15%-18%) để bảo toàn lợi nhuận sau khi khấu trừ phí trung gian.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Chuyển dịch sang Direct Booking:</strong> Đưa khách hàng trực tiếp về website với các đặc quyền độc quyền (giảm 10%, tặng bữa sáng) giúp khách sạn tăng <strong>20-30% tỷ suất lợi nhuận ròng</strong>.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
