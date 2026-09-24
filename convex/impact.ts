import { query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { kgFactorForUnit } from "./lib/units";

// Indicadores públicos de impacto da plataforma (página /impact).
//
// TODO: esta query varre pedidos concluídos, itens e perfis a cada leitura.
// Serve bem para o volume atual, mas conforme os dados crescerem deve migrar
// para uma tabela de agregados (ex.: `platformStats`) atualizada nas
// mutations de pedidos/produtos/perfis, ou para o componente
// @convex-dev/aggregate.
export const getPlatformImpact = query({
  args: {},
  handler: async (ctx) => {
    const completedOrders = await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .collect();

    const productCache = new Map<Id<"products">, Doc<"products"> | null>();
    const getProduct = async (id: Id<"products">) => {
      if (!productCache.has(id)) {
        productCache.set(id, await ctx.db.get(id));
      }
      return productCache.get(id) ?? null;
    };

    let foodSavedKg = 0;
    let itemsSaved = 0;
    let moneySaved = 0;
    const buyers = new Set<Id<"profiles">>();

    for (const order of completedOrders) {
      buyers.add(order.buyerId);

      const items = await ctx.db
        .query("orderItems")
        .withIndex("by_orderId", (q) => q.eq("orderId", order._id))
        .collect();

      for (const item of items) {
        const product = await getProduct(item.productId);
        const kgFactor = kgFactorForUnit(product?.unit);
        if (kgFactor !== undefined) {
          foodSavedKg += item.quantity * kgFactor;
        } else {
          itemsSaved += item.quantity;
        }

        const originalPrice = product?.originalPrice;
        if (originalPrice !== undefined && originalPrice > item.unitPrice) {
          moneySaved += (originalPrice - item.unitPrice) * item.quantity;
        }
      }
    }

    // Vendedores e cidades ativas: perfis de produtores/restaurantes;
    // uma cidade conta como ativa quando algum vendedor dela tem produtos.
    const profiles = await ctx.db.query("profiles").collect();
    let producers = 0;
    let restaurants = 0;
    const activeCities = new Set<string>();

    for (const profile of profiles) {
      if (profile.userType === "consumer") continue;
      if (profile.userType === "producer") producers++;
      else restaurants++;

      const city = profile.city?.trim();
      if (!city) continue;
      const cityKey = city.toLocaleLowerCase("pt-BR");
      if (activeCities.has(cityKey)) continue;

      const hasProduct = await ctx.db
        .query("products")
        .withIndex("by_sellerId", (q) => q.eq("sellerId", profile._id))
        .first();
      if (hasProduct) activeCities.add(cityKey);
    }

    return {
      foodSavedKg: Math.round(foodSavedKg * 100) / 100,
      itemsSaved,
      familiesServed: buyers.size,
      activeCities: activeCities.size,
      producers,
      restaurants,
      moneySaved: Math.round(moneySaved * 100) / 100,
      completedOrders: completedOrders.length,
    };
  },
});
