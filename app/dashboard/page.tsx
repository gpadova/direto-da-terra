"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserNav } from "@/components/auth/user-nav";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Plus, ShoppingBag, BarChart3, Leaf } from "lucide-react";
import { ProductList } from "@/components/products/product-list";
import { OrderList } from "@/components/orders/order-list";
import { SellerAnalytics } from "@/components/analytics/seller-analytics";

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const profile = useQuery(api.profiles.currentProfile);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">A carregar...</div>
      </div>
    );
  }

  if (profile === undefined) {
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

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Bem-vindo de volta, {profile.fullName || "Usuário"}!
          </h2>
          <p className="text-muted-foreground">
            {profile.userType === "producer" &&
              "Gerencie seus anúncios de produtos e conecte-se com compradores locais."}
            {profile.userType === "restaurant" &&
              "Gerencie suas ofertas de alimentos excedentes e reduza o desperdício."}
            {profile.userType === "consumer" &&
              "Descubra ofertas de alimentos frescos de produtores e restaurantes locais."}
          </p>
        </div>

        {profile.userType === "consumer" ? (
          <div className="grid gap-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pedidos Recentes
                  </CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">
                    Nenhum pedido ainda
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Dinheiro Economizado
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$0</div>
                  <p className="text-xs text-muted-foreground">
                    Comece a comprar para economizar!
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Alimento Salvo
                  </CardTitle>
                  <Leaf className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0 kg</div>
                  <p className="text-xs text-muted-foreground">
                    Ajude a reduzir o desperdício!
                  </p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Explorar o Mercado</CardTitle>
                <CardDescription>
                  Descubra ofertas de alimentos frescos de produtores e
                  restaurantes locais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/marketplace">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Ver Produtos
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Tabs defaultValue="products" className="space-y-6">
            <TabsList>
              <TabsTrigger value="products">Meus Produtos</TabsTrigger>
              <TabsTrigger value="orders">Pedidos</TabsTrigger>
              <TabsTrigger value="analytics">Análises</TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Meus Produtos</h3>
                  <p className="text-muted-foreground">
                    Gerencie seus anúncios de alimentos
                  </p>
                </div>
                <Button asChild>
                  <Link href="/dashboard/products/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Produto
                  </Link>
                </Button>
              </div>
              <ProductList sellerId={profile._id} />
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold">Pedidos</h3>
                <p className="text-muted-foreground">
                  Gerencie pedidos recebidos e atualize seu status
                </p>
              </div>
              <OrderList sellerId={profile._id} />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold">Análises</h3>
                <p className="text-muted-foreground">
                  Acompanhe o desempenho das suas vendas e impacto
                </p>
              </div>
              <SellerAnalytics sellerId={profile._id} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
