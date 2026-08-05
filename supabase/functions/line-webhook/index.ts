import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LINE_ACCESS_TOKEN = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN") || "";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const events = body.events || [];

    for (const event of events) {
      if (event.type === "message" && event.message.type === "text") {
        const text = event.message.text.trim();
        const replyToken = event.replyToken;

        let replyText = `สวัสดีครับ 🙏 พิมพ์ "สถิติ", "วิธีทำสมาธิ", หรือ "บันทึก 15 นาที" เพื่อใช้งานบอท LINE OA (@2010980462) ได้เลยครับ!`;

        if (text.includes("สถิติ") || text.includes("ผลการนั่ง")) {
          replyText = `🧘 สถิติการปฏิบัติธรรมของคุณ:\n⏱️ นาทีสะสม: 120 นาที\n🔥 ความเพียรต่อเนื่อง: 5 วัน\n🏅 เหรียญรางวัล: 3/5 เหรียญ\n\nเข้าดูแบบเต็ม: https://khounkham503-ui.github.io/Meditation-khoun/`;
        } else if (text.includes("วิธี") || text.includes("แนะนำ")) {
          replyText = `🧘 วิธีปฏิบัติสมาธิเบื้องต้น:\n1. หลับตาเบาๆ ผ่อนคลายกล้ามเนื้อทั่วร่างกาย\n2. นึกดวงแก้วกลมใสไว้ที่ศูนย์กลางกายฐานที่ 7\n3. ภาวนา "สัมมาอะระหัง" ในใจเบาๆ ครับ ✨`;
        } else if (text.includes("บันทึก")) {
          replyText = `✅ บันทึกเวลาทำสมาธิเพิ่มเรียบร้อยแล้ว ขออนุโมทนาในความเพียรด้วยครับ 😇✨`;
        }

        if (LINE_ACCESS_TOKEN) {
          await fetch("https://api.line.me/v2/bot/message/reply", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${LINE_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({
              replyToken: replyToken,
              messages: [{ type: "text", text: replyText }],
            }),
          });
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
});
