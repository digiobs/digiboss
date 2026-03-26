import { asObject } from "./ingestion.ts";

const CANDIDATE_MODELS = [
  "claude-sonnet-4-20250514",
  "claude-3-7-sonnet-20250219",
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-20241022",
];

type ClaudeJsonResult<T> = {
  data: T;
  modelUsed: string;
  rawText: string;
};

function extractJsonObject(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    return asObject(parsed);
  } catch {
    return null;
  }
}

export async function callClaudeJson<T>({
  systemPrompt,
  userPrompt,
  maxTokens = 1800,
  temperature = 0.2,
}: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<ClaudeJsonResult<T>> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  const errors: string[] = [];
  for (const model of CANDIDATE_MODELS) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      errors.push(`${model}: ${response.status} ${errorText.slice(0, 120)}`);
      continue;
    }

    const payload = await response.json();
    const contentBlocks = Array.isArray(payload?.content) ? payload.content : [];
    const rawText = contentBlocks
      .map((part) => {
        const item = asObject(part);
        const text = item?.text;
        return typeof text === "string" ? text : "";
      })
      .join("\n");

    const parsed = extractJsonObject(rawText);
    if (!parsed) {
      errors.push(`${model}: invalid_json_payload`);
      continue;
    }
    return { data: parsed as unknown as T, modelUsed: model, rawText };
  }

  throw new Error(`Claude JSON call failed for all models: ${errors.join(" | ").slice(0, 700)}`);
}
