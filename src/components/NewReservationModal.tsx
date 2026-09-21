import React, { useState, useMemo } from 'react';
import { X, Calendar, User, CreditCard, ShieldCheck, Bed } from 'lucide-react';
import { Room, RoomType, Reservation, ChannelType } from '../types';
import { getRelativeDate } from '../data/mockHotelData';

interface NewReservationModalProps {
  rooms: Room[];
  roomTypes: RoomType[];
  reservations: Reservation[];
  initialRoomId?: string;
  initialDate?: string;
  onClose: () => void;
  onCreate: (reservation: Reservation) => void;
}

export const NewReservationModal: React.FC<NewReservationModalProps> = ({
  rooms,
  roomTypes,
  reservations,
  initialRoomId,
  initialDate,
  onClose,
  onCreate,
}) => {
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [roomTypeId, setRoomTypeId] = useState(
    initialRoomId ? rooms.find((r) => r.id === initialRoomId)?.roomTypeId || roomTypes[0]?.id : roomTypes[0]?.id
  );
  const [roomId, setRoomId] = useState(initialRoomId || '');
  const [checkIn, setCheckIn] = useState(initialDate || getRelativeDate(0));
  const [checkOut, setCheckOut] = useState(
    initialDate ? getRelativeDate(2) : getRelativeDate(2)
  );
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [channel, setChannel] = useState<ChannelType>('Direct');
  const [specialRequests, setSpecialRequests] = useState('');
  const [depositAmount, setDepositAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer'>('card');

  const selectedRoomType = roomTypes.find((rt) => rt.id === roomTypeId);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [checkIn, checkOut]);

  // Calculate total price based on channel markup
  const calculatedTotal = useMemo(() => {
    if (!selectedRoomType) return 0;
    let price = selectedRoomType.basePrice * nights;
    if (channel === 'Booking.com') price *= 1.15;
    if (channel === 'Agoda') price *= 1.18;
    if (channel === 'Expedia') price *= 1.15;
    return Math.round(price);
  }, [selectedRoomType, nights, channel]);

  // Find physical rooms of this room type that have NO overlapping booking
  const availableRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (r.roomTypeId !== roomTypeId) return false;
      if (r.status === 'maintenance') return false;
      // Overlap check
      const hasConflict = reservations.some((res) => {
        if (res.status === 'cancelled') return false;
        return res.roomId === r.id && res.checkIn < checkOut && checkIn < res.checkOut;
      });
      return !hasConflict;
    });
  }, [rooms, roomTypeId, reservations, checkIn, checkOut]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !checkIn || !checkOut || !roomTypeId) return;

    const code = `CB-${Math.floor(1000 + Math.random() * 9000)}`;
    const effectiveDeposit = Math.min(depositAmount, calculatedTotal);

    const folio = [
      {
        id: `f-${Date.now()}-room`,
        description: `${selectedRoomType?.name} (${nights} đêm)`,
        amount: calculatedTotal,
        quantity: 1,
        type: 'room' as const,
        date: checkIn,
      },
    ];

    const payments = [];
    if (effectiveDeposit > 0) {
      payments.push({
        id: `p-${Date.now()}-dep`,
        amount: effectiveDeposit,
        method: paymentMethod,
        date: new Date().toISOString().split('T')[0],
        notes: 'Tiền cọc / thanh toán ban đầu lúc tạo đặt phòng',
      });
    }

    const newRes: Reservation = {
      id: `res-${Date.now()}`,
      code,
      guestName,
      guestEmail: guestEmail || `${guestName.toLowerCase().replace(/\s+/g, '')}@guest.local`,
      guestPhone: guestPhone || 'Chưa cung cấp',
      guestCountry: 'Vietnam',
      roomTypeId,
      roomId: roomId || (availableRooms[0] ? availableRooms[0].id : undefined),
      checkIn,
      checkOut,
      nights,
      adults,
      children,
      status: 'confirmed',
      channel,
      totalAmount: calculatedTotal,
      paidAmount: effectiveDeposit,
      paymentStatus: effectiveDeposit >= calculatedTotal ? 'paid' : effectiveDeposit > 0 ? 'partial' : 'pending',
      specialRequests,
      createdAt: new Date().toISOString().split('T')[0],
      folio,
      payments,
    };

    onCreate(newRes);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Tạo Đặt phòng Mới (PMS Front Desk)</h2>
            <p className="text-xs text-slate-500">
              Nhập thông tin đặt phòng trực tiếp tại quầy hoặc qua điện thoại.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 text-xs">
          {/* Guest info */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              1. Thông tin khách lưu trú
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên khách *</label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Vd: Hoàng Trọng Nam"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="0905 123 456"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="nam@email.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Dates & Channel */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              2. Kênh đặt & Thời gian
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kênh đặt phòng</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as ChannelType)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="Direct">Trực tiếp (Direct Walk-in)</option>
                  <option value="Booking.com">Booking.com</option>
                  <option value="Agoda">Agoda</option>
                  <option value="Expedia">Expedia</option>
                  <option value="Airbnb">Airbnb</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ngày nhận (Check-in)</label>
                <input
                  type="date"
                  required
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ngày trả (Check-out)</label>
                <input
                  type="date"
                  required
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Khách ({nights} đêm)</label>
                <div className="flex gap-2">
                  <select
                    value={adults}
                    onChange={(e) => setAdults(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-2 text-slate-800 font-semibold"
                  >
                    <option value={1}>1 Lớn</option>
                    <option value={2}>2 Lớn</option>
                    <option value={3}>3 Lớn</option>
                    <option value={4}>4 Lớn</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Room Selection */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              3. Chọn Hạng phòng & Số phòng
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Hạng phòng *</label>
                <select
                  value={roomTypeId}
                  onChange={(e) => {
                    setRoomTypeId(e.target.value);
                    setRoomId('');
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name} ({rt.basePrice.toLocaleString('vi-VN')} đ/đêm)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Gán số phòng (Khả dụng: {availableRooms.length} phòng)
                </label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Tự động gán phòng trống --</option>
                  {availableRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Phòng {r.number} (Tầng {r.floor} • {r.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing & Deposit */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900 text-sm">
                Tổng giá phòng tạm tính ({nights} đêm):
              </span>
              <span className="font-mono font-black text-indigo-700 text-base">
                {calculatedTotal.toLocaleString('vi-VN')} VND
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tiền cọc / thanh toán trước (VND)</label>
                <input
                  type="number"
                  min="0"
                  max={calculatedTotal}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hình thức thanh toán cọc</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-semibold cursor-pointer"
                >
                  <option value="card">Thẻ tín dụng / POS</option>
                  <option value="cash">Tiền mặt</option>
                  <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Yêu cầu đặc biệt & Ghi chú</label>
            <textarea
              rows={2}
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Khách đến sớm, cần hỗ trợ xuất hóa đơn VAT..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Anti overbooking prompt */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Ngay khi nhấn tạo đặt phòng, PMS sẽ cập nhật sơ đồ phòng và tự động gửi lệnh trừ tồn kho tới toàn bộ các kênh OTA.
            </span>
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg transition shadow-sm cursor-pointer"
            >
              Xác nhận tạo đặt phòng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
