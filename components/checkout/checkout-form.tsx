"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCart } from "@/hooks/use-cart"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface Profile {
  id: string
  full_name: string
  email: string
  phone: string | null
}

interface CheckoutFormProps {
  profile: Profile
}

export function CheckoutForm({ profile }: CheckoutFormProps) {
  const { items, getTotalPrice, clearCart } = useCart()
  const [phone, setPhone] = useState(profile.phone || "")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  if (items.length === 0) {
    router.push("/cart")
    return null
  }

  // Group items by seller
  const itemsBySeller = items.reduce(
    (acc, item) => {
      if (!acc[item.seller_id]) {
        acc[item.seller_id] = []
      }
      acc[item.seller_id].push(item)
      return acc
    },
    {} as Record<string, typeof items>,
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Create separate orders for each seller
      for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
        const orderTotal = sellerItems.reduce((total, item) => total + item.price * item.quantity, 0)

        // Create order
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            buyer_id: profile.id,
            seller_id: sellerId,
            total_amount: orderTotal,
            status: "pending",
            notes: notes,
          })
          .select()
          .single()

        if (orderError) throw orderError

        // Create order items
        const orderItems = sellerItems.map((item) => ({
          order_id: order.id,
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
        }))

        const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

        if (itemsError) throw itemsError

        // Update product quantities
        for (const item of sellerItems) {
          const { error: updateError } = await supabase
            .from("products")
            .update({
              quantity: item.max_quantity - item.quantity,
            })
            .eq("id", item.id)

          if (updateError) throw updateError
        }
      }

      // Update user phone if provided
      if (phone && phone !== profile.phone) {
        await supabase.from("profiles").update({ phone }).eq("id", profile.id)
      }

      // Clear cart and redirect
      clearCart()
      router.push("/orders?success=true")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={profile.full_name} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={profile.email} disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Order Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special instructions or notes for the sellers..."
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="w-full" size="lg">
                {isLoading ? "Processing..." : `Place Order - €${getTotalPrice().toFixed(2)}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(itemsBySeller).map(([sellerId, sellerItems]) => (
                <div key={sellerId} className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Order from Seller</h4>
                  {sellerItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.title} × {item.quantity}
                      </span>
                      <span>€{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium text-sm pt-2 border-t">
                    <span>Subtotal:</span>
                    <span>
                      €{sellerItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}

              <div className="flex justify-between font-bold text-lg pt-4 border-t">
                <span>Total:</span>
                <span className="text-primary">€{getTotalPrice().toFixed(2)}</span>
              </div>

              <div className="text-xs text-muted-foreground pt-4 border-t">
                <p>• Payment will be handled directly with each seller during pickup</p>
                <p>• You will receive pickup instructions from each seller</p>
                <p>• Orders are subject to seller confirmation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
