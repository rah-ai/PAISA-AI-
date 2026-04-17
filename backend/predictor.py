"""
Stock Market Predictor for PAISA.
ML-based price prediction using Linear Regression + SMA crossovers.
Uses yfinance for historical data — no heavy DL dependencies needed.
"""
import numpy as np
from datetime import datetime, timedelta

# Will be used if available
try:
    from sklearn.linear_model import LinearRegression
    from sklearn.preprocessing import StandardScaler
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False


NIFTY50_TICKERS = {
    "RELIANCE": {"name": "Reliance Industries Ltd", "sector": "Oil & Gas"},
    "TCS": {"name": "Tata Consultancy Services Ltd", "sector": "IT"},
    "HDFCBANK": {"name": "HDFC Bank Ltd", "sector": "Banking"},
    "INFY": {"name": "Infosys Ltd", "sector": "IT"},
    "ICICIBANK": {"name": "ICICI Bank Ltd", "sector": "Banking"},
    "HINDUNILVR": {"name": "Hindustan Unilever Ltd", "sector": "FMCG"},
    "SBIN": {"name": "State Bank of India", "sector": "Banking"},
    "BHARTIARTL": {"name": "Bharti Airtel Ltd", "sector": "Telecom"},
    "KOTAKBANK": {"name": "Kotak Mahindra Bank Ltd", "sector": "Banking"},
    "ITC": {"name": "ITC Ltd", "sector": "FMCG"},
    "LT": {"name": "Larsen & Toubro Ltd", "sector": "Infrastructure"},
    "AXISBANK": {"name": "Axis Bank Ltd", "sector": "Banking"},
    "BAJFINANCE": {"name": "Bajaj Finance Ltd", "sector": "NBFC"},
    "MARUTI": {"name": "Maruti Suzuki India Ltd", "sector": "Auto"},
    "TATAMOTORS": {"name": "Tata Motors Ltd", "sector": "Auto"},
    "SUNPHARMA": {"name": "Sun Pharma Industries Ltd", "sector": "Pharma"},
    "TITAN": {"name": "Titan Company Ltd", "sector": "Consumer"},
    "ASIANPAINT": {"name": "Asian Paints Ltd", "sector": "Chemicals"},
    "WIPRO": {"name": "Wipro Ltd", "sector": "IT"},
    "HCLTECH": {"name": "HCL Technologies Ltd", "sector": "IT"},
    "TECHM": {"name": "Tech Mahindra Ltd", "sector": "IT"},
    "NTPC": {"name": "NTPC Ltd", "sector": "Power"},
    "POWERGRID": {"name": "Power Grid Corporation Ltd", "sector": "Power"},
    "TATASTEEL": {"name": "Tata Steel Ltd", "sector": "Metals"},
    "NESTLEIND": {"name": "Nestle India Ltd", "sector": "FMCG"},
    "JSWSTEEL": {"name": "JSW Steel Ltd", "sector": "Metals"},
    "M&M": {"name": "Mahindra & Mahindra Ltd", "sector": "Auto"},
    "ADANIENT": {"name": "Adani Enterprises Ltd", "sector": "Diversified"},
    "BAJAJFINSV": {"name": "Bajaj Finserv Ltd", "sector": "NBFC"},
    "ULTRACEMCO": {"name": "UltraTech Cement Ltd", "sector": "Cement"},
    "JIOFIN": {"name": "Jio Financial Services Ltd", "sector": "NBFC"},
    "NCC": {"name": "NCC Limited", "sector": "Infrastructure"},
    "KRSNAA": {"name": "Krsnaa Diagnostics Ltd", "sector": "Healthcare"},
    "CDSL": {"name": "CDSL Ltd", "sector": "Financial Services"},
    "WAAREEENER": {"name": "Waaree Energies Ltd", "sector": "Renewable Energy"},
}
    

def _compute_rsi(prices, period=14):
    """Compute Relative Strength Index."""
    deltas = np.diff(prices)
    gains = np.where(deltas > 0, deltas, 0)
    losses = np.where(deltas < 0, -deltas, 0)

    avg_gain = np.mean(gains[:period])
    avg_loss = np.mean(losses[:period])

    if avg_loss == 0:
        return 100.0

    rs = avg_gain / avg_loss
    return round(100 - (100 / (1 + rs)), 2)


