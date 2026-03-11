import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});

export const seed = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("categories").first();
    if (existing) return;

    const defaults = [
      { name: "Bakery", icon: "🍞", description: "Bread, pastries, and baked goods" },
      { name: "Dairy", icon: "🧀", description: "Milk, cheese, yogurt, and dairy products" },
      { name: "Fruits", icon: "🍎", description: "Fresh fruits and berries" },
      { name: "Meat", icon: "🥩", description: "Fresh meat and poultry" },
      { name: "Pantry", icon: "🫙", description: "Pantry staples and dry goods" },
      { name: "Prepared Foods", icon: "🍲", description: "Ready-to-eat meals and prepared dishes" },
      { name: "Seafood", icon: "🐟", description: "Fresh fish and seafood" },
      { name: "Vegetables", icon: "🥬", description: "Fresh vegetables and greens" },
    ];

    for (const cat of defaults) {
      await ctx.db.insert("categories", cat);
    }
  },
});
