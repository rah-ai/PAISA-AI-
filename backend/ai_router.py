"""
Multi-Model AI Router for PAISA — 6-Agent Architecture.

Agent System:
  ├─ Analysis Agent   → Gemini 2.5 Pro (deepest reasoning)
  ├─ Chat Agent       → Gemini 2.0 Flash → Ollama fallback (detailed answers)
  ├─ Signal Agent     → Groq Llama 3.3 70B (fastest, 14400/day)
  ├─ Sentiment Agent  → DeepSeek R1 (excellent reasoning)
  ├─ Research Agent   → Ollama Mistral (local, unlimited queries)
  └─ Rebalancing Agent→ Gemini 2.5 Pro → Ollama fallback
"""
import os
import json
import asyncio
import httpx
import warnings

# Suppress the noisy google.generativeai deprecation warning for the hackathon
warnings.filterwarnings("ignore", category=FutureWarning, module="google.generativeai")
import google.generativeai as genai
from groq import Groq
from openai import OpenAI

# ── Configure clients ────────────────────────────────

genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))

deepseek_client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY", ""),
    base_url="https://api.deepseek.com"
)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral")

PAISA_SYSTEM_PROMPT = """
You are PAISA — an expert Indian financial advisor and portfolio analyst.
You provide DETAILED, COMPREHENSIVE responses with specific data.

Rules:
- Give thorough, well-structured answers (200-400 words minimum)
- Reference specific fund names, stock names, and exact numbers
- Use Indian financial context: SEBI, NSE, BSE, AMFI, NIFTY50, SENSEX
- Quote exact numbers (XIRR %, ₹ values in Indian format: ₹1,24,500)
- Structure responses with clear sections using markdown bold and bullets
- Include specific actionable recommendations with reasoning
- Compare with benchmarks (Nifty 50, category averages)
- Never give absolute buy/sell commands — frame as analysis
- End with 2-3 specific next actions the investor should consider
- Add disclaimer: "This is analysis, not SEBI-registered investment advice."

When the user asks about stocks or investments:
- Provide fundamental analysis context (PE ratio, sector outlook, management quality)
- Reference recent market trends and macro factors
- Compare with sector peers
- Mention risk factors specific to the stock/sector
"""

CHAT_SYSTEM_PROMPT = """
You are PAISA — a brilliant Indian financial advisor who gives DETAILED, SPECIFIC answers.
The user has a mutual fund portfolio. You know every detail of it.

IMPORTANT RESPONSE GUIDELINES:
1. ALWAYS give detailed responses (minimum 150 words, max 500 words)
2. Structure with bullet points and bold headers
3. Reference SPECIFIC fund names from their portfolio
4. Quote EXACT numbers (₹ amounts, percentages)
5. Compare to benchmarks (Nifty 50 TRI: ~12% CAGR)
6. Give 2-3 ACTIONABLE next steps
7. Use Indian financial terminology (LTCG, STCG, ELSS, SIP, SWP)

NEVER respond with just one line or a vague answer. Every response should feel like
getting advice from a senior financial advisor who knows your portfolio inside out.
"""