def _compute_macd(prices):
    """Compute MACD (12,26,9)."""
    def ema(data, span):
        multiplier = 2 / (span + 1)
        ema_values = [data[0]]
        for i in range(1, len(data)):
            ema_values.append(data[i] * multiplier + ema_values[-1] * (1 - multiplier))
        return np.array(ema_values)

    ema12 = ema(prices, 12)
    ema26 = ema(prices, 26)
    macd_line = ema12 - ema26
    signal_line = ema(macd_line, 9)
    histogram = macd_line - signal_line

    return {
        "macd": round(float(macd_line[-1]), 2),
        "signal": round(float(signal_line[-1]), 2),
        "histogram": round(float(histogram[-1]), 2),
        "trend": "BULLISH" if histogram[-1] > 0 else "BEARISH",
    }


def _compute_sma_crossovers(prices):
    """Compute SMA 20/50/200 and detect crossovers."""
    result = {}

    if len(prices) >= 20:
        sma20 = np.mean(prices[-20:])
        result["sma20"] = round(float(sma20), 2)
    if len(prices) >= 50:
        sma50 = np.mean(prices[-50:])
        result["sma50"] = round(float(sma50), 2)
    if len(prices) >= 200:
        sma200 = np.mean(prices[-200:])
        result["sma200"] = round(float(sma200), 2)

    current = float(prices[-1])

    # Crossover signals
    signals = []
    if "sma20" in result and "sma50" in result:
        if result["sma20"] > result["sma50"]:
            signals.append("Golden Cross (SMA20 > SMA50) — BULLISH")
        else:
            signals.append("Death Cross (SMA20 < SMA50) — BEARISH")

    if "sma200" in result:
        if current > result["sma200"]:
            signals.append(f"Price above 200-DMA (₹{result['sma200']:,.0f}) — Long-term BULLISH")
        else:
            signals.append(f"Price below 200-DMA (₹{result['sma200']:,.0f}) — Long-term BEARISH")

    result["crossover_signals"] = signals
    return result


def _linear_regression_predict(prices, days_ahead=7):
    """
    Predict future prices using Linear Regression.
    Anchored to current price — uses regression slope for direction only,
    so the prediction line starts exactly where the actual line ends.
    """
    current_price = float(prices[-1])

    if not HAS_SKLEARN or len(prices) < 30:
        # Simple trend extrapolation fallback
        recent = prices[-10:]
        slope = (recent[-1] - recent[0]) / len(recent)
        predictions = [current_price + slope * (i + 1) for i in range(days_ahead)]
        return [round(p, 2) for p in predictions], 0.5

    # Use recent 60 trading days for more responsive prediction
    window = min(60, len(prices))
    recent_prices = prices[-window:]

    X = np.arange(window).reshape(-1, 1)
    y = np.array(recent_prices)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = LinearRegression()
    model.fit(X_scaled, y)

    # R² score as confidence
    r2 = model.score(X_scaled, y)
    confidence = max(0.3, min(0.95, abs(r2)))

    # Extract per-day slope from the model
    # slope in original scale = coef / std(X)
    x_std = np.std(np.arange(window))
    daily_slope = float(model.coef_[0]) / x_std if x_std > 0 else 0

    # Anchor predictions from current price using the slope
    predictions = [current_price + daily_slope * (i + 1) for i in range(days_ahead)]

    return [round(p, 2) for p in predictions], round(confidence, 3)


def _compute_support_resistance(prices):
    """Find support and resistance levels."""
    prices = np.array(prices)
    
    # Use pivot points method
    high = np.max(prices[-20:])
    low = np.min(prices[-20:])
    close = float(prices[-1])
    pivot = (high + low + close) / 3

    r1 = 2 * pivot - low
    r2 = pivot + (high - low)
    s1 = 2 * pivot - high
    s2 = pivot - (high - low)

    return {
        "pivot": round(float(pivot), 2),
        "resistance_1": round(float(r1), 2),
        "resistance_2": round(float(r2), 2),
        "support_1": round(float(s1), 2),
        "support_2": round(float(s2), 2),
    }


