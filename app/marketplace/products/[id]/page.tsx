import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/auth/user-nav"
import { ArrowLeft, MapPin, Clock, User, Star } from "lucide-react"
import Link from "next/link"
import { AddToCartButton } from "@/components/cart/add-to-cart-button"
import { Leaf } from "lucide-react"

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Get product with seller and category info
  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
      *,
      categories (
        name,
        icon
      ),
      profiles (
        id,
        full_name,
        user_type,
        city,
        bio
      )
    `,
    )
    .eq("id", id)
    .eq("is_available", true)
    .single()

  if (error || !product) {
    redirect("/marketplace")
  }

  // Get seller reviews
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, comment, created_at")
    .eq("reviewed_id", product.profiles.id)
    .order("created_at", { ascending: false })
    .limit(5)

  const averageRating = reviews?.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
            Back to Marketplace
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0] || "/placeholder.svg"}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">
                  {product.categories?.icon || "📦"}
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1, 5).map((image, index) => (
                  <div key={index} className="aspect-square bg-muted rounded overflow-hidden">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`${product.title} ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{product.categories?.icon}</span>
                <Badge variant="secondary">{product.categories?.name}</Badge>
                {product.original_price && product.original_price > product.price && (
                  <Badge className="bg-secondary">
                    {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% off
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-primary">€{product.price}</span>
                  {product.original_price && product.original_price > product.price && (
                    <span className="text-xl text-muted-foreground line-through">€{product.original_price}</span>
                  )}
                </div>
                <div className="text-lg text-muted-foreground">
                  {product.quantity} {product.unit} available
                </div>
              </div>
            </div>

            {product.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {product.expiry_date && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Expires: {new Date(product.expiry_date).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{product.pickup_location}</span>
              </div>
            </div>

            {product.pickup_instructions && (
              <div>
                <h3 className="font-semibold mb-2">Pickup Instructions</h3>
                <p className="text-sm text-muted-foreground">{product.pickup_instructions}</p>
              </div>
            )}

            <AddToCartButton product={product} />
          </div>
        </div>

        {/* Seller Info */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Seller Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h4 className="font-semibold">{product.profiles.full_name}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {product.profiles.user_type === "producer" ? "Local Producer" : "Restaurant"}
                    </Badge>
                    {product.profiles.city && (
                      <span className="text-sm text-muted-foreground">{product.profiles.city}</span>
                    )}
                  </div>
                  {product.profiles.bio && <p className="text-sm text-muted-foreground">{product.profiles.bio}</p>}
                </div>
                {reviews && reviews.length > 0 && (
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{averageRating.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{reviews.length} reviews</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <div className="mt-8">
            <h3 className="text-2xl font-bold mb-6">Recent Reviews</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.map((review, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && <p className="text-sm">{review.comment}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
