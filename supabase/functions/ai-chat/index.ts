import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { message, contextPrompt, history = [], session_id } = await req.json() as {
      message: string;
      contextPrompt?: string;
      history: { role: string; content: string }[];
      session_id?: string;
    };

    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiKey) {
      const fallback = generateFallbackResponse(message, contextPrompt || "");
      if (session_id) {
        await supabase.from("ai_chat_messages").insert([
          { user_id: user.id, role: "user", content: message, session_id },
          { user_id: user.id, role: "assistant", content: fallback, session_id },
        ]);
      }
      return new Response(JSON.stringify({ reply: fallback }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are TraderOS AI — a personal trading coach embedded in a professional trading journal platform. You have access to the user's actual trading data. Every response must reference their real data.

Current user context:
${contextPrompt || "No context available."}

Rules:
1. ALWAYS reference the user's actual data when answering. Never give generic advice.
2. Be specific, concise, and actionable. No fluff.
3. Focus on one core insight per answer.
4. Use numbers and percentages from their stats.
5. Format with short paragraphs and bullet points.
6. NEVER give financial advice, guarantee profits, or predict prices.
7. NEVER generate fake statistics — only use the data provided.
8. Always explain your reasoning.
9. Tone: confident expert coach, not a generic chatbot.
10. If asked about something outside their data, say so honestly.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10).map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!openAiRes.ok) {
      if (openAiRes.status === 429 || openAiRes.status === 402) {
        const fallback = generateFallbackResponse(message, contextPrompt || "");
        if (session_id) {
          await supabase.from("ai_chat_messages").insert([
            { user_id: user.id, role: "user", content: message, session_id },
            { user_id: user.id, role: "assistant", content: fallback, session_id },
          ]);
        }
        return new Response(JSON.stringify({ reply: fallback }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await openAiRes.text();
      throw new Error(`OpenAI error: ${openAiRes.status} ${errText}`);
    }

    const openAiData = await openAiRes.json();
    const reply = openAiData.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

    if (session_id) {
      await supabase.from("ai_chat_messages").insert([
        { user_id: user.id, role: "user", content: message, session_id },
        { user_id: user.id, role: "assistant", content: reply, session_id },
      ]);
    } else {
      await supabase.from("ai_chat_messages").insert([
        { user_id: user.id, role: "user", content: message },
        { user_id: user.id, role: "assistant", content: reply },
      ]);
    }

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateFallbackResponse(message: string, contextPrompt: string): string {
  const q = message.toLowerCase().trim();
  const ctx = contextPrompt || "";

  if (/^(hi|hello|hey|yo|sup|howdy|greetings)\b/.test(q)) {
    return `Hey! I'm your TraderOS AI Coach. I can see your trading data and I'm ready to help.\n\nHere's what I can see:\n${ctx}\n\nAsk me about your performance, strategies, mistakes, or psychology — I'll answer based on your actual data.`;
  }

  if (q.includes("how am i") || q.includes("summary") || q.includes("doing") || q.includes("overview")) {
    return `Here's your trading snapshot based on your data:\n\n${ctx}\n\nAsk me about specific areas — your win rate, best session, biggest mistakes, or psychology — and I'll give you detailed, data-backed analysis.`;
  }

  if (q.includes("mistake")) {
    return `Based on your trade history, I can analyze your mistakes. Your context:\n\n${ctx}\n\nReview your losing trades in the journal and look for patterns in session, instrument, and emotional state. Check your mistake library in the Psychology module for recurring issues.`;
  }

  if (q.includes("discipline")) {
    return `Your discipline is tracked through your psychology logs and mistake library.\n\n${ctx}\n\nTo improve discipline: use your pre-trade checklist on every entry, track your mistakes, and review your psychology logs weekly.`;
  }

  if (q.includes("psychology") || q.includes("emotion") || q.includes("fomo") || q.includes("fear")) {
    return `Your psychology data:\n\n${ctx}\n\nI analyze your confidence, discipline, FOMO, and stress levels from your journal entries. Keep logging your emotions daily for more accurate coaching.`;
  }

  if (q.includes("improve") || q.includes("better") || q.includes("should")) {
    return `Based on your data, here are your highest-leverage improvements:\n\n${ctx}\n\n1. Focus on your best-performing instrument and session\n2. Review your worst trades for patterns\n3. Tighten entry criteria if your win rate is below 50%\n4. Target higher R:R if yours is below 2:1`;
  }

  if (q.includes("strategy")) {
    return `Your strategy data:\n\n${ctx}\n\nI can see your documented strategies. Compare your strategy rules against your actual trade outcomes to find gaps. Visit the Strategy Management module for detailed strategy performance.`;
  }

  if (q.includes("risk")) {
    return `Your risk profile:\n\n${ctx}\n\nCheck your profit factor (above 1.5 is good), average R:R (aim for 2:1+), and max losing streak. If any of these are weak, focus on position sizing and cutting losses quickly.`;
  }

  if (q.includes("review") && q.includes("trade")) {
    return `I can review any of your trades. Go to the AI Trade Review tab and select a trade — I'll analyze the entry, exit, R:R, notes, and strategy alignment.\n\nYour current context:\n${ctx}`;
  }

  if (q.includes("compare")) {
    return `To compare periods, I use your monthly P&L data.\n\n${ctx}\n\nLook at your monthly breakdown to see which months were profitable and what changed. Focus on what was different in your best vs worst months.`;
  }

  return `I'm analyzing your trading data. Here's what I can see:\n\n${ctx}\n\nI didn't quite catch that, but you can ask me:\n\n• "How am I doing?"\n• "What are my biggest mistakes?"\n• "How is my discipline?"\n• "What should I improve?"\n• "Review my strategy"\n• "How is my psychology?"\n\nTo unlock full AI responses to any question, configure an OpenAI API key in your Supabase edge function secrets.`;
}
