import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  MAX_PICKUP_DAYS_AHEAD,
  PICKUP_WINDOWS,
  addDays,
  nowTimeInSaoPaulo,
  parsePickupTime,
} from "../lib/pickup";
import { todayInSaoPaulo } from "../lib/expiry";
import { kgFactorForUnit } from "./lib/units";

type OrderStatus = Doc<"orders">["status"];

async function getCurrentProfile(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  return await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
}

// Data de hoje (YYYY-MM-DD) no fuso de Brasília.
const todayInBrazil = todayInSaoPaulo;

const MAX_NOTES_LENGTH = 1000;

// Transições de status permitidas ao vendedor.
const SELLER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

// Devolve ao estoque os itens de um pedido cancelado.
async function restoreStock(ctx: MutationCtx, orderId: Id<"orders">) {
  const items = await ctx.db
    .query("orderItems")
    .withIndex("by_orderId", (q) => q.eq("orderId", orderId))
    .collect();

  for (const item of items) {
    const product = await ctx.db.get(item.productId);
    if (!product) continue;
    // Se o estoque estava zerado e o produto indisponível, ele foi
    // desativado automaticamente pela venda: reativa (se não vencido).
    const wasAutoDisabled = product.quantity <= 0 && !product.isAvailable;
    const expired =
      !!product.expiryDate && product.expiryDate.slice(0, 10) < todayInBrazil();
    await ctx.db.patch(product._id, {
      quantity: product.quantity + item.quantity,
      ...(wasAutoDisabled && !expired ? { isAvailable: true } : {}),
    });
  }
}


