import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// 03:05 UTC = 00:05 in America/Sao_Paulo (UTC-3, no DST).
crons.daily(
  "near-expiry markdowns and expiry",
  { hourUTC: 3, minuteUTC: 5 },
  internal.expiry.processNearExpiry,
  {}
);

export default crons;
