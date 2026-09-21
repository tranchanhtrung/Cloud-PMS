import React, { useState, useMemo } from 'react';
import { DollarSign, ShieldAlert, Check, RefreshCw, Sliders, Calendar, Zap, AlertTriangle } from 'lucide-react';
import { RoomType } from '../types';
import { getRelativeDate } from '../data/mockHotelData';

interface RateMatrixViewProps {
  roomTypes: RoomType[];
  onTriggerSync: () => void;
  isSyncing: boolean;
}

export const RateMatrixView: React.FC<RateMatrixViewProps> = ({
  roomTypes,
  onTriggerSync,
  isSyncing,
}) => {
  const daysCount = 10;
  const dateColumns = useMemo(() => {
    const list = [];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    for (let i = 0; i < daysCount; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      list.push({
        dateStr: d.toISOString().split('T')[0],
        dayName: dayNames[d.getDay()],
        dayNum: d.getDate(),
        monthNum: d.getMonth() + 1,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      });
    }
    return list;
  }, []);

  // Rates and Stop Sell states per room type & date
  const [stopSellMap, setStopSellMap] = useState<Record<string, boolean>>({});
  const [ratesMap, setRatesMap] = useState<Record<string, number>>({});
  const [bulkAdjustmentPercent, setBulkAdjustmentPercent] = useState<number>(10);
  const [selectedRoomTypeForBulk, setSelectedRoomTypeForBulk] = useState<string>('all');
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  const getKey = (rtId: string, dateStr: string) => `${rtId}__${dateStr}`;

  const getRate = (rt: RoomType, dateStr: string, isWeekend: boolean) => {
    const key = getKey(rt.id, dateStr);
    if (ratesMap[key] !== undefined) return ratesMap[key];
    // Weekend default +10%
    return isWeekend ? Math.round(rt.basePrice * 1.1) : rt.basePrice;
  };

  const isStopSell = (rtId: string, dateStr: string) => {
    return !!stopSellMap[getKey(rtId, dateStr)];
  };

  const toggleStopSell = (rtId: string, dateStr: string) => {
    const key = getKey(rtId, dateStr);
    setStopSellMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRateChange = (rtId: string, dateStr: string, newRate: number) => {
    const key = getKey(rtId, dateStr);
    setRatesMap((prev) => ({ ...prev, [key]: newRate }));
  };

  const applyBulkAdjustment = () => {
    const updatedRates: Record<string, number> = { ...ratesMap };
    roomTypes.forEach((rt) => {
      if (selectedRoomTypeForBulk === 'all' || selectedRoomTypeForBulk === rt.id) {
        dateColumns.forEach((col) => {
          const key = getKey(rt.id, col.dateStr);
          const current = getRate(rt, col.dateStr, col.isWeekend);
          updatedRates[key] = Math.round(current * (1 + bulkAdjustmentPercent / 100));
        });
      }
    });
    setRatesMap(updatedRates);
    setFeedbackMsg(`Đã áp dụng điều chỉnh ${bulkAdjustmentPercent}% cho các ngày tới.`);
    setTimeout(() => setFeedbackMsg(''), 4000);
    onTriggerSync();
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">Bảng giá linh hoạt & Đóng/Mở phòng (Rate Matrix)</h1>
          <p className="text-xs text-slate-500">
            Quản lý giá bán từng ngày và kích hoạt <strong>Stop Sell</strong> (khóa bán phòng) tức thì lên Booking.com, Agoda và Booking Engine.
          </p>
        </div>

        <button
          onClick={onTriggerSync}
          disabled={isSyncing}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Đang đẩy giá...' : 'Đẩy giá lên toàn bộ OTA'}</span>
        </button>
      </div>

      {/* Bulk Rate Adjustment Tool */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span>Công cụ điều chỉnh giá hàng loạt (Bulk Rate Multiplier)</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <select
            value={selectedRoomTypeForBulk}
            onChange={(e) => setSelectedRoomTypeForBulk(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-semibold text-slate-700 cursor-pointer"
          >
            <option value="all">Tất cả hạng phòng</option>
            {roomTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-medium">Tăng/Giảm:</span>
            <input
              type="number"
              value={bulkAdjustmentPercent}
              onChange={(e) => setBulkAdjustmentPercent(Number(e.target.value))}
              className="w-20 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800"
            />
            <span className="font-bold text-slate-600">%</span>
          </div>

          <button
            onClick={applyBulkAdjustment}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition cursor-pointer"
          >
            Áp dụng và Đồng bộ ngay
          </button>

          {feedbackMsg && (
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
              {feedbackMsg}
            </span>
          )}
        </div>
      </div>

      {/* Main Rate Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="p-3 font-bold w-56 sticky left-0 bg-slate-100 z-10">Hạng phòng</th>
                <th className="p-3 font-bold w-24">Chỉ số</th>
                {dateColumns.map((col) => (
                  <th
                    key={col.dateStr}
                    className={`p-2.5 text-center min-w-[85px] border-l border-slate-200 ${
                      col.isWeekend ? 'bg-indigo-50/60 font-bold text-indigo-900' : ''
                    }`}
                  >
                    <div className="text-[10px] text-slate-500 uppercase">{col.dayName}</div>
                    <div className="font-black text-xs">{col.dayNum}/{col.monthNum}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {roomTypes.map((rt) => (
                <React.Fragment key={rt.id}>
                  {/* Row 1: Rates */}
                  <tr className="hover:bg-slate-50/50">
                    <td rowSpan={2} className="p-3 font-bold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-200">
                      <div>{rt.name}</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        Giá cơ sở: {rt.basePrice.toLocaleString('vi-VN')} đ
                      </div>
                    </td>

                    <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">
                      Giá bán (k VND)
                    </td>

                    {dateColumns.map((col) => {
                      const rate = getRate(rt, col.dateStr, col.isWeekend);
                      const rateInK = Math.round(rate / 1000);

                      return (
                        <td key={col.dateStr} className={`p-1.5 text-center border-r border-slate-200 ${col.isWeekend ? 'bg-indigo-50/20' : ''}`}>
                          <input
                            type="number"
                            value={rateInK}
                            onChange={(e) => handleRateChange(rt.id, col.dateStr, Number(e.target.value) * 1000)}
                            className="w-16 text-center bg-slate-50 border border-slate-300 rounded px-1 py-1 font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row 2: Stop Sell switch */}
                  <tr className="bg-slate-50/30 border-b-2 border-slate-200">
                    <td className="p-2 font-semibold text-slate-500 border-r border-slate-200">
                      Stop Sell (Khóa)
                    </td>

                    {dateColumns.map((col) => {
                      const stopped = isStopSell(rt.id, col.dateStr);

                      return (
                        <td key={col.dateStr} className={`p-1.5 text-center border-r border-slate-200 ${col.isWeekend ? 'bg-indigo-50/20' : ''}`}>
                          <button
                            onClick={() => toggleStopSell(rt.id, col.dateStr)}
                            className={`w-full py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                              stopped
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : 'bg-slate-200/80 hover:bg-slate-300 text-slate-600'
                            }`}
                            title={stopped ? 'Đang ĐÓNG bán phòng' : 'Đang MỞ bán phòng'}
                          >
                            {stopped ? 'KHÓA' : 'Mở'}
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

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>* Cột màu xanh nhạt là ngày cuối tuần (Thứ 7 & Chủ Nhật)</span>
          <span>Nút KHÓA kích hoạt lệnh đóng phòng tức thì trên Booking.com & Agoda</span>
        </div>
      </div>
    </div>
  );
};
