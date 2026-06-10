const RAPIDAPI_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;

const RETAILERS = ['Amazon', 'Walmart', 'Target'];

async function fetchPrice(searchQuery, retailer) {
  const url = `https://real-time-product-search.p.rapidapi.com/search?q=${encodeURIComponent(searchQuery)}&country=us&language=en&limit=5`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'real-time-product-search.p.rapidapi.com',
    },
  });

  const data = await response.json();
  const products = data?.data?.products || data?.products || [];
  if (!products.length) return null;

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

// Fetch prices from all three retailers in parallel.
// Returns { Amazon: {...}|null, Walmart: {...}|null, Target: {...}|null }
export async function fetchAllPrices(searchQuery) {
  const results = await Promise.allSettled(
    RETAILERS.map((r) => fetchPrice(searchQuery, r))
  );
  return Object.fromEntries(
    RETAILERS.map((r, i) => [r, results[i].status === 'fulfilled' ? results[i].value : null])
  );
}
