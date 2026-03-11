"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ProductForm } from "@/components/products/product-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Leaf } from "lucide-react";
import { UserNav } from "@/components/auth/user-nav";

export default function NewProductPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const profile = useQuery(api.profiles.currentProfile);
  const categories = useQuery(api.categories.list);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (profile && profile.userType === "consumer") {
      router.push("/dashboard");
    }
  }, [profile, router]);

  if (isLoading || profile === undefined || categories === undefined) {
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

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Painel
            </Link>
          </Button>
          <h2 className="text-3xl font-bold mb-2">Adicionar Novo Produto</h2>
          <p className="text-muted-foreground">
            Cadastre seus alimentos excedentes para ajudar a reduzir o
            desperdício e conectar-se com compradores locais.
          </p>
        </div>

        <ProductForm
          categories={(categories || []).map((c) => ({
            id: c._id,
            name: c.name,
            icon: c.icon,
          }))}
        />
      </div>
    </div>
  );
}
