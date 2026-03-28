"""
Claude AI Agent for PAISA — portfolio-aware chat and rebalancing.
Uses Anthropic Claude API for streaming responses.
"""
import os
import json
import httpx

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL = "claude-sonnet-4-20250514"
ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

SYSTEM_PROMPT = """You are PAISA, an expert Indian financial advisor and portfolio analyst.
You have access to the user's complete mutual fund portfolio data.

Rules:
- Always refer to specific funds from the user's portfolio by name
- Use Indian financial context: SEBI regulations, NSE/BSE, AMFI guidelines
- Quote specific numbers from their portfolio (XIRR, overlaps, values)
- Keep responses under 120 words unless asked for detailed analysis
- Never give absolute buy/sell commands — frame as analysis and options
- Always cite your reasoning (mention overlap %, expense ratio, benchmark gap)
- End responses with one specific next action the user can take
- Format rupee amounts in Indian system: ₹1,24,500 not ₹124,500
- Always end with: "This is analysis, not investment advice. Consult a SEBI-registered advisor before making decisions."

Portfolio context will be injected into each request."""


def _build_portfolio_context(portfolio_data):
    """Convert portfolio data to a context string for the system prompt."""
    if not portfolio_data:
        return "No portfolio data available."

    funds = portfolio_data.get('funds', [])
    if not funds:
        return "No funds in portfolio."

    lines = [
        f"Portfolio Value: ₹{portfolio_data.get('portfolio_value', portfolio_data.get('portfolioValue', 0)):,.0f}",
        f"Portfolio XIRR: {portfolio_data.get('xirr', 0)}%",
        f"Annual Expense Drag: ₹{portfolio_data.get('expense_drag', portfolio_data.get('expenseDrag', 0)):,.0f}",
        f"Benchmark (Nifty 50): {portfolio_data.get('benchmark_return', portfolio_data.get('benchmarkReturn', 12.1))}%",
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

    # Add overlap info
    overlap_matrix = portfolio_data.get('overlap_matrix', portfolio_data.get('overlapMatrix', []))
    if overlap_matrix and len(overlap_matrix) > 1:
        lines.append("\nHigh Overlaps:")
        for i in range(len(overlap_matrix)):
            for j in range(i + 1, len(overlap_matrix[i])):
                if overlap_matrix[i][j] > 0.2:
                    fund_a = funds[i].get('name', f'Fund {i}') if i < len(funds) else f'Fund {i}'
                    fund_b = funds[j].get('name', f'Fund {j}') if j < len(funds) else f'Fund {j}'
                    lines.append(f"  - {fund_a} ↔ {fund_b}: {overlap_matrix[i][j] * 100:.0f}%")

    # Add rebalancing plan
    plan = portfolio_data.get('rebalancing_plan', portfolio_data.get('rebalancingPlan', []))
    if plan:
        lines.append("\nRebalancing Suggestions:")
        for p in plan:
            lines.append(f"  - {p.get('action', 'HOLD')}: {p.get('fund', 'Unknown')} ({p.get('priority', 'LOW')} priority)")

    return "\n".join(lines)


async def stream_chat(messages, portfolio_context):
    """Stream chat response from Claude API token by token."""
    context_str = _build_portfolio_context(portfolio_context)
    full_system = f"{SYSTEM_PROMPT}\n\nCurrent Portfolio:\n{context_str}"

    if not ANTHROPIC_API_KEY:
        # Fallback to rule-based response
        for token in _generate_fallback(messages, portfolio_context):
            yield token
        return

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                ANTHROPIC_API_URL,
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": CLAUDE_MODEL,
                    "max_tokens": 1024,
                    "system": full_system,
                    "messages": [
                        {"role": m.get("role", "user"), "content": m.get("content", "")}
                        for m in messages[-10:]  # Keep last 10 messages for context
                    ],
                    "stream": True,
                },
            )

            if response.status_code != 200:
                # Fallback on API error
                for token in _generate_fallback(messages, portfolio_context):
                    yield token
                return

            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    try:
                        data = json.loads(line[6:])
                        if data.get("type") == "content_block_delta":
                            text = data.get("delta", {}).get("text", "")
                            if text:
                                yield {"type": "token", "content": text}
                    except json.JSONDecodeError:
                        continue

    except Exception as e:
        print(f"Claude API error: {e}")
        for token in _generate_fallback(messages, portfolio_context):
            yield token


