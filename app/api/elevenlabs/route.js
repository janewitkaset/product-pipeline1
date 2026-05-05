export async function POST(req) {
  try {
    const { script, voiceId = "EXAVITQu4vr4xnSDxMaL" } = await req.json();

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: script,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.72,
            similarity_boost: 0.85,
            style: 0.28,
            use_speaker_boost: true,
            speed: 0.95
          }
        })
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return Response.json({ ok: false, error: errText }, { status: 400 });
    }

    const audioBuffer = await res.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    return Response.json({ ok: true, audioBase64: base64Audio, mimeType: "audio/mpeg" });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
