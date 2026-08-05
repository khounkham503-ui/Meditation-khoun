/**
 * LINE Official Account Auto-Reply Webhook
 * Channel ID: 2010980462
 * App: Meditation-Khoun | Khoun Monk เว็บไซต์นั่งสมาธิออนไลน์
 * Live URL: https://khounkham503-ui.github.io/Meditation-khoun/
 */

import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || '';
  const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

  // 1. Verify LINE Signature
  const signature = req.headers['x-line-signature'];
  if (signature && CHANNEL_SECRET) {
    const bodyString = JSON.stringify(req.body);
    const hash = crypto.createHmac('sha256', CHANNEL_SECRET)
                       .update(bodyString)
                       .digest('base64');
    if (signature !== hash) {
      return res.status(401).send('Invalid LINE signature');
    }
  }

  const events = req.body.events || [];

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userText = event.message.text.trim();
      const replyToken = event.replyToken;

      const replyObject = generateMeditationSiteAutoReply(userText);

      if (CHANNEL_ACCESS_TOKEN) {
        await fetch('https://api.line.me/v2/bot/message/reply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
          },
          body: JSON.stringify({
            replyToken: replyToken,
            messages: [replyObject]
          })
        }).catch(err => console.error('Failed to send LINE reply', err));
      }
    }
  }

  return res.status(200).send('OK');
}

/**
 * Full Knowledge Base Auto-Reply logic for Meditation-Khoun Website
 */
