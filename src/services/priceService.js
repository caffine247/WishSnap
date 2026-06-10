const RAPIDAPI_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;
const RETAILERS = ['Amazon', 'Walmart', 'Target'];

export async function fetchAllPrices(searchQuery) {
  const url = `https://real-time-product-search.p.rapidapi.com/search?q=${encodeURIComponent(searchQuery)}&country=us&language=en&limit=10`;

  let products = [];
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'real-time-product-search.p.rapidapi.com',
      },
    });
    const data = await response.json();
    products = data?.data?.products || data?.products || [];
  } catch (e) {
    console.log('Price API error:', e.message);
  }

  const result = {};
  for (const retailer of RETAILERS) {
    const match = products.find((p) =>
      p.offer?.store_name?.toLowerCase().includes(retailer.toLowerCase())
    );
    if (match) {
      const raw = match?.offer?.price || match?.typical_price_range?.[0];
      const price = raw ? parseFloat(String(raw).replace(/[^0-9.]/g, '')) : null;
      result[retailer] = price
        ? {
            price,
            currency: 'USD',
            retailer: match.offer?.store_name || retailer,
            priceDate: new Date().toISOString(),
            productUrl: match.offer?.offer_page_url || null,
          }
        : null;
    } else {
      result[retailer] = null;
    }
  }

  // If no retailer-specific matches, use the first result as a fallback for Amazon
  if (!result.Amazon && !result.Walmart && !result.Target && products.length > 0) {
    const first = products[0];
    const raw = first?.offer?.price || first?.typical_price_range?.[0];
    const price = raw ? parseFloat(String(raw).replace(/[^0-9.]/g, '')) : null;
    if (price) {
      const storeName = first.offer?.store_name || 'Amazon';
      const matched = RETAILERS.find((r) => storeName.toLowerCase().includes(r.toLowerCase())) || 'Amazon';
      result[matched] = {
        price,
        currency: 'USD',
        retailer: storeName,
        priceDate: new Date().toISOString(),
        productUrl: first.offer?.offer_page_url || null,
      };
    }
  }

  return result;
}
