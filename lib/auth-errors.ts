import { ConvexError } from "convex/values";

type AuthFlow = "signIn" | "signUp";

// Convex Auth throws plain Errors, which production redacts to a generic
// "Server Error". Map what we can recognise (dev messages, ConvexErrors,
// network failures) and fall back to a flow-specific message otherwise.
export function getAuthErrorMessage(err: unknown, flow: AuthFlow): string {
  if (err instanceof ConvexError) {
    return typeof err.data === "string" ? err.data : fallback(flow);
  }

  const message = err instanceof Error ? err.message : String(err);

  if (/InvalidAccountId|InvalidSecret|Invalid credentials/.test(message)) {
    return "Email ou senha incorretos";
  }
  if (/already exists/.test(message)) {
    return "Este email já está registado";
  }
  if (/TooManyFailedAttempts/.test(message)) {
    return "Demasiadas tentativas falhadas. Tente novamente mais tarde.";
  }
  if (/Invalid password/.test(message)) {
    return "A senha deve ter pelo menos 8 caracteres";
  }
  if (/Failed to fetch|NetworkError|Connection lost/i.test(message)) {
    return "Sem ligação ao servidor. Verifique a sua internet.";
  }

  return fallback(flow);
}

function fallback(flow: AuthFlow): string {
  return flow === "signIn"
    ? "Email ou senha incorretos"
    : "Não foi possível criar a conta. Este email pode já estar registado.";
}
