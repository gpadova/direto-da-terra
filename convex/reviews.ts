import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    orderId: v.id("orders"),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Avaliação deve ser entre 1 e 5");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Perfil não encontrado");

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Pedido não encontrado");
    if (order.buyerId !== profile._id) throw new Error("Não autorizado");
    if (order.status !== "completed") {
      throw new Error("Só é possível avaliar pedidos concluídos");
    }

    // Check for existing review
    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .first();
    if (existing && existing.reviewerId === profile._id) {
      throw new Error("Você já avaliou este pedido");
    }

    return await ctx.db.insert("reviews", {
      orderId: args.orderId,
      reviewerId: profile._id,
      reviewedId: order.sellerId,
      rating: args.rating,
      comment: args.comment,
    });
  },
});

export const getByOrderId = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reviews")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .first();
  },
});

export const getAverageRating = query({
  args: { reviewedId: v.id("profiles") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_reviewedId", (q) => q.eq("reviewedId", args.reviewedId))
      .collect();

    if (reviews.length === 0) return { average: 0, count: 0 };

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return { average: sum / reviews.length, count: reviews.length };
  },
});

export const listByReviewer = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) return [];

    const reviews = await ctx.db
      .query("reviews")
      .collect();

    return reviews
      .filter((r) => r.reviewerId === profile._id)
      .map((r) => r.orderId);
  },
});

export const listByReviewedId = query({
  args: { reviewedId: v.id("profiles") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_reviewedId", (q) => q.eq("reviewedId", args.reviewedId))
      .order("desc")
      .take(20);

    return await Promise.all(
      reviews.map(async (review) => {
        const reviewer = await ctx.db.get(review.reviewerId);
        return {
          ...review,
          reviewerName: reviewer?.fullName ?? "Usuário",
        };
      })
    );
  },
});
