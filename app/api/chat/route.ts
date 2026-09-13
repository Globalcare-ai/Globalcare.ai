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

/** Live facts about this journey so the model stops re-offering finished steps. */
type JourneyState = {
  consultationStatus?: "none" | "scheduled" | "completed";
  paid?: boolean;
  flightBooked?: boolean;
  hospital?: string | null;
  destination?: string | null;
  condition?: string | null;
  estimateUsd?: number | null;
};

function stateBlock(st?: JourneyState): string {
  if (!st) return "";
  const lines: string[] = [];
  if (st.condition) lines.push(`- Condition: ${st.condition}`);
  if (st.destination) lines.push(`- Destination: ${st.destination}`);
  if (st.hospital) lines.push(`- Hospital: ${st.hospital}`);
  if (st.estimateUsd != null) lines.push(`- Doctor's final estimate: $${st.estimateUsd}`);

  if (st.consultationStatus === "completed") {
    lines.push(
      "- Video consultation: ALREADY COMPLETED. Do NOT offer another consultation and do NOT emit a ```consultation block. The doctor has already filed the treatment plan.",
      "  Only offer a consultation again if the patient explicitly asks to speak to a doctor again or wants a second opinion."
    );
  } else if (st.consultationStatus === "scheduled") {
    lines.push("- Video consultation: ALREADY BOOKED and upcoming. Do NOT offer another one; remind them of the booking instead.");
  }

  if (st.paid) {
    lines.push(
      "- Payment: ALREADY PAID into escrow. Never ask them to pay again and never mention prices as still owed.",
      st.flightBooked
        ? "- Flights: already selected. Help with hotel, transfers and pre-op preparation."
        : "- Flights: NOT booked yet. This is now the MOST IMPORTANT next step. Ask for their departure date and trip length (if you don't have them), then emit the ```flightsearch block. Do not drift to other topics until flights are chosen."
    );
  } else if (st.flightBooked) {
    lines.push("- Flights: already selected.");
  }

  return lines.length ? `\n\n== CURRENT JOURNEY STATE (authoritative — trust this over the conversation) ==\n${lines.join("\n")}` : "";
}

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
      journeyState,
    }: { messages: ChatMessage[]; deepThink?: boolean; journeyState?: JourneyState } = await req.json();
    if (!messages?.length) {
      return Response.json({ error: "No messages provided" }, { status: 400 });
    }

    const body = (model: string) =>
      JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: `${SYSTEM_PROMPT}\n\nToday's date: ${new Date().toISOString().slice(0, 10)}${stateBlock(journeyState)}`,
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
