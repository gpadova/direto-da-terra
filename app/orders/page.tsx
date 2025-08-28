import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
import { Leaf, ArrowLeft, Clock, MapPin, Package } from "lucide-react";
import Link from "next/link";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  // Get user's orders as a buyer
  const { data: orders } = await supabase
    .from("orders")
    .select(
      `
      *,
      profiles!orders_seller_id_fkey (
        full_name,
        user_type,
        city
      ),
      order_items (
        id,
        quantity,
        unit_price,
        total_price,
        products (
          title,
          unit,
          pickup_location,
          pickup_instructions
        )
      )
    `
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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

        {params.success && (
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
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Pedido #{order.id.slice(-8)}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                        <span>De {order.profiles.full_name}</span>
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <p className="text-lg font-bold text-primary mt-1">
                        €{order.total_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <div>
                    <h4 className="font-medium mb-2">Itens:</h4>
                    <div className="space-y-1">
                      {order.order_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm"
                        >
                          <span>
                            {item.products.title} × {item.quantity}{" "}
                            {item.products.unit}
                          </span>
                          <span>€{item.total_price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pickup Information */}
                  {order.order_items[0]?.products && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Informações de Retirada:</h4>
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p>{order.order_items[0].products.pickup_location}</p>
                          {order.order_items[0].products
                            .pickup_instructions && (
                            <p className="text-muted-foreground mt-1">
                              {
                                order.order_items[0].products
                                  .pickup_instructions
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status Information */}
                  <div className="pt-4 border-t">
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
      </div>
    </div>
  );
}
