import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  User, 
  CreditCard,
  Bed,
  Sparkles,
  Info
} from 'lucide-react';
import { Room, RoomType, Reservation, RoomStatus } from '../types';

interface TapeChartCalendarProps {
  rooms: Room[];
  roomTypes: RoomType[];
  reservations: Reservation[];
  onSelectReservation: (reservation: Reservation) => void;
  onQuickBook: (roomId: string, date: string) => void;
  onUpdateRoomStatus: (roomId: string, newStatus: RoomStatus) => void;
}

export const TapeChartCalendar: React.FC<TapeChartCalendarProps> = ({
  rooms,
  roomTypes,
  reservations,
  onSelectReservation,
  onQuickBook,
  onUpdateRoomStatus,
}) => {
  // Days view count (default 14 days)
  const [daysCount, setDaysCount] = useState<number>(14);
  const [startDateOffset, setStartDateOffset] = useState<number>(-1); // Start 1 day before today to show ongoing stays
  const [filterRoomType, setFilterRoomType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Compute date range array
  const dateColumns = useMemo(() => {
    const dates: { dateStr: string; dayName: string; dayNum: number; monthNum: number; isToday: boolean; dateObj: Date }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    for (let i = 0; i < daysCount; i++) {
      const d = new Date();
      d.setDate(d.getDate() + startDateOffset + i);
      d.setHours(0, 0, 0, 0);

      const dateStr = d.toISOString().split('T')[0];
      const isToday = d.getTime() === today.getTime();

      dates.push({
        dateStr,
        dayName: dayNames[d.getDay()],
        dayNum: d.getDate(),
        monthNum: d.getMonth() + 1,
        isToday,
        dateObj: d,
      });
    }
    return dates;
  }, [daysCount, startDateOffset]);

  // Filter rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      if (filterRoomType !== 'all' && room.roomTypeId !== filterRoomType) return false;
      if (filterStatus !== 'all' && room.status !== filterStatus) return false;
      return true;
    });
  }, [rooms, filterRoomType, filterStatus]);

  // Group rooms by RoomType for hierarchical display
  const groupedRooms = useMemo(() => {
    const map = new Map<string, Room[]>();
    filteredRooms.forEach((r) => {
      const list = map.get(r.roomTypeId) || [];
      list.push(r);
      map.set(r.roomTypeId, list);
    });
    return map;
  }, [filteredRooms]);

  // Calculate daily occupancy
  const dailyStats = useMemo(() => {
    return dateColumns.map((col) => {
      const occupied = reservations.filter((res) => {
        if (res.status === 'cancelled') return false;
        return res.checkIn <= col.dateStr && col.dateStr < res.checkOut;
      }).length;
      const total = rooms.length;
      const pct = Math.round((occupied / total) * 100);
      return {
        dateStr: col.dateStr,
        occupied,
        available: total - occupied,
        percentage: pct,
      };
    });
  }, [dateColumns, reservations, rooms.length]);

  // Status color helper for reservation block
  const getReservationBadgeStyle = (res: Reservation) => {
    if (res.status === 'checked_in') {
      return 'bg-emerald-600 border-emerald-700 text-white hover:bg-emerald-700';
    }
    if (res.status === 'confirmed') {
      return 'bg-indigo-600 border-indigo-700 text-white hover:bg-indigo-700';
    }
    if (res.status === 'checked_out') {
      return 'bg-slate-400 border-slate-500 text-white hover:bg-slate-500';
    }
    return 'bg-rose-500 border-rose-600 text-white';
  };

  const getChannelTag = (channel: string) => {
    switch (channel) {
      case 'Booking.com':
        return <span className="text-[10px] px-1 py-0.2 rounded bg-blue-900/80 text-blue-100 font-semibold">BDC</span>;
      case 'Agoda':
        return <span className="text-[10px] px-1 py-0.2 rounded bg-sky-800/80 text-sky-100 font-semibold">AGD</span>;
      case 'Expedia':
        return <span className="text-[10px] px-1 py-0.2 rounded bg-amber-800/80 text-amber-100 font-semibold">EXP</span>;
      case 'Airbnb':
        return <span className="text-[10px] px-1 py-0.2 rounded bg-rose-800/80 text-rose-100 font-semibold">AIR</span>;
      case 'Direct':
      default:
        return <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-800/80 text-emerald-100 font-semibold">DIRECT</span>;
    }
  };

  const getHousekeepingBadge = (status: RoomStatus) => {
    switch (status) {
      case 'clean':
        return <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" title="Phòng sạch (Clean)" />;
      case 'dirty':
        return <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-100" title="Phòng bẩn (Dirty)" />;
      case 'inspecting':
        return <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-100" title="Đang kiểm tra (Inspecting)" />;
      case 'maintenance':
        return <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-100" title="Đang bảo trì (Out of Order)" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Control bar */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Navigation and Date controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStartDateOffset(0)}
            className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg shadow-2xs transition cursor-pointer"
          >
            Hôm nay
          </button>
          <div className="flex items-center bg-white border border-slate-300 rounded-lg shadow-2xs">
            <button
              onClick={() => setStartDateOffset((prev) => prev - 7)}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
              title="Lùi 7 ngày"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-semibold text-slate-700">
              {dateColumns[0]?.dayNum}/{dateColumns[0]?.monthNum} — {dateColumns[dateColumns.length - 1]?.dayNum}/{dateColumns[dateColumns.length - 1]?.monthNum}
            </span>
            <button
              onClick={() => setStartDateOffset((prev) => prev + 7)}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
              title="Tiến 7 ngày"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days range selector */}
          <div className="hidden sm:flex items-center bg-white border border-slate-300 rounded-lg text-xs font-medium overflow-hidden">
            <button
              onClick={() => setDaysCount(7)}
              className={`px-2.5 py-1.5 transition cursor-pointer ${daysCount === 7 ? 'bg-indigo-50 text-indigo-600 font-bold' : 'hover:bg-slate-50 text-slate-600'}`}
            >
              7 ngày
            </button>
            <button
              onClick={() => setDaysCount(14)}
              className={`px-2.5 py-1.5 border-l border-slate-200 transition cursor-pointer ${daysCount === 14 ? 'bg-indigo-50 text-indigo-600 font-bold' : 'hover:bg-slate-50 text-slate-600'}`}
            >
              14 ngày
            </button>
            <button
              onClick={() => setDaysCount(21)}
              className={`px-2.5 py-1.5 border-l border-slate-200 transition cursor-pointer ${daysCount === 21 ? 'bg-indigo-50 text-indigo-600 font-bold' : 'hover:bg-slate-50 text-slate-600'}`}
            >
              21 ngày
            </button>
          </div>
        </div>

        {/* Right: Filters & Housekeeping Legend */}
        <div className="flex items-center gap-3">
          {/* Room type filter */}
          <select
            value={filterRoomType}
            onChange={(e) => setFilterRoomType(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer"
          >
            <option value="all">Tất cả hạng phòng ({rooms.length})</option>
            {roomTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.name}
              </option>
            ))}
          </select>

          {/* Housekeeping quick legend */}
          <div className="hidden lg:flex items-center gap-2.5 text-[11px] text-slate-600 font-medium px-2.5 py-1 bg-white border border-slate-200 rounded-lg">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Sạch</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Bẩn</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Kiểm tra</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Bảo trì</span>
          </div>
        </div>
      </div>

      {/* Main Grid Calendar Container */}
      <div className="flex-1 overflow-auto custom-scrollbar relative border-b border-slate-200">
        <table className="w-full border-collapse border-spacing-0 select-none min-w-[900px]">
          {/* Calendar Header Row */}
          <thead>
            {/* Top row: Days & dates */}
            <tr className="bg-slate-100/90 sticky top-0 z-30 shadow-2xs">
              <th className="sticky left-0 z-40 bg-slate-100 border-r border-b border-slate-300 p-2.5 text-left w-52 min-w-[200px] text-xs font-bold text-slate-700">
                <div className="flex items-center justify-between">
                  <span>PHÒNG & HẠNG PHÒNG</span>
                  <span className="text-[10px] font-normal text-slate-500">{rooms.length} phòng</span>
                </div>
              </th>
              {dateColumns.map((col) => (
                <th
                  key={col.dateStr}
                  className={`border-r border-b border-slate-300 text-center py-2 px-1 text-xs min-w-[72px] transition ${
                    col.isToday ? 'bg-indigo-50 text-indigo-900 border-indigo-200 font-bold' : 'text-slate-700'
                  }`}
                >
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{col.dayName}</div>
                  <div className={`text-sm leading-tight font-extrabold ${col.isToday ? 'text-indigo-700' : 'text-slate-800'}`}>
                    {col.dayNum}/{col.monthNum}
                  </div>
                </th>
              ))}
            </tr>

            {/* Sub-row: Occupancy % bar */}
            <tr className="bg-slate-50 sticky top-[49px] z-20 text-[10px] border-b border-slate-300">
              <th className="sticky left-0 z-30 bg-slate-50 border-r border-slate-300 px-3 py-1.5 text-left font-semibold text-slate-500">
                Tỷ lệ lấp đầy / Trống
              </th>
              {dailyStats.map((stat, idx) => (
                <th
                  key={stat.dateStr}
                  className={`border-r border-slate-300 px-1 py-1 text-center font-medium ${
                    dateColumns[idx]?.isToday ? 'bg-indigo-50/70 text-indigo-800' : 'text-slate-600'
                  }`}
                >
                  <div className="font-bold">{stat.percentage}%</div>
                  <div className="text-[9px] text-slate-400">Trống: {stat.available}</div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Rooms and Reservation Rows */}
          <tbody>
            {Array.from(groupedRooms.entries()).map(([roomTypeId, rList]) => {
              const rType = roomTypes.find((t) => t.id === roomTypeId);
              return (
                <React.Fragment key={roomTypeId}>
                  {/* Room Type Category Header row */}
                  <tr className="bg-slate-200/60 font-semibold text-xs text-slate-700">
                    <td
                      colSpan={dateColumns.length + 1}
                      className="sticky left-0 z-10 px-3 py-1.5 bg-slate-200/90 border-b border-slate-300 text-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{rType?.name}</span>
                        <span className="text-[11px] text-slate-500 font-normal">
                          ({rType?.capacity} khách • {rType?.bedType})
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-indigo-700">
                        {rType?.basePrice.toLocaleString('vi-VN')} VND / đêm
                      </span>
                    </td>
                  </tr>

                  {/* Individual room rows */}
                  {rList.map((room) => {
                    return (
                      <tr key={room.id} className="hover:bg-slate-50/60 transition group">
                        {/* Room label sticky cell */}
                        <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-b border-slate-200 px-3 py-2 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{room.number}</span>
                              <span className="text-[10px] text-slate-400">T{room.floor}</span>
                            </div>

                            {/* Housekeeping status selector */}
                            <div className="relative group/hk">
                              <button
                                className="flex items-center gap-1.5 p-1 rounded hover:bg-slate-100 transition cursor-pointer"
                                title={`Tình trạng buồng phòng: ${room.status}`}
                              >
                                {getHousekeepingBadge(room.status)}
                              </button>

                              {/* Housekeeping quick switcher dropdown */}
                              <div className="absolute left-0 top-full hidden group-hover/hk:flex flex-col bg-white border border-slate-200 shadow-lg rounded-lg py-1 z-50 text-[11px] min-w-[110px]">
                                <button
                                  onClick={() => onUpdateRoomStatus(room.id, 'clean')}
                                  className="px-2.5 py-1 text-left flex items-center gap-1.5 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700"
                                >
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Sạch (Clean)
                                </button>
                                <button
                                  onClick={() => onUpdateRoomStatus(room.id, 'dirty')}
                                  className="px-2.5 py-1 text-left flex items-center gap-1.5 hover:bg-amber-50 hover:text-amber-700 text-slate-700"
                                >
                                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Bẩn (Dirty)
                                </button>
                                <button
                                  onClick={() => onUpdateRoomStatus(room.id, 'inspecting')}
                                  className="px-2.5 py-1 text-left flex items-center gap-1.5 hover:bg-blue-50 hover:text-blue-700 text-slate-700"
                                >
                                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Kiểm tra
                                </button>
                                <button
                                  onClick={() => onUpdateRoomStatus(room.id, 'maintenance')}
                                  className="px-2.5 py-1 text-left flex items-center gap-1.5 hover:bg-rose-50 hover:text-rose-700 text-slate-700"
                                >
                                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Bảo trì
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Date cells for this room */}
                        {dateColumns.map((col, colIndex) => {
                          // Check if there is an active reservation on this day in this room
                          const matchingReservation = reservations.find((res) => {
                            if (res.status === 'cancelled') return false;
                            if (res.roomId !== room.id) return false;
                            return res.checkIn <= col.dateStr && col.dateStr < res.checkOut;
                          });

                          // Determine if this cell is the start date of the reservation
                          const isStartOfReservation = matchingReservation && matchingReservation.checkIn === col.dateStr;
                          // Or if reservation started before our visible window
                          const isFirstVisibleDayOfRes = matchingReservation && colIndex === 0 && matchingReservation.checkIn < col.dateStr;

                          const shouldRenderReservationBlock = isStartOfReservation || isFirstVisibleDayOfRes;

                          // Compute how many columns this reservation spans in the visible grid
                          let spanColumns = 1;
                          if (shouldRenderReservationBlock && matchingReservation) {
                            const resEndDate = new Date(matchingReservation.checkOut);
                            const currentCellDate = new Date(col.dateStr);
                            const diffTime = resEndDate.getTime() - currentCellDate.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            const remainingVisibleDays = dateColumns.length - colIndex;
                            spanColumns = Math.min(diffDays, remainingVisibleDays);
                          }

                          // If another previous cell is spanning across this column, we do not render a clickable empty cell
                          const isCoveredByPrevious = matchingReservation && !shouldRenderReservationBlock;

                          if (isCoveredByPrevious) {
                            return null; // The spanned cell handles the visual block
                          }

                          return (
                            <td
                              key={col.dateStr}
                              colSpan={shouldRenderReservationBlock ? spanColumns : 1}
                              onClick={() => {
                                if (!matchingReservation) {
                                  onQuickBook(room.id, col.dateStr);
                                }
                              }}
                              className={`border-r border-b border-slate-200 h-14 p-1 relative transition cursor-pointer ${
                                col.isToday ? 'bg-indigo-50/20' : ''
                              } ${!matchingReservation ? 'hover:bg-blue-50/50' : ''}`}
                            >
                              {/* Empty slot '+' hint on hover */}
                              {!matchingReservation && (
                                <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 text-indigo-600 font-bold text-xs transition">
                                  + Đặt
                                </div>
                              )}

                              {/* Reservation Pill Block */}
                              {shouldRenderReservationBlock && matchingReservation && (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectReservation(matchingReservation);
                                  }}
                                  className={`w-full h-full rounded-md shadow-xs border p-1.5 flex flex-col justify-between overflow-hidden cursor-pointer transition transform hover:scale-[1.01] hover:shadow-md ${getReservationBadgeStyle(
                                    matchingReservation
                                  )}`}
                                >
                                  {/* Top line: Guest name & Channel tag */}
                                  <div className="flex items-center justify-between gap-1 overflow-hidden leading-tight">
                                    <div className="font-extrabold text-xs truncate flex items-center gap-1">
                                      <User className="w-3 h-3 shrink-0" />
                                      <span className="truncate">{matchingReservation.guestName}</span>
                                    </div>
                                    <div className="shrink-0">{getChannelTag(matchingReservation.channel)}</div>
                                  </div>

                                  {/* Bottom line: Code, nights, and payment icon */}
                                  <div className="flex items-center justify-between text-[10px] opacity-90 leading-tight">
                                    <span className="font-mono font-medium">{matchingReservation.code}</span>
                                    <div className="flex items-center gap-1">
                                      <span>{matchingReservation.nights}đ</span>
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          matchingReservation.paymentStatus === 'paid'
                                            ? 'bg-emerald-300'
                                            : matchingReservation.paymentStatus === 'partial'
                                            ? 'bg-amber-300'
                                            : 'bg-rose-300'
                                        }`}
                                        title={`Thanh toán: ${matchingReservation.paymentStatus}`}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tape Chart Bottom Quick Status Legend & Actions */}
      <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center gap-4">
          <span className="font-bold text-slate-700">Màu trạng thái đặt phòng:</span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-3 h-3 rounded bg-emerald-600 border border-emerald-700" />
            <span>Đang ở (Checked In)</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-3 h-3 rounded bg-indigo-600 border border-indigo-700" />
            <span>Đã xác nhận (Confirmed)</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-3 h-3 rounded bg-slate-400 border border-slate-500" />
            <span>Đã trả phòng (Checked Out)</span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-500">
          <span>* Nhấp vào bất kỳ ô phòng trống nào để mở đặt phòng nhanh</span>
        </div>
      </div>
    </div>
  );
};
