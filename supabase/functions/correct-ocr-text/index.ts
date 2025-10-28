import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || text.length < 10) {
      return new Response(
        JSON.stringify({ error: "Text is too short to correct" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Correcting OCR text with AI...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an OCR text correction assistant. Your job is to:
1. Fix spelling errors and OCR mistakes
2. Correct common OCR errors (like "rn" misread as "m", "l" as "I", etc.)
3. Preserve the original formatting and line breaks
4. Fix punctuation and capitalization where clearly wrong
5. Keep all numbers and special characters intact
6. Do NOT add, remove, or rearrange sentences
7. Do NOT translate or paraphrase
8. Return ONLY the corrected text, no explanations

Preserve the exact structure and format of the input.`
          },
          {
            role: "user",
            content: text
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const correctedText = data.choices?.[0]?.message?.content;

    if (!correctedText) {
      throw new Error("No corrected text received from AI");
    }

    console.log("Text correction completed successfully");

    return new Response(
      JSON.stringify({ correctedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error("Error in correct-ocr-text function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to correct text" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
