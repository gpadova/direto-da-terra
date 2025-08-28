"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useCart } from "@/hooks/use-cart"
import { ShoppingCart, Plus, Minus } from "lucide-react"

interface Product {
  id: string
  title: string
  price: number
  quantity: number
  unit: string
  seller_id: string
}

interface AddToCartButtonProps {
  product: Product
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1)
  const { addItem, items } = useCart()

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      quantity: quantity,
      unit: product.unit,
      seller_id: product.seller_id,
      max_quantity: product.quantity,
    })
  }

  const incrementQuantity = () => {
    if (quantity < product.quantity) {
      setQuantity(quantity + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const cartItem = items.find((item) => item.id === product.id)
  const totalInCart = cartItem ? cartItem.quantity : 0
  const availableQuantity = product.quantity - totalInCart

  if (availableQuantity <= 0) {
    return (
      <div className="space-y-4">
        <Button disabled className="w-full">
          Out of Stock
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity</Label>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={decrementQuantity} disabled={quantity <= 1}>
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            id="quantity"
            type="number"
            min="1"
            max={availableQuantity}
            value={quantity}
            onChange={(e) => {
              const value = Number.parseInt(e.target.value)
              if (value >= 1 && value <= availableQuantity) {
                setQuantity(value)
              }
            }}
            className="w-20 text-center"
          />
          <Button variant="outline" size="sm" onClick={incrementQuantity} disabled={quantity >= availableQuantity}>
            <Plus className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground ml-2">
            {availableQuantity} {product.unit} available
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-lg font-semibold">
        <span>Total:</span>
        <span className="text-primary">€{(product.price * quantity).toFixed(2)}</span>
      </div>

      <Button onClick={handleAddToCart} className="w-full" size="lg">
        <ShoppingCart className="mr-2 h-4 w-4" />
        Add to Cart
      </Button>

      {totalInCart > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          You already have {totalInCart} {product.unit} in your cart
        </p>
      )}
    </div>
  )
}
