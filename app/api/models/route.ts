function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store, private" } });
}

function endpoint(baseUrl: unknown, suffix: string) {
  if (typeof baseUrl !== "string" || !baseUrl.trim()) throw new Error("invalid_url");
  let url: URL;
  try { url = new URL(baseUrl.trim()); } catch { throw new Error("invalid_url"); }
  if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) throw new Error("invalid_url");
  return `${url.toString().replace(/\/+$/, "")}/${suffix}`;
}

export async function POST(request: Request) {
  let input: { baseUrl?: unknown; apiKey?: unknown };
  try { input = await request.json() as typeof input; } catch { return json({ error: "Некорректный запрос.", code: "invalid_request" }, 400); }
  if (typeof input.apiKey !== "string" || !input.apiKey.trim()) return json({ error: "Введите ключ API.", code: "missing_key" }, 400);
  let url: string;
  try { url = endpoint(input.baseUrl, "models"); } catch { return json({ error: "Укажите корректный HTTP или HTTPS адрес.", code: "invalid_url" }, 400); }
  try {
    const response = await fetch(url, { method: "GET", headers: { Authorization: `Bearer ${input.apiKey.trim()}`, Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(20000) });
    if (!response.ok) {
      const status = response.status === 401 ? 401 : response.status === 404 ? 404 : 502;
      return json({ error: status === 401 ? "Сервис отклонил ключ." : status === 404 ? "Сервис не нашёл список моделей." : "Сервис не смог выполнить запрос." , code: status === 401 ? "unauthorized" : status === 404 ? "not_found" : "provider_error" }, status);
    }
    const payload = await response.json() as { data?: Array<{ id?: unknown; name?: unknown }> };
    const models = (Array.isArray(payload.data) ? payload.data : []).map((item) => typeof item.id === "string" ? item.id : typeof item.name === "string" ? item.name : "").filter(Boolean);
    models.sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
    return json({ models });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") return json({ error: "Сервис не ответил вовремя.", code: "timeout" }, 504);
    return json({ error: "Не удалось связаться с сервисом.", code: "network" }, 502);
  }
}
