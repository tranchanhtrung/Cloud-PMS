import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  CreditCard, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  LogOut,
  AlertCircle
} from 'lucide-react';
import { Reservation, Room, RoomType, ChannelType } from '../types';

interface ReservationListViewProps {
  reservations: Reservation[];
  rooms: Room[];
  roomTypes: RoomType[];
  onSelectReservation: (res: Reservation) => void;
  onNewReservation: () => void;
}

export const ReservationListView: React.FC<ReservationListViewProps> = ({
  reservations,
  rooms,
  roomTypes,
  onSelectReservation,
  onNewReservation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'today_checkin' | 'today_checkout' | 'in_house' | 'confirmed'>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredList = useMemo(() => {
    return reservations.filter((r) => {
      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.guestName.toLowerCase().includes(q);
        const matchCode = r.code.toLowerCase().includes(q);
        const matchPhone = r.guestPhone.toLowerCase().includes(q);
        const matchEmail = r.guestEmail.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchPhone && !matchEmail) return false;
      }

      // Channel filter
      if (filterChannel !== 'all' && r.channel !== filterChannel) return false;

      // Status / time tab filter
      if (filterTab === 'today_checkin') {
        return r.checkIn === todayStr && r.status === 'confirmed';
      }
      if (filterTab === 'today_checkout') {
        return r.checkOut === todayStr && r.status === 'checked_in';
      }
      if (filterTab === 'in_house') {
        return r.status === 'checked_in';
      }
      if (filterTab === 'confirmed') {
        return r.status === 'confirmed';
      }

      return true;
    });
  }, [reservations, searchQuery, filterTab, filterChannel, todayStr]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked_in':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Đang ở
          </span>
        );
      case 'confirmed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
            Đã xác nhận
          </span>
        );
      case 'checked_out':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            Đã trả phòng
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Đã hủy
          </span>
        );
    }
  };

  const getChannelColor = (ch: ChannelType) => {
    switch (ch) {
      case 'Booking.com':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Agoda':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Expedia':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Airbnb':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Direct':
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold';
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">Danh sách Đặt phòng (Reservations)</h1>
          <p className="text-xs text-slate-500">
            Tổng cộng <strong>{reservations.length} đơn đặt phòng</strong> được đồng bộ trên PMS và các kênh.
          </p>
        </div>

        <button
          onClick={onNewReservation}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>+ Đặt phòng mới</span>
        </button>
      </div>

      {/* Filter Tabs & Search bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Quick status tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({reservations.length})
            </button>
            <button
              onClick={() => setFilterTab('in_house')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterTab === 'in_house'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Đang ở ({reservations.filter((r) => r.status === 'checked_in').length})
            </button>
            <button
              onClick={() => setFilterTab('today_checkin')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterTab === 'today_checkin'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Check-in hôm nay ({reservations.filter((r) => r.checkIn === todayStr && r.status === 'confirmed').length})
            </button>
            <button
              onClick={() => setFilterTab('today_checkout')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterTab === 'today_checkout'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Check-out hôm nay ({reservations.filter((r) => r.checkOut === todayStr && r.status === 'checked_in').length})
            </button>
          </div>

          {/* Search box */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên khách, mã, SĐT..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
              />
            </div>

            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">Mọi kênh OTA</option>
              <option value="Direct">Direct Booking</option>
              <option value="Booking.com">Booking.com</option>
              <option value="Agoda">Agoda</option>
              <option value="Expedia">Expedia</option>
              <option value="Airbnb">Airbnb</option>
            </select>
          </div>
        </div>

        {/* Table view */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="p-3 font-bold">Mã / Khách lưu trú</th>
                <th className="p-3 font-bold">Kênh đặt</th>
                <th className="p-3 font-bold">Phòng & Hạng phòng</th>
                <th className="p-3 font-bold">Lưu trú (Nights)</th>
                <th className="p-3 font-bold">Trạng thái</th>
                <th className="p-3 font-bold text-right">Tổng tiền & Nợ</th>
                <th className="p-3 font-bold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length > 0 ? (
                filteredList.map((res) => {
                  const room = rooms.find((r) => r.id === res.roomId);
                  const roomType = roomTypes.find((rt) => rt.id === res.roomTypeId);
                  const balanceDue = res.totalAmount - res.paidAmount;

                  return (
                    <tr
                      key={res.id}
                      onClick={() => onSelectReservation(res)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      <td className="p-3">
                        <div className="font-extrabold text-slate-900 text-sm">{res.guestName}</div>
                        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] mt-0.5">
                          <span className="text-indigo-600 font-bold">{res.code}</span>
                          <span>•</span>
                          <span>{res.guestPhone}</span>
                        </div>
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] border font-semibold ${getChannelColor(
                            res.channel
                          )}`}
                        >
                          {res.channel}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-800">
                          {room ? `Phòng ${room.number}` : <span className="text-amber-600">Chưa xếp phòng</span>}
                        </div>
                        <div className="text-[11px] text-slate-500">{roomType?.name}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-800">
                          {res.checkIn} → {res.checkOut}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {res.nights} đêm ({res.adults} lớn, {res.children} trẻ)
                        </div>
                      </td>

                      <td className="p-3">{getStatusBadge(res.status)}</td>

                      <td className="p-3 text-right">
                        <div className="font-mono font-bold text-slate-900">
                          {res.totalAmount.toLocaleString('vi-VN')} đ
                        </div>
                        <div className="text-[11px]">
                          {balanceDue <= 0 ? (
                            <span className="text-emerald-600 font-semibold">Đã đủ</span>
                          ) : (
                            <span className="text-rose-600 font-semibold">
                              Nợ: {balanceDue.toLocaleString('vi-VN')} đ
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition">
                          Xem Folio
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Không tìm thấy đơn đặt phòng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
