import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexError } from "convex/values";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password({
      // ConvexError messages reach the client in production; plain Errors don't
      validatePasswordRequirements: (password) => {
        if (password.length < 8) {
          throw new ConvexError("A senha deve ter pelo menos 8 caracteres");
        }
      },
    }),
  ],
});
