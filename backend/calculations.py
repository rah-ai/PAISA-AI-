"""
Financial calculations for PAISA portfolio analysis.
XIRR, overlap detection, expense drag, and benchmark comparison.
"""
from datetime import datetime, timedelta
import math


def calculate_xirr(cashflows):
    """
    Calculate XIRR (Extended Internal Rate of Return) for a series of cashflows.
    cashflows: list of (date_str, amount) tuples
    Negative = investment, positive = redemption/current value
    Returns annualized rate as percentage.
    """
    try:
        from scipy.optimize import brentq
    except ImportError:
        # Fallback simple return calculation
        total_invested = sum(abs(cf[1]) for cf in cashflows if cf[1] < 0)
        current_value = sum(cf[1] for cf in cashflows if cf[1] > 0)
        if total_invested == 0:
            return 0.0
        return ((current_value / total_invested) - 1) * 100

    if len(cashflows) < 2:
        return 0.0

    dates = []
    amounts = []
    for date_str, amount in cashflows:
        if isinstance(date_str, str):
            try:
                d = datetime.strptime(date_str, "%Y-%m-%d")
            except ValueError:
                d = datetime.strptime(date_str, "%d-%m-%Y")
        else:
            d = date_str
        dates.append(d)
        amounts.append(float(amount))

    d0 = min(dates)

    def npv(rate):
        return sum(
            amount / (1 + rate) ** ((d - d0).days / 365.25)
            for d, amount in zip(dates, amounts)
        )

    try:
        rate = brentq(npv, -0.99, 10.0, maxiter=1000)
        return round(rate * 100, 2)
    except (ValueError, RuntimeError):
        return 0.0


def calculate_overlap(funds):
    """
    Calculate overlap matrix between all fund pairs.
    Uses Jaccard similarity: |intersection| / |union| on top holdings.
    Returns NxN matrix of float values 0.0-1.0.
    """
    n = len(funds)
    matrix = [[0.0] * n for _ in range(n)]

    for i in range(n):
        for j in range(n):
            if i == j:
                matrix[i][j] = 1.0
            elif j > i:
                holdings_a = set(funds[i].get('topHoldings', []))
                holdings_b = set(funds[j].get('topHoldings', []))

                if not holdings_a or not holdings_b:
                    matrix[i][j] = 0.0
                else:
                    intersection = holdings_a & holdings_b
                    union = holdings_a | holdings_b
                    jaccard = len(intersection) / len(union) if union else 0.0
                    matrix[i][j] = round(jaccard, 3)

                matrix[j][i] = matrix[i][j]

    return matrix


def calculate_expense_drag(funds):
    """
    Calculate annual expense drag in rupees.
    Formula: sum(units × NAV × expense_ratio) for all funds.
    """
    total_drag = 0
    for fund in funds:
        units = fund.get('units', 0)
        nav = fund.get('currentNav', 0)
        expense_ratio = fund.get('expenseRatio', 0) / 100  # Convert percentage to decimal
        total_drag += units * nav * expense_ratio
    return round(total_drag)


def benchmark_comparison(portfolio_xirr, start_date=None):
    """
    Compare portfolio XIRR with Nifty 50 returns.
    Returns benchmark data dictionary.
    """
    # Nifty 50 approximate CAGR for different periods
    nifty_returns = {
        '1Y': 11.5,
        '3Y': 12.8,
        '5Y': 13.5,
        'since_inception': 12.1,
    }

    return {
        'nifty_return': nifty_returns['since_inception'],
        'alpha': round(portfolio_xirr - nifty_returns['since_inception'], 2),
        'nifty_1y': nifty_returns['1Y'],
        'nifty_3y': nifty_returns['3Y'],
        'nifty_5y': nifty_returns['5Y'],
    }


