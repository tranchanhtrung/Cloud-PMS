import React from 'react';
import { BedDouble, CheckCircle2, AlertTriangle, Clock, Wrench, Sparkles, Filter } from 'lucide-react';
import { Room, RoomType, RoomStatus } from '../types';

interface HousekeepingViewProps {
  rooms: Room[];
  roomTypes: RoomType[];
  onUpdateStatus: (roomId: string, status: RoomStatus) => void;
}

export const HousekeepingView: React.FC<HousekeepingViewProps> = ({
  rooms,
  roomTypes,
  onUpdateStatus,
}) => {
  const cleanRooms = rooms.filter((r) => r.status === 'clean');
  const dirtyRooms = rooms.filter((r) => r.status === 'dirty');
  const inspectingRooms = rooms.filter((r) => r.status === 'inspecting');
  const maintenanceRooms = rooms.filter((r) => r.status === 'maintenance');

  const columns: {
    status: RoomStatus;
    title: string;
    rooms: Room[];
    color: string;
    badgeBg: string;
    icon: any;
  }[] = [
    {
      status: 'clean',
      title: 'Phòng Sạch (Clean & Ready)',
      rooms: cleanRooms,
      color: 'border-emerald-500 text-emerald-700',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      icon: CheckCircle2,
    },
    {
      status: 'dirty',
      title: 'Phòng Bẩn (Needs Cleaning)',
      rooms: dirtyRooms,
      color: 'border-amber-500 text-amber-700',
      badgeBg: 'bg-amber-100 text-amber-800',
      icon: Clock,
    },
    {
      status: 'inspecting',
      title: 'Đang Kiểm Tra (Inspecting)',
      rooms: inspectingRooms,
      color: 'border-blue-500 text-blue-700',
      badgeBg: 'bg-blue-100 text-blue-800',
      icon: Sparkles,
    },
    {
      status: 'maintenance',
      title: 'Bảo Trì (Out of Order)',
      rooms: maintenanceRooms,
      color: 'border-rose-500 text-rose-700',
      badgeBg: 'bg-rose-100 text-rose-800',
      icon: Wrench,
    },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900">Quản lý Buồng phòng (Housekeeping Board)</h1>
          <p className="text-xs text-slate-500">
            Cập nhật tức thì trạng thái phòng giữa bộ phận Buồng phòng và Lễ tân PMS.
          </p>
        </div>

        {/* Quick progress */}
        <div className="flex items-center gap-3 bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs shadow-2xs font-semibold">
          <span>Tiến độ sẵn sàng đón khách:</span>
          <span className="font-extrabold text-emerald-700">
            {cleanRooms.length} / {rooms.length} phòng sạch ({Math.round((cleanRooms.length / rooms.length) * 100)}%)
          </span>
        </div>
      </div>

      {/* 4 Column Kanban */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const Icon = col.icon;

          return (
            <div
              key={col.status}
              className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 flex flex-col min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${col.color}`} />
                  <h3 className="font-bold text-xs text-slate-800">{col.title}</h3>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-black ${col.badgeBg}`}>
                  {col.rooms.length}
                </span>
              </div>

              {/* Room Cards List */}
              <div className="space-y-3 mt-3 flex-1 overflow-y-auto custom-scrollbar pr-0.5">
                {col.rooms.map((room) => {
                  const rt = roomTypes.find((t) => t.id === room.roomTypeId);

                  return (
                    <div
                      key={room.id}
                      className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2 hover:shadow-xs transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-lg font-black text-slate-900">Phòng {room.number}</div>
                          <div className="text-[11px] text-indigo-700 font-semibold">{rt?.name}</div>
                          <div className="text-[10px] text-slate-400">Tầng {room.floor}</div>
                        </div>
                      </div>

                      {room.notes && (
                        <p className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-100">
                          {room.notes}
                        </p>
                      )}

                      {/* Quick status change buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] gap-1">
                        {col.status !== 'clean' && (
                          <button
                            onClick={() => onUpdateStatus(room.id, 'clean')}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded cursor-pointer transition"
                          >
                            ✓ Sạch
                          </button>
                        )}
                        {col.status !== 'dirty' && (
                          <button
                            onClick={() => onUpdateStatus(room.id, 'dirty')}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded cursor-pointer transition"
                          >
                            Bẩn
                          </button>
                        )}
                        {col.status !== 'inspecting' && (
                          <button
                            onClick={() => onUpdateStatus(room.id, 'inspecting')}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded cursor-pointer transition"
                          >
                            Kiểm tra
                          </button>
                        )}
                        {col.status !== 'maintenance' && (
                          <button
                            onClick={() => onUpdateStatus(room.id, 'maintenance')}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded cursor-pointer transition"
                          >
                            Bảo trì
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {col.rooms.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs italic">
                    Không có phòng nào
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
