function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store, private" } });
}

function completionEndpoint(baseUrl: unknown) {
  if (typeof baseUrl !== "string" || !baseUrl.trim()) throw new Error("invalid_url");
  let url: URL;
  try { url = new URL(baseUrl.trim()); } catch { throw new Error("invalid_url"); }
  if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) throw new Error("invalid_url");
  return `${url.toString().replace(/\/+$/, "")}/chat/completions`;
}

export async function POST(request: Request) {
  let input: { baseUrl?: unknown; apiKey?: unknown; model?: unknown; messages?: unknown };
  try { input = await request.json() as typeof input; } catch { return json({ error: "Некорректный запрос.", code: "invalid_request" }, 400); }
  if (typeof input.apiKey !== "string" || !input.apiKey.trim()) return json({ error: "Введите ключ API.", code: "missing_key" }, 400);
  if (typeof input.model !== "string" || !input.model.trim()) return json({ error: "Выберите модель.", code: "missing_model" }, 400);
  if (!Array.isArray(input.messages) || input.messages.length !== 2 || !input.messages.every((item) => item && typeof item === "object" && ["system", "user"].includes(String((item as { role?: unknown }).role)) && typeof (item as { content?: unknown }).content === "string")) return json({ error: "Некорректный формат запроса.", code: "invalid_request" }, 400);
  let url: string;
  try { url = completionEndpoint(input.baseUrl); } catch { return json({ error: "Укажите корректный HTTP или HTTPS адрес.", code: "invalid_url" }, 400); }
  try {
    const response = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${input.apiKey.trim()}`, "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ model: input.model.trim(), messages: input.messages, temperature: 0.3, stream: false }), cache: "no-store", signal: AbortSignal.timeout(60000) });
    if (!response.ok) {
      const status = response.status === 401 ? 401 : response.status === 404 ? 404 : 502;
      return json({ error: status === 401 ? "Сервис отклонил ключ." : status === 404 ? "Сервис не нашёл модель или адрес запроса." : "Сервис не смог выполнить запрос." , code: status === 401 ? "unauthorized" : status === 404 ? "not_found" : "provider_error" }, status);
    }
    const payload = await response.json() as { choices?: Array<{ message?: { content?: unknown } }> };
    const raw = payload.choices?.[0]?.message?.content;
    const answer = typeof raw === "string" ? raw : Array.isArray(raw) ? raw.map((part) => part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string" ? (part as { text: string }).text : "").join("") : "";
    if (!answer.trim()) return json({ error: "Модель вернула пустой ответ.", code: "empty_response" }, 502);
    return json({ response: answer });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") return json({ error: "Сервис не ответил вовремя.", code: "timeout" }, 504);
    return json({ error: "Не удалось связаться с сервисом.", code: "network" }, 502);
  }
}
