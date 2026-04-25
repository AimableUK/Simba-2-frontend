import { NextRequest, NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const API_BASE =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const SYSTEM_PROMPT = `You are Simba, the friendly AI shopping assistant for Simba Super Market - Kigali's favourite supermarket chain with 9 branches across Kigali, Rwanda.

You have access to LIVE tools that fetch real data from the database. ALWAYS use tools before answering - never guess or invent data.

CRITICAL RULES:
- Always call get_products when asked about ANY product, food, drink, or item
- Always call get_branches when asked about ANY branch, location, address, map
- Always call get_cart before saying anything about the cart
- Always call get_wishlist before saying anything about the wishlist
- When user says "add wishlist to cart": call get_wishlist FIRST, then call add_to_cart for EACH in-stock item
- Never say "you are not signed in" - just call the tool and return what it gives you
- Respond in the SAME language the user uses (English, Kinyarwanda, French, Swahili)
- Be warm and concise. Use 🛒 📍 ✅ ❤️ sparingly`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;
    const groqKey = process.env.GROQ_API_KEY;

    if (!groqKey) {
      return NextResponse.json({
        reply:
          "I need a GROQ_API_KEY configured to work. Please add it to your .env file.",
        toolResults: [],
      });
    }

    const cookieHeader = req.headers.get("cookie") || "";
    const backendHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(cookieHeader && { Cookie: cookieHeader }),
    };

    const tools = [
      {
        type: "function",
        function: {
          name: "get_products",
          description:
            "Search or list products from the store database. ALWAYS call this for product questions.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search keyword. Empty = return popular products.",
              },
              category: {
                type: "string",
                description:
                  "Category slug e.g. beverages, fresh-produce, food-groceries",
              },
              limit: {
                type: "number",
                description: "Max results (default 8, max 20)",
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
            "Get all Simba Supermarket branches in Kigali with addresses and coordinates. ALWAYS call for branch/location questions.",
          parameters: { type: "object", properties: {} },
        },
      },
      {
        type: "function",
        function: {
          name: "get_cart",
          description:
            "Get the current user's cart items and total. Call this for ANY cart question.",
          parameters: { type: "object", properties: {} },
        },
      },
      {
        type: "function",
        function: {
          name: "get_wishlist",
          description:
            "Get all items in the user's wishlist. Call this for ANY wishlist question.",
          parameters: { type: "object", properties: {} },
        },
      },
      {
        type: "function",
        function: {
          name: "add_to_cart",
          description: "Add a product to the cart by its productId.",
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
                description: "Quantity to add, default 1",
              },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "remove_from_cart",
          description: "Remove a specific product from the cart.",
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
          name: "get_blogs",
          description: "Get recent blog posts from the store.",
          parameters: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Max posts to return, default 5",
              },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "get_categories",
          description: "Get all product categories.",
          parameters: { type: "object", properties: {} },
        },
      },
    ];

    async function executeTool(
      name: string,
      args: Record<string, any>,
    ): Promise<string> {
      try {
        switch (name) {
          case "get_products": {
            const params = new URLSearchParams({
              limit: String(Math.min(args.limit || 8, 20)),
            });
            if (args.query) params.set("search", args.query);
            if (args.category) params.set("category", args.category);
            const r = await fetch(`${API_BASE}/products?${params}`, {
              headers: backendHeaders,
            });
            if (!r.ok)
              return JSON.stringify({
                error: `Products API returned ${r.status}`,
                products: [],
              });
            const d = await r.json();
            const products = Array.isArray(d) ? d : d.data || [];
            if (!products.length)
              return JSON.stringify({
                found: 0,
                products: [],
                message: "No products found for that query",
              });
            return JSON.stringify({
              found: products.length,
              products: products.slice(0, 20).map((p: any) => ({
                id: p.id,
                name: p.name,
                price: p.price,
                currency: "RWF",
                stock: p.stock,
                slug: p.slug,
                category: p.category?.name || "",
                tags: p.tags || [],
                images: p.images?.slice(0, 1) || [],
                description:
                  p.shortDescription || p.description?.slice(0, 100) || "",
                inStock: p.stock > 0,
              })),
            });
          }

          case "get_branches": {
            const r = await fetch(`${API_BASE}/branches`, {
              headers: backendHeaders,
            });
            if (!r.ok)
              return JSON.stringify({
                error: `Branches API returned ${r.status}`,
                branches: [],
              });
            const branches = await r.json();
            if (!Array.isArray(branches) || !branches.length)
              return JSON.stringify({ count: 0, branches: [] });
            return JSON.stringify({
              count: branches.length,
              branches: branches.map((b: any) => ({
                name: b.name,
                address: b.address,
                district: b.district,
                lat: b.lat,
                lng: b.lng,
                phone: b.phone || null,
                hours: `${b.openTime}–${b.closeTime}`,
                rating: b.rating,
                slug: b.slug,
                isActive: b.isActive,
              })),
            });
          }

          case "get_cart": {
            const r = await fetch(`${API_BASE}/cart`, {
              headers: backendHeaders,
            });
            if (!r.ok) {
              if (r.status === 401)
                return JSON.stringify({
                  signedIn: false,
                  items: [],
                  total: 0,
                  message: "User not authenticated",
                });
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
              items: (d.items || []).map((i: any) => ({
                productId: i.productId,
                name: i.product?.name,
                quantity: i.quantity,
                price: i.product?.price,
                subtotal: i.quantity * (i.product?.price || 0),
                image: i.product?.images?.[0],
              })),
            });
          }

          case "get_wishlist": {
            const r = await fetch(`${API_BASE}/wishlist`, {
              headers: backendHeaders,
            });
            if (!r.ok) {
              if (r.status === 401)
                return JSON.stringify({
                  signedIn: false,
                  items: [],
                  message: "User not authenticated",
                });
              return JSON.stringify({
                error: `Wishlist API returned ${r.status}`,
                items: [],
              });
            }
            const items = await r.json();
            return JSON.stringify({
              signedIn: true,
              count: items.length,
              items: (items || []).map((i: any) => ({
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

          case "remove_from_cart": {
            const r = await fetch(`${API_BASE}/cart/${args.productId}`, {
              method: "DELETE",
              headers: backendHeaders,
            });
            return JSON.stringify({ success: r.ok });
          }

          case "clear_cart": {
            const r = await fetch(`${API_BASE}/cart`, {
              method: "DELETE",
              headers: backendHeaders,
            });
            return JSON.stringify({ success: r.ok });
          }

          case "get_blogs": {
            const params = new URLSearchParams({
              limit: String(args.limit || 5),
            });
            const r = await fetch(`${API_BASE}/blogs?${params}`, {
              headers: backendHeaders,
            });
            if (!r.ok) return JSON.stringify({ blogs: [] });
            const d = await r.json();
            const blogs = d.data || d;
            return JSON.stringify({
              count: blogs.length,
              blogs: blogs.slice(0, 8).map((b: any) => ({
                title: b.title,
                slug: b.slug,
                excerpt: b.excerpt || b.content?.slice(0, 120),
                author: b.authorName,
                views: b.viewCount,
                date: b.createdAt?.slice(0, 10),
              })),
            });
          }

          case "get_categories": {
            const r = await fetch(`${API_BASE}/categories`, {
              headers: backendHeaders,
            });
            if (!r.ok) return JSON.stringify({ categories: [] });
            const cats = await r.json();
            return JSON.stringify({
              count: cats.length,
              categories: cats.map((c: any) => ({
                name: c.name,
                slug: c.slug,
                productCount: c._count?.products || 0,
              })),
            });
          }

          default:
            return JSON.stringify({ error: `Unknown tool: ${name}` });
        }
      } catch (e: any) {
        console.error(`Tool ${name} error:`, e.message);
        return JSON.stringify({ error: e.message });
      }
    }

    const groqMessages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    const allToolResults: any[] = [];

    // Agentic loop - sequential to maintain strict message ordering
    for (let round = 0; round < 8; round++) {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: groqMessages,
          tools,
          tool_choice: "auto",
          temperature: 0.2,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Groq error ${response.status}:`, errText);
        return NextResponse.json({
          reply: `I'm having trouble connecting to my AI (${response.status}). Please try again in a moment.`,
          toolResults: allToolResults,
        });
      }

      const data = await response.json();

      if (data.error) {
        console.error("Groq error response:", data.error);
        return NextResponse.json({
          reply: `AI error: ${data.error.message || "unknown"}. Please try again.`,
          toolResults: allToolResults,
        });
      }

      const choice = data.choices?.[0];
      const msg = choice?.message;

      if (!msg) {
        console.error("No message in Groq response:", JSON.stringify(data));
        break;
      }

      // Final text answer - no more tool calls
      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        return NextResponse.json({
          reply: msg.content || "",
          toolResults: allToolResults,
        });
      }

      // Push assistant message with tool_calls
      groqMessages.push({
        role: "assistant",
        content: msg.content || null,
        tool_calls: msg.tool_calls,
      });

      // Execute each tool call SEQUENTIALLY
      for (const tc of msg.tool_calls) {
        let args: Record<string, any> = {};
        try {
          args = JSON.parse(tc.function.arguments || "{}");
        } catch {
          /* empty args */
        }

        const resultStr = await executeTool(tc.function.name, args);
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

    return NextResponse.json({
      reply:
        "I finished processing but couldn't compose a final answer. Please try rephrasing.",
      toolResults: allToolResults,
    });
  } catch (err: any) {
    console.error("Agent route fatal error:", err);
    return NextResponse.json({
      reply: "Something went wrong. Please try again.",
      toolResults: [],
    });
  }
}
