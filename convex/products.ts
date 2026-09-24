import { ConvexError, v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { todayInSaoPaulo } from "../lib/expiry";

// Only the seller fields safe to expose publicly (no email, phone, address,
// postal code, coordinates or auth user id).
function publicSeller(seller: Doc<"profiles"> | null) {
  if (!seller) return null;
  return {
    _id: seller._id,
    fullName: seller.fullName,
    userType: seller.userType,
    city: seller.city,
    bio: seller.bio,
    avatarUrl: seller.avatarUrl,
  };
}

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

function validateProductInput(input: {
  title: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  expiryDate?: string;
}) {
  if (input.title.trim().length === 0) {
    throw new ConvexError("O título do produto é obrigatório");
  }
  if (!Number.isFinite(input.price) || input.price <= 0) {
    throw new ConvexError("O preço deve ser maior que zero");
  }
  if (!Number.isFinite(input.quantity) || input.quantity < 0) {
    throw new ConvexError("A quantidade não pode ser negativa");
  }
  if (!Number.isInteger(input.quantity)) {
    throw new ConvexError("A quantidade deve ser um número inteiro");
  }
  if (
    input.expiryDate !== undefined &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(input.expiryDate) ||
      Number.isNaN(Date.parse(`${input.expiryDate}T00:00:00Z`)))
  ) {
    throw new ConvexError("Data de validade inválida");
  }
  if (input.originalPrice !== undefined && input.originalPrice < input.price) {
    throw new ConvexError("O preço original não pode ser menor que o preço de venda");
  }
}

export const generateUploadUrl = mutation(async (ctx) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("Você precisa estar logado");
  return await ctx.storage.generateUploadUrl();
});

// Upper bound on candidate products scanned per marketplace query.
const LIST_SCAN_LIMIT = 500;
const LIST_RESULT_LIMIT = 50;

