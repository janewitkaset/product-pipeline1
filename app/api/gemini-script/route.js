export async function POST(req) {
  try {
    const { imageBase64, imageType, productDesc, bgThemePrompt, bgThemeLabel } = await req.json();

    const userContext = productDesc
      ? `ข้อมูลสินค้าจากผู้ใช้: "${productDesc}"\n`
      : "";

    const prompt = `${userContext}วิเคราะห์สินค้าในรูปภาพนี้และสร้างเนื้อหาสำหรับคลิปขายสินค้า 12 วินาที
Background theme: "${bgThemeLabel}" — ${bgThemePrompt}

ตอบเป็น JSON object เท่านั้น ห้ามมี markdown หรือ code block:
{"product_name":"ชื่อสินค้า","product_type":"ประเภทสินค้า","tagline":"slogan ไม่เกิน 8 คำ","key_benefits":["จุดเด่น1","จุดเด่น2","จุดเด่น3"],"script":"บทพูดขายสินค้าภาษาไทย 35-45 คำ น่าสนใจ กระชับ","image_prompt":"English prompt for Gemini Imagen: product on background matching theme, commercial photography, 4K, professional lighting","video_prompt":"English prompt for Gemini Veo: 12 second cinematic product video, smooth movement, matching theme background"}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: imageType, data: imageBase64 } },
              { text: prompt }
            ]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      return Response.json({ ok: false, error: `Gemini API error ${res.status}: ${errBody}` }, { status: 500 });
    }

    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Strip markdown fences if present
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      return Response.json({ ok: false, error: `No JSON in response: ${raw.slice(0, 300)}` }, { status: 500 });
    }

    const parsed = JSON.parse(match[0]);
    return Response.json({ ok: true, data: parsed });

  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
