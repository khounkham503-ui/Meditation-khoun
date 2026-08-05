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

        const replyText = getWebsiteAutoReply(text);

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

function getWebsiteAutoReply(text: string): string {
  const q = text.toLowerCase();

  if (q.includes("สถิติ") || q.includes("ผลการนั่ง") || q === "1") {
    return `🧘 สถิติผลการปฏิบัติธรรม (Meditation-Khoun):\n⏱️ นาทีสะสม: 120 นาที\n🔢 ทำสมาธิไปแล้ว: 8 ครั้ง\n🔥 ความเพียรต่อเนื่อง: 5 วัน\n🏅 เหรียญรางวัล: 3/5 เหรียญ\n\nดูแบบเต็ม: https://khounkham503-ui.github.io/Meditation-khoun/`;
  }
  if (q.includes("บันทึก")) {
    return `✅ บันทึกเวลาทำสมาธิเรียบร้อยแล้ว! ขออนุโมทนาในความเพียรปฏิบัติธรรมวันนี้ จิตที่ฝึกหยุดนิ่งดีแล้ว ย่อมนำความสุขมาให้เสมอครับ 😇✨`;
  }
  if (q.includes("เหรียญ") || q.includes("รางวัล")) {
    return `🏅 เหรียญเกียรติยศในเว็บ:\n🥉 สัมมาสมาธิขั้นต้น (15 นาที)\n🥈 จิตหยุดนิ่งเพียรพยายาม (60 นาที)\n🥇 สมาธิแน่วแน่มั่นคง (300 นาที)\n🔥 ความเพียรต่อเนื่อง 7 วัน\n👑 มหาอุบาสก/อุบาสิกา (30 ครั้ง)`;
  }
  if (q.includes("วิธี") || q.includes("แนะนำ")) {
    return `🧘 วิธีปฏิบัติสมาธิเบื้องต้น:\n1. หลับตาเบาๆ ผ่อนคลายกล้ามเนื้อทั่วร่างกาย\n2. นึกดวงแก้วกลมใส ณ ศูนย์กลางกายฐานที่ 7\n3. ภาวนา "สัมมาอะระหัง" ในใจเบาๆ ครับ ✨`;
  }
  if (q.includes("เสียง") || q.includes("ฟัง") || q.includes("ระฆัง")) {
    return `🎵 ฟังเสียงระฆังธรรมเคาะระลึกสติ และสตรีมนำนั่งสมาธิได้ฟรีที่:\nhttps://khounkham503-ui.github.io/Meditation-khoun/ 🎧`;
  }

  return `สวัสดีครับ 🙏 ยินดีต้อนรับสู่ LINE OA ผู้ช่วยปฏิบัติธรรม Meditation-Khoun (@2010980462)\n\nพิมพ์คุยได้เลยครับ:\n• "สถิติ"\n• "บันทึก 15 นาที"\n• "วิธีทำสมาธิ"\n• "เหรียญรางวัล"\n• "ฟังเสียงสมาธิ"\n\nหรือเข้าใช้งานเว็บที่: https://khounkham503-ui.github.io/Meditation-khoun/ 🧘✨`;
}
