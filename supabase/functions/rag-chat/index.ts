import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

console.log("OPENROUTER KEY FOUND:", OPENROUTER_API_KEY ? "YES" : "NO");

/* -------------------------------
   RAG-LITE CONFIG
-------------------------------- */

const KEYWORD_MAPPINGS: Record<string, string[]> = {
  tourist_place: ["visit", "see", "attraction", "park", "garden", "palace", "temple", "museum"],
  restaurant: ["eat", "food", "restaurant", "cafe", "street food"],
  platform_info: ["safe haven", "platform", "app", "register", "tourist id"],
  safety: ["safe", "unsafe", "zone", "green", "yellow", "red", "heat map"],
  emergency: ["emergency", "help", "sos", "police", "hospital", "lost"],
};

function identifyCategories(query: string): string[] {
  const q = query.toLowerCase();
  const matched = Object.entries(KEYWORD_MAPPINGS)
    .filter(([_, keywords]) => keywords.some((k) => q.includes(k)))
    .map(([category]) => category);

  return matched.length > 0 ? matched : ["platform_info"];
}

function isOutOfScope(query: string): boolean {
  const outOfScope = /\b(code|program|python|java|crypto|stock|politics|math)\b/i;
  const inScope = /\b(bangalore|tourist|restaurant|safe haven|safety|police)\b/i;
  return outOfScope.test(query) && !inScope.test(query);
}

/* -------------------------------
   EDGE FUNCTION
-------------------------------- */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (isOutOfScope(message)) {
      return new Response(
        JSON.stringify({
          response: "I can help only with Bangalore tourism and Safe Haven platform-related questions.",
          sources: [],
        }),
        { headers: corsHeaders },
      );
    }

    /* -------------------------------
       ENV
    -------------------------------- */

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials missing");
    }

    if (!OPENROUTER_API_KEY) {
      throw new Error("OpenRouter API key missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    /* -------------------------------
       RAG RETRIEVAL
    -------------------------------- */

    const categories = identifyCategories(message);

    const { data, error } = await supabase
      .from("chat_knowledge")
      .select("title, content, category")
      .in("category", categories)
      .eq("city", "Bangalore");

    if (error || !data || data.length === 0) {
      return new Response(
        JSON.stringify({
          response:
            "I don’t have information on that topic. I can help with Bangalore tourism, safety zones, and Safe Haven features.",
          sources: [],
        }),
        { headers: corsHeaders },
      );
    }

    const context = data.map((k) => `[${k.category.toUpperCase()}] ${k.title}:\n${k.content}`).join("\n\n---\n\n");

    /* -------------------------------
       SYSTEM PROMPT
    -------------------------------- */

    const systemPrompt = `
You are the Safe Haven Assistant for tourists visiting Bangalore.

RULES:
- Answer ONLY using the context below
- If information is missing, politely refuse
- No general knowledge
- Keep answers short and helpful

CONTEXT:
${context}
`;

    /* -------------------------------
       OPENROUTER CALL
    -------------------------------- */

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://safe-haven.app",
        "X-Title": "Safe Haven RAG Bot",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.2-3b-instruct:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenRouter error:", err);
      throw new Error("OpenRouter request failed");
    }

    const result = await response.json();
    const aiText = result.choices?.[0]?.message?.content ?? "I couldn’t generate a response.";

    return new Response(
      JSON.stringify({
        response: aiText,
        sources: data.map((k) => ({
          title: k.title,
          category: k.category,
        })),
      }),
      { headers: corsHeaders },
    );
  } catch (err) {
    console.error("rag-chat error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unexpected server error",
      }),
      { status: 500, headers: corsHeaders },
    );
  }
});
