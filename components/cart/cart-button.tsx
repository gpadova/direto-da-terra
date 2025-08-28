"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import Link from "next/link"

export function CartButton() {
  const { getTotalItems } = useCart()
  const totalItems = getTotalItems()

  return (
    <Button asChild variant="outline" className="relative bg-transparent">
      <Link href="/cart">
        <ShoppingCart className="h-4 w-4" />
        {totalItems > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
            {totalItems}
          </Badge>
        )}
      </Link>
    </Button>
  )
}
