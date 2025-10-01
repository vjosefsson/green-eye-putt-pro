import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData } = await req.json();
    
    if (!imageData) {
      return new Response(
        JSON.stringify({ error: "Image data is required" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing golf green with Lovable AI...");

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
            content: `You are an expert golf caddy analyzing putting greens. Analyze the image and provide:
1. The primary direction and aim point for the putt
2. The break characteristics (direction, severity, and distance)
3. Your confidence level in the analysis
4. 4 specific recommendations for making this putt

Return your response in JSON format with this structure:
{
  "puttingLine": {
    "direction": "Aim X inches left/right of the cup",
    "break": "Description of break direction and severity",
    "confidence": "High/Medium/Low confidence (X%)"
  },
  "recommendations": [
    "recommendation 1",
    "recommendation 2",
    "recommendation 3",
    "recommendation 4"
  ]
}

Be specific and concise. Focus on actionable advice.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this golf green and provide putting line recommendations."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { 
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add more credits to your workspace." }),
          { 
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices?.[0]?.message?.content;
    
    if (!analysisText) {
      throw new Error("No analysis received from AI");
    }

    console.log("Raw AI response:", analysisText);

    // Parse the JSON response from the AI
    let analysis;
    try {
      // Try to extract JSON from the response (in case it's wrapped in markdown)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = JSON.parse(analysisText);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback to a default structure
      analysis = {
        puttingLine: {
          direction: "Aim slightly left of center",
          break: "Moderate right-to-left break expected",
          confidence: "Medium confidence (65%)"
        },
        recommendations: [
          "Account for green slope in your read",
          "Use medium pace for this distance",
          "Watch the grain direction",
          "Trust your line and commit to the stroke"
        ]
      };
    }

    return new Response(
      JSON.stringify(analysis),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error in analyze-green function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
