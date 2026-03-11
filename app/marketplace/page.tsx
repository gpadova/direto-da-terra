"use client";

import { Suspense } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/auth/user-nav";
import { Leaf, MapPin, Clock, Star } from "lucide-react";
import Link from "next/link";
import { SearchFilters } from "@/components/marketplace/search-filters";
import { useSearchParams } from "next/navigation";
import type { Id } from "@/convex/_generated/dataModel";

export default function MarketplacePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">A carregar...</div>
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}

function MarketplaceContent() {
  const searchParams = useSearchParams();

  const search = searchParams.get("search") || undefined;
  const category = searchParams.get("category") || undefined;
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const city = searchParams.get("city") || undefined;
  const sortBy = searchParams.get("sortBy") || undefined;

  const products = useQuery(api.products.listAvailable, {
    search,
    categoryId: category && category !== "all" ? (category as Id<"categories">) : undefined,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    city: city && city !== "all" ? city : undefined,
    sortBy,
  });

  const categories = useQuery(api.categories.list);
  const cities = useQuery(api.profiles.getUniqueCities);

  const filterParams = {
    search: search,
    category: category,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    city: city,
    sortBy: sortBy,
  };

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
          <h2 className="text-3xl font-bold mb-2">Mercado</h2>
          <p className="text-muted-foreground">
            Descubra ofertas de alimentos frescos de produtores e restaurantes locais
          </p>
        </div>

        <SearchFilters
          categories={categories?.map((c) => ({ id: c._id, name: c.name, icon: c.icon })) || []}
          cities={cities || []}
          searchParams={filterParams}
        />

        {products === undefined ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-square bg-muted" />
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4" />
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-muted rounded w-full mb-2" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <Card key={product._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-muted relative">
                  {product.imageUrls && product.imageUrls.length > 0 ? (
                    <img
                      src={product.imageUrls[0]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      {product.category?.icon || "📦"}
                    </div>
                  )}
                  {product.originalPrice && product.originalPrice > product.price && (
                    <Badge className="absolute top-2 right-2 bg-secondary">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% off
                    </Badge>
                  )}
                </div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">{product.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <span>{product.category?.icon}</span>
                        <span>{product.category?.name}</span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-primary">R${product.price}</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-sm text-muted-foreground line-through">R${product.originalPrice}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        {product.quantity} {product.unit}
                      </span>
                      {product.expiryDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(product.expiryDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">{product.seller?.city || "Localização não especificada"}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {product.seller?.userType === "producer" ? "🌱 Produtor" : "🍽️ Restaurante"}
                      </Badge>
                    </div>

                    {product.sellerRating && product.sellerRating.count > 0 && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{product.sellerRating.average.toFixed(1)}</span>
                        <span className="text-muted-foreground">({product.sellerRating.count})</span>
                      </div>
                    )}

                    <div className="pt-2">
                      <Button asChild className="w-full">
                        <Link href={`/marketplace/products/${product._id}`}>Ver Detalhes</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="mx-auto h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🛒</span>
                </div>
                <h4 className="text-lg font-medium mb-2">Nenhum produto encontrado</h4>
                <p className="text-muted-foreground">
                  {search || category || city
                    ? "Tente ajustar os seus filtros de pesquisa para encontrar mais produtos."
                    : "Volte mais tarde para novas listagens de produtores e restaurantes locais."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
