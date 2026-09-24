"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Leaf, MapPin } from "lucide-react";
import { UserNav } from "@/components/auth/user-nav";
import { StarRating } from "@/components/reviews/star-rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatExpiryDate, isLastChance } from "@/lib/expiry";

const userTypeLabel: Record<string, string> = {
  producer: "Produtor Local",
  restaurant: "Restaurante",
  consumer: "Consumidor",
};

export default function SellerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as Id<"profiles">;

  const seller = useQuery(api.profiles.getById, { id });
  const rating = useQuery(api.reviews.getAverageRating, { reviewedId: id });
  const reviews = useQuery(api.reviews.listByReviewedId, { reviewedId: id });
  const products = useQuery(api.products.listPublicBySeller, { sellerId: id });

  const header = (
    <header className="border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Leaf className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-primary">Direto da Terra</h1>
        </Link>
        <UserNav />
      </div>
    </header>
  );

  if (seller === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">A carregar...</div>
      </div>
    );
  }

  if (seller === null) {
    return (
      <div className="min-h-screen bg-background">
        {header}
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-2">Vendedor não encontrado</h2>
          <p className="text-muted-foreground mb-6">
            Este perfil não existe ou foi removido.
          </p>
          <Button asChild>
            <Link href="/marketplace">Ir para o Marketplace</Link>
          </Button>
        </div>
      </div>
    );
  }

  const initials =
    seller.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "V";

  return (
    <div className="min-h-screen bg-background">
      {header}

      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        {/* Profile */}
        <Card className="mb-10">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={seller.avatarUrl || undefined} alt={seller.fullName} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <h2 className="text-3xl font-bold">{seller.fullName}</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline">
                    {userTypeLabel[seller.userType] ?? seller.userType}
                  </Badge>
                  {seller.city && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {seller.city}
                    </span>
                  )}
                </div>
                {seller.bio && (
                  <p className="text-muted-foreground whitespace-pre-line">{seller.bio}</p>
                )}
              </div>
              <div className="sm:text-right">
                {rating && rating.count > 0 ? (
                  <>
                    <div className="flex items-center gap-2 sm:justify-end mb-1">
                      <StarRating value={Math.round(rating.average)} readOnly size="md" />
                      <span className="text-xl font-semibold">
                        {rating.average.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {rating.count} {rating.count === 1 ? "avaliação" : "avaliações"}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Ainda sem avaliações</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Produtos disponíveis</h3>
          {products === undefined ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted" />
                  <CardContent className="pt-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-8 text-muted-foreground">
                Nenhum produto disponível no momento.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <Link key={product._id} href={`/marketplace/products/${product._id}`}>
                  <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-muted relative">
                      {product.imageUrls.length > 0 ? (
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
                      {isLastChance(product.expiryDate) && (
                        <Badge variant="destructive" className="absolute top-2 left-2">
                          Última chance
                        </Badge>
                      )}
                      {product.originalPrice && product.originalPrice > product.price && (
                        <Badge className="absolute top-2 right-2 bg-secondary">
                          {Math.round(
                            ((product.originalPrice - product.price) / product.originalPrice) * 100
                          )}
                          % off
                        </Badge>
                      )}
                    </div>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg line-clamp-1">{product.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <span>{product.category?.icon}</span>
                        <span>{product.category?.name}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-primary">
                          R${product.price.toFixed(2)}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            R${product.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          {product.quantity} {product.unit}
                        </span>
                        {product.expiryDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatExpiryDate(product.expiryDate)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Reviews */}
        <section>
          <h3 className="text-2xl font-bold mb-6">Avaliações recentes</h3>
          {reviews === undefined ? (
            <div className="animate-pulse text-muted-foreground">A carregar...</div>
          ) : reviews.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-8 text-muted-foreground">
                Este vendedor ainda não recebeu avaliações.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.map((review) => (
                <Card key={review._id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StarRating value={review.rating} readOnly size="sm" />
                        <span className="text-sm font-medium">{review.reviewerName}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review._creationTime).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
