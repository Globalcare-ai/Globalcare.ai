import { SYSTEM_PROMPT } from "@/lib/systemPrompt";

// Tried in order — when one model's free quota is exhausted (429), the next is used.
const MODELS = [
  process.env.GEMINI_MODEL ?? "gemini-3-flash-preview",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
];

const apiUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;

type ChatMessage = {
  role: "user" | "model";
  text: string;
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "paste_your_key_here") {
      return Response.json(
        { error: "GEMINI_API_KEY is not set in .env.local" },
        { status: 500 }
      );
    }

    const {
      messages,
      deepThink,
    }: { messages: ChatMessage[]; deepThink?: boolean } = await req.json();
    if (!messages?.length) {
      return Response.json({ error: "No messages provided" }, { status: 400 });
    }

    const body = (model: string) =>
      JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: `${SYSTEM_PROMPT}\n\nToday's date: ${new Date().toISOString().slice(0, 10)}`,
            },
          ],
        },
        contents: messages.map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        })),
        generationConfig: {
          temperature: 0.7,
          // Gemini 3 models take thinkingLevel; older models ignore unknown fields
          ...(model.startsWith("gemini-3")
            ? { thinkingConfig: { thinkingLevel: deepThink ? "HIGH" : "LOW" } }
            : {}),
        },
      });

    let geminiRes: Response | null = null;
    for (const model of MODELS) {
      const res = await fetch(apiUrl(model), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: body(model),
      });

      if (res.ok && res.body) {
        geminiRes = res;
        break;
      }

      const errText = await res.text();
      console.error(`Gemini API error (${model}):`, res.status, errText);

      // Quota exhausted or model unavailable → try the next model
      if (res.status === 429 || res.status === 404 || res.status === 400) continue;
      break;
    }

    if (!geminiRes?.body) {
      return Response.json(
        {
          error:
            "AI quota reached on all free models — wait a minute and try again.",
        },
        { status: 502 }
      );
    }

    // Parse Gemini's SSE stream and forward plain text chunks to the client
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = geminiRes.body.getReader();

    const readable = new ReadableStream({
      async start(controller) {
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() ?? ""; // keep incomplete line in buffer

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const payload = line.slice(6).trim();
              if (!payload || payload === "[DONE]") continue;
              try {
                const json = JSON.parse(payload);
                const text: string | undefined =
                  json?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) controller.enqueue(encoder.encode(text));
              } catch {
                // ignore malformed chunks
              }
            }
          }
        } catch (err) {
          console.error("Stream error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
