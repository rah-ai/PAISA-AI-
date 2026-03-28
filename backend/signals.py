"""
Live Signal Fetching for PAISA Opportunity Radar.
Multi-source: yfinance (Nifty50 volume/price spikes) + BSE API + NSE insider data.
"""
import asyncio
import httpx
from datetime import datetime, timedelta
import json

# ── Nifty 50 Constituents (top 30 most traded) ──
NIFTY50_STOCKS = {
    "RELIANCE.NS": "Reliance Industries Ltd",
    "TCS.NS": "Tata Consultancy Services Ltd",
    "HDFCBANK.NS": "HDFC Bank Ltd",
    "INFY.NS": "Infosys Ltd",
    "ICICIBANK.NS": "ICICI Bank Ltd",
    "HINDUNILVR.NS": "Hindustan Unilever Ltd",
    "SBIN.NS": "State Bank of India",
    "BHARTIARTL.NS": "Bharti Airtel Ltd",
    "KOTAKBANK.NS": "Kotak Mahindra Bank Ltd",
    "ITC.NS": "ITC Ltd",
    "LT.NS": "Larsen & Toubro Ltd",
    "AXISBANK.NS": "Axis Bank Ltd",
    "BAJFINANCE.NS": "Bajaj Finance Ltd",
    "MARUTI.NS": "Maruti Suzuki India Ltd",
    "TATAMOTORS.NS": "Tata Motors Ltd",
    "SUNPHARMA.NS": "Sun Pharma Industries Ltd",
    "TITAN.NS": "Titan Company Ltd",
    "ASIANPAINT.NS": "Asian Paints Ltd",
    "WIPRO.NS": "Wipro Ltd",
    "ULTRACEMCO.NS": "UltraTech Cement Ltd",
    "HCLTECH.NS": "HCL Technologies Ltd",
    "ADANIENT.NS": "Adani Enterprises Ltd",
    "TECHM.NS": "Tech Mahindra Ltd",
    "NTPC.NS": "NTPC Ltd",
    "POWERGRID.NS": "Power Grid Corporation Ltd",
    "TATASTEEL.NS": "Tata Steel Ltd",
    "BAJAJFINSV.NS": "Bajaj Finserv Ltd",
    "NESTLEIND.NS": "Nestle India Ltd",
    "JSWSTEEL.NS": "JSW Steel Ltd",
    "M&M.NS": "Mahindra & Mahindra Ltd",
    "JIOFIN.NS": "Jio Financial Services Ltd",
    "NCC.NS": "NCC Limited",
    "KRSNAA.NS": "Krsnaa Diagnostics Ltd",
    "CDSL.NS": "CDSL Ltd",
    "WAAREEENER.NS": "Waaree Energies Ltd",
}


