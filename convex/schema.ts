import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  profiles: defineTable({
    userId: v.string(),
    email: v.string(),
    fullName: v.string(),
    userType: v.union(
      v.literal("consumer"),
      v.literal("producer"),
      v.literal("restaurant")
    ),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_city", ["city"]),

  categories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.string(),
  }).index("by_name", ["name"]),

  products: defineTable({
    sellerId: v.id("profiles"),
    categoryId: v.id("categories"),
    title: v.string(),
    description: v.optional(v.string()),
    price: v.float64(),
    originalPrice: v.optional(v.float64()),
    quantity: v.number(),
    unit: v.string(),
    expiryDate: v.optional(v.string()),
    pickupLocation: v.optional(v.string()),
    pickupInstructions: v.optional(v.string()),
    images: v.optional(v.array(v.id("_storage"))),
    isAvailable: v.boolean(),
  })
    .index("by_sellerId", ["sellerId"])
    .index("by_categoryId", ["categoryId"])
    .index("by_isAvailable", ["isAvailable"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["isAvailable", "categoryId"],
    }),

  orders: defineTable({
    buyerId: v.id("profiles"),
    sellerId: v.id("profiles"),
    totalAmount: v.float64(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("ready"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    pickupTime: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index("by_buyerId", ["buyerId"])
    .index("by_sellerId", ["sellerId"])
    .index("by_status", ["status"]),

  orderItems: defineTable({
    orderId: v.id("orders"),
    productId: v.id("products"),
    quantity: v.number(),
    unitPrice: v.float64(),
    totalPrice: v.float64(),
  })
    .index("by_orderId", ["orderId"])
    .index("by_productId", ["productId"]),

  reviews: defineTable({
    orderId: v.id("orders"),
    reviewerId: v.id("profiles"),
    reviewedId: v.id("profiles"),
    rating: v.number(),
    comment: v.optional(v.string()),
  })
    .index("by_reviewedId", ["reviewedId"])
    .index("by_orderId", ["orderId"]),
});
