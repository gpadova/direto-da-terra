"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { BarChart3, Package, Euro, TrendingUp, Users, Leaf } from "lucide-react"

interface AnalyticsData {
  totalSales: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  foodSaved: number
  recentSales: Array<{
    date: string
    amount: number
  }>
  topProducts: Array<{
    title: string
    sales: number
    quantity_sold: number
  }>
}

interface SellerAnalyticsProps {
  sellerId: string
}

export function SellerAnalytics({ sellerId }: SellerAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Get total sales and orders
        const { data: orders } = await supabase
          .from("orders")
          .select("total_amount, created_at, buyer_id")
          .eq("seller_id", sellerId)
          .eq("status", "completed")

        // Get total products
        const { data: products } = await supabase.from("products").select("id, title").eq("seller_id", sellerId)

        // Get order items for product analytics
        const { data: orderItems } = await supabase
          .from("order_items")
          .select(
            `
            quantity,
            total_price,
            products (
              title,
              seller_id
            ),
            orders!inner (
              seller_id,
              status
            )
          `,
          )
          .eq("orders.seller_id", sellerId)
          .eq("orders.status", "completed")

        const totalSales = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0
        const totalOrders = orders?.length || 0
        const totalProducts = products?.length || 0
        const uniqueCustomers = new Set(orders?.map((order) => order.buyer_id)).size
        const foodSaved = orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0

        // Calculate recent sales (last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const recentSales =
          orders
            ?.filter((order) => new Date(order.created_at) >= sevenDaysAgo)
            .reduce(
              (acc, order) => {
                const date = new Date(order.created_at).toLocaleDateString()
                const existing = acc.find((item) => item.date === date)
                if (existing) {
                  existing.amount += order.total_amount
                } else {
                  acc.push({ date, amount: order.total_amount })
                }
                return acc
              },
              [] as Array<{ date: string; amount: number }>,
            ) || []

        // Calculate top products
        const productSales =
          orderItems?.reduce(
            (acc, item) => {
              if (item.products) {
                const title = item.products.title
                if (!acc[title]) {
                  acc[title] = { sales: 0, quantity_sold: 0 }
                }
                acc[title].sales += item.total_price
                acc[title].quantity_sold += item.quantity
              }
              return acc
            },
            {} as Record<string, { sales: number; quantity_sold: number }>,
          ) || {}

        const topProducts = Object.entries(productSales)
          .map(([title, data]) => ({ title, ...data }))
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 5)

        setAnalytics({
          totalSales,
          totalOrders,
          totalProducts,
          totalCustomers: uniqueCustomers,
          foodSaved,
          recentSales,
          topProducts,
        })
      } catch (error) {
        console.error("Error fetching analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [sellerId, supabase])

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">No analytics data</h4>
            <p className="text-muted-foreground">Start selling to see your analytics.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">€{analytics.totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products Listed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Active listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Unique buyers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Food Saved</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{analytics.foodSaved}</div>
            <p className="text-xs text-muted-foreground">Items sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{analytics.totalOrders > 0 ? (analytics.totalSales / analytics.totalOrders).toFixed(2) : "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Per completed order</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      {analytics.topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Your best performing items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topProducts.map((product, index) => (
                <div key={product.title} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{product.title}</p>
                      <p className="text-sm text-muted-foreground">{product.quantity_sold} items sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-primary">€{product.sales.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