async def fetch_live_stock_signals():
    """Fetch live stock data from yfinance and generate trading signals."""
    try:
        import yfinance as yf
        signals = []
        symbols = list(NIFTY50_STOCKS.keys())

        # Fetch data for all stocks in batch
        tickers = yf.Tickers(" ".join(symbols))
        today = datetime.now()

        for symbol in symbols:
            try:
                ticker = tickers.tickers.get(symbol)
                if not ticker:
                    continue

                # Get recent history
                hist = ticker.history(period="5d")
                if hist.empty or len(hist) < 2:
                    continue

                latest = hist.iloc[-1]
                prev = hist.iloc[-2]
                company = NIFTY50_STOCKS.get(symbol, symbol)

                close = float(latest['Close'])
                prev_close = float(prev['Close'])
                volume = int(latest['Volume'])
                avg_volume = int(hist['Volume'].mean())
                change_pct = ((close - prev_close) / prev_close) * 100

                # Generate signals based on price action and volume
                signal = None

                # Volume spike (>2x average) = potential institutional activity
                if volume > avg_volume * 2:
                    confidence = min(95, 60 + int((volume / avg_volume) * 10))
                    if change_pct > 0:
                        signal = {
                            "company": company,
                            "symbol": symbol.replace(".NS", ""),
                            "signal_type": "BULK_DEAL",
                            "date": today.strftime("%Y-%m-%d"),
                            "value": int(close * volume),
                            "price": round(close, 2),
                            "change_pct": round(change_pct, 2),
                            "volume_ratio": round(volume / avg_volume, 1),
                            "confidence": confidence,
                            "description": f"Volume spike {volume/avg_volume:.1f}x average with {change_pct:+.1f}% price move. ₹{close:,.0f} | Vol: {volume:,}",
                            "source": "NSE Live Data",
                            "live": True,
                        }
                    else:
                        signal = {
                            "company": company,
                            "symbol": symbol.replace(".NS", ""),
                            "signal_type": "INSIDER_SELL",
                            "date": today.strftime("%Y-%m-%d"),
                            "value": int(close * volume),
                            "price": round(close, 2),
                            "change_pct": round(change_pct, 2),
                            "volume_ratio": round(volume / avg_volume, 1),
                            "confidence": min(85, 50 + int((volume / avg_volume) * 8)),
                            "description": f"High volume selling {volume/avg_volume:.1f}x avg with {change_pct:.1f}% drop. ₹{close:,.0f} | Vol: {volume:,}",
                            "source": "NSE Live Data",
                            "live": True,
                        }

                # Large price move (>2%) = significant movement
                elif abs(change_pct) > 2:
                    confidence = min(90, 55 + int(abs(change_pct) * 8))
                    signal = {
                        "company": company,
                        "symbol": symbol.replace(".NS", ""),
                        "signal_type": "INSIDER_BUY" if change_pct > 0 else "INSIDER_SELL",
                        "date": today.strftime("%Y-%m-%d"),
                        "value": int(close * volume),
                        "price": round(close, 2),
                        "change_pct": round(change_pct, 2),
                        "volume_ratio": round(volume / avg_volume, 1),
                        "confidence": confidence,
                        "description": f"{'Bullish breakout' if change_pct > 0 else 'Bearish breakdown'} {change_pct:+.1f}%. ₹{close:,.0f} | Vol: {volume:,} ({volume/avg_volume:.1f}x avg)",
                        "source": "NSE Live Data",
                        "live": True,
                    }

                # Moderate activity — at least capture top movers
                elif abs(change_pct) > 0.5 and volume > avg_volume * 1.3:
                    signal = {
                        "company": company,
                        "symbol": symbol.replace(".NS", ""),
                        "signal_type": "BULK_DEAL" if change_pct > 0 else "FILING_ALERT",
                        "date": today.strftime("%Y-%m-%d"),
                        "value": int(close * volume),
                        "price": round(close, 2),
                        "change_pct": round(change_pct, 2),
                        "volume_ratio": round(volume / avg_volume, 1),
                        "confidence": min(75, 45 + int(abs(change_pct) * 10)),
                        "description": f"Active trading {change_pct:+.1f}% with {volume/avg_volume:.1f}x volume. ₹{close:,.0f} | Vol: {volume:,}",
                        "source": "NSE Live Data",
                        "live": True,
                    }

                if signal:
                    signals.append(signal)

            except Exception as e:
                continue

        return signals
    except ImportError:
        print("yfinance not installed, using sample data")
        return []
    except Exception as e:
        print(f"yfinance signal fetch error: {e}")
        return []


