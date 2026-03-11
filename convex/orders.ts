import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listByBuyer = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) return [];

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", profile._id))
      .order("desc")
      .collect();

    return await Promise.all(
      orders.map(async (order) => {
        const seller = await ctx.db.get(order.sellerId);
        const items = await ctx.db
          .query("orderItems")
          .withIndex("by_orderId", (q) => q.eq("orderId", order._id))
          .collect();

        const enrichedItems = await Promise.all(
          items.map(async (item) => {
            const product = await ctx.db.get(item.productId);
            return { ...item, product };
          })
        );

        return { ...order, seller, orderItems: enrichedItems };
      })
    );
  },
});

export const listBySeller = query({
  args: { sellerId: v.id("profiles") },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", args.sellerId))
      .order("desc")
      .collect();

    return await Promise.all(
      orders.map(async (order) => {
        const buyer = await ctx.db.get(order.buyerId);
        const items = await ctx.db
          .query("orderItems")
          .withIndex("by_orderId", (q) => q.eq("orderId", order._id))
          .collect();

        const enrichedItems = await Promise.all(
          items.map(async (item) => {
            const product = await ctx.db.get(item.productId);
            return { ...item, product };
          })
        );

        return { ...order, buyer, orderItems: enrichedItems };
      })
    );
  },
});

export const create = mutation({
  args: {
    sellerId: v.id("profiles"),
    totalAmount: v.float64(),
    notes: v.optional(v.string()),
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
        unitPrice: v.float64(),
        totalPrice: v.float64(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Profile not found");

    const orderId = await ctx.db.insert("orders", {
      buyerId: profile._id,
      sellerId: args.sellerId,
      totalAmount: args.totalAmount,
      status: "pending",
      notes: args.notes,
    });

    for (const item of args.items) {
      await ctx.db.insert("orderItems", {
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      });

      // Update product quantity
      const product = await ctx.db.get(item.productId);
      if (product) {
        await ctx.db.patch(item.productId, {
          quantity: product.quantity - item.quantity,
        });
      }
    }

    return orderId;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("ready"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Profile not found");

    const order = await ctx.db.get(args.id);
    if (!order || order.sellerId !== profile._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const getAnalytics = query({
  args: { sellerId: v.id("profiles") },
  handler: async (ctx, args) => {
    const completedOrders = await ctx.db
      .query("orders")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", args.sellerId))
      .collect();

    const completed = completedOrders.filter((o) => o.status === "completed");

    const totalSales = completed.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = completed.length;
    const uniqueCustomers = new Set(completed.map((o) => o.buyerId)).size;

    // Get products count
    const products = await ctx.db
      .query("products")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", args.sellerId))
      .collect();

    // Get order items for completed orders
    let foodSaved = 0;
    const productSales: Record<
      string,
      { title: string; sales: number; quantitySold: number }
    > = {};

    for (const order of completed) {
      const items = await ctx.db
        .query("orderItems")
        .withIndex("by_orderId", (q) => q.eq("orderId", order._id))
        .collect();

      for (const item of items) {
        foodSaved += item.quantity;
        const product = await ctx.db.get(item.productId);
        if (product) {
          const key = product._id;
          if (!productSales[key]) {
            productSales[key] = {
              title: product.title,
              sales: 0,
              quantitySold: 0,
            };
          }
          productSales[key].sales += item.totalPrice;
          productSales[key].quantitySold += item.quantity;
        }
      }
    }

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    return {
      totalSales,
      totalOrders,
      totalProducts: products.length,
      totalCustomers: uniqueCustomers,
      foodSaved,
      topProducts,
    };
  },
});
