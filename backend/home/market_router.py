"""
Market Indicators API router for Django Ninja.

This module provides the market indicators endpoint:
- GET /api/market/indicators: Returns real-time currency exchange rates from CollectAPI
"""
import os
from datetime import datetime
from typing import Optional
from decimal import Decimal

import httpx
from ninja import Router
from ninja.errors import HttpError
from django.core.cache import cache
from pydantic import BaseModel

router = Router(tags=["Market"])

# Cache timeout in seconds (7 minutes - between 5-10 min as requested)j
MARKET_CACHE_TIMEOUT = 420  # 7 minutes

# CollectAPI configuration
COLLECTAPI_BASE_URL = "https://api.collectapi.com"
COLLECTAPI_ENDPOINT = "/economy/currencyToAll"
COLLECTAPI_TOKEN = os.getenv("COLLECTAPI_TOKEN", "")

# Target currencies to include in response
TARGET_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CNY"]


class MarketIndicatorItem(BaseModel):
    """Schema for a single market indicator item."""
    symbol: str
    label: str
    value: float
    change_pct: Optional[float] = None


class MarketIndicatorsResponse(BaseModel):
    """Schema for market indicators response."""
    base: str
    updated_at: str
    items: list[MarketIndicatorItem]


def _get_cache_key() -> str:
    """Generate cache key for market indicators."""
    return "market_indicators:latest"


def _get_previous_cache_key() -> str:
    """Generate cache key for previous market indicators (for change_pct calculation)."""
    return "market_indicators:previous"


