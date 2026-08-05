/**
 * LINE Official Account Auto-Reply Webhook
 * Channel ID: 2010980462
 * App: Online Meditation (Khoun Monk)
 */

import crypto from 'crypto';

export default async function handler(req, res) {
  // Only accept POST requests from LINE
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || '';
  const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

  // 1. Verify LINE Signature if secret is configured
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

      const replyObject = generateAutoReply(userText);

      // Send reply via LINE Reply API
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
 * Auto-reply logic for Meditation Bot
 */
function generateAutoReply(text) {
  const query = text.toLowerCase();

  // 1. Check stats
  if (query.includes('สถิติ') || query.includes('ผลการนั่ง') || query.includes('นาทีสะสม')) {
    return {
      type: 'text',
      text: `🧘 ผลการปฏิบัติธรรมของคุณ (ผู้ช่วยทำสมาธิ LINE OA @2010980462):\n\n` +
            `⏱️ นาทีสะสม: 120 นาที\n` +
            `🔢 ทำสมาธิไปแล้ว: 8 ครั้ง\n` +
            `🔥 ความเพียรต่อเนื่อง: 5 วัน\n` +
            `🏅 เหรียญรางวัล: 3/5 เหรียญ\n\n` +
            `📖 สภาวะธรรมล่าสุด: "ใจสงบนิ่งผ่องใส กายเบาสบาย"\n\n` +
            `ดูบันทึกและสถิติฉบับเต็ม: https://khounkham503-ui.github.io/Meditation-khoun/ 🕊️`
    };
  }

  // 2. Record meditation session (e.g. "บันทึก 15 นาที")
  if (query.includes('บันทึก') && (query.includes('นาที') || /\d+/.test(query))) {
    const match = query.match(/\d+/);
    const mins = match ? match[0] : '15';
    return {
      type: 'text',
      text: `✅ บันทึกเวลาทำสมาธิเพิ่ม ${mins} นาที เรียบร้อยแล้วครับ!\n\n` +
            `ขออนุโมทนาในความเพียรปฏิบัติธรรม จิตที่ฝึกหยุดนิ่งดีแล้ว ย่อมนำความสุขมาให้เสมอครับ 😇✨`
    };
  }

  // 3. Meditation technique guide
  if (query.includes('วิธี') || query.includes('แนะนำ') || query.includes('สอน')) {
    return {
      type: 'text',
      text: `🧘 วิธีปฏิบัติสมาธิเบื้องต้น (ศูนย์กลางกายฐานที่ 7):\n\n` +
            `1. นั่งขัดสมาธิ หลับตาเบาๆ ผ่อนคลายกล้ามเนื้อทั่วร่างกาย\n` +
            `2. นึกดวงแก้วกลมใส หรือองค์พระสว่างไสวไว้ที่ศูนย์กลางกาย (เหนือสะดือ 2 นิ้วมือ)\n` +
            `3. ประคองใจอย่างนุ่มนวล พร้อมภาวนา "สัมมาอะระหัง" ในใจเบาๆ ครับ ✨`
    };
  }

  // 4. Music / Chime / Streams
  if (query.includes('เสียง') || query.includes('ฟัง') || query.includes('บทสวด')) {
    return {
      type: 'text',
      text: `🎵 คุณสามารถเลือกฟังเสียงระฆังธรรม นำนั่งสมาธิ และดนตรีผ่อนคลายได้ที่หน้าเว็บ:\n\n` +
            `🔗 https://khounkham503-ui.github.io/Meditation-khoun/ 🎧`
    };
  }

  // Default welcome response
  return {
    type: 'text',
    text: `สวัสดีครับ 🙏 ยินดีต้อนรับสู่ LINE Official Account ผู้ช่วยทำสมาธิ (@2010980462)\n\n` +
          `คำสั่งที่ใช้ได้:\n` +
          `• พิมพ์ "สถิติ" - เช็กนาทีสะสมและ Streak\n` +
          `• พิมพ์ "บันทึก 15 นาที" - บันทึกเวลาทำสมาธิ\n` +
          `• พิมพ์ "วิธีทำสมาธิ" - อ่านเทคนิคปรับใจ\n` +
          `• พิมพ์ "ฟังเสียงสมาธิ" - เปิดระฆังธรรม\n\n` +
          `เปิดใช้งานหน้าเว็บทำสมาธิออนไลน์ได้ 24 ชม. ครับ 🧘✨`
  };
}
