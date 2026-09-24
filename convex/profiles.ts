import { ConvexError, v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const currentProfile = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const getById = query({
  // v.string() (e não v.id) para que ids malformados vindos da URL retornem
  // null em vez de lançar erro de validação.
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("profiles", args.id);
    if (!id) return null;
    const profile = await ctx.db.get(id);
    // Página pública apenas para vendedores; consumidores não são expostos.
    if (!profile || profile.userType === "consumer") return null;
    // Apenas campos públicos: sem email, telefone, endereço ou coordenadas.
    return {
      _id: profile._id,
      fullName: profile.fullName,
      userType: profile.userType,
      city: profile.city,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
    };
  },
});

export const createProfile = mutation({
  args: {
    email: v.string(),
    fullName: v.string(),
    userType: v.union(
      v.literal("consumer"),
      v.literal("producer"),
      v.literal("restaurant")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Você precisa estar logado");

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) return existing._id;

    // Usa o email da conta autenticada (não confia no enviado pelo cliente).
    const user = await ctx.db.get(userId);
    const fullName = args.fullName.trim();
    if (!fullName) throw new ConvexError("O nome é obrigatório");

    return await ctx.db.insert("profiles", {
      userId,
      email: user?.email ?? args.email,
      fullName,
      userType: args.userType,
    });
  },
});

export const updateProfile = mutation({
  args: {
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Você precisa estar logado");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new ConvexError("Perfil não encontrado");

    const { latitude, longitude } = args;
    if ((latitude === undefined) !== (longitude === undefined)) {
      throw new ConvexError("Localização incompleta");
    }
    if (
      latitude !== undefined &&
      longitude !== undefined &&
      (!Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        Math.abs(latitude) > 90 ||
        Math.abs(longitude) > 180)
    ) {
      throw new ConvexError("Localização inválida");
    }
    if (args.avatarUrl && !/^https?:\/\//i.test(args.avatarUrl)) {
      throw new ConvexError("URL da foto inválida");
    }
    for (const [key, value] of Object.entries(args)) {
      if (typeof value === "string" && value.length > 2000) {
        throw new ConvexError(`Campo "${key}" muito longo`);
      }
    }

    await ctx.db.patch(profile._id, args);
  },
});

export const getUniqueCities = query({
  handler: async (ctx) => {
    // Apenas cidades de vendedores (não expõe onde moram os consumidores).
    const profiles = await ctx.db.query("profiles").collect();
    const cities = [
      ...new Set(
        profiles
          .filter((p) => p.userType !== "consumer")
          .map((p) => p.city?.trim())
          .filter(Boolean)
      ),
    ] as string[];
    return cities.sort();
  },
});