// Great-circle distance in km between two lat/lng points (haversine formula).
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function isValidCoord(lat?: number, lng?: number) {
  return (
    lat !== undefined &&
    lng !== undefined &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

export const listAvailable = query({
  args: {
    search: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    minPrice: v.optional(v.float64()),
    maxPrice: v.optional(v.float64()),
    city: v.optional(v.string()),
    sortBy: v.optional(v.string()),
    sellerType: v.optional(
      v.union(v.literal("producer"), v.literal("restaurant"))
    ),
    // Buyer location, used for "distance" sorting and the radius filter
    lat: v.optional(v.float64()),
    lng: v.optional(v.float64()),
    maxDistanceKm: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const search = args.search?.trim();
    const categoryId = args.categoryId;

    let products: Doc<"products">[];
    if (search) {
      products = await ctx.db
        .query("products")
        .withSearchIndex("search_title", (q) => {
          const base = q.search("title", search).eq("isAvailable", true);
          return categoryId ? base.eq("categoryId", categoryId) : base;
        })
        .take(LIST_SCAN_LIMIT);
    } else if (categoryId) {
      products = await ctx.db
        .query("products")
        .withIndex("by_categoryId", (q) => q.eq("categoryId", categoryId))
        .order("desc")
        .filter((q) => q.eq(q.field("isAvailable"), true))
        .take(LIST_SCAN_LIMIT);
    } else {
      products = await ctx.db
        .query("products")
        .withIndex("by_isAvailable", (q) => q.eq("isAvailable", true))
        .order("desc")
        .take(LIST_SCAN_LIMIT);
    }

    // Exclude expired or out-of-stock products, and apply price filters
    const today = todayInSaoPaulo();
    products = products.filter((p) => {
      if (p.quantity <= 0) return false;
      if (p.expiryDate && p.expiryDate.slice(0, 10) < today) return false;
      if (args.minPrice !== undefined && p.price < args.minPrice) return false;
      if (args.maxPrice !== undefined && p.price > args.maxPrice) return false;
      return true;
    });

    // Deduplicated lookups: each category / seller / rating is fetched once
    const categoryCache = new Map<Id<"categories">, Promise<Doc<"categories"> | null>>();
    const sellerCache = new Map<Id<"profiles">, Promise<Doc<"profiles"> | null>>();
    const sellerRatingCache = new Map<
      Id<"profiles">,
      Promise<{ average: number; count: number }>
    >();

    const getCategory = (id: Id<"categories">) => {
      let cached = categoryCache.get(id);
      if (!cached) {
        cached = ctx.db.get(id);
        categoryCache.set(id, cached);
      }
      return cached;
    };
    const getSeller = (id: Id<"profiles">) => {
      let cached = sellerCache.get(id);
      if (!cached) {
        cached = ctx.db.get(id);
        sellerCache.set(id, cached);
      }
      return cached;
    };
    const getSellerRating = (id: Id<"profiles">) => {
      let cached = sellerRatingCache.get(id);
      if (!cached) {
        cached = ctx.db
          .query("reviews")
          .withIndex("by_reviewedId", (q) => q.eq("reviewedId", id))
          .collect()
          .then((reviews) => {
            if (reviews.length === 0) return { average: 0, count: 0 };
            const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
            return { average: sum / reviews.length, count: reviews.length };
          });
        sellerRatingCache.set(id, cached);
      }
      return cached;
    };

    // Seller data is needed for the city / seller type filters
    let withSeller = await Promise.all(
      products.map(async (p) => ({ ...p, seller: await getSeller(p.sellerId) }))
    );

    if (args.city) {
      withSeller = withSeller.filter(
        (p) => p.seller?.city?.trim() === args.city?.trim()
      );
    }
    if (args.sellerType) {
      withSeller = withSeller.filter(
        (p) => p.seller?.userType === args.sellerType
      );
    }

    // Distance to each seller (null when either side lacks coordinates)
    const hasBuyerLocation = isValidCoord(args.lat, args.lng);
    let withDistance = withSeller.map((p) => {
      const sellerLat = p.seller?.latitude;
      const sellerLng = p.seller?.longitude;
      const distanceKm =
        hasBuyerLocation && isValidCoord(sellerLat, sellerLng)
          ? haversineKm(args.lat!, args.lng!, sellerLat!, sellerLng!)
          : null;
      return { ...p, distanceKm };
    });

    if (
      hasBuyerLocation &&
      args.maxDistanceKm !== undefined &&
      args.maxDistanceKm > 0
    ) {
      const maxKm = args.maxDistanceKm;
      withDistance = withDistance.filter(
        (p) => p.distanceKm !== null && p.distanceKm <= maxKm
      );
    }

    // Sort
    switch (args.sortBy) {
      case "price_asc":
        withDistance.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        withDistance.sort((a, b) => b.price - a.price);
        break;
      case "expiry":
        withDistance.sort((a, b) => {
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return a.expiryDate.localeCompare(b.expiryDate);
        });
        break;
      case "distance":
        // Sellers without coordinates go last; ties fall back to newest first
        withDistance.sort((a, b) => {
          if (a.distanceKm === null && b.distanceKm === null) {
            return b._creationTime - a._creationTime;
          }
          if (a.distanceKm === null) return 1;
          if (b.distanceKm === null) return -1;
          return a.distanceKm - b.distanceKm;
        });
        break;
      default:
        withDistance.sort((a, b) => b._creationTime - a._creationTime);
    }

    // Only enrich the page actually returned
    return await Promise.all(
      withDistance.slice(0, LIST_RESULT_LIMIT).map(async (p) => {
        const [category, sellerRating, imageUrls] = await Promise.all([
          getCategory(p.categoryId),
          getSellerRating(p.sellerId),
          resolveImageUrls(ctx, p.images),
        ]);
        return {
          ...p,
          // Coarsened (0.5 km steps) so exact seller coordinates can't be
          // trilaterated from arbitrary buyer positions.
          distanceKm:
            p.distanceKm === null
              ? null
              : Math.max(0.5, Math.round(p.distanceKm * 2) / 2),
          seller: publicSeller(p.seller),
          category,
          sellerRating,
          imageUrls,
        };
      })
    );
  },
});

export const getById = query({
  // v.string() (e não v.id) para que ids malformados vindos da URL retornem
  // null em vez de lançar erro de validação.
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("products", args.id);
    if (!id) return null;
    const product = await ctx.db.get(id);
    if (!product) return null;

    const category = await ctx.db.get(product.categoryId);
    const seller = await ctx.db.get(product.sellerId);
    const imageUrls = await resolveImageUrls(ctx, product.images);

    return { ...product, category, seller: publicSeller(seller), imageUrls };
  },
});

// Seller dashboard listing (includes unavailable/expired products): only the
// seller themself may read it. Public storefronts use listPublicBySeller.
export const listBySeller = query({
  args: { sellerId: v.id("profiles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile || profile._id !== args.sellerId) return [];

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
    autoDiscount: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Você precisa estar logado");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new ConvexError("Perfil não encontrado");
    if (profile.userType === "consumer") {
      throw new ConvexError("Apenas produtores e restaurantes podem cadastrar produtos");
    }

    validateProductInput(args);

    const category = await ctx.db.get(args.categoryId);
    if (!category) throw new ConvexError("Categoria não encontrada");

    return await ctx.db.insert("products", {
      ...args,
      title: args.title.trim(),
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
    autoDiscount: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Você precisa estar logado");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new ConvexError("Perfil não encontrado");

    const product = await ctx.db.get(args.id);
    if (!product || product.sellerId !== profile._id) {
      throw new ConvexError("Não autorizado");
    }

    validateProductInput(args);

    const category = await ctx.db.get(args.categoryId);
    if (!category) throw new ConvexError("Categoria não encontrada");

    const { id, ...data } = args;
    // A seller-set price becomes the new base for automatic markdowns
    const basePrice = data.price !== product.price ? undefined : product.basePrice;
    await ctx.db.patch(id, { ...data, basePrice, title: data.title.trim() });

    // Delete images removed from the product so they don't linger in storage
    const kept = new Set(data.images ?? []);
    for (const imageId of product.images ?? []) {
      if (kept.has(imageId)) continue;
      try {
        await ctx.storage.delete(imageId);
      } catch {
        // Image already deleted; nothing to do
      }
    }
  },
});

export const toggleAvailability = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Você precisa estar logado");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new ConvexError("Perfil não encontrado");

    const product = await ctx.db.get(args.id);
    if (!product || product.sellerId !== profile._id) {
      throw new ConvexError("Não autorizado");
    }

    await ctx.db.patch(args.id, { isAvailable: !product.isAvailable });
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Você precisa estar logado");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new ConvexError("Perfil não encontrado");

    const product = await ctx.db.get(args.id);
    if (!product || product.sellerId !== profile._id) {
      throw new ConvexError("Não autorizado");
    }

    await ctx.db.delete(args.id);

    // Clean up stored images so they don't linger in file storage
    for (const imageId of product.images ?? []) {
      try {
        await ctx.storage.delete(imageId);
      } catch {
        // Image already deleted; nothing to do
      }
    }
  },
});

export const updateQuantity = mutation({
  args: {
    id: v.id("products"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Você precisa estar logado");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new ConvexError("Perfil não encontrado");

    const product = await ctx.db.get(args.id);
    if (!product || product.sellerId !== profile._id) {
      throw new ConvexError("Não autorizado");
    }

    if (
      !Number.isFinite(args.quantity) ||
      args.quantity < 0 ||
      !Number.isInteger(args.quantity)
    ) {
      throw new ConvexError("A quantidade deve ser um número inteiro não negativo");
    }

    await ctx.db.patch(args.id, { quantity: args.quantity });
  },
});

// Public listing for a seller's storefront: only available, in-stock,
// non-expired products.
export const listPublicBySeller = query({
  args: { sellerId: v.string() },
  handler: async (ctx, args) => {
    const sellerId = ctx.db.normalizeId("profiles", args.sellerId);
    if (!sellerId) return [];
    const products = await ctx.db
      .query("products")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", sellerId))
      .order("desc")
      .take(LIST_SCAN_LIMIT);

    const today = todayInSaoPaulo();
    const visible = products
      .filter(
        (p) =>
          p.isAvailable &&
          p.quantity > 0 &&
          !(p.expiryDate && p.expiryDate.slice(0, 10) < today)
      )
      .slice(0, LIST_RESULT_LIMIT);

    return await Promise.all(
      visible.map(async (p) => {
        const [category, imageUrls] = await Promise.all([
          ctx.db.get(p.categoryId),
          resolveImageUrls(ctx, p.images),
        ]);
        return { ...p, category, imageUrls };
      })
    );
  },
});
