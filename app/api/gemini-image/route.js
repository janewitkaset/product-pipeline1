export async function POST(req) {
  try {
    const { prompt } = await req.json();

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] }
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      return Response.json({ ok: false, error: `Gemini Image API error ${res.status}: ${errBody}` }, { status: 500 });
    }

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find(p => p.inlineData);

    if (!imgPart) {
      return Response.json({ ok: false, error: "Gemini did not return an image" }, { status: 400 });
    }

    return Response.json({
      ok: true,
      imageBase64: imgPart.inlineData.data,
      mimeType: imgPart.inlineData.mimeType,
    });

  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
