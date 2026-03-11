"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CartButton } from "@/components/cart/cart-button";
import { useRouter } from "next/navigation";
import { LogOut, Settings, UserIcon } from "lucide-react";

export function UserNav() {
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.profiles.currentProfile);
  const router = useRouter();
  const { signOut } = useAuthActions();

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  if (!isAuthenticated || !profile) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="outline">
          <a href="/auth/login">Entrar</a>
        </Button>
        <Button asChild>
          <a href="/auth/signup">Registar-se</a>
        </Button>
      </div>
    );
  }

  const initials =
    profile.fullName
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() ||
    profile.email?.[0].toUpperCase() ||
    "U";

  return (
    <div className="flex items-center gap-2">
      <CartButton />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={profile.avatarUrl || "/placeholder.svg"}
                alt={profile.fullName}
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {profile.fullName || "Usuário"}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {profile.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/dashboard")}>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Painel</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/orders")}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Meus Pedidos</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
