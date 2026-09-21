import React, { useState } from 'react';
import { 
  X, 
  User, 
  Calendar, 
  CreditCard, 
  Sparkles, 
  Printer, 
  CheckCircle, 
  LogOut, 
  AlertCircle, 
  Send, 
  Copy, 
  Check, 
  DollarSign,
  FileText,
  Building,
  Phone,
  Mail,
  Clock
} from 'lucide-react';
import { Reservation, Room, RoomType, ReservationStatus } from '../types';

interface ReservationDetailModalProps {
  reservation: Reservation | null;
  rooms: Room[];
  roomTypes: RoomType[];
  onClose: () => void;
  onUpdateStatus: (reservationId: string, newStatus: ReservationStatus) => void;
  onAddPayment: (reservationId: string, amount: number, method: string) => void;
}

export const ReservationDetailModal: React.FC<ReservationDetailModalProps> = ({
  reservation,
  rooms,
  roomTypes,
  onClose,
  onUpdateStatus,
  onAddPayment,
}) => {
  if (!reservation) return null;

  const [activeTab, setActiveTab] = useState<'folio' | 'ai_communication'>('folio');
  const [paymentAmount, setPaymentAmount] = useState<number>(reservation.totalAmount - reservation.paidAmount);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [showAddPayment, setShowAddPayment] = useState<boolean>(false);

  // AI Communication state
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiSubjectVi, setAiSubjectVi] = useState<string>('');
  const [aiMessageVi, setAiMessageVi] = useState<string>('');
  const [aiSubjectEn, setAiSubjectEn] = useState<string>('');
  const [aiMessageEn, setAiMessageEn] = useState<string>('');
  const [copiedLang, setCopiedLang] = useState<'vi' | 'en' | null>(null);

  const roomType = roomTypes.find((rt) => rt.id === reservation.roomTypeId);
  const room = rooms.find((r) => r.id === reservation.roomId);

  // Generate AI guest welcome communication
  const handleGenerateAiMessage = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/gemini/guest-communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: reservation.guestName,
          roomNumber: room?.number,
          roomType: roomType?.name,
          checkIn: reservation.checkIn,
          checkOut: reservation.checkOut,
          totalAmount: reservation.totalAmount,
          channel: reservation.channel,
          specialRequests: reservation.specialRequests,
          type: 'welcome_and_checkin_guide',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAiSubjectVi(data.subjectVi || '');
        setAiMessageVi(data.messageVi || '');
        setAiSubjectEn(data.subjectEn || '');
        setAiMessageEn(data.messageEn || '');
      }
    } catch (e) {
      console.error('Failed to generate message:', e);
    } finally {
      setAiLoading(false);
    }
  };

  const copyToClipboard = (text: string, lang: 'vi' | 'en') => {
    navigator.clipboard.writeText(text);
    setCopiedLang(lang);
    setTimeout(() => setCopiedLang(null), 2000);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) return;
    onAddPayment(reservation.id, Number(paymentAmount), paymentMethod);
    setShowAddPayment(false);
  };

  const balanceDue = reservation.totalAmount - reservation.paidAmount;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              {reservation.channel.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">{reservation.guestName}</h2>
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                  {reservation.code}
                </span>
                {reservation.channelBookingRef && (
                  <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    OTA Ref: {reservation.channelBookingRef}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Kênh: <strong>{reservation.channel}</strong> • Tạo lúc: {reservation.createdAt}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action bar (Check-in, Check-out, Print) */}
        <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Trạng thái:</span>
            {reservation.status === 'confirmed' && (
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800">
                Đã xác nhận (Confirmed)
              </span>
            )}
            {reservation.status === 'checked_in' && (
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                Đang ở (Checked In)
              </span>
            )}
            {reservation.status === 'checked_out' && (
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-slate-200 text-slate-700">
                Đã trả phòng (Checked Out)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {reservation.status === 'confirmed' && (
              <button
                onClick={() => onUpdateStatus(reservation.id, 'checked_in')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Check-in nhận phòng</span>
              </button>
            )}

            {reservation.status === 'checked_in' && (
              <button
                onClick={() => onUpdateStatus(reservation.id, 'checked_out')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Check-out trả phòng</span>
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>In hóa đơn (Folio)</span>
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="px-6 border-b border-slate-200 flex gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('folio')}
            className={`py-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'folio'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Hồ sơ & Hóa đơn Folio</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ai_communication');
              if (!aiMessageVi && !aiLoading) {
                handleGenerateAiMessage();
              }
            }}
            className={`py-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ai_communication'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>AI Chăm sóc khách (Bilingual Welcome Letter)</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {activeTab === 'folio' ? (
            <div className="space-y-6">
              {/* Stay & Guest Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">Phòng & Hạng phòng</span>
                  <div className="font-extrabold text-slate-900 text-sm">
                    Phòng {room ? room.number : 'Chưa gán'}
                  </div>
                  <div className="text-indigo-600 font-semibold">{roomType?.name}</div>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5">Thời gian lưu trú</span>
                  <div className="font-bold text-slate-800">
                    {reservation.checkIn} → {reservation.checkOut}
                  </div>
                  <div className="text-slate-500">
                    {reservation.nights} đêm • {reservation.adults} lớn, {reservation.children} trẻ
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5">Thông tin liên hệ</span>
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {reservation.guestPhone}
                  </div>
                  <div className="text-slate-500 flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 text-slate-400" /> {reservation.guestEmail}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5">Tình trạng thanh toán</span>
                  <div className="font-black text-slate-900 text-sm">
                    {balanceDue <= 0 ? (
                      <span className="text-emerald-600 font-bold">Đã thanh toán đủ</span>
                    ) : (
                      <span className="text-rose-600 font-bold">
                        Còn nợ: {balanceDue.toLocaleString('vi-VN')} đ
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500">
                    Đã trả: {reservation.paidAmount.toLocaleString('vi-VN')} đ / {reservation.totalAmount.toLocaleString('vi-VN')} đ
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {reservation.specialRequests && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <strong>Ghi chú & Yêu cầu đặc biệt của khách:</strong> {reservation.specialRequests}
                </div>
              )}

              {/* Folio items table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-900 text-sm">Hạng mục hóa đơn (Guest Folio)</h3>
                  <button
                    onClick={() => setShowAddPayment(true)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    + Thu tiền / Thêm thanh toán
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                        <th className="p-2.5 font-bold">Mô tả dịch vụ</th>
                        <th className="p-2.5 font-bold">Loại</th>
                        <th className="p-2.5 font-bold">Ngày</th>
                        <th className="p-2.5 font-bold text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reservation.folio.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-medium text-slate-800">{item.description}</td>
                          <td className="p-2.5 text-slate-500 uppercase text-[10px] font-bold">
                            {item.type}
                          </td>
                          <td className="p-2.5 text-slate-500">{item.date}</td>
                          <td className={`p-2.5 text-right font-mono font-bold ${item.amount < 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                            {item.amount.toLocaleString('vi-VN')} đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-bold border-t border-slate-200 text-xs">
                        <td colSpan={3} className="p-2.5 text-right">
                          Tổng chi phí Folio:
                        </td>
                        <td className="p-2.5 text-right font-mono text-indigo-700 text-sm">
                          {reservation.totalAmount.toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Payment History */}
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-2">Lịch sử thanh toán</h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                        <th className="p-2.5 font-bold">Hình thức</th>
                        <th className="p-2.5 font-bold">Ngày</th>
                        <th className="p-2.5 font-bold">Ghi chú</th>
                        <th className="p-2.5 font-bold text-right">Số tiền đã thu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reservation.payments.length > 0 ? (
                        reservation.payments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-800 uppercase">{p.method}</td>
                            <td className="p-2.5 text-slate-500">{p.date}</td>
                            <td className="p-2.5 text-slate-500">{p.notes || '-'}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                              +{p.amount.toLocaleString('vi-VN')} đ
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-3 text-center text-slate-400">
                            Chưa có giao dịch thanh toán nào được ghi nhận.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add Payment Modal overlay */}
              {showAddPayment && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Ghi nhận thanh toán mới</span>
                    <button onClick={() => setShowAddPayment(false)} className="text-slate-400 hover:text-slate-600">
                      ✕
                    </button>
                  </div>
                  <form onSubmit={handlePaymentSubmit} className="flex flex-wrap items-center gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1">Số tiền (VND)</label>
                      <input
                        type="number"
                        min="1"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        className="bg-white border border-slate-300 rounded px-2.5 py-1.5 font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1">Phương thức</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="bg-white border border-slate-300 rounded px-2.5 py-1.5 font-semibold text-slate-800"
                      >
                        <option value="cash">Tiền mặt (Cash)</option>
                        <option value="card">Thẻ ngân hàng (POS)</option>
                        <option value="bank_transfer">Chuyển khoản (Bank Transfer)</option>
                        <option value="ota_virtual_card">Thẻ ảo OTA (Virtual Card)</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="mt-4 px-4 py-1.5 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 cursor-pointer"
                    >
                      Lưu thanh toán
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            /* AI Communication Assistant Tab */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Thư Chào mừng & Hướng dẫn nhận phòng cá nhân hóa (Gemini AI)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tự động tạo email / tin nhắn chuẩn mực theo thông tin đặt phòng của khách.
                  </p>
                </div>

                <button
                  onClick={handleGenerateAiMessage}
                  disabled={aiLoading}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                  <span>{aiLoading ? 'AI đang viết...' : 'Tạo lại thư'}</span>
                </button>
              </div>

              {aiLoading ? (
                <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>AI đang soạn thảo thư chào mừng song ngữ...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Vietnamese version */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-bold text-slate-900">Bản Tiếng Việt (VN)</span>
                        <button
                          onClick={() => copyToClipboard(`${aiSubjectVi}\n\n${aiMessageVi}`, 'vi')}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedLang === 'vi' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedLang === 'vi' ? 'Đã sao chép' : 'Sao chép'}</span>
                        </button>
                      </div>
                      <div className="font-semibold text-slate-800">{aiSubjectVi}</div>
                      <pre className="text-slate-600 font-sans whitespace-pre-wrap leading-relaxed">
                        {aiMessageVi}
                      </pre>
                    </div>
                  </div>

                  {/* English version */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-bold text-slate-900">Bản Tiếng Anh (English)</span>
                        <button
                          onClick={() => copyToClipboard(`${aiSubjectEn}\n\n${aiMessageEn}`, 'en')}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedLang === 'en' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedLang === 'en' ? 'Đã sao chép' : 'Sao chép'}</span>
                        </button>
                      </div>
                      <div className="font-semibold text-slate-800">{aiSubjectEn}</div>
                      <pre className="text-slate-600 font-sans whitespace-pre-wrap leading-relaxed">
                        {aiMessageEn}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
