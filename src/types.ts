export type RoomStatus = 'clean' | 'dirty' | 'inspecting' | 'maintenance';

export type ReservationStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';

export type ChannelType = 'Direct' | 'Booking.com' | 'Agoda' | 'Expedia' | 'Airbnb';

export interface RoomType {
  id: string;
  name: string;
  category: string;
  capacity: number;
  bedType: string;
  sizeM2: number;
  basePrice: number;
  image: string;
  description: string;
  amenities: string[];
  totalRooms: number;
}

export interface Room {
  id: string;
  number: string;
  roomTypeId: string;
  floor: number;
  status: RoomStatus;
  notes?: string;
}

export interface FolioItem {
  id: string;
  description: string;
  amount: number;
  quantity: number;
  type: 'room' | 'service' | 'fnb' | 'tax' | 'discount';
  date: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  method: 'cash' | 'card' | 'bank_transfer' | 'ota_virtual_card';
  date: string;
  notes?: string;
}

export interface Reservation {
  id: string;
  code: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestCountry: string;
  roomTypeId: string;
  roomId?: string; // Optional if not yet assigned, or assigned room id
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;
  adults: number;
  children: number;
  status: ReservationStatus;
  channel: ChannelType;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'paid' | 'partial' | 'pending';
  specialRequests?: string;
  createdAt: string;
  channelBookingRef?: string;
  folio: FolioItem[];
  payments: PaymentRecord[];
}

export interface ChannelConnection {
  id: string;
  name: ChannelType;
  iconBg: string;
  status: 'active' | 'syncing' | 'warning' | 'paused';
  markupPercent: number; // e.g. +15% on Booking.com to offset commission
  commissionPercent: number; // e.g. 15%
  lastSyncTime: string;
  latencyMs: number;
  activeListingsCount: number;
  autoSyncEnabled: boolean;
  rateParityStatus: 'in_parity' | 'disparity' | 'direct_cheaper';
}

export interface SyncLogEvent {
  id: string;
  timestamp: string;
  channel: ChannelType;
  eventType: 'inventory_push' | 'rate_update' | 'reservation_in' | 'overbooking_shield_lock';
  status: 'success' | 'warning';
  details: string;
}

export interface DailyRateSetting {
  date: string; // YYYY-MM-DD
  roomTypeId: string;
  rate: number;
  availableRooms: number;
  stopSell: boolean;
  minStay: number;
}

export interface ChannelAllotmentSetting {
  channel: ChannelType | 'ALL';
  roomTypeId: string;
  date: string;
  allotment: number; // Số lượng phòng mở bán trên kênh
  rate: number; // Giá bán trên kênh này
  stopSell: boolean; // Khóa bán
  minStay: number; // Số đêm tối thiểu
}

export interface BulkOtaUpdatePayload {
  channels: (ChannelType | 'ALL')[];
  roomTypeIds: string[];
  startDate: string;
  endDate: string;
  daysOfWeek: number[]; // 0: CN, 1: T2, ..., 6: T7
  allotmentMode?: 'fixed' | 'max_available' | 'keep';
  allotment?: number;
  rateMode?: 'fixed' | 'percentage_adjust' | 'keep';
  fixedRate?: number;
  rateAdjustmentPercent?: number;
  stopSell?: boolean;
  minStay?: number;
}