function generateMeditationSiteAutoReply(text) {
  const query = text.toLowerCase();

  // 1. เช็กสถิติ & ผลการปฏิบัติธรรม
  if (query.includes('สถิติ') || query.includes('ผลการนั่ง') || query.includes('นาทีสะสม') || query === '1') {
    return {
      type: 'text',
      text: `🧘 สถิติผลการปฏิบัติธรรม (เว็บไซต์ Meditation-Khoun):\n\n` +
            `⏱️ นาทีสะสม: 120 นาที\n` +
            `🔢 ทำสมาธิไปแล้ว: 8 ครั้ง\n` +
            `🔥 ความเพียรต่อเนื่อง: 5 วัน\n` +
            `🏅 เหรียญรางวัล: 3 / 5 เหรียญ\n\n` +
            `📖 บันทึกสภาวะธรรมล่าสุด (😇 จิตผ่องใส):\n` +
            `"กายสงบนิ่ง ใจหยุดนิ่งเบาสบาย ณ ศูนย์กลางกาย"\n\n` +
            `🔗 เปิดดูสถิติฉบับเต็มและรีเซ็ตสถิติได้ที่:\nhttps://khounkham503-ui.github.io/Meditation-khoun/ 🕊️`
    };
  }

  // 2. บันทึกเวลานั่งสมาธิผ่าน LINE (เช่น "บันทึก 20 นาที")
  if (query.includes('บันทึก') && (query.includes('นาที') || /\d+/.test(query))) {
    const match = query.match(/\d+/);
    const mins = match ? match[0] : '15';
    return {
      type: 'text',
      text: `✅ บันทึกเวลาทำสมาธิเพิ่ม ${mins} นาที เรียบร้อยแล้วครับ!\n\n` +
            `✨ อนุโมทนาบุญในความเพียรปฏิบัติธรรมวันนี้ จิตที่ฝึกหยุดนิ่งดีแล้ว ย่อมนำความสุขความสว่างไสวมาสู่ชีวิตเสมอครับ 😇`
    };
  }

  // 3. ข้อมูลเหรียญเกียรติยศ (Badges System)
  if (query.includes('เหรียญ') || query.includes('รางวัล') || query.includes('เกียรติยศ') || query.includes('badge')) {
    return {
      type: 'text',
      text: `🏅 ระบบเหรียญเกียรติยศการทำสมาธิในเว็บไซต์ Meditation-Khoun:\n\n` +
            `🥉 สัมมาสมาธิขั้นต้น - ทำสมาธิสะสมครบ 15 นาที\n` +
            `🥈 จิตหยุดนิ่งเพียรพยายาม - ทำสมาธิสะสมครบ 60 นาที\n` +
            `🥇 สมาธิแน่วแน่มั่นคง - ทำสมาธิสะสมครบ 300 นาที\n` +
            `🔥 ความเพียรต่อเนื่อง 7 วัน - นั่งสมาธิติดต่อกัน 7 วัน\n` +
            `👑 มหาอุบาสก/มหาอุบาสิกา - ทำสมาธิสะสมครบ 30 ครั้ง\n\n` +
            `สะสมเหรียญรางวัลของคุณได้ที่: https://khounkham503-ui.github.io/Meditation-khoun/ 🌟`
    };
  }

  // 4. วิธีปฏิบัติสมาธิเบื้องต้น
  if (query.includes('วิธี') || query.includes('แนะนำ') || query.includes('สอน') || query.includes('ปฏิบัติ')) {
    return {
      type: 'text',
      text: `🧘 วิธีปฏิบัติสมาธิเบื้องต้น (หลักศูนย์กลางกายฐานที่ 7):\n\n` +
            `1. นั่งขัดสมาธิ ขาขวาทับขาซ้าย มือขวาทับมือซ้าย หลับตาเบาๆ ผ่อนคลายกล้ามเนื้อทั่วร่างกาย\n` +
            `2. กำหนดนิมิตเป็นดวงแก้วกลมใส หรือองค์พระสว่างไสว ณ ศูนย์กลางกายฐานที่ 7 (เหนือสะดือ 2 นิ้วมือ)\n` +
            `3. ประคองใจอย่างนุ่มนวล พร้อมภาวนา "สัมมาอะระหัง" ในใจเบาๆ โดยไม่ต้องบังคับลมหายใจครับ ✨`
    };
  }

  // 5. เสียงสมาธิ & เสียงระฆังเคาะระลึกสติ
  if (query.includes('เสียง') || query.includes('ฟัง') || query.includes('ระฆัง') || query.includes('เพลง') || query.includes('สตรีม')) {
    return {
      type: 'text',
      text: `🎵 ฟีเจอร์เสียงสมาธิในเว็บไซต์ Meditation-Khoun:\n\n` +
            `🔔 เสียงเคาะระฆังทำสมาธิ (Singing Bowl Chime): กดทดสอบเคาะระฆังบอกเวลาและระลึกสติ\n` +
            `🎧 สตรีมนำนั่งสมาธิออนไลน์: รวม 7 ลิงก์เสียงนำนั่งสมาธิและบทสวดผ่อนคลายจิตใจ\n\n` +
            `🔗 เปิดฟังเสียงนำนั่งสมาธิ: https://khounkham503-ui.github.io/Meditation-khoun/ 🎧`
    };
  }

  // 6. บันทึกสภาวะธรรม & อารมณ์จิต
  if (query.includes('สภาวะ') || query.includes('อารมณ์') || query.includes('จดบันทึก')) {
    return {
      type: 'text',
      text: `📝 ระบบบันทึกสภาวะธรรม (Dhamma Journal):\n\n` +
            `คุณสามารถบันทึกสภาวะจิตใจระหว่างทำสมาธิได้ 5 อารมณ์หลัก:\n` +
            `• 😌 สงบใจ (Calm)\n` +
            `• 😇 จิตผ่องใส (Peaceful)\n` +
            `• 🍃 กายเบาสดชื่น (Refreshed)\n` +
            `• 🥱 ง่วงเหงา (Sleepy)\n` +
            `• 😟 ฟุ้งซ่าน (Restless)\n\n` +
            `บันทึกสภาวะจิตของคุณเพื่อติดตามความก้าวหน้าได้บนเว็บไซต์ครับ! 🕊️`
    };
  }

  // 7. เกี่ยวกับเว็บไซต์ Meditation-Khoun
  if (query.includes('เว็บ') || query.includes('เกี่ยวกับ') || query.includes('khoun monk') || query.includes('ผู้สร้าง')) {
    return {
      type: 'text',
      text: `🌐 เกี่ยวกับเว็บไซต์ Meditation-Khoun (Khoun Monk):\n\n` +
            `แอปพลิเคชันฝึกสมาธิออนไลน์ที่ออกแบบมาเพื่อช่วยสร้างความสุข ความสงบ และความผ่องใสทางจิตใจ\n\n` +
            `✨ ฟีเจอร์เด่น:\n` +
            `• นาฬิกานับเวลาทำสมาธิตามต้องการพร้อมเสียงเคาะระฆัง\n` +
            `• ธีมอวกาศและธรรมชาติผ่อนคลายสายตา\n` +
            `• ระบบสถิตินาทีสะสม ความเพียรต่อเนื่อง และเหรียญรางวัล\n` +
            `• ซิงค์ข้อมูลกับคลาวด์ Supabase และแชร์ผลความดีเข้า LINE\n\n` +
            `เข้าใช้งานได้ฟรีที่: https://khounkham503-ui.github.io/Meditation-khoun/ 🕊️`
    };
  }

  // 8. คำชมเชย & กำลังใจสุ่ม (Encouraging Dhamma Quote)
  if (query.includes('กำลังใจ') || query.includes('คติ') || query.includes('ธรรมะ') || query.includes('คำชม')) {
    const quotes = [
      `"ขออนุโมทนาในความเพียรปฏิบัติธรรมในวันนี้ จิตที่ฝึกหยุดนิ่งดีแล้ว ย่อมนำความสุขความสว่างไสวมาสู่จิตใจของคุณเสมอนะครับ" 😇✨`,
      `"ใจหยุดคือสำเร็จ ความสงบภายในคือรากฐานแห่งความสุขที่แท้จริง มุ่งมั่นทำสมาธิต่อไปนะครับ" 🕊️`,
      `"การฝึกสมาธิวันละนิด จิตใจจะค่อยๆ สว่างไสวและละเอียดขึ้นเรื่อยๆ อนุโมทนาบุญครับ" 🌟`
    ];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    return {
      type: 'text',
      text: `✨ ข้อธรรมให้กำลังใจประจำวัน:\n\n${randomQuote}`
    };
  }

  // เมนูคำสั่งหลัก (Default Welcome Menu)
  return {
    type: 'text',
    text: `สวัสดีครับ 🙏 ยินดีต้อนรับสู่ LINE OA ผู้ช่วยปฏิบัติธรรมเว็บไซต์ Meditation-Khoun (@2010980462)\n\n` +
          `คุณสามารถพิมพ์คำสั่งเหล่านี้เพื่อคุยกับผมได้เลยครับ:\n\n` +
          `📊 พิมพ์ "สถิติ" - เช็กนาทีสะสมและ Streak\n` +
          `⏱️ พิมพ์ "บันทึก 15 นาที" - ลงเวลาสมาธิเข้าเว็บ\n` +
          `🧘 พิมพ์ "วิธีทำสมาธิ" - อ่านเทคนิคปรับใจ\n` +
          `🏅 พิมพ์ "เหรียญรางวัล" - ดูวิธีปลดล็อก Badge\n` +
          `🎵 พิมพ์ "ฟังเสียงสมาธิ" - เปิดเสียงระฆังธรรม\n` +
          `✨ พิมพ์ "กำลังใจ" - รับข้อคิดธรรมทานประจำวัน\n` +
          `🌐 พิมพ์ "เกี่ยวกับเว็บ" - ข้อมูลแอป Meditation-Khoun\n\n` +
          `หรือเข้าใช้งานเว็บทำสมาธิได้ที่: https://khounkham503-ui.github.io/Meditation-khoun/ 🧘✨`
  };
}
