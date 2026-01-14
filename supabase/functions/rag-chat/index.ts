import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Categories for knowledge retrieval
const VALID_CATEGORIES = ["tourist_place", "restaurant", "platform_info", "safety", "emergency"];

// Keywords mapping for better retrieval
const KEYWORD_MAPPINGS: Record<string, string[]> = {
  tourist_place: ["visit", "see", "attraction", "place", "tourist", "landmark", "park", "garden", "palace", "temple", "museum"],
  restaurant: ["eat", "food", "restaurant", "cuisine", "dining", "meal", "breakfast", "lunch", "dinner", "cafe", "street food"],
  platform_info: ["safe haven", "app", "platform", "how to", "use", "register", "id card", "tourist id", "features"],
  safety: ["safe", "unsafe", "danger", "zone", "green", "yellow", "red", "heat map", "safety", "caution", "alert"],
  emergency: ["emergency", "help", "sos", "police", "hospital", "unsafe", "feel", "scared", "threat", "lost"],
};

function identifyCategories(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  const matchedCategories: string[] = [];

  for (const [category, keywords] of Object.entries(KEYWORD_MAPPINGS)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      matchedCategories.push(category);
    }
  }

  // Default to platform_info if no match
  return matchedCategories.length > 0 ? matchedCategories : ["platform_info"];
}

function isOutOfScope(query: string): boolean {
  const outOfScopePatterns = [
    /\b(code|program|javascript|python|java|react|programming)\b/i,
    /\b(politics|election|government|minister|president)\b/i,
    /\b(medical|doctor|disease|symptom|health advice)\b/i,
    /\b(legal|lawyer|court|law|lawsuit)\b/i,
    /\b(stock|invest|crypto|bitcoin|trading)\b/i,
    /\b(math|calculate|equation|formula)\b/i,
    /\b(recipe|cook|bake)\b/i,
  ];

  // Check if query is about Bangalore/tourism/Safe Haven
  const inScopePatterns = [
    /\b(bangalore|bengaluru|karnataka)\b/i,
    /\b(tourist|travel|visit|trip|vacation)\b/i,
    /\b(safe haven|safety|heat map|zone)\b/i,
    /\b(restaurant|food|eat|dining)\b/i,
    /\b(place|attraction|landmark|park|garden|palace)\b/i,
    /\b(emergency|help|police|hospital)\b/i,
    /\b(platform|app|register|how to)\b/i,
  ];

  const hasInScopeMatch = inScopePatterns.some(pattern => pattern.test(query));
  const hasOutOfScopeMatch = outOfScopePatterns.some(pattern => pattern.test(query));

  // If it matches out-of-scope patterns and doesn't match in-scope, reject
  if (hasOutOfScopeMatch && !hasInScopeMatch) {
    return true;
  }

  return false;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for out-of-scope queries
    if (isOutOfScope(message)) {
      return new Response(
        JSON.stringify({
          response: "I can help only with Bangalore tourism and Safe Haven platform-related questions. For other topics, please consult appropriate resources.",
          sources: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not configured");
    }

    if (!geminiApiKey) {
      throw new Error("Gemini API key not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Identify relevant categories from the query
    const categories = identifyCategories(message);

    // Retrieve knowledge from database
    const { data: knowledgeData, error: dbError } = await supabase
      .from("chat_knowledge")
      .select("title, content, category, tags")
      .in("category", categories)
      .eq("city", "Bangalore");

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to retrieve knowledge");
    }

    // If no knowledge found, refuse politely
    if (!knowledgeData || knowledgeData.length === 0) {
      return new Response(
        JSON.stringify({
          response: "I don't have specific information about that topic. I can help you with Bangalore tourist places, restaurants, safety zones, and Safe Haven platform features. What would you like to know?",
          sources: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context from retrieved knowledge
    const context = knowledgeData
      .map((k) => `[${k.category.toUpperCase()}] ${k.title}:\n${k.content}`)
      .join("\n\n---\n\n");

    // Build conversation history for context
    const historyContext = history
      ? history.slice(-6).map((h: { role: string; content: string }) => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.content }],
        }))
      : [];

    // Construct the prompt with strict RAG-Lite instructions
    const systemPrompt = `You are the Safe Haven Assistant, a helpful chatbot for tourists visiting Bangalore, India.

CRITICAL INSTRUCTIONS:
1. You MUST answer ONLY using the provided context below
2. If the answer is not found in the context, politely say you don't have that information
3. NEVER use your general knowledge - only the provided context
4. Keep responses concise, friendly, and helpful
5. Focus on tourist safety and helping visitors navigate Bangalore

AUTHORITATIVE CONTEXT (Use ONLY this information to answer):
${context}

Remember: You can ONLY answer questions about:
- Bangalore tourist places
- Restaurants and food in Bangalore
- Safe Haven platform features (safety map, zones, tourist ID)
- Safety information and what to do in emergencies

For ANY other topic, respond with: "I can help only with Bangalore tourism and Safe Haven platform-related questions."`;

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            ...historyContext,
            { role: "user", parts: [{ text: message }] },
          ],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
            topP: 0.8,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", errorText);
      throw new Error("Failed to get response from AI");
    }

    const geminiData = await geminiResponse.json();
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
      "I apologize, but I couldn't generate a response. Please try again.";

    return new Response(
      JSON.stringify({
        response: aiResponse,
        sources: knowledgeData.map((k) => ({ title: k.title, category: k.category })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in rag-chat function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An unexpected error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
