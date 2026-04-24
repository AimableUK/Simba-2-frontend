import { NextRequest, NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const SYSTEM_PROMPT = `You are Simba, the friendly AI shopping assistant for Simba Super Market - Kigali's favourite supermarket chain.

You have access to these tools:
- get_products: Search/list products from the store
- get_branches: List all 9 Kigali branches with locations
- get_cart: View the user's current cart
- get_wishlist: View the user's wishlist
- add_to_cart: Add a product to cart
- remove_from_cart: Remove a product from cart
- clear_cart: Empty the entire cart

RULES:
- Always respond in the SAME language the user writes in (English, Kinyarwanda, French, or Swahili)
- Be warm, helpful and concise - you are a friendly Rwandan supermarket assistant
- When showing products, include price in RWF, stock status, and a short description
- When the user asks to add wishlist items to cart, FIRST call get_wishlist, then add each item
- NEVER make up products - only use real data from the tools
- For branch questions, always show the real 9 Kigali locations
- Keep replies short and conversational unless detail is needed
- Use emojis sparingly but warmly 🛒`;

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionToken } = await req.json();
    const groqKey = process.env.GROQ_API_KEY;

    if (!groqKey) {
      return NextResponse.json(
        { error: "Groq API key not configured" },
        { status: 500 },
      );
    }

    const tools = [
      {
        type: "function",
        function: {
          name: "get_products",
          description:
            "Search for products in the store by keyword, category, or browse all",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query or empty for all",
              },
              category: {
                type: "string",
                description: "Category slug to filter by",
              },
              limit: {
                type: "number",
                description: "Max products to return (default 8)",
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
            "Get all 9 Simba Supermarket branches in Kigali with their locations",
          parameters: { type: "object", properties: {} },
        },
      },
      {
        type: "function",
        function: {
          name: "get_cart",
          description: "Get the current user cart contents and total",
          parameters: { type: "object", properties: {} },
        },
      },
      {
        type: "function",
        function: {
          name: "get_wishlist",
          description: "Get all items in the user wishlist",
          parameters: { type: "object", properties: {} },
        },
      },
      {
        type: "function",
        function: {
          name: "add_to_cart",
          description: "Add a product to the user cart",
          parameters: {
            type: "object",
            required: ["productId", "quantity"],
            properties: {
              productId: {
                type: "string",
                description: "The product ID to add",
              },
              quantity: {
                type: "number",
                description: "Quantity to add (default 1)",
              },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "remove_from_cart",
          description: "Remove a product from the user cart",
          parameters: {
            type: "object",
            required: ["productId"],
            properties: {
              productId: {
                type: "string",
                description: "The product ID to remove",
              },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "clear_cart",
          description: "Remove all items from the user cart",
          parameters: { type: "object", properties: {} },
        },
      },
    ];

    // Build auth headers for backend calls
    const backendHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(sessionToken && {
        Cookie: `better-auth.session_token=${sessionToken}`,
      }),
    };

    // Tool executor
    async function executeTool(name: string, args: any): Promise<string> {
      try {
        switch (name) {
          case "get_products": {
            const params = new URLSearchParams();
            if (args.query) params.set("search", args.query);
            if (args.category) params.set("category", args.category);
            if (args.limit) params.set("limit", String(args.limit));
            else params.set("limit", "8");
            const res = await fetch(`${API_BASE}/products?${params}`, {
              headers: backendHeaders,
            });
            const data = await res.json();
            const products = data.data || data;
            if (!products?.length)
              return JSON.stringify({ found: 0, message: "No products found" });
            return JSON.stringify({
              found: products.length,
              products: products.slice(0, 8).map((p: any) => ({
                id: p.id,
                name: p.name,
                price: p.price,
                stock: p.stock,
                category: p.category?.name,
                slug: p.slug,
                images: p.images?.slice(0, 1),
                description: p.shortDescription || p.description?.slice(0, 80),
              })),
            });
          }

          case "get_branches": {
            const res = await fetch(`${API_BASE}/branches`, {
              headers: backendHeaders,
            });
            const branches = await res.json();
            return JSON.stringify({
              count: branches.length,
              branches: branches.map((b: any) => ({
                name: b.name,
                address: b.address,
                district: b.district,
                lat: b.lat,
                lng: b.lng,
                phone: b.phone,
                hours: `${b.openTime}–${b.closeTime}`,
                rating: b.rating,
                slug: b.slug,
              })),
            });
          }

          case "get_cart": {
            const res = await fetch(`${API_BASE}/cart`, {
              headers: backendHeaders,
            });
            if (!res.ok) return JSON.stringify({ error: "Not authenticated" });
            const data = await res.json();
            return JSON.stringify({
              itemCount: data.items?.length || 0,
              total: data.total,
              deliveryFee: data.deliveryFee,
              items: data.items?.map((i: any) => ({
                productId: i.productId,
                name: i.product?.name,
                quantity: i.quantity,
                price: i.product?.price,
                subtotal: i.quantity * i.product?.price,
              })),
            });
          }

          case "get_wishlist": {
            const res = await fetch(`${API_BASE}/wishlist`, {
              headers: backendHeaders,
            });
            if (!res.ok) return JSON.stringify({ error: "Not authenticated" });
            const items = await res.json();
            return JSON.stringify({
              count: items.length,
              items: items.map((i: any) => ({
                productId: i.productId,
                name: i.product?.name,
                price: i.product?.price,
                stock: i.product?.stock,
                slug: i.product?.slug,
                images: i.product?.images?.slice(0, 1),
                inStock: i.product?.stock > 0,
              })),
            });
          }

          case "add_to_cart": {
            const res = await fetch(`${API_BASE}/cart`, {
              method: "POST",
              headers: backendHeaders,
              body: JSON.stringify({
                productId: args.productId,
                quantity: args.quantity || 1,
              }),
            });
            if (!res.ok) {
              const err = await res.json();
              return JSON.stringify({ success: false, error: err.message });
            }
            return JSON.stringify({ success: true, message: `Added to cart` });
          }

          case "remove_from_cart": {
            const res = await fetch(`${API_BASE}/cart/${args.productId}`, {
              method: "DELETE",
              headers: backendHeaders,
            });
            return JSON.stringify({ success: res.ok });
          }

          case "clear_cart": {
            const res = await fetch(`${API_BASE}/cart`, {
              method: "DELETE",
              headers: backendHeaders,
            });
            return JSON.stringify({ success: res.ok });
          }

          default:
            return JSON.stringify({ error: "Unknown tool" });
        }
      } catch (err) {
        return JSON.stringify({ error: String(err) });
      }
    }

    // Agentic loop - allow up to 5 tool call rounds
    const groqMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    let finalContent = "";
    let toolResults: any[] = [];

    for (let round = 0; round < 5; round++) {
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
          temperature: 0.4,
          max_tokens: 1024,
        }),
      });

      const data = await response.json();
      const choice = data.choices?.[0];
      const msg = choice?.message;

      if (!msg) break;

      // No tool calls - we have final answer
      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        finalContent = msg.content || "";
        break;
      }

      // Execute all tool calls in parallel
      groqMessages.push({
        role: "assistant",
        content: msg.content || null,
        tool_calls: msg.tool_calls,
      });

      await Promise.all(
        msg.tool_calls.map(async (tc: any) => {
          const args = JSON.parse(tc.function.arguments || "{}");
          const result = await executeTool(tc.function.name, args);
          toolResults.push({
            toolName: tc.function.name,
            args,
            result: JSON.parse(result),
          });
          groqMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: result,
          });
        }),
      );
    }

    return NextResponse.json({ reply: finalContent, toolResults });
  } catch (err) {
    console.error("Agent error:", err);
    return NextResponse.json({ error: "Agent unavailable" }, { status: 500 });
  }
}