export const listByBuyer = query({
  handler: async (ctx) => {
    const profile = await getCurrentProfile(ctx);
    if (!profile) return [];

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", profile._id))
      .order("desc")
      .collect();

    return await Promise.all(
      orders.map(async (order) => {
        const sellerProfile = await ctx.db.get(order.sellerId);
        // Contato do vendedor para a retirada; sem coordenadas nem userId.
        const seller = sellerProfile
          ? {
              _id: sellerProfile._id,
              fullName: sellerProfile.fullName,
              userType: sellerProfile.userType,
              phone: sellerProfile.phone,
              email: sellerProfile.email,
              address: sellerProfile.address,
              city: sellerProfile.city,
            }
          : null;
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
  handler: async (ctx) => {
    const profile = await getCurrentProfile(ctx);
    if (!profile) return [];

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", profile._id))
      .order("desc")
      .collect();

    return await Promise.all(
      orders.map(async (order) => {
        const buyerProfile = await ctx.db.get(order.buyerId);
        const buyer = buyerProfile
          ? {
              fullName: buyerProfile.fullName,
              phone: buyerProfile.phone,
              email: buyerProfile.email,
            }
          : null;
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

// Datas de validade dos produtos do carrinho, para limitar a escolha da data
// de retirada no checkout (a validação definitiva acontece em `create`).
export const pickupLimits = query({
  args: { productIds: v.array(v.id("products")) },
  handler: async (ctx, args) => {
    const ids = args.productIds.slice(0, 100);
    return await Promise.all(
      ids.map(async (id) => {
        const product = await ctx.db.get(id);
        return { productId: id, expiryDate: product?.expiryDate ?? null };
      })
    );
  },
});

export const create = mutation({
  args: {
    sellerId: v.id("profiles"),
    notes: v.optional(v.string()),
    pickupTime: v.string(),
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
        // Preço exibido ao comprador; se o preço atual for maior, o pedido é recusado.
        expectedUnitPrice: v.optional(v.float64()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Perfil não encontrado");

    if (profile._id === args.sellerId) {
      throw new Error("Você não pode comprar seus próprios produtos");
    }
    if (args.items.length === 0) {
      throw new Error("O pedido deve conter pelo menos um item");
    }
    if (args.items.length > 100) {
      throw new Error("O pedido tem itens demais");
    }
    const notes = args.notes?.trim() || undefined;
    if (notes && notes.length > MAX_NOTES_LENGTH) {
      throw new Error(
        `As observações devem ter no máximo ${MAX_NOTES_LENGTH} caracteres`
      );
    }

    const seller = await ctx.db.get(args.sellerId);
    if (!seller || seller.userType === "consumer") {
      throw new Error("Vendedor não encontrado");
    }

    const today = todayInBrazil();

    // Horário de retirada: "yyyy-MM-dd HH:mm-HH:mm" (horário de Brasília).
    const pickup = parsePickupTime(args.pickupTime);
    if (!pickup) {
      throw new Error("Escolha uma data e um horário de retirada");
    }
    if (!(PICKUP_WINDOWS as readonly string[]).includes(pickup.window)) {
      throw new Error("Faixa de horário de retirada inválida");
    }
    if (
      pickup.date < today ||
      (pickup.date === today && pickup.end <= nowTimeInSaoPaulo())
    ) {
      throw new Error("O horário de retirada escolhido já passou");
    }
    if (pickup.date > addDays(today, MAX_PICKUP_DAYS_AHEAD)) {
      throw new Error(
        `A retirada deve ser agendada em até ${MAX_PICKUP_DAYS_AHEAD} dias`
      );
    }

    // Agrupa quantidades por produto (caso o mesmo produto venha repetido).
    const requested = new Map<Id<"products">, number>();
    const expectedPrice = new Map<Id<"products">, number>();
    for (const item of args.items) {
      if (
        !Number.isFinite(item.quantity) ||
        item.quantity <= 0 ||
        !Number.isInteger(item.quantity)
      ) {
        throw new Error("Quantidade inválida");
      }
      requested.set(
        item.productId,
        (requested.get(item.productId) ?? 0) + item.quantity
      );
      if (item.expectedUnitPrice !== undefined) {
        const prev = expectedPrice.get(item.productId);
        expectedPrice.set(
          item.productId,
          prev === undefined
            ? item.expectedUnitPrice
            : Math.min(prev, item.expectedUnitPrice)
        );
      }
    }

    // Valida tudo antes de qualquer escrita.
    const lines: {
      product: Doc<"products">;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }[] = [];
    for (const [productId, quantity] of requested) {
      const product = await ctx.db.get(productId);
      if (!product) throw new Error("Produto não encontrado");
      if (product.sellerId !== args.sellerId) {
        throw new Error(
          `O produto "${product.title}" não pertence a este vendedor`
        );
      }
      if (!product.isAvailable) {
        throw new Error(`O produto "${product.title}" não está disponível`);
      }
      if (product.expiryDate && product.expiryDate.slice(0, 10) < today) {
        throw new Error(`O produto "${product.title}" está vencido`);
      }
      if (product.expiryDate && pickup.date > product.expiryDate.slice(0, 10)) {
        throw new Error(
          `A retirada deve ser até a validade de "${product.title}" (${product.expiryDate
            .slice(0, 10)
            .split("-")
            .reverse()
            .join("/")})`
        );
      }
      if (quantity > product.quantity) {
        throw new Error(
          `Estoque insuficiente para "${product.title}" (disponível: ${product.quantity} ${product.unit})`
        );
      }
      const expected = expectedPrice.get(productId);
      if (expected !== undefined && product.price > expected + 0.005) {
        throw new Error(
          `O preço de "${product.title}" mudou para R$${product.price.toFixed(2)}. Atualize o carrinho e tente novamente.`
        );
      }
      const unitPrice = product.price;
      const totalPrice = Math.round(unitPrice * quantity * 100) / 100;
      lines.push({ product, quantity, unitPrice, totalPrice });
    }

    const totalAmount =
      Math.round(lines.reduce((sum, l) => sum + l.totalPrice, 0) * 100) / 100;

    const orderId = await ctx.db.insert("orders", {
      buyerId: profile._id,
      sellerId: args.sellerId,
      totalAmount,
      status: "pending",
      pickupTime: `${pickup.date} ${pickup.window}`,
      notes,
    });

    for (const line of lines) {
      await ctx.db.insert("orderItems", {
        orderId,
        productId: line.product._id,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        totalPrice: line.totalPrice,
      });

      const remaining = line.product.quantity - line.quantity;
      await ctx.db.patch(line.product._id, {
        quantity: remaining,
        ...(remaining <= 0 ? { isAvailable: false } : {}),
      });
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
    const profile = await getCurrentProfile(ctx);
    if (!profile) throw new Error("Não autenticado");

    const order = await ctx.db.get(args.id);
    if (!order || order.sellerId !== profile._id) {
      throw new Error("Não autorizado");
    }

    if (order.status === args.status) return;

    if (!SELLER_TRANSITIONS[order.status].includes(args.status)) {
      throw new Error("Transição de status inválida");
    }

    await ctx.db.patch(args.id, { status: args.status });

    if (args.status === "cancelled") {
      await restoreStock(ctx, order._id);
    }
  },
});

export const cancel = mutation({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const profile = await getCurrentProfile(ctx);
    if (!profile) throw new Error("Não autenticado");

    const order = await ctx.db.get(args.id);
    if (!order || order.buyerId !== profile._id) {
      throw new Error("Não autorizado");
    }
    if (order.status !== "pending") {
      throw new Error("Só é possível cancelar pedidos pendentes");
    }

    await ctx.db.patch(args.id, { status: "cancelled" });
    await restoreStock(ctx, order._id);
  },
});

export const getAnalytics = query({
  handler: async (ctx) => {
    const profile = await getCurrentProfile(ctx);
    if (!profile) return null;
    const sellerId = profile._id;

    const sellerOrders = await ctx.db
      .query("orders")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", sellerId))
      .collect();

    const completed = sellerOrders.filter((o) => o.status === "completed");

    const totalSales = completed.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = completed.length;
    const uniqueCustomers = new Set(completed.map((o) => o.buyerId)).size;

    const products = await ctx.db
      .query("products")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", sellerId))
      .collect();

    // Alimento salvo: unidades de peso convertidas para kg; demais
    // unidades (peças, porções, litros, caixas...) contadas como itens.
    let foodSavedKg = 0;
    let itemsSaved = 0;
    const productSales: Record<
      string,
      { title: string; unit: string; sales: number; quantitySold: number }
    > = {};

    for (const order of completed) {
      const items = await ctx.db
        .query("orderItems")
        .withIndex("by_orderId", (q) => q.eq("orderId", order._id))
        .collect();

      for (const item of items) {
        const product = await ctx.db.get(item.productId);
        const kgFactor = kgFactorForUnit(product?.unit);
        if (kgFactor !== undefined) {
          foodSavedKg += item.quantity * kgFactor;
        } else {
          itemsSaved += item.quantity;
        }

        if (product) {
          const key = product._id;
          if (!productSales[key]) {
            productSales[key] = {
              title: product.title,
              unit: product.unit,
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
      foodSavedKg: Math.round(foodSavedKg * 100) / 100,
      itemsSaved,
      topProducts,
    };
  },
});
