"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  icon: string
}

interface ProductFormProps {
  categories: Category[]
  product?: any
  isEditing?: boolean
}

export function ProductForm({ categories, product, isEditing = false }: ProductFormProps) {
  const [title, setTitle] = useState(product?.title || "")
  const [description, setDescription] = useState(product?.description || "")
  const [categoryId, setCategoryId] = useState(product?.category_id || "")
  const [price, setPrice] = useState(product?.price?.toString() || "")
  const [originalPrice, setOriginalPrice] = useState(product?.original_price?.toString() || "")
  const [quantity, setQuantity] = useState(product?.quantity?.toString() || "")
  const [unit, setUnit] = useState(product?.unit || "")
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(
    product?.expiry_date ? new Date(product.expiry_date) : undefined,
  )
  const [pickupLocation, setPickupLocation] = useState(product?.pickup_location || "")
  const [pickupInstructions, setPickupInstructions] = useState(product?.pickup_instructions || "")
  const [isAvailable, setIsAvailable] = useState(product?.is_available ?? true)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("You must be logged in to create products")
      }

      const productData = {
        title,
        description,
        category_id: categoryId,
        price: Number.parseFloat(price),
        original_price: originalPrice ? Number.parseFloat(originalPrice) : null,
        quantity: Number.parseInt(quantity),
        unit,
        expiry_date: expiryDate ? format(expiryDate, "yyyy-MM-dd") : null,
        pickup_location: pickupLocation,
        pickup_instructions: pickupInstructions,
        is_available: isAvailable,
        seller_id: user.id,
      }

      let result
      if (isEditing && product) {
        result = await supabase.from("products").update(productData).eq("id", product.id).eq("seller_id", user.id)
      } else {
        result = await supabase.from("products").insert([productData])
      }

      if (result.error) throw result.error

      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const unitOptions = [
    { value: "kg", label: "Quilogramas (kg)" },
    { value: "g", label: "Gramas (g)" },
    { value: "pieces", label: "Peças" },
    { value: "liters", label: "Litros (L)" },
    { value: "ml", label: "Mililitros (ml)" },
    { value: "portions", label: "Porções" },
    { value: "boxes", label: "Caixas" },
    { value: "bags", label: "Sacos" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Produto" : "Adicionar Novo Produto"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Atualize as informações do seu produto"
            : "Preencha os detalhes do seu item alimentar excedente"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Produto *</Label>
              <Input
                id="title"
                placeholder="ex: Maçãs Orgânicas Frescas"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva o seu produto, o seu estado e quaisquer notas especiais..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price">Preço de Venda (€) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="originalPrice">Preço Original (€)</Label>
              <Input
                id="originalPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="unit">Unidade *</Label>
              <Select value={unit} onValueChange={setUnit} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar unidade" />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de Validade</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !expiryDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? format(expiryDate, "PPP") : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={expiryDate} onSelect={setExpiryDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickupLocation">Local de Recolha *</Label>
            <Input
              id="pickupLocation"
              placeholder="ex: Rua Principal 123, Cidade, Código Postal"
              required
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickupInstructions">Instruções de Recolha</Label>
            <Textarea
              id="pickupInstructions"
              placeholder="Quaisquer instruções especiais para recolha (ex: tocar campainha, entrada traseira, etc.)"
              rows={2}
              value={pickupInstructions}
              onChange={(e) => setPickupInstructions(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="available" checked={isAvailable} onCheckedChange={setIsAvailable} />
            <Label htmlFor="available">Disponível para compra</Label>
          </div>

          {error && (
            <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading
                ? isEditing
                  ? "Atualizando..."
                  : "Criando..."
                : isEditing
                  ? "Atualizar Produto"
                  : "Criar Produto"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
