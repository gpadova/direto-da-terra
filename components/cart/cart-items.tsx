"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCart } from "@/hooks/use-cart"
import { Trash2, Plus, Minus } from "lucide-react"
import Link from "next/link"

export function CartItems() {
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🛒</span>
            </div>
            <h4 className="text-lg font-medium mb-2">O seu carrinho está vazio</h4>
            <p className="text-muted-foreground mb-4">Adicione alguns produtos do marketplace para começar.</p>
            <Button asChild>
              <Link href="/marketplace">Explorar Produtos</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
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

  return (
    <div className="space-y-6">
      {Object.entries(itemsBySeller).map(([sellerId, sellerItems]) => (
        <Card key={sellerId}>
          <CardHeader>
            <CardTitle className="text-lg">Pedido do Vendedor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sellerItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      R${item.price} por {item.unit}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      max={item.max_quantity}
                      value={item.quantity}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value)
                        if (value >= 1 && value <= item.max_quantity) {
                          updateQuantity(item.id, value)
                        }
                      }}
                      className="w-16 text-center"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.max_quantity}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-right">
                    <p className="font-medium">R${(item.price * item.quantity).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} {item.unit}
                    </p>
                  </div>

                  <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="font-medium">Subtotal:</span>
                <span className="font-bold text-lg">
                  R${sellerItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xl font-bold">Total:</span>
            <span className="text-2xl font-bold text-primary">R${getTotalPrice().toFixed(2)}</span>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={clearCart} className="flex-1 bg-transparent">
              Limpar Carrinho
            </Button>
            <Button asChild className="flex-1">
              <Link href="/checkout">Finalizar Compra</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
