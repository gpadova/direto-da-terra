"use client";

import { Suspense, useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { UserNav } from "@/components/auth/user-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Leaf, ArrowLeft, Clock, MapPin, Package, Star, CheckCircle } from "lucide-react";
import Link from "next/link";
import { ReviewDialog } from "@/components/reviews/review-dialog";
import type { Id } from "@/convex/_generated/dataModel";

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">A carregar...</div>
      </div>
    }>
      <OrdersContent />
    </Suspense>
  );
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const { isAuthenticated, isLoading } = useConvexAuth();
  const orders = useQuery(api.orders.listByBuyer);
  const reviewedOrderIds = useQuery(api.reviews.listByReviewer);
  const router = useRouter();
  const [reviewingOrderId, setReviewingOrderId] = useState<Id<"orders"> | null>(null);
  const [reviewingSellerName, setReviewingSellerName] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading || orders === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">A carregar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Direto da Terra</h1>
          </div>
          <UserNav />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para o Painel
          </Link>
        </Button>

        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Meus Pedidos</h2>
          <p className="text-muted-foreground">
            Acompanhe suas compras e detalhes de retirada
          </p>
        </div>

        {success && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-800">
                <Package className="h-5 w-5" />
                <span className="font-medium">
                  Pedido realizado com sucesso!
                </span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Você receberá atualizações dos vendedores sobre os detalhes da
                retirada.
              </p>
            </CardContent>
          </Card>
        )}

        {orders && orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order._id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Pedido #{order._id.slice(-8)}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(order._creationTime).toLocaleDateString()}
                        </span>
                        <span>De {order.seller?.fullName}</span>
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status === "pending" ? "Pendente" : order.status === "confirmed" ? "Confirmado" : order.status === "ready" ? "Pronto" : order.status === "completed" ? "Concluído" : order.status === "cancelled" ? "Cancelado" : order.status}
                      </Badge>
                      <p className="text-lg font-bold text-primary mt-1">
                        R${order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Itens:</h4>
                    <div className="space-y-1">
                      {order.orderItems.map((item) => (
                        <div
                          key={item._id}
                          className="flex justify-between text-sm"
                        >
                          <span>
                            {item.product?.title} × {item.quantity}{" "}
                            {item.product?.unit}
                          </span>
                          <span>R${item.totalPrice.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.orderItems[0]?.product && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Informações de Retirada:</h4>
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p>{order.orderItems[0].product.pickupLocation}</p>
                          {order.orderItems[0].product.pickupInstructions && (
                            <p className="text-muted-foreground mt-1">
                              {order.orderItems[0].product.pickupInstructions}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {order.status === "pending" &&
                        "Aguardando confirmação do vendedor"}
                      {order.status === "confirmed" &&
                        "Pedido confirmado! O vendedor está preparando seus itens"}
                      {order.status === "ready" &&
                        "Seu pedido está pronto para retirada!"}
                      {order.status === "completed" &&
                        "Pedido concluído. Obrigado!"}
                      {order.status === "cancelled" &&
                        "Este pedido foi cancelado"}
                    </div>
                    {order.status === "completed" && reviewedOrderIds && (
                      reviewedOrderIds.includes(order._id) ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Avaliado</span>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReviewingOrderId(order._id);
                            setReviewingSellerName(order.seller?.fullName ?? "Vendedor");
                          }}
                        >
                          <Star className="mr-1 h-4 w-4" />
                          Avaliar
                        </Button>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h4 className="text-lg font-medium mb-2">
                  Nenhum pedido ainda
                </h4>
                <p className="text-muted-foreground mb-4">
                  Comece a comprar para apoiar produtores locais e reduzir o
                  desperdício de alimentos.
                </p>
                <Button asChild>
                  <Link href="/marketplace">Explorar Marketplace</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {reviewingOrderId && (
          <ReviewDialog
            orderId={reviewingOrderId}
            sellerName={reviewingSellerName}
            open={!!reviewingOrderId}
            onOpenChange={(open) => {
              if (!open) setReviewingOrderId(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
