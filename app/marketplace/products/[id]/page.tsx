"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/auth/user-nav";
import { ArrowLeft, MapPin, Clock, User, Leaf } from "lucide-react";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { StarRating } from "@/components/reviews/star-rating";
import { useParams, useRouter } from "next/navigation";
import type { Id } from "@/convex/_generated/dataModel";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as Id<"products">;

  const product = useQuery(api.products.getById, { id });
  const reviews = useQuery(
    api.reviews.listByReviewedId,
    product?.seller?._id ? { reviewedId: product.seller._id } : "skip"
  );

  if (product === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">A carregar...</div>
      </div>
    );
  }

  if (!product || !product.isAvailable) {
    router.push("/marketplace");
    return null;
  }

  const averageRating =
    reviews && reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

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
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/marketplace">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Mercado
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              {product.imageUrls && product.imageUrls.length > 0 ? (
                <img
                  src={product.imageUrls[0]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">
                  {product.category?.icon || "📦"}
                </div>
              )}
            </div>
            {product.imageUrls && product.imageUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.imageUrls.slice(1, 5).map((url, index) => (
                  <div key={index} className="aspect-square bg-muted rounded overflow-hidden">
                    <img
                      src={url}
                      alt={`${product.title} ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{product.category?.icon}</span>
                <Badge variant="secondary">{product.category?.name}</Badge>
                {product.originalPrice && product.originalPrice > product.price && (
                  <Badge className="bg-secondary">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% off
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-primary">R${product.price}</span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-xl text-muted-foreground line-through">R${product.originalPrice}</span>
                  )}
                </div>
                <div className="text-lg text-muted-foreground">
                  {product.quantity} {product.unit} disponível
                </div>
              </div>
            </div>

            {product.description && (
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {product.expiryDate && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Validade: {new Date(product.expiryDate).toLocaleDateString("pt-BR")}</span>
                </div>
              )}
              {product.pickupLocation && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{product.pickupLocation}</span>
                </div>
              )}
            </div>

            {product.pickupInstructions && (
              <div>
                <h3 className="font-semibold mb-2">Instruções de Retirada</h3>
                <p className="text-sm text-muted-foreground">{product.pickupInstructions}</p>
              </div>
            )}

            <AddToCartButton
              product={{
                id: product._id,
                title: product.title,
                price: product.price,
                quantity: product.quantity,
                unit: product.unit,
                seller_id: product.sellerId,
              }}
            />
          </div>
        </div>

        {/* Seller Info */}
        {product.seller && (
          <div className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações do Vendedor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h4 className="font-semibold">{product.seller.fullName}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {product.seller.userType === "producer" ? "Produtor Local" : "Restaurante"}
                      </Badge>
                      {product.seller.city && (
                        <span className="text-sm text-muted-foreground">{product.seller.city}</span>
                      )}
                    </div>
                    {product.seller.bio && (
                      <p className="text-sm text-muted-foreground">{product.seller.bio}</p>
                    )}
                  </div>
                  {reviews && reviews.length > 0 && (
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        <StarRating value={Math.round(averageRating)} readOnly size="sm" />
                        <span className="font-semibold">{averageRating.toFixed(1)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{reviews.length} avaliações</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <div className="mt-8">
            <h3 className="text-2xl font-bold mb-6">Avaliações Recentes</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.map((review) => (
                <Card key={review._id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StarRating value={review.rating} readOnly size="sm" />
                        <span className="text-sm font-medium">
                          {review.reviewerName}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review._creationTime).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
