import React, { useState, useCallback } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { TapeChartCalendar } from './components/TapeChartCalendar';
import { ChannelManagerView } from './components/ChannelManagerView';
import { DirectBookingEngineView } from './components/DirectBookingEngineView';
import { ReservationListView } from './components/ReservationListView';
import { RateMatrixView } from './components/RateMatrixView';
import { HousekeepingView } from './components/HousekeepingView';
import { AnalyticsView } from './components/AnalyticsView';
import { ReservationDetailModal } from './components/ReservationDetailModal';
import { NewReservationModal } from './components/NewReservationModal';

import { 
  INITIAL_ROOM_TYPES, 
  INITIAL_ROOMS, 
  INITIAL_RESERVATIONS, 
  INITIAL_CHANNELS, 
  INITIAL_SYNC_LOGS,
  getRelativeDate 
} from './data/mockHotelData';

import { 
  Room, 
  RoomType, 
  Reservation, 
  ChannelConnection, 
  SyncLogEvent, 
  RoomStatus, 
  ReservationStatus 
} from './types';
import { ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('tapechart');

  // Core Hotel State
  const [roomTypes] = useState<RoomType[]>(INITIAL_ROOM_TYPES);
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [channels, setChannels] = useState<ChannelConnection[]>(INITIAL_CHANNELS);
  const [syncLogs, setSyncLogs] = useState<SyncLogEvent[]>(INITIAL_SYNC_LOGS);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modals & Selected items
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showNewReservationModal, setShowNewReservationModal] = useState<boolean>(false);
  const [quickBookRoomId, setQuickBookRoomId] = useState<string | undefined>(undefined);
  const [quickBookDate, setQuickBookDate] = useState<string | undefined>(undefined);

  // Floating Toast alert notification
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'shield' } | null>(null);

  const triggerToast = (title: string, desc: string, type: 'success' | 'shield' = 'shield') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Sync All Channels action
  const handleSyncAllChannels = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/channel-sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channels: channels.map((c) => c.name),
          roomInventory: rooms.map((r) => ({ id: r.id, status: r.status })),
          action: 'manual_push_all',
        }),
      });

      const data = await res.json();
      const timeStr = data.syncedAt || new Date().toLocaleTimeString('vi-VN', { hour12: false });

      // Update channels last sync time
      setChannels((prev) =>
        prev.map((ch) => ({
          ...ch,
          lastSyncTime: `Vừa xong (${timeStr})`,
          status: 'active',
        }))
      );

      // Add log
      const newLog: SyncLogEvent = {
        id: `log-${Date.now()}`,
        timestamp: timeStr,
        channel: 'Booking.com',
        eventType: 'rate_update',
        status: 'success',
        details: `Đã đẩy toàn bộ giá phòng và tồn kho ${rooms.length} phòng lên 5 kênh kết nối. Parity 100%.`,
      };
      setSyncLogs((prev) => [newLog, ...prev]);

      triggerToast(
        'Đồng bộ hoàn tất thành công',
        'Lịch trống và giá phòng đã cập nhật trên Booking.com, Agoda, Expedia, Airbnb và Booking Engine.',
        'success'
      );
    } catch (e) {
      console.error('Channel sync error:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [channels, rooms]);

  // Simulate an inbound booking from an OTA (e.g. Agoda / Booking.com)
  const handleSimulateInboundOtaBooking = useCallback((channelName: 'Booking.com' | 'Agoda' | 'Expedia') => {
    // Find an unoccupied room for tomorrow
    const checkInDate = getRelativeDate(1);
    const checkOutDate = getRelativeDate(3);

    const availableRoom = rooms.find((r) => {
      if (r.status === 'maintenance') return false;
      const isBooked = reservations.some((res) => {
        if (res.status === 'cancelled') return false;
        return res.roomId === r.id && res.checkIn < checkOutDate && checkInDate < res.checkOut;
      });
      return !isBooked;
    });

    if (!availableRoom) {
      alert('Tất cả phòng trong ngày này đã kín!');
      return;
    }

    const rType = roomTypes.find((t) => t.id === availableRoom.roomTypeId) || roomTypes[0];
    const simulatedNames = ['Thomas Edison', 'Emma Watson', 'Nguyễn Thu Trang', 'Michael Chang', 'Elena Rostova'];
    const randomGuest = simulatedNames[Math.floor(Math.random() * simulatedNames.length)];
    const bookingCode = `${channelName === 'Booking.com' ? 'BDC' : channelName === 'Agoda' ? 'AGD' : 'EXP'}-${Math.floor(100000 + Math.random() * 900000)}`;

    const total = rType.basePrice * 2 * 1.15;

    const newRes: Reservation = {
      id: `res-sim-${Date.now()}`,
      code: `CB-${Math.floor(1000 + Math.random() * 9000)}`,
      channelBookingRef: bookingCode,
      guestName: randomGuest,
      guestEmail: `${randomGuest.toLowerCase().replace(/\s+/g, '')}@ota-guest.com`,
      guestPhone: '+84 905 888 999',
      guestCountry: 'International',
      roomTypeId: rType.id,
      roomId: availableRoom.id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights: 2,
      adults: 2,
      children: 0,
      status: 'confirmed',
      channel: channelName,
      totalAmount: total,
      paidAmount: total,
      paymentStatus: 'paid',
      specialRequests: `Đơn đặt từ ${channelName} API Webhook. Khách yêu cầu phòng yên tĩnh.`,
      createdAt: new Date().toISOString().split('T')[0],
      folio: [
        {
          id: `f-${Date.now()}`,
          description: `${rType.name} (2 đêm qua ${channelName})`,
          amount: total,
          quantity: 1,
          type: 'room',
          date: checkInDate,
        },
      ],
      payments: [
        {
          id: `p-${Date.now()}`,
          amount: total,
          method: 'ota_virtual_card',
          date: new Date().toISOString().split('T')[0],
          notes: `${channelName} Virtual Credit Card Payout`,
        },
      ],
    };

    setReservations((prev) => [newRes, ...prev]);

    // Create sync logs showing the Overbooking Shield in action
    const timeNow = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    const inboundLog: SyncLogEvent = {
      id: `log-${Date.now()}-in`,
      timestamp: timeNow,
      channel: channelName,
      eventType: 'reservation_in',
      status: 'success',
      details: `[OTA Inbound] Đơn mới ${bookingCode} (${randomGuest}) cho phòng ${availableRoom.number}. Kích hoạt Overbooking Shield tức thì.`,
    };

    const lockLog: SyncLogEvent = {
      id: `log-${Date.now()}-lock`,
      timestamp: timeNow,
      channel: channelName === 'Agoda' ? 'Booking.com' : 'Agoda',
      eventType: 'overbooking_shield_lock',
      status: 'success',
      details: `[Overbooking Shield] Tự động khóa tồn kho phòng ${availableRoom.number} trên các kênh còn lại (Thời gian phản hồi: 140ms).`,
    };

    setSyncLogs((prev) => [lockLog, inboundLog, ...prev]);

    triggerToast(
      `Đơn đặt mới từ ${channelName}!`,
      `Khách ${randomGuest} đã đặt phòng ${availableRoom.number}. Overbooking Shield đã khóa phòng trên toàn bộ các kênh khác trong 140ms.`,
      'shield'
    );
  }, [rooms, reservations, roomTypes]);

  // Complete Direct Booking
  const handleCompleteDirectBooking = useCallback((newReservation: Reservation) => {
    setReservations((prev) => [newReservation, ...prev]);

    const timeNow = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    const log: SyncLogEvent = {
      id: `log-${Date.now()}`,
      timestamp: timeNow,
      channel: 'Direct',
      eventType: 'reservation_in',
      status: 'success',
      details: `[Direct Booking Engine] Đơn ${newReservation.code} (${newReservation.guestName}) đã vào PMS. Tự động giảm tồn kho phòng trên Booking.com & Agoda.`,
    };
    setSyncLogs((prev) => [log, ...prev]);

    triggerToast(
      'Đặt phòng trực tiếp thành công!',
      `Đơn ${newReservation.code} đã cập nhật trên PMS Tape Chart và khóa phòng trên các kênh OTA.`,
      'shield'
    );
  }, []);

  // Update reservation status (check in, check out, cancel)
  const handleUpdateReservationStatus = useCallback((resId: string, newStatus: ReservationStatus) => {
    setReservations((prev) =>
      prev.map((r) => {
        if (r.id === resId) {
          return { ...r, status: newStatus };
        }
        return r;
      })
    );

    // If checked out, automatically mark room as dirty
    if (newStatus === 'checked_out') {
      const res = reservations.find((r) => r.id === resId);
      if (res && res.roomId) {
        setRooms((prev) =>
          prev.map((rm) => (rm.id === res.roomId ? { ...rm, status: 'dirty' } : rm))
        );
      }
    }

    if (selectedReservation && selectedReservation.id === resId) {
      setSelectedReservation((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  }, [reservations, selectedReservation]);

  // Add payment to reservation
  const handleAddPayment = useCallback((resId: string, amount: number, method: string) => {
    setReservations((prev) =>
      prev.map((r) => {
        if (r.id === resId) {
          const newPaid = r.paidAmount + amount;
          const newPaymentStatus = newPaid >= r.totalAmount ? 'paid' : 'partial';
          const newPayment = {
            id: `p-${Date.now()}`,
            amount,
            method: method as any,
            date: new Date().toISOString().split('T')[0],
            notes: 'Thu ngân thanh toán tại quầy',
          };
          return {
            ...r,
            paidAmount: newPaid,
            paymentStatus: newPaymentStatus,
            payments: [...r.payments, newPayment],
          };
        }
        return r;
      })
    );

    if (selectedReservation && selectedReservation.id === resId) {
      setSelectedReservation((prev) => {
        if (!prev) return null;
        const newPaid = prev.paidAmount + amount;
        return {
          ...prev,
          paidAmount: newPaid,
          paymentStatus: newPaid >= prev.totalAmount ? 'paid' : 'partial',
          payments: [
            ...prev.payments,
            {
              id: `p-${Date.now()}`,
              amount,
              method: method as any,
              date: new Date().toISOString().split('T')[0],
              notes: 'Thu ngân thanh toán tại quầy',
            },
          ],
        };
      });
    }
  }, [selectedReservation]);

  // Housekeeping room status update
  const handleUpdateRoomStatus = useCallback((roomId: string, newStatus: RoomStatus) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r))
    );
  }, []);

  // Channel markup update
  const handleUpdateMarkup = useCallback((channelId: string, newMarkup: number) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === channelId ? { ...ch, markupPercent: newMarkup } : ch))
    );
  }, []);

  // Channel auto-sync toggle
  const handleToggleChannelAutoSync = useCallback((channelId: string) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === channelId ? { ...ch, autoSyncEnabled: !ch.autoSyncEnabled } : ch))
    );
  }, []);

  // Quick book from tape chart cell
  const handleQuickBook = (roomId: string, date: string) => {
    setQuickBookRoomId(roomId);
    setQuickBookDate(date);
    setShowNewReservationModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navbar with live pulse & tabs */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewReservation={() => {
          setQuickBookRoomId(undefined);
          setQuickBookDate(undefined);
          setShowNewReservationModal(true);
        }}
        onSyncAllChannels={handleSyncAllChannels}
        isSyncing={isSyncing}
        activeChannelsCount={channels.filter((c) => c.autoSyncEnabled).length}
        totalChannelsCount={channels.length}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 overflow-x-hidden">
        {activeTab === 'tapechart' && (
          <TapeChartCalendar
            rooms={rooms}
            roomTypes={roomTypes}
            reservations={reservations}
            onSelectReservation={(res) => setSelectedReservation(res)}
            onQuickBook={handleQuickBook}
            onUpdateRoomStatus={handleUpdateRoomStatus}
          />
        )}

        {activeTab === 'channels' && (
          <ChannelManagerView
            channels={channels}
            syncLogs={syncLogs}
            roomTypes={roomTypes}
            onToggleChannelAutoSync={handleToggleChannelAutoSync}
            onUpdateMarkup={handleUpdateMarkup}
            onTriggerFullSync={handleSyncAllChannels}
            onSimulateInboundOtaBooking={handleSimulateInboundOtaBooking}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'booking_engine' && (
          <DirectBookingEngineView
            roomTypes={roomTypes}
            rooms={rooms}
            reservations={reservations}
            onCompleteDirectBooking={handleCompleteDirectBooking}
          />
        )}

        {activeTab === 'reservations' && (
          <ReservationListView
            reservations={reservations}
            rooms={rooms}
            roomTypes={roomTypes}
            onSelectReservation={(res) => setSelectedReservation(res)}
            onNewReservation={() => {
              setQuickBookRoomId(undefined);
              setQuickBookDate(undefined);
              setShowNewReservationModal(true);
            }}
          />
        )}

        {activeTab === 'ratematrix' && (
          <RateMatrixView
            roomTypes={roomTypes}
            onTriggerSync={handleSyncAllChannels}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'housekeeping' && (
          <HousekeepingView
            rooms={rooms}
            roomTypes={roomTypes}
            onUpdateStatus={handleUpdateRoomStatus}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            reservations={reservations}
            rooms={rooms}
            roomTypes={roomTypes}
            channels={channels}
          />
        )}
      </main>

      {/* Reservation Detail & Folio Modal */}
      {selectedReservation && (
        <ReservationDetailModal
          reservation={selectedReservation}
          rooms={rooms}
          roomTypes={roomTypes}
          onClose={() => setSelectedReservation(null)}
          onUpdateStatus={handleUpdateReservationStatus}
          onAddPayment={handleAddPayment}
        />
      )}

      {/* New Reservation Modal */}
      {showNewReservationModal && (
        <NewReservationModal
          rooms={rooms}
          roomTypes={roomTypes}
          reservations={reservations}
          initialRoomId={quickBookRoomId}
          initialDate={quickBookDate}
          onClose={() => setShowNewReservationModal(false)}
          onCreate={(newRes) => {
            setReservations((prev) => [newRes, ...prev]);
            triggerToast(
              'Tạo đặt phòng thành công',
              `Đơn ${newRes.code} (${newRes.guestName}) đã được thêm vào PMS và gửi lệnh trừ tồn kho tới OTA.`,
              'shield'
            );
          }}
        />
      )}

      {/* Floating Toast Notification for Overbooking Shield & Channel Sync */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 text-white rounded-2xl shadow-2xl p-4 border border-slate-700 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="font-extrabold text-sm text-white flex items-center justify-between">
                <span>{toastMessage.title}</span>
                <button
                  onClick={() => setToastMessage(null)}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer ml-2"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {toastMessage.desc}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