def calculate_all(portfolio_data):
    """
    Run all calculations on portfolio data.
    Returns complete analysis dictionary.
    """
    funds = portfolio_data.get('funds', [])

    if not funds:
        return {"error": "No funds found in portfolio data"}

    # Calculate individual fund XIRR if not present
    for fund in funds:
        if 'xirr' not in fund or fund['xirr'] == 0:
            if fund.get('purchaseDate') and fund.get('value', 0) > 0:
                invested = fund.get('units', 0) * fund.get('purchaseNav', 0)
                if invested > 0:
                    cashflows = [
                        (fund['purchaseDate'], -invested),
                        (datetime.now().strftime("%Y-%m-%d"), fund['value']),
                    ]
                    fund['xirr'] = calculate_xirr(cashflows)

        # Ensure expense ratio exists
        if 'expenseRatio' not in fund:
            fund['expenseRatio'] = _estimate_expense_ratio(fund.get('category', ''))

    # Portfolio-level calculations
    total_value = sum(f.get('value', 0) for f in funds)
    weighted_xirr = sum(
        (f.get('value', 0) / total_value) * f.get('xirr', 0)
        for f in funds
    ) if total_value > 0 else 0

    overlap_matrix = calculate_overlap(funds)
    expense_drag = calculate_expense_drag(funds)
    benchmark = benchmark_comparison(weighted_xirr)

    # Generate rebalancing plan
    rebalancing_plan = _generate_rebalancing_plan(funds, overlap_matrix, expense_drag, total_value)

    return {
        "xirr": round(weighted_xirr, 1),
        "portfolio_value": total_value,
        "funds": funds,
        "overlap_matrix": overlap_matrix,
        "expense_drag": expense_drag,
        "benchmark_return": benchmark['nifty_return'],
        "alpha": benchmark['alpha'],
        "rebalancing_plan": rebalancing_plan,
    }


def _estimate_expense_ratio(category):
    """Estimate expense ratio based on fund category."""
    ratios = {
        'Large Cap': 1.5,
        'Mid Cap': 1.7,
        'Small Cap': 1.8,
        'Flexi Cap': 1.2,
        'Large & Mid Cap': 1.6,
        'Sectoral - Technology': 2.0,
        'Sectoral - Pharma': 1.9,
        'Sectoral - Banking': 1.8,
        'Index': 0.3,
        'ELSS': 1.6,
        'Hybrid': 1.4,
        'Debt': 0.8,
        'Liquid': 0.3,
    }
    return ratios.get(category, 1.5)


def _generate_rebalancing_plan(funds, overlap_matrix, expense_drag, total_value):
    """Generate rule-based rebalancing recommendations."""
    plan = []
    n = len(funds)

    for i in range(n):
        fund = funds[i]
        action = 'HOLD'
        reason = ''
        priority = 'LOW'

        # Check high expense ratio
        if fund.get('expenseRatio', 0) > 1.8:
            action = 'REDUCE'
            reason = f"Expense ratio at {fund['expenseRatio']}% is above category average. "
            priority = 'HIGH' if fund['expenseRatio'] > 2.0 else 'MEDIUM'

        # Check high overlap
        max_overlap = 0
        overlap_fund = ''
        for j in range(n):
            if i != j and overlap_matrix[i][j] > max_overlap:
                max_overlap = overlap_matrix[i][j]
                overlap_fund = funds[j]['name']

        if max_overlap > 0.4:
            action = 'REDUCE'
            reason += f"High overlap ({(max_overlap * 100):.0f}%) with {overlap_fund}. Consider consolidating. "
            priority = 'HIGH'
        elif max_overlap > 0.25:
            reason += f"Moderate overlap ({(max_overlap * 100):.0f}%) with {overlap_fund}. "

        # Check underperformance
        if fund.get('xirr', 0) < 10 and fund.get('category') not in ['Debt', 'Liquid', 'Hybrid']:
            action = 'REDUCE' if action != 'REDUCE' else action
            reason += f"XIRR at {fund['xirr']}% is below benchmark. "
            priority = 'MEDIUM' if priority == 'LOW' else priority

        # Check for increase candidates
        if fund.get('expenseRatio', 0) < 1.0 and fund.get('xirr', 0) > 14 and max_overlap < 0.2:
            action = 'INCREASE'
            reason = f"Low expense ratio ({fund['expenseRatio']}%), strong returns ({fund['xirr']}%), and unique diversification. Consider increasing SIP allocation."
            priority = 'MEDIUM'

        if not reason:
            reason = f"Current allocation performing within expected range. XIRR at {fund.get('xirr', 0)}%. Maintain current position."

        plan.append({
            'fund': fund['name'],
            'action': action,
            'reason': reason.strip(),
            'priority': priority,
        })

    # Sort by priority
    priority_order = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2}
    plan.sort(key=lambda x: priority_order.get(x['priority'], 3))

    return plan