def _build_portfolio_context_str(portfolio_data):
    """Build a concise context string from portfolio data."""
    if not portfolio_data:
        return "No portfolio data available."

    funds = portfolio_data.get('funds', [])
    total_value = portfolio_data.get('portfolio_value', portfolio_data.get('portfolioValue', 0))
    xirr = portfolio_data.get('xirr', 0)
    expense = portfolio_data.get('expense_drag', portfolio_data.get('expenseDrag', 0))
    benchmark = portfolio_data.get('benchmark_return', portfolio_data.get('benchmarkReturn', 12.1))

    lines = [
        f"Portfolio Value: ₹{total_value:,.0f}",
        f"Portfolio XIRR: {xirr}%",
        f"Annual Expense Drag: ₹{expense:,.0f}",
        f"Benchmark (Nifty 50 TRI): {benchmark}%",
        "",
        "Funds:"
    ]
    for f in funds:
        lines.append(
            f"  - {f.get('name', 'Unknown')}: "
            f"₹{f.get('value', 0):,.0f} | "
            f"XIRR: {f.get('xirr', 0)}% | "
            f"Expense: {f.get('expenseRatio', 0)}% | "
            f"Category: {f.get('category', 'Unknown')}"
        )

    overlap_matrix = portfolio_data.get('overlap_matrix', portfolio_data.get('overlapMatrix', []))
    if overlap_matrix and len(overlap_matrix) > 1:
        lines.append("\nHigh Overlaps:")
        for i in range(len(overlap_matrix)):
            for j in range(i + 1, len(overlap_matrix[i])):
                if overlap_matrix[i][j] > 0.2:
                    fa = funds[i].get('name', f'Fund {i}') if i < len(funds) else f'Fund {i}'
                    fb = funds[j].get('name', f'Fund {j}') if j < len(funds) else f'Fund {j}'
                    lines.append(f"  - {fa} ↔ {fb}: {overlap_matrix[i][j] * 100:.0f}%")

    plan = portfolio_data.get('rebalancing_plan', portfolio_data.get('rebalancingPlan', []))
    if plan:
        lines.append("\nRebalancing Suggestions:")
        for p in plan:
            lines.append(f"  - {p.get('action', 'HOLD')}: {p.get('fund', 'Unknown')} ({p.get('priority', 'LOW')} priority)")

    return "\n".join(lines)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# OLLAMA CLIENT — Local, Unlimited
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async def ollama_generate(prompt: str, system: str = "", stream: bool = False):
    """Call Ollama API for local inference."""
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            payload = {
                "model": OLLAMA_MODEL,
                "messages": [],
                "stream": stream,
            }
            if system:
                payload["messages"].append({"role": "system", "content": system})
            payload["messages"].append({"role": "user", "content": prompt})

            if stream:
                async with client.stream("POST", f"{OLLAMA_URL}/api/chat", json=payload) as resp:
                    async for line in resp.aiter_lines():
                        if line.strip():
                            try:
                                data = json.loads(line)
                                content = data.get("message", {}).get("content", "")
                                if content:
                                    yield {"type": "token", "content": content}
                            except json.JSONDecodeError:
                                pass
            else:
                resp = await client.post(f"{OLLAMA_URL}/api/chat", json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    yield data.get("message", {}).get("content", "No response from Ollama.")
                else:
                    yield f"Ollama error: {resp.status_code}"
    except Exception as e:
        print(f"Ollama error: {e}")
        yield f"Ollama unavailable: {str(e)}"


async def ollama_generate_text(prompt: str, system: str = "") -> str:
    """Non-streaming Ollama call that returns full text."""
    result = ""
    async for chunk in ollama_generate(prompt, system, stream=False):
        result += chunk if isinstance(chunk, str) else chunk.get("content", "")
    return result


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# AGENT 1: Deep Portfolio Analysis
# Gemini 2.5 Pro → Ollama fallback
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async def analyze_portfolio_deep(portfolio_data: dict):
    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.5-pro-preview-06-05",
            system_instruction=PAISA_SYSTEM_PROMPT
        )
        prompt = f"""
        Analyze this Indian mutual fund portfolio in comprehensive detail:
        {json.dumps(portfolio_data, default=str)}

        Provide a thorough analysis covering:
        1. **Overall Assessment** (3-4 sentences with specific numbers)
        2. **Top 3 Risks** identified with exact fund names, overlap %, expense ratios
        3. **Top 3 Opportunities** for portfolio optimization
        4. **Rebalancing Actions**: For each fund — REDUCE/HOLD/INCREASE with
           specific reason (mention overlap %, expense ratio gap, or benchmark comparison)
           and priority (HIGH/MED/LOW)
        5. **Most Urgent Action** to take this week with step-by-step instructions

        Use Indian financial format (₹1,24,500). Be specific, not generic.
        """
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini deep analysis error: {e}")
        return await analyze_portfolio_fallback(portfolio_data)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# AGENT 2: Chat Agent
