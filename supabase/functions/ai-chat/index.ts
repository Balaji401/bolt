import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TradeContext {
  totalTrades: number;
  winRate: number;
  netPnl: number;
  avgRR: number;
  profitFactor: number;
  bestInstrument: string;
  worstInstrument: string;
  bestSession: string;
  worstSession: string;
  bestWeekday: string;
  currentStreak: number;
  maxDrawdown: number;
}

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

    // Verify user
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

    const { message, context, history = [] } = await req.json() as {
      message: string;
      context: TradeContext;
      history: { role: string; content: string }[];
    };

    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiKey) {
      // Return a smart fallback response when OpenAI isn't configured
      const fallback = generateFallbackResponse(message, context);
      return new Response(JSON.stringify({ reply: fallback }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are TraderOS AI — an expert trading coach and analyst embedded inside a professional trading journal platform. You have access to the user's actual trading statistics and you give precise, data-driven, actionable answers.

The user's current trading statistics:
- Total trades: ${context.totalTrades}
- Win rate: ${context.winRate.toFixed(1)}%
- Net P&L: $${context.netPnl.toFixed(2)}
- Average R:R: ${context.avgRR.toFixed(2)}
- Profit factor: ${context.profitFactor.toFixed(2)}
- Best instrument: ${context.bestInstrument || "N/A"}
- Worst instrument: ${context.worstInstrument || "N/A"}
- Best session: ${context.bestSession || "N/A"}
- Worst session: ${context.worstSession || "N/A"}
- Best weekday: ${context.bestWeekday || "N/A"}
- Current streak: ${context.currentStreak > 0 ? `+${context.currentStreak} wins` : `${context.currentStreak} losses`}
- Max drawdown: ${context.maxDrawdown.toFixed(1)}%

Rules:
1. Always reference the user's actual data when answering.
2. Be specific, concise, and actionable. No fluff.
3. Focus on one core insight per answer. Don't overwhelm.
4. Use numbers and percentages from their stats when relevant.
5. Format responses with short paragraphs. Use bullet points for lists.
6. Never hallucinate data — if you don't know something, say so.
7. Tone: confident expert coach, not a generic chatbot.`;

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
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!openAiRes.ok) {
      const errText = await openAiRes.text();
      throw new Error(`OpenAI error: ${openAiRes.status} ${errText}`);
    }

    const openAiData = await openAiRes.json();
    const reply = openAiData.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

    // Persist message + reply to DB
    await supabase.from("ai_chat_messages").insert([
      { user_id: user.id, role: "user", content: message },
      { user_id: user.id, role: "assistant", content: reply },
    ]);

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

// Smart fallback when OpenAI key is not set — uses the context to generate a useful response
function generateFallbackResponse(message: string, ctx: TradeContext): string {
  const q = message.toLowerCase();

  if (q.includes("best") && (q.includes("instrument") || q.includes("pair") || q.includes("currency"))) {
    return `Based on your trade history, **${ctx.bestInstrument || "N/A"}** is your best-performing instrument. Focus your attention there — trade what you're good at, not what looks exciting.`;
  }
  if (q.includes("worst") && (q.includes("instrument") || q.includes("pair"))) {
    return `Your weakest instrument is **${ctx.worstInstrument || "N/A"}**. Consider cutting it from your watchlist entirely, or paper-trading it until you understand why you lose on it.`;
  }
  if (q.includes("win rate") || q.includes("winning")) {
    if (ctx.winRate < 40) return `Your win rate is **${ctx.winRate.toFixed(1)}%** — below 40%. This is a major issue. Focus on trade quality: only take A+ setups that fully meet your checklist. One good trade beats three mediocre ones.`;
    if (ctx.winRate < 55) return `Your win rate is **${ctx.winRate.toFixed(1)}%** — acceptable, but improvable. Review your losing trades: is there a pattern (specific session, instrument, or emotional state) that's dragging your rate down?`;
    return `Your win rate is **${ctx.winRate.toFixed(1)}%** — solid. Make sure your average R:R (${ctx.avgRR.toFixed(2)}) justifies the risk. A high win rate with poor R:R can still result in net losses over time.`;
  }
  if (q.includes("losing money") || q.includes("why am i losing") || q.includes("not profitable")) {
    return `With a net P&L of **$${ctx.netPnl.toFixed(2)}** and a profit factor of **${ctx.profitFactor.toFixed(2)}**, here's what to check:\n\n• Are you consistently using the right position size?\n• Are you cutting winners too early or letting losers run?\n• Your worst session is **${ctx.worstSession}** — consider avoiding it.\n• Review your last 10 losing trades for a common pattern.`;
  }
  if (q.includes("best time") || q.includes("best session") || q.includes("when should")) {
    return `Your strongest session is **${ctx.bestSession}**. Schedule your active trading around that window. Avoid **${ctx.worstSession}** unless you have a specific edge you've back-tested.`;
  }
  if (q.includes("drawdown") || q.includes("draw down")) {
    return `Your maximum drawdown is **${ctx.maxDrawdown.toFixed(1)}%**. ${ctx.maxDrawdown > 15 ? "This is high — consider halving your position size until your equity recovers. Protect capital first." : "This is within an acceptable range. Keep following your risk rules to maintain it."}`;
  }
  if (q.includes("improve") || q.includes("better") || q.includes("plan")) {
    return `Based on your stats, here are your 3 highest-leverage improvements:\n\n1. **Focus on ${ctx.bestInstrument || "your best instrument"}** — where you already have an edge.\n2. **Trade more in the ${ctx.bestSession || "best"} session** — your stats are strongest there.\n3. **Target an avg R:R above 2:1** — yours is currently ${ctx.avgRR.toFixed(2)}.`;
  }
  if (q.includes("streak") || q.includes("consecutive")) {
    return ctx.currentStreak > 0
      ? `You are on a **${ctx.currentStreak}-trade winning streak**. Don't increase position size just because you're on a roll — stick to your risk rules. Streaks end.`
      : `You are on a **${Math.abs(ctx.currentStreak)}-trade losing streak**. Step back, review your last few trades, and consider taking a break for 24 hours to reset mentally.`;
  }

  return `I'm analyzing your **${ctx.totalTrades} trades** with a **${ctx.winRate.toFixed(1)}% win rate** and **${ctx.profitFactor.toFixed(2)} profit factor**.\n\nTo unlock full AI chat with personalized answers to any trading question, configure your OpenAI API key in the Supabase edge function secrets. Your data is ready — the AI just needs the key.`;
}
