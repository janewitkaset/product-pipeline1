export async function POST(req) {
  try {
    const { imageBase64, imageType, productDesc, bgThemePrompt, bgThemeLabel } = await req.json();

    const userContext = productDesc ? `ข้อมูลสินค้าจากผู้ใช้: "${productDesc}"\n\n` : "";

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1200,
        system: "คุณเป็น expert ด้านการตลาดและ content video ตอบเป็น JSON เท่านั้น",
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: imageType, data: imageBase64 } },
            {
              type: "text",
              text: `${userContext}วิเคราะห์สินค้าในรูปและสร้างเนื้อหาสำหรับคลิปขายสินค้า 12 วินาที
Background theme: "${bgThemeLabel}" — ${bgThemePrompt}

ตอบเป็น JSON เท่านั้น:
{
  "product_name": "ชื่อสินค้า",
  "product_type": "ประเภทสินค้า",
  "tagline": "slogan ไม่เกิน 8 คำ",
  "key_benefits": ["จุดเด่น 1","จุดเด่น 2","จุดเด่น 3"],
  "script": "บทพูดขายสินค้าภาษาไทย 35-45 คำ น่าสนใจ กระชับ",
  "image_prompt": "prompt ภาษาอังกฤษสำหรับ Gemini Imagen: สินค้านี้บน background ตามธีม commercial photography 4K",
  "video_prompt": "prompt ภาษาอังกฤษสำหรับ Gemini Veo 12 วินาที: การเคลื่อนไหวของสินค้าบน background ตามธีม cinematic"
}`
            }
          ]
        }]
      })
    });

    const data = await res.json();
    const text = data.content?.[0]?.text || "";
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : text);

    return Response.json({ ok: true, data: parsed });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
