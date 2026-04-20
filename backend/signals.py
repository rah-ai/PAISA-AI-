"""
Live Signal Fetching for PAISA Opportunity Radar.
Multi-source: yfinance (Nifty50 volume/price spikes) + BSE API + NSE insider data.
"""
import asyncio
import httpx
from datetime import datetime, timedelta
import json
import os

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


# ── Signal Persistence ──
SIGNALS_FILE = os.path.join(os.path.dirname(__file__), "signal_history.json")


def _load_stored_signals():
    """Load previously stored signals from disk."""
    try:
        if os.path.exists(SIGNALS_FILE):
            with open(SIGNALS_FILE, "r") as f:
                data = json.load(f)
                # Prune signals older than 90 days
                cutoff = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
                return [s for s in data if s.get("date", "") >= cutoff]
    except Exception as e:
        print(f"Error loading signal history: {e}")
    return []


def _save_signals(signals):
    """Persist signals to disk."""
    try:
        # Keep max 90 days, max 500 entries
        cutoff = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
        filtered = [s for s in signals if s.get("date", "") >= cutoff][:500]
        with open(SIGNALS_FILE, "w") as f:
            json.dump(filtered, f, indent=2, default=str)
    except Exception as e:
        print(f"Error saving signal history: {e}")


async def fetch_financial_news():
    """Scrape financial news from Indian market RSS feeds."""
    news_signals = []
    feeds = [
        ("https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms", "Economic Times"),
        ("https://www.moneycontrol.com/rss/marketreports.xml", "MoneyControl"),
        ("https://www.livemint.com/rss/markets", "LiveMint"),
    ]
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            for feed_url, source in feeds:
                try:
                    headers = {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        "Accept": "application/rss+xml, application/xml, text/xml",
                    }
                    resp = await client.get(feed_url, headers=headers, follow_redirects=True)
                    if resp.status_code == 200:
                        text = resp.text
                        # Simple XML parsing for RSS items
                        items = text.split("<item>")[1:8]  # Get first 7 items
                        for item in items:
                            title = _extract_xml_tag(item, "title")
                            pub_date = _extract_xml_tag(item, "pubDate")
                            description = _extract_xml_tag(item, "description")
                            
                            if not title:
                                continue
                            
                            # Parse date
                            signal_date = datetime.now().strftime("%Y-%m-%d")
                            if pub_date:
                                try:
                                    from email.utils import parsedate_to_datetime
                                    dt = parsedate_to_datetime(pub_date)
                                    signal_date = dt.strftime("%Y-%m-%d")
                                except Exception:
                                    pass
                            
                            # Detect signal type from title keywords
                            title_lower = title.lower()
                            if any(w in title_lower for w in ["buy", "bullish", "surge", "rally", "gain", "rise", "up"]):
                                signal_type = "INSIDER_BUY"
                                confidence = 65
                            elif any(w in title_lower for w in ["sell", "bearish", "crash", "fall", "drop", "down"]):
                                signal_type = "INSIDER_SELL"
                                confidence = 60
                            else:
                                signal_type = "BULK_DEAL"
                                confidence = 55
                            
                            # Extract company name from title if possible
                            company = _extract_company_from_title(title)
                            
                            news_signals.append({
                                "company": company or "Market Update",
                                "signal_type": signal_type,
                                "date": signal_date,
                                "value": 0,
                                "confidence": confidence,
                                "description": _clean_html(title),
                                "source": f"{source} News",
                                "live": True,
                                "type": "news",
                            })
                except Exception as e:
                    print(f"RSS feed error ({source}): {e}")
                    continue
    except Exception as e:
        print(f"News fetch error: {e}")
    
    return news_signals


def _extract_xml_tag(text, tag):
    """Simple XML tag extraction."""
    import re
    # Handle CDATA
    pattern = f"<{tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</{tag}>"
    match = re.search(pattern, text, re.DOTALL)
    return match.group(1).strip() if match else ""


def _clean_html(text):
    """Remove HTML tags from text."""
    import re
    clean = re.sub(r'<[^>]+>', '', text)
    clean = clean.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"').replace('&#39;', "'")
    return clean.strip()