async def fetch_bse_bulk_deals():
    """Fetch bulk deal data from BSE."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            url = "https://api.bseindia.com/BseIndiaAPI/api/AnnGetData/w"
            params = {
                "strCat": "Bulk Deals",
                "strPrevDate": (datetime.now() - timedelta(days=30)).strftime("%Y%m%d"),
                "strScrip": "",
                "strSearch": "P",
                "strToDate": datetime.now().strftime("%Y%m%d"),
                "strType": "C",
            }
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json",
                "Referer": "https://www.bseindia.com/",
                "Origin": "https://www.bseindia.com",
            }

            response = await client.get(url, params=params, headers=headers)

            if response.status_code == 200:
                data = response.json()
                deals = []
                for item in data.get("Table", [])[:20]:
                    quantity = float(item.get("QUANTITY", 0))
                    price = float(item.get("RATE", 0))
                    value = quantity * price

                    if value > 500000000:
                        confidence = 90
                    elif value > 100000000:
                        confidence = 80
                    elif value > 50000000:
                        confidence = 70
                    else:
                        confidence = 60

                    deals.append({
                        "company": item.get("SCRIP_NAME", "Unknown"),
                        "signal_type": "BULK_DEAL",
                        "date": item.get("DT_DATE", datetime.now().strftime("%Y-%m-%d")),
                        "value": value,
                        "confidence": confidence,
                        "description": f"{item.get('CLIENT_NAME', 'Unknown')} {'acquired' if item.get('BUY_SELL', 'B') == 'B' else 'sold'} {int(quantity):,} shares at ₹{price:,.2f}",
                        "source": "BSE Bulk Deal Data",
                        "live": True,
                    })
                return deals
    except Exception as e:
        print(f"BSE bulk deals fetch error: {e}")

    return []


async def fetch_insider_trades():
    """Fetch insider trading data from BSE/SEBI."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            url = "https://api.bseindia.com/BseIndiaAPI/api/AnnGetData/w"
            params = {
                "strCat": "Insider Trading / SAST",
                "strPrevDate": (datetime.now() - timedelta(days=30)).strftime("%Y%m%d"),
                "strScrip": "",
                "strSearch": "P",
                "strToDate": datetime.now().strftime("%Y%m%d"),
                "strType": "C",
            }
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json",
                "Referer": "https://www.bseindia.com/",
                "Origin": "https://www.bseindia.com",
            }

            response = await client.get(url, params=params, headers=headers)

            if response.status_code == 200:
                data = response.json()
                trades = []
                for item in data.get("Table", [])[:20]:
                    is_buy = "acquire" in item.get("MORE", "").lower() or "buy" in item.get("MORE", "").lower()
                    confidence = 85 if is_buy else 65

                    trades.append({
                        "company": item.get("SCRIP_NAME", "Unknown"),
                        "signal_type": "INSIDER_BUY" if is_buy else "INSIDER_SELL",
                        "date": item.get("DT_DATE", datetime.now().strftime("%Y-%m-%d")),
                        "value": 0,
                        "confidence": confidence,
                        "description": item.get("MORE", "Insider activity detected"),
                        "source": "BSE Insider Trading Disclosures",
                        "live": True,
                    })
                return trades
    except Exception as e:
        print(f"Insider trades fetch error: {e}")

    return []


async def fetch_all_signals():
    """Fetch and merge all signal sources, sorted by confidence."""
    # Run all sources in parallel
    yf_signals, bulk_deals, insider_trades = await asyncio.gather(
        fetch_live_stock_signals(),
        fetch_bse_bulk_deals(),
        fetch_insider_trades(),
    )

    all_signals = yf_signals + bulk_deals + insider_trades

    # Deduplicate by company (keep highest confidence)
    seen = {}
    for sig in all_signals:
        company = sig.get("company", "")
        if company not in seen or sig.get("confidence", 0) > seen[company].get("confidence", 0):
            seen[company] = sig
    
    all_signals = list(seen.values())
    all_signals.sort(key=lambda x: x.get("confidence", 0), reverse=True)

    # If we got no live data at all, use samples
    if len(all_signals) == 0:
        return _sample_signals()

    return all_signals


