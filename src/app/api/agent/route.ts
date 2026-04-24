import { NextRequest, NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const SYSTEM_PROMPT = `You are Simba, the friendly AI shopping assistant for Simba Super Market — Kigali's favourite supermarket chain with 9 branches.

You have access to tools to fetch live data. Always call a tool to get real data before answering questions about products, branches, cart, or wishlist.

BEHAVIOUR:
- Respond in the SAME language the user writes in (English, Kinyarwanda, French, Swahili)
- Be warm, concise, and helpful — you are a friendly Rwandan supermarket assistant
- Always use real data from tools — never invent product names, prices, or branch info
- When adding wishlist to cart: call get_wishlist first, then add each in-stock item one by one
- Keep replies short (2-4 sentences max) unless listing items
- Use light emojis: 🛒 🥛 📍 ✅ ❤️`;

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionToken } = await req.json();
    const groqKey = process.env.GROQ_API_KEY;

    if (!groqKey) {
      return NextResponse.json({
        reply:
          "I'm not configured yet. Please add a GROQ_API_KEY to the environment.",
        toolResults: [],
      });
    }

    const backendHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(sessionToken && {
        Cookie: `better-auth.session_token=${sessionToken}`,
      }),
    };

    const tools = [
      {
        type: "function",
        function: {
          name: "get_products",
          description:
            "Search products in the store. Call this for ANY question about products, food, drinks, availability.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search keyword (empty = browse all)",
              },
              limit: { type: "number", description: "Max results, default 8" },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "get_branches",
          description:
            "Get all 9 Simba branches in Kigali. Call for ANY branch/location/address questions.",
          parameters: { type: "object", properties: {} },
        },
      },
      {
        type: "function",
        function: {
          name: "get_cart",
          description: "Get user's current cart contents and total.",
          parameters: { type: "object", properties: {} },
        },
      },
      {
        type: "function",
        function: {
          name: "get_wishlist",
          description: "Get all items in the user's wishlist.",
          parameters: { type: "object", properties: {} },
        },
      },
      {
        type: "function",
        function: {
          name: "add_to_cart",
          description: "Add a product to cart by productId.",
          parameters: {
            type: "object",
            required: ["productId"],
            properties: {
              productId: { type: "string" },
              quantity: { type: "number", description: "Default 1" },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "remove_from_cart",
          description: "Remove a product from cart.",
          parameters: {
            type: "object",
            required: ["productId"],
            properties: { productId: { type: "string" } },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "clear_cart",
          description: "Remove ALL items from cart.",
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
              limit: String(args.limit || 8),
            });
            if (args.query) params.set("search", args.query);
            const r = await fetch(`${API_BASE}/products?${params}`, {
              headers: backendHeaders,
            });
            const d = await r.json();
            const products = Array.isArray(d) ? d : d.data || [];
            return JSON.stringify({
              found: products.length,
              products: products.slice(0, 8).map((p: any) => ({
                id: p.id,
                name: p.name,
                price: p.price,
                stock: p.stock,
                slug: p.slug,
                category: p.category?.name || "",
                images: p.images?.slice(0, 1) || [],
                description:
                  p.shortDescription || p.description?.slice(0, 80) || "",
              })),
            });
          }
          case "get_branches": {
            const r = await fetch(`${API_BASE}/branches`, {
              headers: backendHeaders,
            });
            const branches = await r.json();
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
              })),
            });
          }
          case "get_cart": {
            const r = await fetch(`${API_BASE}/cart`, {
              headers: backendHeaders,
            });
            if (!r.ok)
              return JSON.stringify({ error: "Not signed in", items: [] });
            const d = await r.json();
            return JSON.stringify({
              itemCount: d.items?.length || 0,
              total: d.total || 0,
              items: (d.items || []).map((i: any) => ({
                productId: i.productId,
                name: i.product?.name,
                quantity: i.quantity,
                price: i.product?.price,
                subtotal: i.quantity * i.product?.price,
              })),
            });
          }
          case "get_wishlist": {
            const r = await fetch(`${API_BASE}/wishlist`, {
              headers: backendHeaders,
            });
            if (!r.ok)
              return JSON.stringify({ error: "Not signed in", items: [] });
            const items = await r.json();
            return JSON.stringify({
              count: items.length,
              items: (items || []).map((i: any) => ({
                productId: i.productId,
                name: i.product?.name,
                price: i.product?.price,
                stock: i.product?.stock,
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
              const e = await r.json();
              return JSON.stringify({ success: false, error: e.message });
            }
            return JSON.stringify({ success: true });
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
          default:
            return JSON.stringify({ error: "Unknown tool" });
        }
      } catch (e) {
        return JSON.stringify({ error: String(e) });
      }
    }

    // Build message history
    const groqMessages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    const allToolResults: any[] = [];

    // Agentic loop — sequential tool execution to avoid race conditions
    for (let round = 0; round < 6; round++) {
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
          temperature: 0.3,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("Groq API error:", response.status, err);
        return NextResponse.json({
          reply: `I ran into an issue (${response.status}). Please try again.`,
          toolResults: allToolResults,
        });
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const msg = choice?.message;

      if (!msg) break;

      // No tool calls = final text answer
      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        return NextResponse.json({
          reply: msg.content || "",
          toolResults: allToolResults,
        });
      }

      // Push assistant message first (with tool_calls)
      groqMessages.push({
        role: "assistant",
        content: msg.content || null,
        tool_calls: msg.tool_calls,
      });

      // Execute tools SEQUENTIALLY to maintain message order
      for (const tc of msg.tool_calls) {
        const args = (() => {
          try {
            return JSON.parse(tc.function.arguments || "{}");
          } catch {
            return {};
          }
        })();

        const resultStr = await executeTool(tc.function.name, args);
        const resultObj = (() => {
          try {
            return JSON.parse(resultStr);
          } catch {
            return { raw: resultStr };
          }
        })();

        allToolResults.push({
          toolName: tc.function.name,
          args,
          result: resultObj,
        });

        // Push tool result immediately after executing
        groqMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: resultStr,
        });
      }
    }

    // Fallback if loop exhausted
    return NextResponse.json({
      reply:
        "I processed your request but couldn't form a final answer. Please try rephrasing.",
      toolResults: allToolResults,
    });
  } catch (err) {
    console.error("Agent route error:", err);
    return NextResponse.json({
      reply: "Something went wrong on my end. Please try again.",
      toolResults: [],
    });
  }
}
