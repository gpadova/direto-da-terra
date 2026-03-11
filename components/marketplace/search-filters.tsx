"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Search, X, SlidersHorizontal } from "lucide-react"

interface Category {
  id: string
  name: string
  icon: string
}

interface SearchFiltersProps {
  categories: Category[]
  cities: string[]
  searchParams: {
    search?: string
    category?: string
    userType?: string
    minPrice?: string
    maxPrice?: string
    city?: string
    sortBy?: string
  }
}

export function SearchFilters({ categories, cities, searchParams }: SearchFiltersProps) {
  const router = useRouter()
  const currentSearchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(searchParams.search || "")
  const [minPrice, setMinPrice] = useState(searchParams.minPrice || "")
  const [maxPrice, setMaxPrice] = useState(searchParams.maxPrice || "")

  const updateSearchParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(currentSearchParams.toString())

    if (value && value !== "") {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    router.push(`/marketplace?${params.toString()}`)
  }

  const handleSearch = () => {
    updateSearchParams("search", searchValue)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const applyPriceFilter = () => {
    const params = new URLSearchParams(currentSearchParams.toString())

    if (minPrice) params.set("minPrice", minPrice)
    else params.delete("minPrice")

    if (maxPrice) params.set("maxPrice", maxPrice)
    else params.delete("maxPrice")

    router.push(`/marketplace?${params.toString()}`)
  }

  const clearAllFilters = () => {
    setSearchValue("")
    setMinPrice("")
    setMaxPrice("")
    router.push("/marketplace")
  }

  const activeFiltersCount = Object.values(searchParams).filter(Boolean).length

  return (
    <div className="mb-8 space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch}>Buscar</Button>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Category Filter */}
        <Select value={searchParams.category || "all"} onValueChange={(value) => updateSearchParams("category", value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas as Categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <span className="flex items-center gap-2">
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Location Filter */}
        <Select value={searchParams.city || "all"} onValueChange={(value) => updateSearchParams("city", value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas as Cidades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Cidades</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Filter */}
        <Select value={searchParams.sortBy || "latest"} onValueChange={(value) => updateSearchParams("sortBy", value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Mais Recentes</SelectItem>
            <SelectItem value="price_asc">Preço: Menor para Maior</SelectItem>
            <SelectItem value="price_desc">Preço: Maior para Menor</SelectItem>
            <SelectItem value="expiry">Vencimento Próximo</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 bg-transparent">
              <SlidersHorizontal className="h-4 w-4" />
              Mais Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Faixa de Preço (R$)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Mín"
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <Input
                    placeholder="Máx"
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
                <Button onClick={applyPriceFilter} size="sm" className="w-full">
                  Aplicar Filtro de Preço
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Vendedor</Label>
                <Select
                  value={searchParams.userType || "all"}
                  onValueChange={(value) => updateSearchParams("userType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os Vendedores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Vendedores</SelectItem>
                    <SelectItem value="producer">🌱 Produtores</SelectItem>
                    <SelectItem value="restaurant">🍽️ Restaurantes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <Button variant="ghost" onClick={clearAllFilters} className="gap-2">
            <X className="h-4 w-4" />
            Limpar Tudo
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {searchParams.search && (
            <Badge variant="secondary" className="gap-1">
              Busca: {searchParams.search}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateSearchParams("search", null)} />
            </Badge>
          )}
          {searchParams.category && (
            <Badge variant="secondary" className="gap-1">
              Categoria: {categories.find((c) => c.id === searchParams.category)?.name}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateSearchParams("category", null)} />
            </Badge>
          )}
          {searchParams.city && (
            <Badge variant="secondary" className="gap-1">
              Cidade: {searchParams.city}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateSearchParams("city", null)} />
            </Badge>
          )}
          {searchParams.userType && (
            <Badge variant="secondary" className="gap-1">
              Vendedor: {searchParams.userType === "producer" ? "Produtores" : "Restaurantes"}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateSearchParams("userType", null)} />
            </Badge>
          )}
          {(searchParams.minPrice || searchParams.maxPrice) && (
            <Badge variant="secondary" className="gap-1">
              Preço: R${searchParams.minPrice || "0"} - R${searchParams.maxPrice || "∞"}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  updateSearchParams("minPrice", null)
                  updateSearchParams("maxPrice", null)
                }}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