async def predict_stock(symbol: str, days: int = 30):
    """
    Full stock prediction pipeline:
    1. Fetch historical data via yfinance
    2. Compute technical indicators (RSI, MACD, SMA)
    3. Run Linear Regression prediction
    4. Generate support/resistance levels
    5. Return structured prediction output
    """
    try:
        import yfinance as yf
    except ImportError:
        return {"error": "yfinance not installed. Run: pip install yfinance"}

    # Normalize symbol
    ticker_symbol = symbol.upper().replace(".NS", "").replace(".BO", "")
    yf_symbol = f"{ticker_symbol}.NS"
    
    stock_info = NIFTY50_TICKERS.get(ticker_symbol, {"name": ticker_symbol, "sector": "Unknown"})

    try:
        ticker = yf.Ticker(yf_symbol)
        hist = ticker.history(period="1y")

        if hist.empty:
            return {"error": f"No data found for {ticker_symbol}. Try a valid NSE symbol like RELIANCE, TCS, HDFCBANK."}

        prices = hist['Close'].values.tolist()
        volumes = hist['Volume'].values.tolist()
        dates = [d.strftime("%Y-%m-%d") for d in hist.index]
        
        current_price = round(float(prices[-1]), 2)

        # Technical indicators
        rsi = _compute_rsi(prices) if len(prices) >= 15 else 50.0
        macd = _compute_macd(prices) if len(prices) >= 27 else {"macd": 0, "signal": 0, "histogram": 0, "trend": "NEUTRAL"}
        sma = _compute_sma_crossovers(prices)
        support_resistance = _compute_support_resistance(prices)

        # ML Predictions
        pred_7d, conf_7d = _linear_regression_predict(prices, 7)
        pred_30d, conf_30d = _linear_regression_predict(prices, min(days, 30))

        # Determine overall trend
        price_7d_change = ((pred_7d[-1] - current_price) / current_price) * 100
        price_30d_change = ((pred_30d[-1] - current_price) / current_price) * 100

        if price_30d_change > 3:
            trend = "BULLISH"
        elif price_30d_change < -3:
            trend = "BEARISH"
        else:
            trend = "NEUTRAL"

        # Prepare chart data — use ALL historical data for a dense chart
        chart_actual = []
        for i in range(len(dates)):
            chart_actual.append({"date": dates[i], "price": round(prices[i], 2), "type": "actual"})

        # Future dates — only trading days (skip weekends)
        last_date = datetime.strptime(dates[-1], "%Y-%m-%d")
        chart_predicted = []
        trading_days_added = 0
        day_offset = 1
        while trading_days_added < len(pred_30d):
            future_date = last_date + timedelta(days=day_offset)
            day_offset += 1
            if future_date.weekday() >= 5:  # Skip Saturday(5) and Sunday(6)
                continue
            chart_predicted.append({
                "date": future_date.strftime("%Y-%m-%d"),
                "price": pred_30d[trading_days_added],
                "type": "predicted"
            })
            trading_days_added += 1

        # Volume analysis
        avg_volume = int(np.mean(volumes[-20:])) if volumes else 0
        recent_volume = int(volumes[-1]) if volumes else 0

        return {
            "symbol": ticker_symbol,
            "name": stock_info["name"],
            "sector": stock_info["sector"],
            "current_price": current_price,
            "trend": trend,
            "predictions": {
                "7_day": {
                    "target": round(pred_7d[-1], 2),
                    "change_pct": round(price_7d_change, 2),
                    "confidence": round(conf_7d * 100, 1),
                    "daily_prices": pred_7d,
                },
                "30_day": {
                    "target": round(pred_30d[-1], 2),
                    "change_pct": round(price_30d_change, 2),
                    "confidence": round(conf_30d * 100, 1),
                    "daily_prices": pred_30d,
                },
            },
            "technical_indicators": {
                "rsi": rsi,
                "rsi_signal": "OVERBOUGHT" if rsi > 70 else "OVERSOLD" if rsi < 30 else "NEUTRAL",
                "macd": macd,
                "sma": sma,
                "support_resistance": support_resistance,
            },
            "volume": {
                "current": recent_volume,
                "average_20d": avg_volume,
                "ratio": round(recent_volume / avg_volume, 2) if avg_volume > 0 else 1.0,
            },
            "chart_data": {
                "actual": chart_actual,
                "predicted": chart_predicted,
            },
            "metadata": {
                "data_points": len(prices),
                "model": "Linear Regression + Technical Analysis",
                "last_updated": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            }
        }

    except Exception as e:
        return {"error": f"Prediction failed for {ticker_symbol}: {str(e)}"}


def get_nifty50_list():
    """Return list of all Nifty 50 tickers for autocomplete."""
    return [
        {"symbol": k, "name": v["name"], "sector": v["sector"]}
        for k, v in NIFTY50_TICKERS.items()
    ]