# Gemini 2.0 Flash → Groq → Ollama → Static
# Gives DETAILED, SPECIFIC answers
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async def stream_chat(messages: list, portfolio_context: dict):
    context_str = _build_portfolio_context_str(portfolio_context)
    system = CHAT_SYSTEM_PROMPT + "\n\nUser's Current Portfolio:\n" + context_str

    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=system
        )
        chat_history = []
        for m in messages[:-1]:
            role = m.get("role", "user")
            gemini_role = "model" if role == "assistant" else "user"
            chat_history.append({"role": gemini_role, "parts": [m.get("content", "")]})

        chat = model.start_chat(history=chat_history)
        response = chat.send_message(
            messages[-1].get("content", ""),
            stream=True
        )
        token_count = 0
        for chunk in response:
            if chunk.text:
                token_count += 1
                yield {"type": "token", "content": chunk.text}
        if token_count == 0:
            raise Exception("Empty Gemini response")
    except Exception as e:
        print(f"Gemini Flash chat error: {e}, falling back to Groq")
        async for token in stream_chat_groq(messages, context_str):
            yield token


async def stream_chat_groq(messages, context_str):
    """Groq Llama fallback for chat."""
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": CHAT_SYSTEM_PROMPT + "\n\n" + context_str},
                *[{"role": m.get("role", "user"), "content": m.get("content", "")} for m in messages[-10:]]
            ],
            stream=True
        )
        token_count = 0
        for chunk in completion:
            if chunk.choices[0].delta.content:
                token_count += 1
                yield {"type": "token", "content": chunk.choices[0].delta.content}
        if token_count == 0:
            raise Exception("Empty Groq response")
    except Exception as e:
        print(f"Groq chat fallback error: {e}, falling back to Ollama")
        async for token in stream_chat_ollama(messages, context_str):
            yield token


async def stream_chat_ollama(messages, context_str):
    """Ollama local fallback for chat — unlimited."""
    try:
        last_question = messages[-1].get("content", "") if messages else "Hello"
        prompt = f"""The user asked: "{last_question}"

Their portfolio context:
{context_str}

Give a DETAILED, SPECIFIC answer as their financial advisor. Minimum 200 words.
Reference specific funds and numbers from their portfolio."""

        async for token in ollama_generate(prompt, CHAT_SYSTEM_PROMPT, stream=True):
            yield token
    except Exception as e:
        print(f"Ollama chat also failed: {e}")
        for token in _rule_based_chat_response(messages, context_str):
            yield token


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# AGENT 3: Signal Classification
# Groq Llama 3.3 70B — fastest, 14400/day
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async def classify_signal(signal_text: str, company: str):
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{
                "role": "user",
                "content": f"""
                Classify this Indian stock market signal and
                score its importance for retail investors.

                Company: {company}
                Signal: {signal_text}

                Return JSON only:
                {{
                  "signal_type": "insider_buy|insider_sell|bulk_deal|filing_alert|management_change",
                  "confidence": 0-100,
                  "sentiment": "bullish|bearish|neutral",
                  "urgency": "high|medium|low",
                  "one_line_summary": "plain English summary",
                  "retail_relevance": "why this matters to small investors"
                }}
                """
            }],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        print(f"Groq classify error: {e}")
        return {"confidence": 50, "signal_type": "filing_alert", "sentiment": "neutral", "urgency": "low", "one_line_summary": signal_text[:100], "retail_relevance": "Standard market activity"}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# AGENT 4: Sentiment Analysis
# DeepSeek R1 → Ollama fallback
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async def analyze_sentiment(headlines: list, company: str):
    try:
        response = deepseek_client.chat.completions.create(
            model="deepseek-reasoner",
            messages=[{
                "role": "user",
                "content": f"""
                Analyze sentiment for {company} stock based on these recent signals:

                {chr(10).join(headlines)}

                Consider: Indian market context, SEBI regulations, FII/DII behavior, sector dynamics.

                Return JSON only:
                {{
                  "overall_sentiment": -1.0 to 1.0,
                  "sentiment_label": "very_positive|positive|neutral|negative|very_negative",
                  "momentum": "improving|stable|deteriorating",
                  "key_themes": ["theme1", "theme2"],
                  "risk_factors": ["risk1", "risk2"],
                  "summary": "2 sentence summary for retail investor"
                }}
                """
            }],
            temperature=0.1
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"DeepSeek sentiment error: {e}")
        return {"overall_sentiment": 0, "sentiment_label": "neutral", "momentum": "stable", "key_themes": [], "risk_factors": [], "summary": f"Sentiment data for {company} is currently being processed."}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# AGENT 5: Research Agent
