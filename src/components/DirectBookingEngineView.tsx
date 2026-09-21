import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Users, 
  Sparkles, 
  Check, 
  ShieldCheck, 
  CreditCard, 
  ArrowRight, 
  ChevronRight, 
  Percent, 
  Coffee, 
  Car, 
  Heart,
  MapPin,
  Star,
  CheckCircle2,
  Lock,
  Tag
} from 'lucide-react';
import { RoomType, Room, Reservation, FolioItem } from '../types';
import { getRelativeDate } from '../data/mockHotelData';

interface DirectBookingEngineViewProps {
  roomTypes: RoomType[];
  rooms: Room[];
  reservations: Reservation[];
  onCompleteDirectBooking: (newReservation: Reservation) => void;
}

export const DirectBookingEngineView: React.FC<DirectBookingEngineViewProps> = ({
  roomTypes,
  rooms,
  reservations,
  onCompleteDirectBooking,
}) => {
  // Search parameters
  const [checkIn, setCheckIn] = useState<string>(getRelativeDate(1));
  const [checkOut, setCheckOut] = useState<string>(getRelativeDate(3));
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [promoCode, setPromoCode] = useState<string>('DIRECT10');
  const [promoApplied, setPromoApplied] = useState<boolean>(true);

  // Booking process step
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>(['addon-breakfast']);

  // Guest details form
  const [guestName, setGuestName] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedBooking, setCompletedBooking] = useState<Reservation | null>(null);

  // Calculate nights
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [checkIn, checkOut]);

  // Check available count for each room type during the selected dates
  const roomAvailability = useMemo(() => {
    const map = new Map<string, number>();
    roomTypes.forEach((rt) => {
      // Find all physical rooms of this room type
      const totalOfThisType = rooms.filter((r) => r.roomTypeId === rt.id && r.status !== 'maintenance');
      // Count how many are occupied in the chosen date range
      const occupiedRooms = new Set<string>();
      reservations.forEach((res) => {
        if (res.status === 'cancelled') return false;
        if (res.roomTypeId === rt.id && res.roomId) {
          // Check date overlap
          if (res.checkIn < checkOut && checkIn < res.checkOut) {
            occupiedRooms.add(res.roomId);
          }
        }
      });
      const available = Math.max(0, totalOfThisType.length - occupiedRooms.size);
      map.set(rt.id, available);
    });
    return map;
  }, [roomTypes, rooms, reservations, checkIn, checkOut]);

  // Add-ons list
  const availableAddons = [
    {
      id: 'addon-breakfast',
      name: 'Buffet Bữa Sáng Cao Cấp & Cà phê Đặc Sản',
      price: 150000,
      unit: 'khách / ngày',
      icon: Coffee,
      desc: 'Hơn 45 món Á - Âu, hải sản tươi và tráng miệng phong phú tại nhà hàng Lotus.',
    },
    {
      id: 'addon-airport',
      name: 'Đón sân bay Đà Nẵng 1 chiều (Xe Sedan 4 chỗ cao cấp)',
      price: 350000,
      unit: 'chuyến',
      icon: Car,
      desc: 'Tài xế đón tận sảnh với bảng tên, nước suối và khăn lạnh.',
    },
    {
      id: 'addon-spa',
      name: 'Gói Trị Liệu Spa & Massage Thư Giãn (60 phút)',
      price: 450000,
      unit: 'khách',
      icon: Heart,
      desc: 'Massage thảo dược cổ truyền giảm mệt mỏi sau chuyến bay dài.',
    },
  ];

  // Pricing calculations
  const calculateTotal = (rt: RoomType) => {
    const baseRoomTotal = rt.basePrice * nights;
    const discount = promoApplied ? baseRoomTotal * 0.1 : 0;
    const roomCostAfterDiscount = baseRoomTotal - discount;

    let addonsCost = 0;
    if (selectedAddons.includes('addon-breakfast')) {
      addonsCost += 150000 * adults * nights;
    }
    if (selectedAddons.includes('addon-airport')) {
      addonsCost += 350000;
    }
    if (selectedAddons.includes('addon-spa')) {
      addonsCost += 450000 * adults;
    }

    return {
      baseRoomTotal,
      discount,
      roomCostAfterDiscount,
      addonsCost,
      grandTotal: roomCostAfterDiscount + addonsCost,
    };
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomType || !guestName || !guestEmail || !guestPhone) return;

    setIsSubmitting(true);

    const pricing = calculateTotal(selectedRoomType);
    const bookingCode = `CB-${Math.floor(1000 + Math.random() * 9000)}`;

    // Find first available physical room of this type
    const availableRooms = rooms.filter((r) => {
      if (r.roomTypeId !== selectedRoomType.id || r.status === 'maintenance') return false;
      const isOccupied = reservations.some((res) => {
        if (res.status === 'cancelled') return false;
        return res.roomId === r.id && res.checkIn < checkOut && checkIn < res.checkOut;
      });
      return !isOccupied;
    });

    const assignedRoom = availableRooms[0];

    // Build folio
    const folio: FolioItem[] = [
      {
        id: `f-${Date.now()}-1`,
        description: `${selectedRoomType.name} (${nights} đêm)`,
        amount: pricing.baseRoomTotal,
        quantity: 1,
        type: 'room',
        date: checkIn,
      },
    ];

    if (pricing.discount > 0) {
      folio.push({
        id: `f-${Date.now()}-disc`,
        description: 'Ưu đãi Đặt phòng trực tiếp Direct Booking (-10%)',
        amount: -pricing.discount,
        quantity: 1,
        type: 'discount',
        date: checkIn,
      });
    }

    if (selectedAddons.includes('addon-breakfast')) {
      folio.push({
        id: `f-${Date.now()}-bf`,
        description: `Buffet Bữa Sáng (${adults} khách x ${nights} đêm)`,
        amount: 150000 * adults * nights,
        quantity: 1,
        type: 'fnb',
        date: checkIn,
      });
    }

    if (selectedAddons.includes('addon-airport')) {
      folio.push({
        id: `f-${Date.now()}-air`,
        description: 'Đón sân bay Đà Nẵng 1 chiều',
        amount: 350000,
        quantity: 1,
        type: 'service',
        date: checkIn,
      });
    }

    if (selectedAddons.includes('addon-spa')) {
      folio.push({
        id: `f-${Date.now()}-spa`,
        description: `Gói Massage Thư Giãn (${adults} khách)`,
        amount: 450000 * adults,
        quantity: 1,
        type: 'service',
        date: checkIn,
      });
    }

    const newRes: Reservation = {
      id: `res-direct-${Date.now()}`,
      code: bookingCode,
      guestName,
      guestEmail,
      guestPhone,
      guestCountry: 'Vietnam',
      roomTypeId: selectedRoomType.id,
      roomId: assignedRoom ? assignedRoom.id : undefined,
      checkIn,
      checkOut,
      nights,
      adults,
      children,
      status: 'confirmed',
      channel: 'Direct',
      totalAmount: pricing.grandTotal,
      paidAmount: pricing.grandTotal,
      paymentStatus: 'paid',
      specialRequests,
      createdAt: new Date().toISOString().split('T')[0],
      folio,
      payments: [
        {
          id: `p-${Date.now()}`,
          amount: pricing.grandTotal,
          method: 'card',
          date: new Date().toISOString().split('T')[0],
          notes: 'Thanh toán trực tiếp qua Cổng thanh toán Booking Engine',
        },
      ],
    };

    setTimeout(() => {
      onCompleteDirectBooking(newRes);
      setCompletedBooking(newRes);
      setIsSubmitting(false);
    }, 600);
  };

  // If booking succeeded, show luxury confirmation screen
  if (completedBooking) {
    return (
      <div className="max-w-2xl mx-auto my-8 p-6 bg-white rounded-2xl border border-emerald-200 shadow-lg text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Đặt phòng trực tiếp thành công (0% Phí hoa hồng)
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">
            Cảm ơn Quý khách {completedBooking.guestName}!
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Đơn đặt phòng của Quý khách đã được xác nhận tức thì và đồng bộ vào hệ thống quản lý PMS của khách sạn.
          </p>
        </div>

        {/* Voucher card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <span className="text-slate-500 font-medium">Mã đặt phòng (Booking Code):</span>
              <div className="font-mono text-lg font-black text-indigo-700">{completedBooking.code}</div>
            </div>
            <div className="text-right">
              <span className="text-slate-500 font-medium">Kênh đặt:</span>
              <div className="font-bold text-emerald-700">Direct Booking Engine</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-500">Khách lưu trú:</span>
              <div className="font-bold text-slate-800">{completedBooking.guestName}</div>
              <div className="text-slate-500">{completedBooking.guestPhone}</div>
            </div>
            <div>
              <span className="text-slate-500">Hạng phòng & Số phòng:</span>
              <div className="font-bold text-slate-800">
                {roomTypes.find((r) => r.id === completedBooking.roomTypeId)?.name}
              </div>
              <div className="text-indigo-600 font-semibold">
                Phòng: {rooms.find((r) => r.id === completedBooking.roomId)?.number || 'Sắp xếp khi check-in'}
              </div>
            </div>
            <div>
              <span className="text-slate-500">Nhận phòng (Check-in):</span>
              <div className="font-bold text-slate-800">{completedBooking.checkIn} (14:00)</div>
            </div>
            <div>
              <span className="text-slate-500">Trả phòng (Check-out):</span>
              <div className="font-bold text-slate-800">{completedBooking.checkOut} (12:00)</div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3 flex items-center justify-between font-bold text-sm">
            <span>Tổng thanh toán đã xác nhận:</span>
            <span className="text-indigo-700 font-mono text-base">
              {completedBooking.totalAmount.toLocaleString('vi-VN')} VND
            </span>
          </div>
        </div>

        {/* Sync notification */}
        <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center gap-3 text-left">
          <ShieldCheck className="w-6 h-6 text-indigo-600 shrink-0" />
          <div>
            <strong>Đã kích hoạt Overbooking Shield:</strong> Hệ thống vừa tự động gửi tín hiệu giảm tồn kho phòng tới Booking.com, Agoda và Expedia trong vòng 0.2s để đảm bảo không ai có thể đặt trùng phòng này nữa.
          </div>
        </div>

        <button
          onClick={() => {
            setCompletedBooking(null);
            setSelectedRoomType(null);
          }}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition cursor-pointer"
        >
          Đặt thêm phòng khác
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-full pb-12">
      {/* Hospitality Hotel Hero Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white py-10 px-4 lg:px-8 shadow-inner">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <span>Khách sạn & Khu nghỉ dưỡng 4 Sao Cao Cấp</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                Grand Lotus Boutique Hotel & Spa Đà Nẵng
              </h1>
              <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                288 Đường Võ Nguyên Giáp, Bãi biển Mỹ Khê, Đà Nẵng
              </p>
            </div>

            {/* Direct Booking Privilege Badge */}
            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3.5 text-xs text-emerald-300 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-base">
                %
              </div>
              <div>
                <div className="font-extrabold text-white text-sm">Đặc quyền Đặt phòng Trực tiếp</div>
                <div>Giảm ngay 10% so với OTA • Miễn phí Bữa sáng & Check-out trễ</div>
              </div>
            </div>
          </div>

          {/* Booking Search Form Bar */}
          <div className="bg-white text-slate-800 rounded-2xl p-4 shadow-xl border border-slate-200 mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Nhận phòng (Check-in)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Trả phòng (Check-out)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Số khách ({nights} đêm)
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value={1}>1 Người lớn</option>
                  <option value={2}>2 Người lớn</option>
                  <option value={3}>3 Người lớn</option>
                  <option value={4}>4 Người lớn</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Mã ưu đãi (Promo Code)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Mã giảm giá..."
                  className="w-full text-xs font-mono font-bold uppercase bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setPromoApplied(promoCode === 'DIRECT10')}
                className="w-full h-[42px] bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>Cập nhật giá ({nights} đêm)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Room Catalog or Reservation Checkout */}
      <div className="max-w-6xl mx-auto px-4 lg:px-8 mt-8">
        {!selectedRoomType ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Hạng phòng khả dụng ({checkIn} đến {checkOut})
                </h2>
                <p className="text-xs text-slate-500">
                  Giá trực tiếp đã giảm 10% so với Booking.com và Agoda, bao gồm bảo hiểm phòng & hỗ trợ 24/7.
                </p>
              </div>

              {promoApplied && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-100 px-3 py-1 rounded-full">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Đã áp dụng mã DIRECT10 (-10%)</span>
                </div>
              )}
            </div>

            {/* Room cards list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {roomTypes.map((rt) => {
                const availableCount = roomAvailability.get(rt.id) ?? 0;
                const pricing = calculateTotal(rt);
                const otaPriceNight = Math.round(rt.basePrice * 1.15); // Simulated Booking.com price with 15% markup
                const directPriceNight = Math.round(rt.basePrice * 0.9); // Direct booking discount

                return (
                  <div
                    key={rt.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Image banner */}
                      <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                        <img
                          src={rt.image}
                          alt={rt.name}
                          className="w-full h-full object-cover hover:scale-105 transition duration-500"
                        />
                        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                          {rt.sizeM2} m² • {rt.bedType}
                        </div>

                        {availableCount > 0 ? (
                          <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                            Còn {availableCount} phòng trống
                          </div>
                        ) : (
                          <div className="absolute top-3 right-3 bg-rose-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                            Hết phòng ngày này
                          </div>
                        )}
                      </div>

                      {/* Room Content */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-extrabold text-lg text-slate-900">{rt.name}</h3>
                            <p className="text-xs text-slate-500 line-clamp-2 mt-1">{rt.description}</p>
                          </div>
                        </div>

                        {/* Amenities pills */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {rt.amenities.slice(0, 4).map((a, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1"
                            >
                              <Check className="w-3 h-3 text-emerald-600" />
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Footer Rate & Action */}
                    <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-slate-400 line-through">
                          Giá OTA: {otaPriceNight.toLocaleString('vi-VN')} đ
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl font-black text-indigo-700">
                            {directPriceNight.toLocaleString('vi-VN')} đ
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">/ đêm</span>
                        </div>
                        <div className="text-[10px] text-emerald-600 font-bold">
                          Tiết kiệm {(otaPriceNight - directPriceNight).toLocaleString('vi-VN')} đ / đêm
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedRoomType(rt)}
                        disabled={availableCount === 0}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span>{availableCount > 0 ? 'Chọn đặt phòng' : 'Hết phòng'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Step 2: Checkout & Guest Form */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Guest Info & Add-ons selection */}
            <div className="lg:col-span-2 space-y-6">
              <button
                onClick={() => setSelectedRoomType(null)}
                className="text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
              >
                ← Quay lại danh sách phòng
              </button>

              {/* Guest Form */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-3">
                  1. Thông tin khách đặt phòng (Instant PMS Sync)
                </h3>

                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Họ và tên khách *</label>
                      <input
                        type="text"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Số điện thoại liên hệ *</label>
                      <input
                        type="tel"
                        required
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="0912 345 678"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Địa chỉ Email xác nhận *</label>
                      <input
                        type="email"
                        required
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="nguyenvana@gmail.com"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Yêu cầu đặc biệt (Tùy chọn)</label>
                      <textarea
                        rows={2}
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Ví dụ: Giường đôi lớn, phòng tầng cao, check-in trễ khoảng 18h..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </form>
              </div>

              {/* Add-ons selection */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-3">
                  2. Dịch vụ bổ sung trải nghiệm nghỉ dưỡng
                </h3>

                <div className="space-y-3">
                  {availableAddons.map((addon) => {
                    const isSelected = selectedAddons.includes(addon.id);
                    const Icon = addon.icon;

                    return (
                      <div
                        key={addon.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedAddons(selectedAddons.filter((id) => id !== addon.id));
                          } else {
                            setSelectedAddons([...selectedAddons, addon.id]);
                          }
                        }}
                        className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-300'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{addon.name}</div>
                            <div className="text-xs text-slate-500">{addon.desc}</div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-extrabold text-indigo-700 text-sm">
                            +{addon.price.toLocaleString('vi-VN')} đ
                          </div>
                          <span className="text-[10px] text-slate-400">{addon.unit}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Folio Summary Card */}
            <div>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md sticky top-24 space-y-5">
                <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-3">
                  Tóm tắt đặt phòng
                </h3>

                {/* Selected room preview */}
                <div className="flex items-center gap-3">
                  <img
                    src={selectedRoomType.image}
                    alt={selectedRoomType.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{selectedRoomType.name}</h4>
                    <p className="text-xs text-slate-500">
                      {nights} đêm ({checkIn} → {checkOut})
                    </p>
                    <p className="text-xs text-slate-500">{adults} người lớn</p>
                  </div>
                </div>

                {/* Pricing calculation */}
                {(() => {
                  const p = calculateTotal(selectedRoomType);
                  return (
                    <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                      <div className="flex justify-between text-slate-600">
                        <span>Giá phòng ({nights} đêm):</span>
                        <span>{p.baseRoomTotal.toLocaleString('vi-VN')} đ</span>
                      </div>

                      {p.discount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span>Ưu đãi đặt trực tiếp (-10%):</span>
                          <span>-{p.discount.toLocaleString('vi-VN')} đ</span>
                        </div>
                      )}

                      {p.addonsCost > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Dịch vụ cộng thêm:</span>
                          <span>+{p.addonsCost.toLocaleString('vi-VN')} đ</span>
                        </div>
                      )}

                      <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                        <span className="font-extrabold text-slate-900 text-sm">Tổng thanh toán:</span>
                        <span className="font-black text-xl text-indigo-700 font-mono">
                          {p.grandTotal.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Anti-overbooking guarantee note */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Xác nhận tức thì & Khóa phòng an toàn</span>
                  </div>
                  <p className="text-emerald-700">
                    Phòng được giữ ngay lập tức trên PMS và khóa tự động trên Booking.com & Agoda.
                  </p>
                </div>

                <button
                  onClick={handleBookingSubmit}
                  disabled={isSubmitting || !guestName || !guestEmail || !guestPhone}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Đang gửi vào PMS...' : 'Xác nhận đặt phòng ngay'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