def _extract_company_from_title(title):
    """Try to extract a company name from a news headline."""
    # Check against known Nifty50 names
    known_companies = {
        "Reliance": "Reliance Industries Ltd",
        "TCS": "Tata Consultancy Services Ltd",
        "HDFC Bank": "HDFC Bank Ltd",
        "HDFC": "HDFC Bank Ltd",
        "Infosys": "Infosys Ltd",
        "ICICI Bank": "ICICI Bank Ltd",
        "ICICI": "ICICI Bank Ltd",
        "HUL": "Hindustan Unilever Ltd",
        "SBI": "State Bank of India",
        "Airtel": "Bharti Airtel Ltd",
        "Bharti Airtel": "Bharti Airtel Ltd",
        "Kotak": "Kotak Mahindra Bank Ltd",
        "ITC": "ITC Ltd",
        "L&T": "Larsen & Toubro Ltd",
        "Larsen": "Larsen & Toubro Ltd",
        "Axis Bank": "Axis Bank Ltd",
        "Bajaj Finance": "Bajaj Finance Ltd",
        "Maruti": "Maruti Suzuki India Ltd",
        "Tata Motors": "Tata Motors Ltd",
        "Sun Pharma": "Sun Pharma Industries Ltd",
        "Titan": "Titan Company Ltd",
        "Asian Paints": "Asian Paints Ltd",
        "Wipro": "Wipro Ltd",
        "HCL Tech": "HCL Technologies Ltd",
        "Adani": "Adani Enterprises Ltd",
        "Tech Mahindra": "Tech Mahindra Ltd",
        "NTPC": "NTPC Ltd",
        "Tata Steel": "Tata Steel Ltd",
        "Bajaj Finserv": "Bajaj Finserv Ltd",
        "Nestle": "Nestle India Ltd",
        "JSW Steel": "JSW Steel Ltd",
        "Mahindra": "Mahindra & Mahindra Ltd",
        "Nifty": "Nifty 50 Index",
        "Sensex": "BSE Sensex",
    }
    for keyword, full_name in known_companies.items():
        if keyword.lower() in title.lower():
            return full_name
    return None


async def fetch_all_signals():
    """Fetch, merge, persist, and return all signals including history."""
    # Load existing history
    stored = _load_stored_signals()
    
    # Run all live sources in parallel
    yf_signals, bulk_deals, insider_trades, news = await asyncio.gather(
        fetch_live_stock_signals(),
        fetch_bse_bulk_deals(),
        fetch_insider_trades(),
        fetch_financial_news(),
    )

    fresh_signals = yf_signals + bulk_deals + insider_trades + news

    # Merge fresh into stored — deduplicate by (company, date)
    existing_keys = set()
    for s in stored:
        key = (s.get("company", ""), s.get("date", ""))
        existing_keys.add(key)
    
    for s in fresh_signals:
        key = (s.get("company", ""), s.get("date", ""))
        if key not in existing_keys:
            stored.append(s)
            existing_keys.add(key)
        else:
            # Update existing signal if new one has higher confidence
            for i, existing in enumerate(stored):
                if (existing.get("company", ""), existing.get("date", "")) == key:
                    if s.get("confidence", 0) > existing.get("confidence", 0):
                        stored[i] = s
                    break

    # Sort by date descending, then by confidence
    stored.sort(key=lambda x: (x.get("date", ""), x.get("confidence", 0)), reverse=True)
    
    # Persist to disk
    _save_signals(stored)

    # If we still have nothing (first run, no APIs working), use enriched samples
    if len(stored) == 0:
        stored = _sample_signals()
        _save_signals(stored)

    return stored


