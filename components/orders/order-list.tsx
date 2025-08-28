"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { Clock, User, Package, Phone, MessageSquare } from "lucide-react"
import { Label } from "@/components/ui/label"

interface Order {
  id: string
  buyer_id: string
  total_amount: number
  status: string
  pickup_time: string | null
  notes: string | null
  created_at: string
  updated_at: string
  profiles: {
    full_name: string
    email: string
    phone: string | null
  }
  order_items: Array<{
    id: string
    quantity: number
    unit_price: number
    total_price: number
    products: {
      title: string
      unit: string
    }
  }>
}

interface OrderListProps {
  sellerId: string
}

export function OrderList({ sellerId }: OrderListProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          profiles!orders_buyer_id_fkey (
            full_name,
            email,
            phone
          ),
          order_items (
            id,
            quantity,
            unit_price,
            total_price,
            products (
              title,
              unit
            )
          )
        `,
        )
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching orders:", error)
      } else {
        setOrders(data || [])
      }
      setLoading(false)
    }

    fetchOrders()

    // Subscribe to order updates
    const subscription = supabase
      .channel("orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `seller_id=eq.${sellerId}`,
        },
        () => {
          fetchOrders()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [sellerId, supabase])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId)
    const { error } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("seller_id", sellerId)

    if (error) {
      console.error("Error updating order status:", error)
    } else {
      setOrders(orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))
    }
    setUpdatingStatus(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "ready":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusOptions = (currentStatus: string) => {
    const allStatuses = [
      { value: "pending", label: "Pending" },
      { value: "confirmed", label: "Confirmed" },
      { value: "ready", label: "Ready for Pickup" },
      { value: "completed", label: "Completed" },
      { value: "cancelled", label: "Cancelled" },
    ]

    // Filter out invalid transitions
    switch (currentStatus) {
      case "pending":
        return allStatuses.filter((s) => ["pending", "confirmed", "cancelled"].includes(s.value))
      case "confirmed":
        return allStatuses.filter((s) => ["confirmed", "ready", "cancelled"].includes(s.value))
      case "ready":
        return allStatuses.filter((s) => ["ready", "completed", "cancelled"].includes(s.value))
      case "completed":
        return allStatuses.filter((s) => s.value === "completed")
      case "cancelled":
        return allStatuses.filter((s) => s.value === "cancelled")
      default:
        return allStatuses
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-3 bg-muted rounded w-1/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">No orders yet</h4>
            <p className="text-muted-foreground">Orders will appear here when customers purchase your products.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">Order #{order.id.slice(-8)}</CardTitle>
                <CardDescription className="flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {order.profiles.full_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </CardDescription>
              </div>
              <div className="text-right">
                <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                <p className="text-lg font-bold text-primary mt-1">€{order.total_amount.toFixed(2)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Order Items */}
            <div>
              <h4 className="font-medium mb-2">Items:</h4>
              <div className="space-y-1">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.products.title} × {item.quantity} {item.products.unit}
                    </span>
                    <span>€{item.total_price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Contact */}
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Customer Email</Label>
                <p className="text-sm">{order.profiles.email}</p>
              </div>
              {order.profiles.phone && (
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p className="text-sm flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {order.profiles.phone}
                  </p>
                </div>
              )}
            </div>

            {/* Order Notes */}
            {order.notes && (
              <div>
                <Label className="text-xs text-muted-foreground">Customer Notes</Label>
                <div className="mt-1 p-2 bg-muted rounded text-sm">
                  <MessageSquare className="h-4 w-4 inline mr-1" />
                  {order.notes}
                </div>
              </div>
            )}

            {/* Status Update */}
            <div className="flex items-center gap-4 pt-4 border-t">
              <div className="flex-1">
                <Label htmlFor={`status-${order.id}`} className="text-sm font-medium">
                  Update Status:
                </Label>
                <Select
                  value={order.status}
                  onValueChange={(value) => updateOrderStatus(order.id, value)}
                  disabled={updatingStatus === order.id}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getStatusOptions(order.status).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {updatingStatus === order.id && <div className="text-sm text-muted-foreground">Updating...</div>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
