import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/auth/user-nav"
import { Leaf, MapPin, Clock } from "lucide-react"
import Link from "next/link"
import { SearchFilters } from "@/components/marketplace/search-filters"

interface SearchParams {
  search?: string
  category?: string
  userType?: string
  minPrice?: string
  maxPrice?: string
  city?: string
  sortBy?: string
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createClient()

  // Build query based on search params
  let query = supabase
    .from("products")
    .select(
      `
      *,
      categories (
        name,
        icon
      ),
      profiles (
        full_name,
        user_type,
        city
      )
    `,
    )
    .eq("is_available", true)

  // Apply filters
  if (searchParams.search) {
    query = query.or(`title.ilike.%${searchParams.search}%,description.ilike.%${searchParams.search}%`)
  }

  if (searchParams.category) {
    query = query.eq("category_id", searchParams.category)
  }

  if (searchParams.minPrice) {
    query = query.gte("price", Number.parseFloat(searchParams.minPrice))
  }

  if (searchParams.maxPrice) {
    query = query.lte("price", Number.parseFloat(searchParams.maxPrice))
  }

  if (searchParams.city) {
    query = query.eq("profiles.city", searchParams.city)
  }

  // Apply sorting
  switch (searchParams.sortBy) {
    case "price_asc":
      query = query.order("price", { ascending: true })
      break
    case "price_desc":
      query = query.order("price", { ascending: false })
      break
    case "expiry":
      query = query.order("expiry_date", { ascending: true })
      break
    default:
      query = query.order("created_at", { ascending: false })
  }

  const { data: products } = await query.limit(50)

  // Get categories for filter dropdown
  const { data: categories } = await supabase.from("categories").select("*").order("name")

  // Get unique cities for location filter
  const { data: cities } = await supabase.from("profiles").select("city").not("city", "is", null).order("city")

  const uniqueCities = Array.from(new Set(cities?.map((c) => c.city).filter(Boolean))) as string[]

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
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Marketplace</h2>
          <p className="text-muted-foreground">
            Descubra ofertas de alimentos frescos de produtores e restaurantes locais
          </p>
        </div>

        <SearchFilters categories={categories || []} cities={uniqueCities} searchParams={searchParams} />

        {/* Products Grid */}
        {products && products.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-muted relative">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0] || "/placeholder.svg"}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      {product.categories?.icon || "📦"}
                    </div>
                  )}
                  {product.original_price && product.original_price > product.price && (
                    <Badge className="absolute top-2 right-2 bg-secondary">
                      {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% off
                    </Badge>
                  )}
                </div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">{product.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <span>{product.categories?.icon}</span>
                        <span>{product.categories?.name}</span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-primary">€{product.price}</span>
                        {product.original_price && product.original_price > product.price && (
                          <span className="text-sm text-muted-foreground line-through">€{product.original_price}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        {product.quantity} {product.unit}
                      </span>
                      {product.expiry_date && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(product.expiry_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">{product.profiles?.city || "Location not specified"}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {product.profiles?.user_type === "producer" ? "🌱 Producer" : "🍽️ Restaurant"}
                      </Badge>
                    </div>

                    <div className="pt-2">
                      <Button asChild className="w-full">
                        <Link href={`/marketplace/products/${product.id}`}>Ver Detalhes</Link>
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
                  {searchParams.search || searchParams.category || searchParams.city
                    ? "Tente ajustar os seus filtros de pesquisa para encontrar mais produtos."
                    : "Volte mais tarde para novas listagens de produtores e restaurantes locais."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
