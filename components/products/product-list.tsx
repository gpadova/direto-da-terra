"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProductListProps {
  sellerId: Id<"profiles">;
}

export function ProductList({ sellerId }: ProductListProps) {
  const products = useQuery(api.products.listBySeller, { sellerId });
  const toggleAvailability = useMutation(api.products.toggleAvailability);
  const removeProduct = useMutation(api.products.remove);

  if (products === undefined) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded mb-4"></div>
              <div className="h-3 bg-muted rounded w-full mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">📦</span>
            </div>
            <h4 className="text-lg font-medium mb-2">Nenhum produto ainda</h4>
            <p className="text-muted-foreground mb-4">
              Comece adicionando seu primeiro produto ao marketplace.
            </p>
            <Button asChild>
              <Link href="/dashboard/products/new">
                Adicionar seu primeiro produto
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Card key={product._id} className="relative">
          {product.imageUrls && product.imageUrls.length > 0 && (
            <div className="aspect-video bg-muted overflow-hidden">
              <img
                src={product.imageUrls[0]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg line-clamp-1">
                  {product.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <span>{product.category?.icon}</span>
                  <span>{product.category?.name}</span>
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/products/${product._id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/products/${product._id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => toggleAvailability({ id: product._id })}
                  >
                    {product.isAvailable
                      ? "Marcar Indisponível"
                      : "Marcar Disponível"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => removeProduct({ id: product._id })}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {product.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">
                    R${product.price}
                  </span>
                  {product.originalPrice &&
                    product.originalPrice > product.price && (
                      <span className="text-sm text-muted-foreground line-through">
                        R${product.originalPrice}
                      </span>
                    )}
                </div>
                <Badge variant={product.isAvailable ? "default" : "secondary"}>
                  {product.isAvailable ? "Disponível" : "Indisponível"}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {product.quantity} {product.unit}
                </span>
                {product.expiryDate && (
                  <span>
                    Validade:{" "}
                    {new Date(product.expiryDate).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