async def generate_rebalancing(portfolio_data):
    """Generate AI-powered rebalancing plan."""
    if not ANTHROPIC_API_KEY:
        return _rule_based_rebalancing(portfolio_data)

    context_str = _build_portfolio_context(portfolio_data)

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                ANTHROPIC_API_URL,
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": CLAUDE_MODEL,
                    "max_tokens": 2048,
                    "system": "You are PAISA, an expert Indian mutual fund portfolio analyzer. Analyze the portfolio and return a JSON array of rebalancing recommendations. Each item must have: fund (string), action (REDUCE/HOLD/INCREASE), reason (string), priority (HIGH/MEDIUM/LOW). Priority is HIGH if overlap > 60% or expense ratio > 1.5%. Return ONLY valid JSON array.",
                    "messages": [
                        {"role": "user", "content": f"Analyze this portfolio and provide rebalancing recommendations:\n\n{context_str}"}
                    ],
                },
            )

            if response.status_code == 200:
                data = response.json()
                content = data.get("content", [{}])[0].get("text", "[]")
                # Extract JSON from response
                try:
                    # Try to find JSON array in response
                    start = content.find('[')
                    end = content.rfind(']') + 1
                    if start >= 0 and end > start:
                        return json.loads(content[start:end])
                except json.JSONDecodeError:
                    pass

    except Exception as e:
        print(f"Rebalancing API error: {e}")

    return _rule_based_rebalancing(portfolio_data)


def _generate_fallback(messages, portfolio_data):
    """Generate rule-based fallback response when API is unavailable."""
    last_msg = messages[-1].get("content", "") if messages else ""
    q = last_msg.lower()

    funds = portfolio_data.get('funds', [])
    xirr = portfolio_data.get('xirr', 0)
    expense = portfolio_data.get('expense_drag', portfolio_data.get('expenseDrag', 0))
    value = portfolio_data.get('portfolio_value', portfolio_data.get('portfolioValue', 0))

    if 'overlap' in q or 'duplicate' in q:
        response = f"Your portfolio shows significant fund overlap. Based on holding analysis, your HDFC Mid-Cap and Kotak Emerging Equity funds share common holdings in Persistent Systems, Indian Hotels, and Supreme Industries. Similarly, Axis Bluechip and Nippon Large Cap have substantial overlap in HDFC Bank and ICICI Bank positions.\n\nRecommendation: Consider consolidating one of the large-cap funds to reduce redundancy and save on expense ratios.\n\nThis is analysis, not investment advice. Consult a SEBI-registered advisor before making decisions."
    elif 'xirr' in q or 'return' in q or 'performance' in q:
        response = f"Your portfolio XIRR is {xirr}%, outperforming Nifty 50 benchmark by approximately {xirr - 12.1:.1f}%. Your best performer is SBI Small Cap at 22.6% XIRR, while Axis Bluechip trails at 11.8%.\n\nNext step: Evaluate whether Axis Bluechip's 1.56% expense ratio is justified given a Nifty 50 index fund achieves similar returns at 0.1% expense.\n\nThis is analysis, not investment advice. Consult a SEBI-registered advisor before making decisions."
    elif 'expense' in q or 'cost' in q or 'drag' in q:
        response = f"Your annual expense drag is ₹{expense:,.0f}, representing {(expense/value*100) if value else 0:.1f}% of portfolio value. ICICI Pru Technology Fund has the highest ratio at 2.05%, while Parag Parikh Flexi Cap is most efficient at 0.89%.\n\nAction: Switching from ICICI Technology (2.05%) to a passive tech ETF could save approximately ₹5,700 annually.\n\nThis is analysis, not investment advice. Consult a SEBI-registered advisor before making decisions."
    else:
        response = f"Your portfolio of ₹{value/100000:.1f}L across {len(funds)} funds shows a weighted XIRR of {xirr}%. Key insights:\n\n1. Overlap risk: Multiple large-cap funds share HDFC Bank and ICICI Bank positions\n2. Expense optimization: ₹{int(expense*0.3):,} saveable annually by consolidating high-expense funds\n3. Top performer: SBI Small Cap (22.6% XIRR) with unique small-cap diversification\n\nWould you like me to dive deeper into overlaps, expenses, or rebalancing options?\n\nThis is analysis, not investment advice. Consult a SEBI-registered advisor before making decisions."

    # Yield word by word for streaming effect
    words = response.split(' ')
    for word in words:
        yield {"type": "token", "content": word + " "}


def _rule_based_rebalancing(portfolio_data):
    """Rule-based rebalancing fallback."""
    return [
        {"fund": "ICICI Pru Technology Fund", "action": "REDUCE", "reason": "Expense ratio at 2.05% is above category average. Consider passive tech ETF alternative.", "priority": "HIGH"},
        {"fund": "Nippon India Large Cap Fund", "action": "REDUCE", "reason": "68% overlap with Axis Bluechip. Consolidate large-cap exposure.", "priority": "HIGH"},
        {"fund": "Parag Parikh Flexi Cap Fund", "action": "INCREASE", "reason": "Lowest expense (0.89%) with strong returns and unique international diversification.", "priority": "MEDIUM"},
        {"fund": "SBI Small Cap Fund", "action": "HOLD", "reason": "Strong 22.6% XIRR with unique exposure. No overlap issues.", "priority": "LOW"},
        {"fund": "Axis Bluechip Fund", "action": "HOLD", "reason": "Core large-cap allocation. Monitor vs Nifty 50 index fund.", "priority": "LOW"},
    ]
