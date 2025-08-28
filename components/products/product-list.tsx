"use client";

import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price: number | null;
  quantity: number;
  unit: string;
  expiry_date: string | null;
  is_available: boolean;
  images: string[];
  categories: {
    name: string;
    icon: string;
  };
}

interface ProductListProps {
  sellerId: string;
}

export function ProductList({ sellerId }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          categories (
            name,
            icon
          )
        `
        )
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching products:", error);
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [sellerId, supabase]);

  const toggleAvailability = async (
    productId: string,
    currentStatus: boolean
  ) => {
    const { error } = await supabase
      .from("products")
      .update({ is_available: !currentStatus })
      .eq("id", productId)
      .eq("seller_id", sellerId);

    if (error) {
      console.error("Error updating product:", error);
    } else {
      setProducts(
        products.map((p) =>
          p.id === productId ? { ...p, is_available: !currentStatus } : p
        )
      );
    }
  };

  const deleteProduct = async (productId: string) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("seller_id", sellerId);

    if (error) {
      console.error("Error deleting product:", error);
    } else {
      setProducts(products.filter((p) => p.id !== productId));
    }
  };

  if (loading) {
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
        <Card key={product.id} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg line-clamp-1">
                  {product.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <span>{product.categories?.icon}</span>
                  <span>{product.categories?.name}</span>
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
                    <Link href={`/dashboard/products/${product.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/products/${product.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      toggleAvailability(product.id, product.is_available)
                    }
                  >
                    {product.is_available
                      ? "Mark Unavailable"
                      : "Mark Available"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => deleteProduct(product.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
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
                    €{product.price}
                  </span>
                  {product.original_price &&
                    product.original_price > product.price && (
                      <span className="text-sm text-muted-foreground line-through">
                        €{product.original_price}
                      </span>
                    )}
                </div>
                <Badge variant={product.is_available ? "default" : "secondary"}>
                  {product.is_available ? "Available" : "Unavailable"}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {product.quantity} {product.unit}
                </span>
                {product.expiry_date && (
                  <span>
                    Expires:{" "}
                    {new Date(product.expiry_date).toLocaleDateString()}
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
