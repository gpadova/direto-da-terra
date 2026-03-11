import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

async function resolveImageUrls(
  ctx: QueryCtx,
  images?: Id<"_storage">[]
): Promise<string[]> {
  if (!images || images.length === 0) return [];
  const urls = await Promise.all(
    images.map((id) => ctx.storage.getUrl(id))
  );
  return urls.filter((url): url is string => url !== null);
}

export const generateUploadUrl = mutation(async (ctx) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Não autenticado");
  return await ctx.storage.generateUploadUrl();
});

export const listAvailable = query({
  args: {
    search: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    minPrice: v.optional(v.float64()),
    maxPrice: v.optional(v.float64()),
    city: v.optional(v.string()),
    sortBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let products = await ctx.db
      .query("products")
      .withIndex("by_isAvailable", (q) => q.eq("isAvailable", true))
      .collect();

    if (args.search) {
      const s = args.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(s) ||
          p.description?.toLowerCase().includes(s)
      );
    }

    if (args.categoryId) {
      products = products.filter((p) => p.categoryId === args.categoryId);
    }

    if (args.minPrice !== undefined) {
      products = products.filter((p) => p.price >= args.minPrice!);
    }

    if (args.maxPrice !== undefined) {
      products = products.filter((p) => p.price <= args.maxPrice!);
    }

    // Enrich with category, seller info, and seller rating
    const sellerRatingCache: Record<string, { average: number; count: number }> = {};
    let enriched = await Promise.all(
      products.map(async (p) => {
        const category = await ctx.db.get(p.categoryId);
        const seller = await ctx.db.get(p.sellerId);

        if (!sellerRatingCache[p.sellerId]) {
          const reviews = await ctx.db
            .query("reviews")
            .withIndex("by_reviewedId", (q) => q.eq("reviewedId", p.sellerId))
            .collect();
          if (reviews.length === 0) {
            sellerRatingCache[p.sellerId] = { average: 0, count: 0 };
          } else {
            const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
            sellerRatingCache[p.sellerId] = {
              average: sum / reviews.length,
              count: reviews.length,
            };
          }
        }

        const imageUrls = await resolveImageUrls(ctx, p.images);
        return {
          ...p,
          category,
          seller,
          sellerRating: sellerRatingCache[p.sellerId],
          imageUrls,
        };
      })
    );

    // City filter (needs seller data)
    if (args.city) {
      enriched = enriched.filter((p) => p.seller?.city === args.city);
    }

    // Sort
    switch (args.sortBy) {
      case "price_asc":
        enriched.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        enriched.sort((a, b) => b.price - a.price);
        break;
      case "expiry":
        enriched.sort((a, b) => {
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return a.expiryDate.localeCompare(b.expiryDate);
        });
        break;
      default:
        enriched.sort((a, b) => b._creationTime - a._creationTime);
    }

    return enriched.slice(0, 50);
  },
});

export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) return null;

    const category = await ctx.db.get(product.categoryId);
    const seller = await ctx.db.get(product.sellerId);
    const imageUrls = await resolveImageUrls(ctx, product.images);

    return { ...product, category, seller, imageUrls };
  },
});

export const listBySeller = query({
  args: { sellerId: v.id("profiles") },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", args.sellerId))
      .order("desc")
      .collect();

    return await Promise.all(
      products.map(async (p) => {
        const category = await ctx.db.get(p.categoryId);
        const imageUrls = await resolveImageUrls(ctx, p.images);
        return { ...p, category, imageUrls };
      })
    );
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    categoryId: v.id("categories"),
    price: v.float64(),
    originalPrice: v.optional(v.float64()),
    quantity: v.number(),
    unit: v.string(),
    expiryDate: v.optional(v.string()),
    pickupLocation: v.optional(v.string()),
    pickupInstructions: v.optional(v.string()),
    isAvailable: v.boolean(),
    images: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Profile not found");

    return await ctx.db.insert("products", {
      ...args,
      sellerId: profile._id,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    title: v.string(),
    description: v.optional(v.string()),
    categoryId: v.id("categories"),
    price: v.float64(),
    originalPrice: v.optional(v.float64()),
    quantity: v.number(),
    unit: v.string(),
    expiryDate: v.optional(v.string()),
    pickupLocation: v.optional(v.string()),
    pickupInstructions: v.optional(v.string()),
    isAvailable: v.boolean(),
    images: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Profile not found");

    const product = await ctx.db.get(args.id);
    if (!product || product.sellerId !== profile._id) {
      throw new Error("Unauthorized");
    }

    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const toggleAvailability = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Profile not found");

    const product = await ctx.db.get(args.id);
    if (!product || product.sellerId !== profile._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, { isAvailable: !product.isAvailable });
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Profile not found");

    const product = await ctx.db.get(args.id);
    if (!product || product.sellerId !== profile._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});

export const updateQuantity = mutation({
  args: {
    id: v.id("products"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { quantity: args.quantity });
  },
});