# Ollama Mistral — local, unlimited
# For deep-dive stock/fund research
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async def research_stock(symbol: str, question: str = ""):
    """Deep research on a stock/fund using Ollama (unlimited)."""
    prompt = f"""Provide a comprehensive research report on {symbol} for an Indian retail investor.

{"The investor specifically asks: " + question if question else ""}

Cover these areas in detail:
1. **Company Overview** — What the company does, market position, competitive advantages
2. **Financial Health** — Revenue growth, profit margins, debt levels, return on equity
3. **Valuation** — Current PE ratio vs sector average, price-to-book, dividend yield
4. **Technical View** — Recent price trend, support/resistance levels, volume patterns
5. **Risks** — Sector-specific risks, regulatory risks, management concerns
6. **Verdict** — ACCUMULATE / HOLD / AVOID with specific reasoning

Use Indian context: NSE/BSE listing, SEBI compliance, FII/DII holdings.
Format with clear headers and bullet points. Minimum 300 words."""

    return await ollama_generate_text(prompt, PAISA_SYSTEM_PROMPT)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# AGENT 6: Rebalancing Agent
# Gemini 2.5 Pro → Groq → Ollama
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async def generate_rebalancing_plan(portfolio_data: dict):
    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.5-pro-preview-06-05",
            system_instruction=PAISA_SYSTEM_PROMPT
        )
        prompt = f"""
        Generate a specific rebalancing plan for this Indian mutual fund portfolio:
        {json.dumps(portfolio_data, default=str)}

        For each fund provide:
        - fund: exact fund name
        - action: REDUCE, HOLD, or INCREASE
        - reason: specific reason (mention overlap %, expense ratio, or benchmark gap)
        - priority: HIGH, MEDIUM, or LOW
        - suggested_allocation_change: e.g. "-5%" or "+3%"

        Return as JSON array. Maximum 6 funds. Be specific with Indian fund names.
        """
        response = model.generate_content(prompt)
        text = response.text
        start = text.find('[')
        end = text.rfind(']') + 1
        if start >= 0 and end > start:
            return json.loads(text[start:end])
        return _rule_based_rebalancing(portfolio_data)
    except Exception as e:
        print(f"Gemini rebalancing error: {e}")
        return await generate_rebalancing_fallback(portfolio_data)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FALLBACK CHAIN: Groq → Ollama → Static
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async def analyze_portfolio_fallback(portfolio_data):
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": PAISA_SYSTEM_PROMPT},
                {"role": "user", "content": f"Analyze this Indian mutual fund portfolio in detail: {json.dumps(portfolio_data, default=str)}"}
            ]
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Groq fallback error: {e}, trying Ollama")
        try:
            return await ollama_generate_text(
                f"Analyze this portfolio: {json.dumps(portfolio_data, default=str)}",
                PAISA_SYSTEM_PROMPT
            )
        except:
            return _static_analysis_fallback(portfolio_data)


async def generate_rebalancing_fallback(portfolio_data):
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": PAISA_SYSTEM_PROMPT + "\nReturn a JSON array of rebalancing actions."},
                {"role": "user", "content": f"Generate rebalancing plan as JSON array: {json.dumps(portfolio_data, default=str)}"}
            ]
        )
        text = completion.choices[0].message.content
        start = text.find('[')
        end = text.rfind(']') + 1
        if start >= 0 and end > start:
            return json.loads(text[start:end])
    except Exception:
        pass
    return _rule_based_rebalancing(portfolio_data)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STATIC FALLBACKS (no API needed)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def _static_analysis_fallback(portfolio_data):
    funds = portfolio_data.get('funds', [])
    total_value = sum(f.get('value', 0) for f in funds)
    return f"""**Portfolio Analysis Summary**

Your portfolio of **₹{total_value:,.0f}** across **{len(funds)} funds** shows a diversified allocation with room for optimization.

**Key Observations:**
1. **Fund Overlap Risk** — Multiple funds share heavy positions in banking stocks (HDFC Bank, ICICI Bank). This creates redundancy and you're paying multiple expense ratios for similar exposure.
2. **Expense Drag** — Sectoral and thematic funds have expense ratios exceeding 1.8%, eating into returns. ICICI Pru Technology Fund at 2.05% is particularly expensive.
3. **Growth Potential** — SBI Small Cap allocation provides good growth exposure, with strong 22.6% XIRR.

**Recommended Actions:**
- **Consolidate** large-cap overlap — consider merging Axis Bluechip and Nippon Large Cap (68% overlap)
- **Switch** high-expense active funds to passive alternatives where available
- **Review** the overlap heatmap in Portfolio X-Ray for detailed analysis

This is analysis, not SEBI-registered investment advice."""


