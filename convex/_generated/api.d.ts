/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as categories from "../categories.js";
import type * as crons from "../crons.js";
import type * as expiry from "../expiry.js";
import type * as http from "../http.js";
import type * as impact from "../impact.js";
import type * as lib_units from "../lib/units.js";
import type * as orders from "../orders.js";
import type * as products from "../products.js";
import type * as profiles from "../profiles.js";
import type * as reviews from "../reviews.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  categories: typeof categories;
  crons: typeof crons;
  expiry: typeof expiry;
  http: typeof http;
  impact: typeof impact;
  "lib/units": typeof lib_units;
  orders: typeof orders;
  products: typeof products;
  profiles: typeof profiles;
  reviews: typeof reviews;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
