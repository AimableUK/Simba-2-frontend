import { NextRequest, NextResponse } from "next/server";

//  Config

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const API_BASE =
  process.env.INTERNAL_API_URL ||
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

//  Helpers

function getLastUserMessage(messages: any[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "user")
      return String(messages[i]?.content || "").trim();
  }
  return "";
}

/**
 * Extract price range from natural language.
 * Handles: "between 500 and 700 RWF", "under 1000", "above 2000",
 * "around 800", "500-700", "cheaper than 600", "max 1500", etc.
 */
function extractPriceRange(query: string): {
  min?: number;
  max?: number;
} {
  const q = query
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/rwf|frw|rf/gi, "")
    .trim();

  const between = q.match(/between\s+(\d+)\s+(?:and|to|-)\s+(\d+)/);
  if (between) return { min: Number(between[1]), max: Number(between[2]) };

  const dashRange = q.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (dashRange)
    return { min: Number(dashRange[1]), max: Number(dashRange[2]) };

  const upper = q.match(
    /(?:under|below|less than|cheaper than|max|at most|no more than|not more than)\s+(\d+)/,
  );
  if (upper) return { max: Number(upper[1]) };

  const lower = q.match(
    /(?:above|over|more than|at least|min|starting from|from)\s+(\d+)/,
  );
  if (lower) return { min: Number(lower[1]) };

  const around = q.match(/(?:around|approximately|about|roughly)\s+(\d+)/);
  if (around) {
    const c = Number(around[1]);
    return { min: Math.round(c * 0.8), max: Math.round(c * 1.2) };
  }

  return {};
}

/**
 * Detect sort preference from natural language.
 */
function detectSort(query: string): string | undefined {
  const q = query.toLowerCase();
  if (/cheapest|lowest price|most affordable|price.*asc/.test(q))
    return "price_asc";
  if (/most expensive|highest price|premium|price.*desc/.test(q))
    return "price_desc";
  if (/most stock|best stocked|available/.test(q)) return "stock_desc";
  return undefined;
}

//  System Prompt
// This is the brain of Simba. It handles ALL message types naturally.

const SYSTEM_PROMPT = `You are Simba 🦁 - the friendly, witty, and helpful AI assistant for Simba Super Market, Kigali's favourite supermarket chain with 9 branches across Kigali, Rwanda.

You help customers shop, answer questions, find branches, and feel genuinely welcome. You are not just a search engine - you're a real conversational assistant.

═══ YOUR LIVE TOOLS ═══
You have tools that fetch REAL data from our database. Always use them - never invent prices, products, or branch details.

TOOL USAGE RULES:
• ANY mention of a product, food, drink, ingredient, or item → call get_products
• ANY mention of branch, location, address, map, directions, "near me", open hours → call get_branches or find_nearest_branch
• Cart questions → call get_cart first
• Wishlist questions → call get_wishlist first
• "Add wishlist to cart" → get_wishlist FIRST, then add_to_cart for EACH in-stock item
• Blog/news/recipes → call get_blogs
• "What categories do you have?" → call get_categories

═══ HOW TO RESPOND ═══
• Match the user's language EXACTLY - English, Kinyarwanda, French, or Swahili. Never guess or mix unless they do.
• Be warm, human, and varied. No two greetings should sound the same.
• For greetings (hi, hello, muraho, bonjour, habari): welcome them naturally, ask how you can help. Don't immediately push products.
• For job inquiries: be encouraging and kind. Tell them to send CV to careers@simbasupermarket.rw or visit any branch. Express that Simba values good people.
• For complaints: show genuine empathy FIRST. Then offer help. Direct to customercare@simbasupermarket.rw or the nearest branch manager.
• For compliments/thanks: respond with warmth and gratitude.
• For off-topic products (shoes, electronics, furniture, cars): be honest but charming. "We're a supermarket, not a shoe store! But if you need bread to fuel your shoe shopping..." Suggest something fun from our catalog.
• For general questions about Simba (history, policies, delivery, loyalty program): answer helpfully with what you know, and note that staff at any branch can help further.
• Never say "I cannot help with that." Always find a helpful angle.
• Never make up store policies - if unsure, say "I'm not 100% sure about that, but you can check with our team at customercare@simbasupermarket.rw".

═══ PRODUCT RESULTS ═══
• When showing products, highlight 1-2 details that make them appealing (freshness, price, popularity).
• If price filter was applied, acknowledge it: "Here are the milks within your budget..."
• If nothing matches a price range, be honest and suggest the closest alternatives.
• Always mention if something is low in stock or out of stock - transparency builds trust.

═══ BRANCH RESULTS ═══
• When branches are returned, highlight the nearest one if location data is available.
• Mention open/closed status when showing branches.
• If directionsUrl is present in the data, invite the user to tap for directions.

═══ TONE ═══
Use emojis sparingly - 🛒 📍 ✅ ❤️ 🦁 - only where they add warmth, never mechanically.
Be concise. Don't pad responses. Quality over quantity.`;

