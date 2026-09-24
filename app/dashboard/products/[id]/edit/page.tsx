"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Leaf } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ProductForm } from "@/components/products/product-form";
import { UserNav } from "@/components/auth/user-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">A carregar...</div>
    </div>
  );
}

function EditProductContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as Id<"products">;

  const profile = useQuery(api.profiles.currentProfile);
  const product = useQuery(api.products.getById, { id });
  const categories = useQuery(api.categories.list);

  const isOwner = !!profile && !!product && product.sellerId === profile._id;

  useEffect(() => {
    if (profile === null) {
      router.push("/auth/login");
    }
  }, [profile, router]);

  if (profile === undefined || product === undefined || categories === undefined) {
    return <Loading />;
  }

  if (!profile) {
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
          <h2 className="text-3xl font-bold mb-2">Editar Produto</h2>
          <p className="text-muted-foreground">
            Atualize preço, quantidade e validade para manter o seu anúncio em dia.
          </p>
        </div>

        {!product || !isOwner ? (
          <Card>
            <CardContent className="pt-6 text-center py-8">
              <h4 className="text-lg font-medium mb-2">
                {!product ? "Produto não encontrado" : "Acesso negado"}
              </h4>
              <p className="text-muted-foreground mb-4">
                {!product
                  ? "Este produto não existe ou foi removido."
                  : "Apenas o vendedor deste produto pode editá-lo."}
              </p>
              <Button asChild>
                <Link href="/dashboard">Voltar ao Painel</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ProductForm
            isEditing
            product={product}
            categories={categories.map((c) => ({
              id: c._id,
              name: c.name,
              icon: c.icon,
            }))}
          />
        )}
      </div>
    </div>
  );
}

export default function EditProductPage() {
  return (
    <AuthGuard>
      <EditProductContent />
    </AuthGuard>
  );
}