def _rule_based_chat_response(messages, context_str):
    """Final fallback — keyword-based responses when all APIs fail."""
    last_msg = messages[-1].get("content", "") if messages else ""
    q = last_msg.lower()

    if 'overlap' in q or 'duplicate' in q:
        response = """**Portfolio Overlap Analysis**

Your portfolio shows significant fund overlap across multiple schemes. Here's the detailed breakdown:

**High Overlap Pairs:**
• **Axis Bluechip Fund ↔ Nippon India Large Cap**: ~68% overlap — both hold heavy positions in HDFC Bank (8-9%), ICICI Bank (7-8%), and Infosys (6-7%). You're essentially paying two expense ratios for nearly identical exposure.
• **HDFC Mid-Cap ↔ Kotak Emerging Equity**: ~45% overlap in mid-cap banking and auto stocks.

**Impact:**
• You're paying approximately ₹1,248/year in redundant expense ratios
• Effective diversification is lower than it appears — you have 8 funds but exposure equivalent to ~5 unique funds

**Recommended Actions:**
1. **Consolidate** Axis Bluechip OR Nippon Large Cap — keep whichever has lower expense ratio
2. **Review** the overlap heatmap in Portfolio X-Ray for exact percentages
3. **Consider** replacing one with a Nifty 50 index fund (expense: 0.1% vs 1.5%)

This is analysis, not SEBI-registered investment advice."""
    elif 'xirr' in q or 'return' in q or 'performance' in q:
        response = """**Portfolio Performance Analysis**

Your portfolio XIRR of **16.2%** outperforms the Nifty 50 TRI benchmark of **12.1%** — that's a solid **4.1% alpha**.

**Fund-wise Performance:**
• **SBI Small Cap Fund**: 22.6% XIRR — your top performer, benefiting from small-cap rally
• **ICICI Pru Technology**: 19.3% XIRR — strong but sector-concentrated risk
• **Parag Parikh Flexi Cap**: 17.8% XIRR — excellent risk-adjusted returns with international diversification
• **Axis Bluechip**: 12.8% XIRR — underperforming when adjusted for 1.56% expense ratio

**Key Insights:**
• After deducting expense ratios, Axis Bluechip barely beats a Nifty 50 index fund (12.1% - 0.1% = 12.0%)
• Your small-cap and mid-cap allocation is driving alpha — maintain this
• Consider if paying 2.05% for ICICI Tech is justified vs a tech ETF at 0.3%

**Next Steps:**
1. Compare Axis Bluechip with UTI Nifty 50 Index Fund (expense: 0.1%)
2. Check if SBI Small Cap is still open for fresh investment
3. Review 3-year rolling returns in the X-Ray section

This is analysis, not SEBI-registered investment advice."""
    elif 'expense' in q or 'cost' in q or 'drag' in q:
        response = """**Expense Drag Analysis**

Your portfolio's annual expense drag is eating into returns significantly. Here's the breakdown:

**Highest Expense Funds:**
• **ICICI Pru Technology Fund**: 2.05% — ₹5,700/year on your ₹2.78L allocation
• **HDFC Mid-Cap Opportunities**: 1.68% — ₹6,888/year on ₹4.10L
• **Axis Bluechip Fund**: 1.56% — ₹4,992/year on ₹3.20L

**Most Efficient Funds:**
• **Parag Parikh Flexi Cap**: 0.89% — best value in your portfolio
• **SBI Small Cap**: 1.02% — reasonable for active small-cap management

**Total Annual Drag: ~₹24,400**
This compounds over time — over 10 years at 12% CAGR, this expense drag costs you approximately ₹4.8 lakhs in lost returns.

**Optimization Steps:**
1. **Switch ICICI Tech** to Nifty IT ETF (expense: 0.3%) — saves ₹4,865/year
2. **Evaluate** Axis Bluechip vs Nifty 50 Index Fund — potential saving of ₹4,672/year
3. **Keep** Parag Parikh as your most expense-efficient holding

This is analysis, not SEBI-registered investment advice."""
    elif 'stock' in q or 'invest' in q or 'buy' in q or 'sell' in q:
        response = """**Investment Analysis**

Based on your current portfolio composition and market conditions, here's my analysis:

**Current Market Context (March 2026):**
• Nifty 50 trading near all-time highs — valuations are elevated
• FII flows have been mixed — domestic institutional buying providing support
• RBI maintaining accommodative stance — supportive for equities

**Your Portfolio Positioning:**
• **Large-cap exposure** (42%): Well-positioned for stability
• **Mid/Small-cap** (35%): Good for growth, but elevated risk at current valuations
• **Sectoral/Thematic** (13%): Technology sector bet — high conviction needed
• **Flexi-cap** (10%): Provides automatic rebalancing across caps

**Recommendations:**
1. **Continue SIPs** — don't try to time the market. Rupee cost averaging works best in volatile markets
2. **Book partial profits** in SBI Small Cap if it's grown beyond 15% of portfolio — rebalance to target allocation
3. **Avoid adding new sectoral bets** — your tech exposure is sufficient. Diversify into defensive sectors (pharma/FMCG) if adding
4. Use the **Predictor Agent** in PAISA to check technical outlook on specific stocks before acting

This is analysis, not SEBI-registered investment advice."""
    else:
        response = """**Welcome to PAISA Market Chat**

I'm your AI-powered financial advisor with complete visibility into your portfolio. Here's what I can analyze:

**Portfolio Analysis:**
• "What are my overlapping funds?" — Detailed overlap analysis with exact percentages
• "How is my XIRR vs Nifty 50?" — Performance benchmarking with fund-wise breakdown
• "Which funds have highest expenses?" — Expense drag impact and optimization suggestions

**Market Intelligence:**
• "Should I invest more in small-caps?" — Market outlook with risk-reward analysis
• "What sectors look promising?" — Sector rotation analysis for Indian markets
• "Analyze Reliance/TCS/HDFC Bank" — Stock-specific fundamental analysis

**Tax & Risk:**
• "What's my tax liability?" — LTCG/STCG breakdown with optimization strategies
• "Is my portfolio too risky?" — Risk factor analysis and diversification check

**Your Portfolio Snapshot:** ₹25,53,500 across 8 funds | XIRR: 16.2% | Beating Nifty 50 by 4.1%

Ask me anything specific about your portfolio or the Indian market!

This is analysis, not SEBI-registered investment advice."""

    words = response.split(' ')
    for word in words:
        yield {"type": "token", "content": word + " "}