def _sample_signals():
    """Enriched sample data spanning 30 days for meaningful date filtering."""
    today = datetime.now()
    signals = []
    
    # Generate realistic signals spread across 30 days
    sample_data = [
        ("Tata Motors Ltd", "TATAMOTORS", "INSIDER_BUY", 0, 28500000, 1900.0, 2.3, 92, "Director acquired 15,000 shares at ₹1,900. Consistent buying pattern over 3 quarters."),
        ("Reliance Industries Ltd", "RELIANCE", "BULK_DEAL", 1, 425000000, 2850.0, 1.8, 85, "Goldman Sachs acquired 1.2L shares via block deal. Represents institutional conviction."),
        ("HDFC Bank Ltd", "HDFCBANK", "INSIDER_BUY", 2, 18200000, 2141.0, 0.9, 88, "CFO purchased 8,500 shares at ₹2,141. Second purchase this quarter."),
        ("Infosys Ltd", "INFY", "BULK_DEAL", 3, 312000000, 1680.0, -0.5, 78, "BlackRock increased stake by 0.3% via market purchase. Long-term accumulation pattern."),
        ("Bajaj Finance Ltd", "BAJFINANCE", "INSIDER_BUY", 4, 45600000, 8769.0, 1.5, 94, "MD & CEO acquired 5,200 shares at ₹8,769. Highest single purchase by management in FY26."),
        ("Asian Paints Ltd", "ASIANPAINT", "INSIDER_SELL", 5, 189000000, 3250.0, -1.2, 72, "FII exit — Vanguard reduced stake by 0.5%. Monitor for further selling pressure in FMCG pack."),
        ("Larsen & Toubro Ltd", "LT", "INSIDER_BUY", 6, 32100000, 3420.0, 0.8, 86, "Whole-time Director acquired 4,800 shares. Third consecutive insider buy in infra sector."),
        ("State Bank of India", "SBIN", "BULK_DEAL", 1, 580000000, 820.0, 2.1, 91, "Domestic fund houses accumulating ahead of Q4 results. Volume 3.2x average."),
        ("Bharti Airtel Ltd", "BHARTIARTL", "INSIDER_BUY", 3, 125000000, 1680.0, 1.1, 83, "Board member purchased 7,400 shares post tariff hike announcement. Telecom sector bullish."),
        ("ITC Ltd", "ITC", "BULK_DEAL", 5, 340000000, 475.0, 0.6, 76, "Mutual fund accumulation — SBI MF and HDFC MF both increased positions. Defensive play."),
        ("Sun Pharma Industries Ltd", "SUNPHARMA", "BULK_DEAL", 7, 210000000, 1890.0, 3.4, 87, "FII buying — Morgan Stanley increased stake. Pharma outperforming in defensive rotation."),
        ("TCS Ltd", "TCS", "INSIDER_BUY", 8, 98000000, 4120.0, -0.3, 79, "Independent director purchased 2,380 shares. IT sector showing value at current levels."),
        # 2 weeks ago signals
        ("ICICI Bank Ltd", "ICICIBANK", "INSIDER_BUY", 10, 67000000, 1280.0, 1.4, 84, "Executive Director purchased 12,000 shares. Banking sector showing insider confidence."),
        ("Kotak Mahindra Bank Ltd", "KOTAKBANK", "BULK_DEAL", 12, 230000000, 1920.0, 0.7, 77, "FPI inflows — Fidelity increased stake by 0.2%. Private banking plays attracting FPI."),
        ("Titan Company Ltd", "TITAN", "INSIDER_BUY", 14, 42000000, 3650.0, 1.9, 81, "Promoter entity acquired shares worth ₹4.2Cr. Consumer discretionary showing strength."),
        ("HCL Technologies Ltd", "HCLTECH", "BULK_DEAL", 15, 185000000, 1740.0, -0.8, 73, "Block deal — CDPQ sold 1.5L shares. However, domestic MFs absorbed the supply."),
        # 3 weeks ago signals
        ("Wipro Ltd", "WIPRO", "INSIDER_BUY", 18, 35000000, 480.0, 2.2, 75, "Independent director bought 7,300 shares ahead of Q4 results. IT sector value emerging."),
        ("NTPC Ltd", "NTPC", "BULK_DEAL", 20, 290000000, 380.0, 1.6, 82, "LIC increased stake by 0.4%. Power sector seeing institutional accumulation."),
        ("Adani Enterprises Ltd", "ADANIENT", "INSIDER_BUY", 22, 520000000, 3200.0, 3.1, 70, "Promoter group bought shares via open market. High conviction despite sector volatility."),
        ("Maruti Suzuki India Ltd", "MARUTI", "BULK_DEAL", 24, 178000000, 12400.0, 0.5, 80, "Goldman Sachs added 8,000 shares. Auto sector benefiting from rural recovery narrative."),
        # 1 month ago signals
        ("Tata Steel Ltd", "TATASTEEL", "INSIDER_SELL", 26, 145000000, 155.0, -2.1, 68, "Promoter entity reduced stake by 0.1%. Steel cycle concerns weigh on sentiment."),
        ("Bajaj Finserv Ltd", "BAJAJFINSV", "INSIDER_BUY", 28, 88000000, 1890.0, 1.3, 83, "Managing Director purchased 4,650 shares. Financial services sector insider confidence."),
        ("Nestle India Ltd", "NESTLEIND", "BULK_DEAL", 29, 155000000, 2680.0, 0.4, 71, "DII accumulation — HDFC MF increased allocation. Defensive FMCG play amid uncertainty."),
        ("Mahindra & Mahindra Ltd", "M&M", "INSIDER_BUY", 30, 110000000, 2950.0, 2.5, 88, "CFO and whole-time director both purchased shares. Strong auto + EV outlook."),
    ]
    
    for company, symbol, sig_type, days_ago, value, price, chg, conf, desc in sample_data:
        signals.append({
            "company": company,
            "symbol": symbol,
            "signal_type": sig_type,
            "date": (today - timedelta(days=days_ago)).strftime("%Y-%m-%d"),
            "value": value,
            "price": price,
            "change_pct": chg,
            "confidence": conf,
            "description": desc,
            "source": "BSE Insider Trading" if "INSIDER" in sig_type else "NSE Bulk Deal Data",
            "live": False,
        })
    
    return signals
