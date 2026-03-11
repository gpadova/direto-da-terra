"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserNav } from "@/components/auth/user-nav";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Leaf, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CheckoutPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const profile = useQuery(api.profiles.currentProfile);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || profile === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">A carregar...</div>
      </div>
    );
  }

  if (!profile) {
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Direto da Terra</h1>
          </div>
          <UserNav />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/cart">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao carrinho
          </Link>
        </Button>

        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Finalizar compra</h2>
          <p className="text-muted-foreground">Complete seu pedido</p>
        </div>

        <CheckoutForm
          profile={{
            id: profile._id,
            full_name: profile.fullName,
            email: profile.email,
            phone: profile.phone || null,
          }}
        />
      </div>
    </div>
  );
}