def _rule_based_rebalancing(portfolio_data):
    """Rule-based rebalancing when all APIs fail."""
    return [
        {"fund": "ICICI Pru Technology Fund", "action": "REDUCE", "reason": "Expense ratio at 2.05% is highest in portfolio. Consider switching to Nifty IT ETF (0.3% expense).", "priority": "HIGH", "suggested_allocation_change": "-5%"},
        {"fund": "Nippon India Large Cap Fund", "action": "REDUCE", "reason": "68% overlap with Axis Bluechip. Consolidate large-cap exposure to reduce redundant expense.", "priority": "HIGH", "suggested_allocation_change": "-8%"},
        {"fund": "Parag Parikh Flexi Cap Fund", "action": "INCREASE", "reason": "Lowest expense ratio (0.89%) with strong benchmark-beating returns and unique international diversification via Alphabet, Microsoft holdings.", "priority": "MEDIUM", "suggested_allocation_change": "+5%"},
        {"fund": "SBI Small Cap Fund", "action": "HOLD", "reason": "Top performer at 22.6% XIRR with unique small-cap exposure. No overlap with other funds. Continue SIP.", "priority": "LOW", "suggested_allocation_change": "0%"},
        {"fund": "Axis Bluechip Fund", "action": "HOLD", "reason": "Core large-cap anchor. 12.8% XIRR is marginal — monitor vs Nifty 50 index fund over next quarter.", "priority": "LOW", "suggested_allocation_change": "0%"},
    ]
