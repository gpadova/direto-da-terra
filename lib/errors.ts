import { ConvexError } from "convex/values";

const FALLBACK = "Ocorreu um erro inesperado. Tente novamente.";

/**
 * Extracts a user-facing message from an error thrown by a Convex function.
 * Server functions throw `new ConvexError("mensagem em pt-BR")`; in production
 * Convex redacts plain `Error` messages to "Server Error", so only ConvexError
 * data is safe to show to users.
 */
export function getErrorMessage(error: unknown, fallback: string = FALLBACK): string {
  if (error instanceof ConvexError) {
    const data = error.data as unknown;
    if (typeof data === "string" && data.trim()) return data;
    if (data && typeof data === "object" && "message" in data && typeof data.message === "string") {
      return data.message;
    }
  }
  return fallback;
}
