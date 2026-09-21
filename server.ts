import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "Cloudbeds PMS & Booking Engine", timestamp: new Date().toISOString() });
});

// AI Revenue Management & Dynamic Pricing Endpoint
app.post("/api/gemini/pricing-advice", async (req: Request, res: Response) => {
  const { currentOccupancy, roomTypes, upcomingDays, targetAdr } = req.body;
  const ai = getGeminiClient();

  if (!ai) {
    // Intelligent heuristic fallback when API key is not configured
    const suggestions = (roomTypes || []).map((rt: any) => {
      let adjustment = 0;
      let reason = "";
      if (currentOccupancy > 80) {
        adjustment = +12; // Increase rate in high occupancy
        reason = "Tỷ lệ lấp đầy cao (>80%). Đề xuất tăng giá để tối ưu RevPAR và hạn chế hết phòng sớm.";
      } else if (currentOccupancy < 45) {
        adjustment = -10; // Discount to spur demand
        reason = "Tỷ lệ lấp đầy thấp (<45%). Khuyến nghị giảm giá 10% kết hợp flash sale trực tiếp trên Booking Engine.";
      } else {
        adjustment = +5;
        reason = "Nhu cầu ổn định. Duy trì giá sàn và tăng nhẹ 5% vào cuối tuần để giữ cân bằng ADR.";
      }
      return {
        roomTypeId: rt.id,
        roomTypeName: rt.name,
        currentBasePrice: rt.basePrice,
        recommendedPrice: Math.round(rt.basePrice * (1 + adjustment / 100)),
        percentageChange: adjustment,
        channelStrategy: "Giữ giá sàn trên Booking Engine trực tiếp thấp hơn 10% so với OTA (Booking.com/Agoda) để kích cầu đặt phòng không hoa hồng.",
        reason,
      };
    });

    return res.json({
      success: true,
      strategySummary: `Dựa trên tỷ lệ lấp đầy phòng hiện tại (${currentOccupancy}%), hệ thống đề xuất chiến lược cân bằng doanh thu ADR và kênh phân phối.`,
      suggestions,
      overbookingRisk: currentOccupancy > 90 ? "Cao - Cần kích hoạt Overbooking Shield" : "An toàn - Lượng phòng khả dụng tốt",
      isFallback: true,
    });
  }

  try {
    const prompt = `
Bạn là chuyên gia Revenue Manager và Quản trị khách sạn (PMS & Channel Manager) hàng đầu theo chuẩn Cloudbeds.
Phân tích dữ liệu vận hành sau:
- Tỷ lệ lấp đầy hiện tại (Occupancy): ${currentOccupancy}%
- Mục tiêu ADR: ${targetAdr || "1.200.000 VND"}
- Số ngày dự báo: ${upcomingDays || 7} ngày tới
- Danh sách hạng phòng: ${JSON.stringify(roomTypes || [])}

Hãy đưa ra đề xuất điều chỉnh giá phòng linh hoạt (Dynamic Pricing) và chiến lược kênh (Channel Strategy: Booking.com, Agoda, Expedia vs Direct Booking Engine) nhằm:
1. Tối đa hóa RevPAR và ADR.
2. Tránh triệt để rủi ro Overbooking khi lấp đầy trên 85%.
3. Tăng tỷ trọng đặt phòng trực tiếp không mất hoa hồng qua Booking Engine.

Trả về kết quả chuẩn JSON với cấu trúc:
{
  "strategySummary": "Tóm tắt chiến lược giá ngắn gọn",
  "suggestions": [
    {
      "roomTypeId": "id",
      "roomTypeName": "Tên phòng",
      "currentBasePrice": 1000000,
      "recommendedPrice": 1100000,
      "percentageChange": 10,
      "channelStrategy": "Chiến lược cụ thể cho hạng phòng này",
      "reason": "Lý do dựa trên cung cầu"
    }
  ],
  "overbookingRisk": "Đánh giá mức độ rủi ro overbooking"
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return res.json({ success: true, ...parsed, isFallback: false });
  } catch (error: any) {
    console.error("Gemini pricing error:", error);
    return res.status(500).json({
      success: false,
      error: "Không thể xử lý đề xuất từ AI: " + (error?.message || "Lỗi không xác định"),
    });
  }
});

// AI Guest Communication Assistant (Welcome Email, Check-in details, Folio invoice notes)
app.post("/api/gemini/guest-communication", async (req: Request, res: Response) => {
  const { guestName, roomNumber, roomType, checkIn, checkOut, totalAmount, channel, specialRequests, type } = req.body;
  const ai = getGeminiClient();

  if (!ai) {
    // Elegant template fallback
    const welcomeVi = `Kính gửi Quý khách ${guestName || "Quý khách"},\n\nKhách sạn trân trọng chào đón Quý khách đã đặt phòng ${roomType || "Deluxe"} (Phòng ${roomNumber || "102"}) qua ${channel || "Booking Engine trực tiếp"}!\nThời gian lưu trú: Từ ${checkIn} đến ${checkOut}.\nTổng hóa đơn tạm tính: ${Number(totalAmount || 0).toLocaleString("vi-VN")} VND.\n\nGiờ nhận phòng tiêu chuẩn: 14:00 - Trả phòng: 12:00.\nNếu Quý khách có yêu cầu đặc biệt${specialRequests ? ` (${specialRequests})` : ""}, đội ngũ Lễ tân luôn sẵn sàng hỗ trợ 24/7.\n\nTrân trọng cảm ơn và chúc Quý khách một kỳ nghỉ tuyệt vời!`;
    const welcomeEn = `Dear ${guestName || "Valued Guest"},\n\nWe are delighted to confirm your reservation for ${roomType || "Deluxe Room"} (Room ${roomNumber || "102"}) via ${channel || "Direct Booking"}!\nStay dates: ${checkIn} to ${checkOut}.\nTotal Folio: ${Number(totalAmount || 0).toLocaleString("vi-VN")} VND.\n\nStandard Check-in: 14:00 | Check-out: 12:00.\nOur Front Desk concierge is available 24/7. Have a memorable stay!`;
    
    return res.json({
      success: true,
      messageVi: welcomeVi,
      messageEn: welcomeEn,
      subjectVi: `[Xác nhận đặt phòng] Chào mừng Quý khách ${guestName} đến với Khách sạn`,
      subjectEn: `[Reservation Confirmed] Welcome ${guestName} to your hotel stay`,
      isFallback: true,
    });
  }

  try {
    const prompt = `
Bạn là Trưởng bộ phận Chăm sóc khách hàng của khách sạn cao cấp sử dụng PMS Cloudbeds.
Tạo thư giao tiếp với khách theo thông tin:
- Tên khách: ${guestName}
- Hạng phòng: ${roomType}, Số phòng: ${roomNumber || "Được bố trí khi check-in"}
- Check-in: ${checkIn}, Check-out: ${checkOut}
- Kênh đặt: ${channel}
- Tổng thanh toán: ${totalAmount} VND
- Yêu cầu đặc biệt: ${specialRequests || "Không có"}
- Loại thư: ${type || "welcome_and_checkin_guide"}

Yêu cầu:
1. Tạo 2 phiên bản song ngữ: Tiếng Việt và Tiếng Anh.
2. Giọng văn lịch thiệp, ấm áp, chuẩn khách sạn 4-5 sao, cung cấp rõ ràng thông tin check-in, wifi, và lời dặn hữu ích.
3. Trả về định dạng JSON:
{
  "subjectVi": "Tiêu đề thư tiếng Việt",
  "messageVi": "Nội dung thư tiếng Việt",
  "subjectEn": "Email Subject in English",
  "messageEn": "Email Body in English"
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return res.json({ success: true, ...parsed, isFallback: false });
  } catch (error: any) {
    console.error("Gemini communication error:", error);
    return res.status(500).json({
      success: false,
      error: "Không thể tạo nội dung: " + (error?.message || "Lỗi không xác định"),
    });
  }
});

// Channel Manager Sync Simulation API
app.post("/api/channel-sync/push", (req: Request, res: Response) => {
  const { channels, roomInventory, action } = req.body;
  const timestamp = new Date().toLocaleTimeString("vi-VN", { hour12: false });
  
  const syncResults = (channels || ["Booking.com", "Agoda", "Expedia", "Airbnb", "Direct Booking Engine"]).map((ch: string) => {
    const latency = Math.floor(Math.random() * 180) + 120; // 120ms - 300ms realistic sync
    return {
      channel: ch,
      status: "synced",
      latencyMs: latency,
      rateParity: "100%",
      syncedAt: timestamp,
      message: `Đã cập nhật ${roomInventory ? roomInventory.length : 8} hạng phòng và lịch trống thành công. Không phát hiện xung đột tồn kho.`,
    };
  });

  return res.json({
    success: true,
    action: action || "full_sync",
    syncedAt: timestamp,
    overallStatus: "ACTIVE_IN_SYNC",
    antiOverbookingActive: true,
    results: syncResults,
  });
});

async function startServer() {
  // Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cloudbeds PMS & Booking Engine running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