def _sample_signals():
    """Sample data as ultimate fallback."""
    today = datetime.now()
    return [
        {"company": "Tata Motors Ltd", "symbol": "TATAMOTORS", "signal_type": "INSIDER_BUY", "date": today.strftime("%Y-%m-%d"), "value": 28500000, "price": 1900.0, "change_pct": 2.3, "confidence": 92, "description": "Director acquired 15,000 shares at ₹1,900. Consistent buying pattern over 3 quarters.", "source": "BSE Insider Trading", "live": False},
        {"company": "Reliance Industries Ltd", "symbol": "RELIANCE", "signal_type": "BULK_DEAL", "date": (today - timedelta(days=1)).strftime("%Y-%m-%d"), "value": 425000000, "price": 2850.0, "change_pct": 1.8, "confidence": 85, "description": "Goldman Sachs acquired 1.2L shares via block deal. Represents institutional conviction.", "source": "BSE Bulk Deal Data", "live": False},
        {"company": "HDFC Bank Ltd", "symbol": "HDFCBANK", "signal_type": "INSIDER_BUY", "date": (today - timedelta(days=2)).strftime("%Y-%m-%d"), "value": 18200000, "price": 2141.0, "change_pct": 0.9, "confidence": 88, "description": "CFO purchased 8,500 shares at ₹2,141. Second purchase this quarter.", "source": "BSE Insider Trading", "live": False},
        {"company": "Infosys Ltd", "symbol": "INFY", "signal_type": "BULK_DEAL", "date": (today - timedelta(days=3)).strftime("%Y-%m-%d"), "value": 312000000, "price": 1680.0, "change_pct": -0.5, "confidence": 78, "description": "BlackRock increased stake by 0.3% via market purchase. Pattern suggests long-term accumulation.", "source": "NSE Bulk Deal Data", "live": False},
        {"company": "Bajaj Finance Ltd", "symbol": "BAJFINANCE", "signal_type": "INSIDER_BUY", "date": (today - timedelta(days=4)).strftime("%Y-%m-%d"), "value": 45600000, "price": 8769.0, "change_pct": 1.5, "confidence": 94, "description": "MD & CEO acquired 5,200 shares at ₹8,769. Highest single purchase by management in FY26.", "source": "BSE Insider Trading", "live": False},
        {"company": "Asian Paints Ltd", "symbol": "ASIANPAINT", "signal_type": "INSIDER_SELL", "date": (today - timedelta(days=5)).strftime("%Y-%m-%d"), "value": 189000000, "price": 3250.0, "change_pct": -1.2, "confidence": 72, "description": "FII exit — Vanguard reduced stake by 0.5%. Monitor for further selling pressure in FMCG pack.", "source": "NSE Bulk Deal Data", "live": False},
        {"company": "Larsen & Toubro Ltd", "symbol": "LT", "signal_type": "INSIDER_BUY", "date": (today - timedelta(days=6)).strftime("%Y-%m-%d"), "value": 32100000, "price": 3420.0, "change_pct": 0.8, "confidence": 86, "description": "Whole-time Director acquired 4,800 shares. Third consecutive insider buy in infra sector.", "source": "BSE Insider Trading", "live": False},
        {"company": "State Bank of India", "symbol": "SBIN", "signal_type": "BULK_DEAL", "date": (today - timedelta(days=1)).strftime("%Y-%m-%d"), "value": 580000000, "price": 820.0, "change_pct": 2.1, "confidence": 91, "description": "Domestic fund houses accumulating ahead of Q4 results. Volume 3.2x average.", "source": "NSE Live Data", "live": False},
        {"company": "Bharti Airtel Ltd", "symbol": "BHARTIARTL", "signal_type": "INSIDER_BUY", "date": (today - timedelta(days=2)).strftime("%Y-%m-%d"), "value": 125000000, "price": 1680.0, "change_pct": 1.1, "confidence": 83, "description": "Board member purchased 7,400 shares post tariff hike announcement. Telecom sector bullish.", "source": "BSE Insider Trading", "live": False},
        {"company": "ITC Ltd", "symbol": "ITC", "signal_type": "BULK_DEAL", "date": (today - timedelta(days=3)).strftime("%Y-%m-%d"), "value": 340000000, "price": 475.0, "change_pct": 0.6, "confidence": 76, "description": "Mutual fund accumulation — SBI MF and HDFC MF both increased positions. Defensive play.", "source": "NSE Bulk Deal Data", "live": False},
        {"company": "Tata Consultancy Services Ltd", "symbol": "TCS", "signal_type": "INSIDER_BUY", "date": (today - timedelta(days=4)).strftime("%Y-%m-%d"), "value": 98000000, "price": 4120.0, "change_pct": -0.3, "confidence": 79, "description": "Independent director purchased 2,380 shares. IT sector showing value at current levels.", "source": "BSE Insider Trading", "live": False},
        {"company": "Sun Pharma Industries Ltd", "symbol": "SUNPHARMA", "signal_type": "BULK_DEAL", "date": (today - timedelta(days=5)).strftime("%Y-%m-%d"), "value": 210000000, "price": 1890.0, "change_pct": 3.4, "confidence": 87, "description": "FII buying — Morgan Stanley increased stake. Pharma sector outperforming in defensive rotation.", "source": "NSE Bulk Deal Data", "live": False},
    ]