def _fetch_from_collectapi() -> dict:
    """
    Fetch currency rates from CollectAPI.
    
    Returns:
        dict: Parsed response from CollectAPI
        
    Raises:
        HttpError: If API call fails or returns invalid response
    """
    if not COLLECTAPI_TOKEN:
        raise HttpError(503, "CollectAPI token not configured")
    
    url = f"{COLLECTAPI_BASE_URL}{COLLECTAPI_ENDPOINT}"
    headers = {
        "authorization": COLLECTAPI_TOKEN,
        "content-type": "application/json",
    }
    params = {
        "int": "1",
        "base": "USD",
    }
    
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(url, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Validate response structure
            if not isinstance(data, dict):
                raise HttpError(503, "Invalid response format from CollectAPI")
            
            if not data.get("success", False):
                error_msg = data.get("error", {}).get("message", "Unknown error from CollectAPI")
                raise HttpError(503, f"CollectAPI error: {error_msg}")
            
            return data
            
    except HttpError:
        # Re-raise our own HttpError exceptions
        raise
    except httpx.TimeoutException:
        raise HttpError(503, "CollectAPI request timeout")
    except httpx.ConnectError as e:
        raise HttpError(503, f"CollectAPI connection failed: {str(e)}")
    except httpx.HTTPStatusError as e:
        raise HttpError(503, f"CollectAPI HTTP error: {e.response.status_code}")
    except httpx.RequestError as e:
        raise HttpError(503, f"CollectAPI request failed: {str(e)}")
    except Exception as e:
        raise HttpError(503, f"Unexpected error fetching from CollectAPI: {str(e)}")


def _parse_collectapi_response(data: dict) -> dict:
    """
    Parse CollectAPI response and extract relevant currency data.
    
    Args:
        data: Raw response from CollectAPI
        
    Returns:
        dict: Parsed data with base, updated_at, and items
    """
    result = data.get("result", {})
    base = result.get("base", "USD")
    lastupdate = result.get("lastupdate")
    
    # Parse lastupdate timestamp
    updated_at = datetime.utcnow().isoformat() + "Z"
    if lastupdate:
        try:
            # CollectAPI may return timestamp in various formats
            # Try to parse it, fallback to current time
            if isinstance(lastupdate, (int, float)):
                updated_at = datetime.utcfromtimestamp(lastupdate).isoformat() + "Z"
            elif isinstance(lastupdate, str):
                # Try ISO format or other common formats
                try:
                    dt = datetime.fromisoformat(lastupdate.replace("Z", "+00:00"))
                    updated_at = dt.isoformat() + "Z"
                except:
                    updated_at = datetime.utcnow().isoformat() + "Z"
        except:
            updated_at = datetime.utcnow().isoformat() + "Z"
    
    # Extract currency data
    currency_data = result.get("data", [])
    if not isinstance(currency_data, list):
        currency_data = []
    
    # Map currencies - CollectAPI response structure may vary
    # Common field names: code, currency, name, rate, value, buying, selling
    items = []
    currency_map = {}  # symbol -> {value, label}
    
    for item in currency_data:
        if not isinstance(item, dict):
            continue
        
        # Try different possible field names
        code = item.get("code") or item.get("currency") or item.get("name", "").upper()
        rate = item.get("rate") or item.get("value") or item.get("buying")
        
        if not code or rate is None:
            continue
        
        # Normalize code to uppercase
        code = code.upper()
        
        # Only include target currencies
        if code in TARGET_CURRENCIES:
            try:
                rate_float = float(rate)
                label = item.get("name") or code
                currency_map[code] = {
                    "value": rate_float,
                    "label": label,
                }
            except (ValueError, TypeError):
                continue
    
    # Always include USD as base (1.0)
    if "USD" not in currency_map:
        currency_map["USD"] = {"value": 1.0, "label": "USD"}
    
    # Build items list in the order of TARGET_CURRENCIES
    for symbol in TARGET_CURRENCIES:
        if symbol in currency_map:
            items.append({
                "symbol": symbol,
                "label": currency_map[symbol]["label"],
                "value": currency_map[symbol]["value"],
            })
    
    return {
        "base": base,
        "updated_at": updated_at,
        "items": items,
    }


def _calculate_change_pct(current_items: list[dict], previous_items: Optional[list[dict]]) -> list[dict]:
    """
    Calculate change_pct for each item by comparing with previous cached values.
    
    Args:
        current_items: Current market indicator items
        previous_items: Previous cached items (if available)
        
    Returns:
        list[dict]: Items with change_pct added
    """
    if not previous_items:
        return current_items
    
    # Create a lookup for previous values
    previous_map = {item["symbol"]: item["value"] for item in previous_items if "symbol" in item and "value" in item}
    
    # Calculate change_pct for each current item
    result = []
    for item in current_items:
        symbol = item["symbol"]
        current_value = item["value"]
        previous_value = previous_map.get(symbol)
        
        if previous_value is not None and previous_value > 0:
            try:
                change_pct = ((current_value - previous_value) / previous_value) * 100
                item["change_pct"] = round(change_pct, 2)
            except (ZeroDivisionError, TypeError, ValueError):
                item["change_pct"] = None
        else:
            item["change_pct"] = None
        
        result.append(item)
    
    return result


@router.get(
    "/indicators",
    response={200: MarketIndicatorsResponse, 503: dict},
    summary="Get market indicators",
    description="""
    Get real-time currency exchange rates from CollectAPI.
    
    **No authentication required.**
    
    Returns currency rates for USD, EUR, GBP, JPY, and CNY (base: USD).
    
    **Caching:**
    - Results are cached for 7 minutes
    - If CollectAPI fails, returns last cached response
    - If no cache exists and API fails, returns 503
    
    **Change Percentage:**
    - If available, includes `change_pct` comparing current rate with previous cached value
    """,
)
def get_market_indicators(request):
    """
    Get market indicators (currency exchange rates).
    
    Fetches from CollectAPI with caching and fallback to cached data on failure.
    """
    cache_key = _get_cache_key()
    previous_cache_key = _get_previous_cache_key()
    
    # Try to get cached data first
    cached_data = cache.get(cache_key)
    previous_cached_data = cache.get(previous_cache_key)
    
    # Try to fetch fresh data from CollectAPI
    fresh_data = None
    try:
        api_response = _fetch_from_collectapi()
        fresh_data = _parse_collectapi_response(api_response)
        
        # Calculate change_pct if we have previous data
        if previous_cached_data and "items" in previous_cached_data:
            fresh_data["items"] = _calculate_change_pct(
                fresh_data["items"],
                previous_cached_data.get("items")
            )
        
        # Save current as previous before updating cache
        if cached_data:
            cache.set(previous_cache_key, cached_data, MARKET_CACHE_TIMEOUT * 2)
        
        # Cache the fresh data
        cache.set(cache_key, fresh_data, MARKET_CACHE_TIMEOUT)
        
        return fresh_data
        
    except HttpError:
        # If we have cached data, return it
        if cached_data:
            return cached_data
        
        # If no cache and API failed, raise the error
        raise
    except Exception as e:
        # Unexpected error - try to return cached data
        if cached_data:
            return cached_data
        
        # If no cache, return 503
        raise HttpError(503, f"Market indicators unavailable: {str(e)}")