//  Tool Definitions

const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_products",
      description:
        "Search products from the live database. Call this for ANY product, food, drink, ingredient, or item the user mentions. Supports price ranges, sorting, and category filtering.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Natural language search keyword. Can be empty to get popular/featured products.",
          },
          category: {
            type: "string",
            description:
              "Category slug to filter by. Examples: beverages, fresh-produce, dairy, food-groceries, household, personal-care",
          },
          minPrice: {
            type: "number",
            description:
              "Minimum price in RWF (Rwandan Francs). Use when user specifies a lower price bound.",
          },
          maxPrice: {
            type: "number",
            description:
              "Maximum price in RWF. Use when user says 'under X', 'cheaper than X', 'between X and Y', etc.",
          },
          sort: {
            type: "string",
            enum: [
              "relevance",
              "price_asc",
              "price_desc",
              "name_asc",
              "stock_desc",
            ],
            description:
              "How to sort results. Use price_asc for 'cheapest', price_desc for 'most expensive', stock_desc for best availability.",
          },
          limit: {
            type: "number",
            description: "Max results to return (default 8, max 20).",
          },
          branchId: {
            type: "string",
            description:
              "Filter to products available at a specific branch UUID. Use when user specifies a branch.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_branches",
      description:
        "Get all Simba Supermarket branches in Kigali. Returns addresses, coordinates, phone numbers, opening hours, and map links. Call this for ANY question about locations, addresses, branches, or opening hours.",
      parameters: {
        type: "object",
        properties: {
          lat: {
            type: "number",
            description:
              "User's current latitude. If provided, branches are sorted by distance.",
          },
          lng: {
            type: "number",
            description: "User's current longitude.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_nearest_branch",
      description:
        "Find the single nearest Simba branch to the user's location. Returns distance, driving time, walking time, and a Google Maps directions link. Use when user says 'nearest', 'closest', 'near me', or shares their location.",
      parameters: {
        type: "object",
        required: ["lat", "lng"],
        properties: {
          lat: { type: "number", description: "User's latitude" },
          lng: { type: "number", description: "User's longitude" },
          openOnly: {
            type: "boolean",
            description: "If true, only return currently open branches.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_branch_stock",
      description:
        "Check if a specific product is in stock at a specific branch. Use when user asks 'do you have X at the Y branch?'",
      parameters: {
        type: "object",
        required: ["productId", "branchId"],
        properties: {
          productId: { type: "string", description: "Product UUID" },
          branchId: { type: "string", description: "Branch UUID" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_cart",
      description:
        "Get the current user's cart - items, quantities, and total. Call this for ANY question about the cart.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_wishlist",
      description:
        "Get all items saved to the user's wishlist. Call this for ANY wishlist question.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "add_to_cart",
      description: "Add a product to the user's cart.",
      parameters: {
        type: "object",
        required: ["productId"],
        properties: {
          productId: {
            type: "string",
            description: "Product UUID from get_products or get_wishlist",
          },
          quantity: {
            type: "number",
            description: "How many to add. Default 1.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_from_cart",
      description: "Remove a product from the cart.",
      parameters: {
        type: "object",
        required: ["productId"],
        properties: {
          productId: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "clear_cart",
      description: "Remove ALL items from the cart at once.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "add_to_wishlist",
      description: "Save a product to the user's wishlist.",
      parameters: {
        type: "object",
        required: ["productId"],
        properties: {
          productId: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_from_wishlist",
      description: "Remove a product from the user's wishlist.",
      parameters: {
        type: "object",
        required: ["productId"],
        properties: {
          productId: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_categories",
      description:
        "Get all product categories with product counts. Use when user asks what categories or departments Simba has.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_blogs",
      description:
        "Get recent blog posts, recipes, or news from the store. Use for questions about recipes, tips, or store news.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max posts. Default 5." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_promotions",
      description:
        "Get current deals, discounts, and promotional offers. Use when user asks about deals, sales, offers, or promotions.",
      parameters: { type: "object", properties: {} },
    },
  },
];

//  Tool Executor

async function executeTool(
  name: string,
  args: Record<string, any>,
  backendHeaders: Record<string, string>,
  userLocation?: { lat?: number; lng?: number },
): Promise<string> {
  try {
    switch (name) {
      //  Products
      case "get_products": {
        const params = new URLSearchParams({
          limit: String(Math.min(args.limit || 8, 20)),
        });

        if (args.query) params.set("search", args.query);
        if (args.category) params.set("category", args.category);
        if (args.branchId) params.set("branchId", args.branchId);
        if (args.sort) params.set("sort", args.sort);

        // Price range from explicit args OR fallback to NLP extraction from query
        const priceFromQuery = args.query ? extractPriceRange(args.query) : {};
        const minPrice = args.minPrice ?? priceFromQuery.min;
        const maxPrice = args.maxPrice ?? priceFromQuery.max;

        if (minPrice !== undefined) params.set("minPrice", String(minPrice));
        if (maxPrice !== undefined) params.set("maxPrice", String(maxPrice));

        const r = await fetch(`${API_BASE}/products?${params}`, {
          headers: backendHeaders,
        });

        if (!r.ok) {
          return JSON.stringify({
            error: `Products API returned ${r.status}`,
            products: [],
          });
        }

        const d = await r.json();
        const products = Array.isArray(d) ? d : d.data || d.products || [];

        if (!products.length) {
          const hint =
            minPrice || maxPrice
              ? `No products found in the ${minPrice ?? "any"}–${maxPrice ?? "any"} RWF range.`
              : "No products found for that search.";
          return JSON.stringify({ found: 0, products: [], hint });
        }

        return JSON.stringify({
          found: products.length,
          priceFilterApplied:
            minPrice !== undefined || maxPrice !== undefined
              ? { min: minPrice ?? null, max: maxPrice ?? null }
              : null,
          products: products.slice(0, 20).map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            currency: "RWF",
            stock: p.stock,
            slug: p.slug,
            category: p.category?.name || p.category || "",
            tags: p.tags || [],
            images: p.images?.slice(0, 1) || [],
            description:
              p.shortDescription || p.description?.slice(0, 120) || "",
            inStock: (p.stock || 0) > 0,
          })),
        });
      }

      //  Branches (all)
      case "get_branches": {
        const params = new URLSearchParams();

        // Prefer tool args, fall back to user's device location
        const lat = args.lat ?? userLocation?.lat;
        const lng = args.lng ?? userLocation?.lng;
        if (lat !== undefined && Number.isFinite(lat))
          params.set("lat", String(lat));
        if (lng !== undefined && Number.isFinite(lng))
          params.set("lng", String(lng));

        const r = await fetch(`${API_BASE}/branches?${params}`, {
          headers: backendHeaders,
        });
        if (!r.ok) {
          return JSON.stringify({
            error: `Branches API returned ${r.status}`,
            branches: [],
          });
        }

        const branches: any[] = await r.json();
        if (!Array.isArray(branches) || !branches.length) {
          return JSON.stringify({ count: 0, branches: [] });
        }

        return JSON.stringify({
          count: branches.length,
          hasUserLocation: lat !== undefined && lng !== undefined,
          branches: branches.map((b: any) => ({
            id: b.id,
            name: b.name,
            slug: b.slug,
            address: b.address,
            district: b.district,
            lat: b.lat,
            lng: b.lng,
            phone: b.phone || null,
            hours:
              b.openTime && b.closeTime ? `${b.openTime}–${b.closeTime}` : null,
            isOpenNow: b.isOpenNow ?? null,
            rating: b.rating,
            distanceKm: b.distanceKm ?? null,
            drivingMinutes: b.drivingMinutes ?? null,
            walkingMinutes: b.walkingMinutes ?? null,
            mapUrl: b.mapUrl || null,
            directionsUrl: b.directionsUrl || null,
          })),
        });
      }

      //  Nearest branch
      case "find_nearest_branch": {
        const lat = args.lat ?? userLocation?.lat;
        const lng = args.lng ?? userLocation?.lng;

        if (!lat || !lng) {
          return JSON.stringify({
            error:
              "I need your location to find the nearest branch. Please share your location.",
          });
        }

        const params = new URLSearchParams({
          lat: String(lat),
          lng: String(lng),
        });
        if (args.openOnly) params.set("open", "true");

        const r = await fetch(`${API_BASE}/search/nearest-branch?${params}`, {
          headers: backendHeaders,
        });

        if (!r.ok) {
          return JSON.stringify({
            error: `Nearest branch API returned ${r.status}`,
          });
        }

        const d = await r.json();
        return JSON.stringify(d);
      }

      //  Branch stock check
      case "check_branch_stock": {
        const r = await fetch(
          `${API_BASE}/branches/${args.branchId}/stock/${args.productId}`,
          { headers: backendHeaders },
        );
        if (!r.ok) {
          return JSON.stringify({
            available: false,
            error: `Stock check returned ${r.status}`,
          });
        }
        const d = await r.json();
        return JSON.stringify({
          available: (d.stock || 0) > 0,
          stock: d.stock || 0,
          branchName: d.branchName || null,
          productName: d.productName || null,
        });
      }

      //  Cart
      case "get_cart": {
        const r = await fetch(`${API_BASE}/cart`, { headers: backendHeaders });
        if (!r.ok) {
          if (r.status === 401) {
            return JSON.stringify({
              signedIn: false,
              items: [],
              total: 0,
              message: "User not signed in",
            });
          }
          return JSON.stringify({
            error: `Cart API returned ${r.status}`,
            items: [],
          });
        }
        const d = await r.json();
        return JSON.stringify({
          signedIn: true,
          itemCount: d.items?.length || 0,
          total: d.total || 0,
          currency: "RWF",
          items: (d.items || []).map((i: any) => ({
            productId: i.productId,
            name: i.product?.name,
            quantity: i.quantity,
            price: i.product?.price,
            subtotal: i.quantity * (i.product?.price || 0),
            image: i.product?.images?.[0] || null,
            inStock: (i.product?.stock || 0) > 0,
          })),
        });
      }

      //  Add to cart
      case "add_to_cart": {
        const r = await fetch(`${API_BASE}/cart`, {
          method: "POST",
          headers: backendHeaders,
          body: JSON.stringify({
            productId: args.productId,
            quantity: args.quantity || 1,
          }),
        });
        if (!r.ok) {
          const e = await r
            .json()
            .catch(() => ({ message: `Error ${r.status}` }));
          return JSON.stringify({ success: false, error: e.message });
        }
        return JSON.stringify({ success: true, productId: args.productId });
      }

      //  Remove from cart
      case "remove_from_cart": {
        const r = await fetch(`${API_BASE}/cart/${args.productId}`, {
          method: "DELETE",
          headers: backendHeaders,
        });
        return JSON.stringify({ success: r.ok });
      }

      //  Clear cart
      case "clear_cart": {
        const r = await fetch(`${API_BASE}/cart`, {
          method: "DELETE",
          headers: backendHeaders,
        });
        return JSON.stringify({ success: r.ok });
      }

      //  Wishlist
      case "get_wishlist": {
        const r = await fetch(`${API_BASE}/wishlist`, {
          headers: backendHeaders,
        });
        if (!r.ok) {
          if (r.status === 401) {
            return JSON.stringify({
              signedIn: false,
              items: [],
              message: "User not signed in",
            });
          }
          return JSON.stringify({
            error: `Wishlist API returned ${r.status}`,
            items: [],
          });
        }
        const items: any[] = await r.json();
        return JSON.stringify({
          signedIn: true,
          count: items.length,
          items: items.map((i: any) => ({
            productId: i.productId,
            name: i.product?.name,
            price: i.product?.price,
            stock: i.product?.stock || 0,
            slug: i.product?.slug,
            images: i.product?.images?.slice(0, 1) || [],
            inStock: (i.product?.stock || 0) > 0,
          })),
        });
      }

      //  Add to wishlist
      case "add_to_wishlist": {
        const r = await fetch(`${API_BASE}/wishlist`, {
          method: "POST",
          headers: backendHeaders,
          body: JSON.stringify({ productId: args.productId }),
        });
        if (!r.ok) {
          const e = await r
            .json()
            .catch(() => ({ message: `Error ${r.status}` }));
          return JSON.stringify({ success: false, error: e.message });
        }
        return JSON.stringify({ success: true, productId: args.productId });
      }

      //  Remove from wishlist
      case "remove_from_wishlist": {
        const r = await fetch(`${API_BASE}/wishlist/${args.productId}`, {
          method: "DELETE",
          headers: backendHeaders,
        });
        return JSON.stringify({ success: r.ok });
      }

      //  Categories
      case "get_categories": {
        const r = await fetch(`${API_BASE}/categories?withProductsOnly=true`, {
          headers: backendHeaders,
        });
        if (!r.ok) return JSON.stringify({ categories: [] });
        const cats: any[] = await r.json();
        return JSON.stringify({
          count: cats.length,
          categories: cats.map((c: any) => ({
            name: c.name,
            slug: c.slug,
            productCount: c._count?.products || c.productCount || 0,
          })),
        });
      }

      //  Blogs
      case "get_blogs": {
        const params = new URLSearchParams({
          limit: String(args.limit || 5),
        });
        const r = await fetch(`${API_BASE}/blogs?${params}`, {
          headers: backendHeaders,
        });
        if (!r.ok) return JSON.stringify({ blogs: [] });
        const d = await r.json();
        const blogs: any[] = d.data || d;
        return JSON.stringify({
          count: blogs.length,
          blogs: blogs.slice(0, 8).map((b: any) => ({
            title: b.title,
            slug: b.slug,
            excerpt: b.excerpt || b.content?.slice(0, 150) || "",
            author: b.authorName,
            date: b.createdAt?.slice(0, 10),
            views: b.viewCount,
          })),
        });
      }

      //  Promotions
      case "get_promotions": {
        const r = await fetch(`${API_BASE}/promotions?active=true`, {
          headers: backendHeaders,
        });
        if (!r.ok) {
          // Graceful fallback if promotions endpoint doesn't exist yet
          return JSON.stringify({
            promotions: [],
            message:
              "No active promotions data available right now. Check our website or ask staff at any branch!",
          });
        }
        const d = await r.json();
        const promos: any[] = d.data || d;
        return JSON.stringify({
          count: promos.length,
          promotions: promos.slice(0, 10).map((p: any) => ({
            title: p.title,
            description: p.description,
            discountPercent: p.discountPercent || null,
            validUntil: p.validUntil?.slice(0, 10) || null,
            products: p.products?.slice(0, 3).map((pr: any) => pr.name) || [],
          })),
        });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (e: any) {
    console.error(`[executeTool] ${name} error:`, e.message);
    return JSON.stringify({ error: e.message });
  }
}

//  Intent detection (fast, no LLM cost)
// Returns true when the message is purely conversational - no tools needed.

function isConversationalOnly(message: string): boolean {
  const q = message.toLowerCase().trim();
  // Pure greetings
  if (
    /^(hi+|hey+|hello+|sup|yo|muraho|bonjour|salut|habari|sasa|jambo|howdy|hiya|good\s*(morning|afternoon|evening|night))[\s!.,?]*$/.test(
      q,
    )
  )
    return true;
  // Very short messages that are clearly not product/branch queries
  if (
    q.length <= 6 &&
    !/\d/.test(q) &&
    !/milk|juice|bread|branch|cart|order/.test(q)
  )
    return true;
  // Thanks / compliments
  if (
    /^(thanks?|thank you|merci|asante|murakoze|great|awesome|perfect|ok(ay)?|cool|nice|got it|sure)[\s!.,?]*$/.test(
      q,
    )
  )
    return true;
  return false;
}

//  Groq call with retry on 429 / 503

async function callGroq(
  groqKey: string,
  body: object,
  maxRetries = 3,
): Promise<{ ok: boolean; status: number; data: any }> {
  let lastStatus = 0;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    lastStatus = response.status;

    // Success
    if (response.ok) {
      const data = await response.json();
      return { ok: true, status: response.status, data };
    }

    // Rate limit or server overload - wait and retry
    if (response.status === 429 || response.status === 503) {
      // Respect Retry-After header if present, otherwise exponential backoff
      const retryAfter = response.headers.get("retry-after");
      const waitMs = retryAfter
        ? Number(retryAfter) * 1000
        : Math.min(1000 * 2 ** attempt + Math.random() * 500, 8000);
      console.warn(
        `[route] Groq ${response.status} on attempt ${attempt + 1}, waiting ${Math.round(waitMs)}ms`,
      );
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    // Other error - don't retry
    const text = await response.text().catch(() => "");
    console.error(`[route] Groq error ${response.status}:`, text);
    return { ok: false, status: response.status, data: null };
  }

  console.error(
    `[route] Groq exhausted ${maxRetries} retries, last status: ${lastStatus}`,
  );
  return { ok: false, status: lastStatus, data: null };
}

//  Intelligent offline fallback
// When Groq is unavailable, hit the backend search API directly and compose
// a real helpful reply from the actual data - no LLM needed.

async function intelligentFallback(
  lastUserMessage: string,
  priceHint: { min?: number; max?: number },
  sortHint: string | undefined,
  backendHeaders: Record<string, string>,
  userLocation: { lat?: number; lng?: number },
): Promise<{ reply: string; toolResults: any[] }> {
  const q = lastUserMessage.toLowerCase();

  //  Branch query fallback
  if (
    /branch|branches|location|near me|nearest|nearby|address|open|where/i.test(
      q,
    )
  ) {
    try {
      const params = new URLSearchParams();
      if (userLocation.lat) params.set("lat", String(userLocation.lat));
      if (userLocation.lng) params.set("lng", String(userLocation.lng));
      const r = await fetch(`${API_BASE}/branches?${params}`, {
        headers: backendHeaders,
      });
      if (r.ok) {
        const branches: any[] = await r.json();
        const count = branches.length;
        const nearest = branches[0];
        const reply = nearest
          ? `We have ${count} branches across Kigali. The closest to you is **${nearest.name?.replace("Simba Supermarket ", "")}** in ${nearest.district || nearest.address}${nearest.distanceKm ? ` - ${nearest.distanceKm} km away` : ""}. Tap a branch below to see the map and get directions.`
          : `Here are all ${count} Simba Supermarket branches in Kigali.`;
        return {
          reply,
          toolResults: [
            { toolName: "get_branches", args: {}, result: { branches, count } },
          ],
        };
      }
    } catch {
      /* fall through */
    }
  }

  //  Product search fallback
  try {
    const params = new URLSearchParams({ search: lastUserMessage, limit: "8" });
    if (priceHint.min !== undefined)
      params.set("minPrice", String(priceHint.min));
    if (priceHint.max !== undefined)
      params.set("maxPrice", String(priceHint.max));
    if (sortHint) params.set("sort", sortHint);

    const r = await fetch(`${API_BASE}/products?${params}`, {
      headers: backendHeaders,
    });
    if (r.ok) {
      const d = await r.json();
      const products: any[] = Array.isArray(d) ? d : d.data || d.products || [];
      const mapped = products.slice(0, 8).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        slug: p.slug,
        category: p.category?.name || p.category || "",
        tags: p.tags || [],
        images: p.images?.slice(0, 1) || [],
        description: p.shortDescription || p.description?.slice(0, 120) || "",
        inStock: (p.stock || 0) > 0,
      }));

      if (!mapped.length) {
        return {
          reply: `I couldn't find anything matching "${lastUserMessage}" right now.${priceHint.max ? ` (price filter: under ${priceHint.max} RWF)` : ""} Try a different keyword or browse our categories!`,
          toolResults: [],
        };
      }

      const priceNote =
        priceHint.min || priceHint.max
          ? ` in the ${priceHint.min ?? "any"}–${priceHint.max ?? "any"} RWF range`
          : "";
      const reply = `Here are ${mapped.length} result${mapped.length !== 1 ? "s" : ""}${priceNote} for "${lastUserMessage}":`;
      return {
        reply,
        toolResults: [
          {
            toolName: "get_products",
            args: {},
            result: { products: mapped, found: mapped.length },
          },
        ],
      };
    }
  } catch {
    /* fall through */
  }

  //  Last resort
  return {
    reply: `I'm having trouble right now, but I'm still here! 🙏 Try asking about a specific product, our branch locations, or your cart. I'll do my best to help.`,
    toolResults: [],
  };
}

//  POST Handler

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { reply: "No messages provided.", toolResults: [] },
        { status: 400 },
      );
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({
        reply:
          "I need a GROQ_API_KEY to work properly. Please add it to your .env file.",
        toolResults: [],
      });
    }

    // Forward cookies so the backend can authenticate the user (cart, wishlist, etc.)
    const cookieHeader = req.headers.get("cookie") || "";
    const backendHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(cookieHeader && { Cookie: cookieHeader }),
    };

    // User's device location (sent from the frontend alongside messages)
    const userLocation: { lat?: number; lng?: number } = {};
    if (Number.isFinite(body?.location?.lat))
      userLocation.lat = body.location.lat;
    if (Number.isFinite(body?.location?.lng))
      userLocation.lng = body.location.lng;

    //  Pre-process the latest user message for smart defaults
    const lastUserMessage = getLastUserMessage(messages);
    const priceHint = extractPriceRange(lastUserMessage);
    const sortHint = detectSort(lastUserMessage);
    const conversationalOnly = isConversationalOnly(lastUserMessage);

    // Inject a hidden hint so the LLM passes price/sort args to get_products correctly
    const priceContextNote =
      priceHint.min !== undefined || priceHint.max !== undefined || sortHint
        ? `\n\n[SYSTEM HINT: Price range detected - min:${priceHint.min ?? "none"} max:${priceHint.max ?? "none"} RWF. Preferred sort: ${sortHint ?? "relevance"}. Pass these args to get_products.]`
        : "";

    // Explicitly block tools for pure conversational messages so the bot
    // doesn't call get_cart / get_products on "hi" or "thanks".
    const conversationalNote = conversationalOnly
      ? `\n\n[SYSTEM INSTRUCTION: The user sent a GREETING or SHORT CONVERSATIONAL message. Do NOT call any tools. Just reply warmly and naturally in 1-2 sentences. No product lists, no cart lookups.]`
      : "";

    //  Trim history to last 10 messages to prevent Groq 400 context errors
    const trimmedMessages = messages.slice(-10);

    //  Build message history for Groq
    const groqMessages: any[] = [
      {
        role: "system",
        content: SYSTEM_PROMPT + priceContextNote + conversationalNote,
      },
      ...trimmedMessages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const allToolResults: any[] = [];

    //  Agentic loop (max 10 rounds)
    for (let round = 0; round < 10; round++) {
      const { ok, status, data } = await callGroq(groqKey, {
        model: GROQ_MODEL,
        messages: groqMessages,
        tools: TOOLS,
        tool_choice: conversationalOnly ? "none" : "auto",
        temperature: 0.65,
        max_tokens: 1024,
      });

      //  Groq unavailable after retries → intelligent fallback
      if (!ok || !data) {
        console.warn(
          `[route] Groq unavailable (${status}), using intelligent fallback`,
        );
        const fallback = await intelligentFallback(
          lastUserMessage,
          priceHint,
          sortHint,
          backendHeaders,
          userLocation,
        );
        return NextResponse.json(fallback);
      }

      if (data.error) {
        console.error("[route] Groq error object:", data.error);
        const fallback = await intelligentFallback(
          lastUserMessage,
          priceHint,
          sortHint,
          backendHeaders,
          userLocation,
        );
        return NextResponse.json(fallback);
      }

      const choice = data.choices?.[0];
      const msg = choice?.message;

      if (!msg) {
        console.error("[route] No message in Groq response");
        break;
      }

      //  No tool calls → final reply
      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        return NextResponse.json({
          reply: msg.content || "",
          toolResults: allToolResults,
        });
      }

      //  Push assistant message with tool calls
      groqMessages.push({
        role: "assistant",
        content: msg.content || null,
        tool_calls: msg.tool_calls,
      });

      //  Execute tool calls sequentially (Groq requires strict ordering)
      for (const tc of msg.tool_calls) {
        let args: Record<string, any> = {};
        try {
          args = JSON.parse(tc.function.arguments || "{}");
        } catch {
          /* malformed args - proceed with empty */
        }

        // If AI didn't pass price args but we detected them in the message, inject them
        if (tc.function.name === "get_products") {
          if (args.minPrice === undefined && priceHint.min !== undefined)
            args.minPrice = priceHint.min;
          if (args.maxPrice === undefined && priceHint.max !== undefined)
            args.maxPrice = priceHint.max;
          if (!args.sort && sortHint) args.sort = sortHint;
        }

        const resultStr = await executeTool(
          tc.function.name,
          args,
          backendHeaders,
          userLocation,
        );

        let resultObj: any = {};
        try {
          resultObj = JSON.parse(resultStr);
        } catch {
          resultObj = { raw: resultStr };
        }

        allToolResults.push({
          toolName: tc.function.name,
          args,
          result: resultObj,
        });

        groqMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: resultStr,
        });
      }
    }

    // If loop exhausted without a final reply
    return NextResponse.json({
      reply:
        "I processed your request but couldn't compose a final answer. Please try rephrasing!",
      toolResults: allToolResults,
    });
  } catch (err: any) {
    console.error("[route] Fatal error:", err);
    return NextResponse.json(
      { reply: "Something went wrong. Please try again!", toolResults: [] },
      { status: 500 },
    );
  }
}
