const RAPIDAPI_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;

const RETAILER_CONFIG = {
  Amazon: { tbs: 'Amazon' },
  Walmart: { tbs: 'Walmart' },
  Target: { tbs: 'Target' },
};

export async function fetchPrice(searchQuery, retailer = 'Amazon') {
  const config = RETAILER_CONFIG[retailer] || RETAILER_CONFIG.Amazon;

  const url = `https://real-time-product-search.p.rapidapi.com/search?q=${encodeURIComponent(searchQuery)}&country=us&language=en&limit=3`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'real-time-product-search.p.rapidapi.com',
    },
  });

  const data = await response.json();
  console.log('Price API response:', JSON.stringify(data).slice(0, 500));

  const products = data?.data?.products || data?.products || [];
  if (!products.length) return null;

  // Find first product with a price from the preferred retailer, or just first result
  const match =
    products.find((p) =>
      p.offer?.store_name?.toLowerCase().includes(retailer.toLowerCase())
    ) || products[0];

  const price = match?.offer?.price || match?.typical_price_range?.[0];
  if (!price) return null;

  return {
    price: parseFloat(String(price).replace(/[^0-9.]/g, '')),
    currency: 'USD',
    retailer: match?.offer?.store_name || retailer,
    priceDate: new Date().toISOString(),
    productUrl: match?.offer?.offer_page_url || null,
  };
}
