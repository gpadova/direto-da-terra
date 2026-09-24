import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import {
  autoDiscountFactor,
  daysUntilExpiry,
  roundPrice,
  todayInSaoPaulo,
} from "../lib/expiry";

const BATCH_SIZE = 200;

/**
 * Computes the patch (if any) for a single product. Pure and idempotent:
 * running it again on the patched product yields no further changes.
 */
function computePatch(
  product: Doc<"products">,
  today: string
): Partial<Doc<"products">> | null {
  if (!product.isAvailable || !product.expiryDate) return null;

  const daysLeft = daysUntilExpiry(product.expiryDate, today);
  if (daysLeft < 0) return { isAvailable: false };

  if (!product.autoDiscount) return null;
  const factor = autoDiscountFactor(daysLeft);
  if (factor === null) return null;

  const basePrice = product.basePrice ?? product.price;
  const target = roundPrice(basePrice * factor);
  // Only ever mark down; never raise a price the seller (or a prior run) lowered.
  if (target <= 0 || target >= product.price) return null;

  return {
    price: target,
    basePrice,
    // Keep a reference price so the strike-through shows in the UI.
    originalPrice: Math.max(product.originalPrice ?? basePrice, basePrice),
  };
}

/**
 * Daily near-expiry pass: hides expired products and applies automatic
 * markdowns for sellers who opted in. Processes available products in
 * batches, rescheduling itself until the whole table has been scanned.
 */
export const processNearExpiry = internalMutation({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
    today: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const today = args.today ?? todayInSaoPaulo();

    const page = await ctx.db
      .query("products")
      .withIndex("by_isAvailable", (q) => q.eq("isAvailable", true))
      .paginate({ cursor: args.cursor ?? null, numItems: BATCH_SIZE });

    let expired = 0;
    let discounted = 0;
    for (const product of page.page) {
      const patch = computePatch(product, today);
      if (!patch) continue;
      await ctx.db.patch(product._id, patch);
      if (patch.isAvailable === false) expired++;
      else discounted++;
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.expiry.processNearExpiry, {
        cursor: page.continueCursor,
        today,
      });
    }

    return { today, scanned: page.page.length, expired, discounted, isDone: page.isDone };
  },
});
