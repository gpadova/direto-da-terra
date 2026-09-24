"use client";

import { getErrorMessage } from "@/lib/errors";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { Clock, User, Package, Phone, MessageSquare, CalendarClock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPickupLabel, parsePickupTime } from "@/lib/pickup";
import { todayInSaoPaulo } from "@/lib/expiry";

export function OrderList() {
  const orders = useQuery(api.orders.listBySeller);
  const updateStatus = useMutation(api.orders.updateStatus);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "today">("all");

  const handleUpdateStatus = async (orderId: Id<"orders">, newStatus: "pending" | "confirmed" | "ready" | "completed" | "cancelled") => {
    setUpdatingStatus(orderId);
    try {
      await updateStatus({ id: orderId, status: newStatus });
    } catch (error) {
      console.error("Erro ao atualizar status do pedido:", error);
      toast.error(getErrorMessage(error, "Não foi possível atualizar o status do pedido"));
    } finally {
      setUpdatingStatus(null);
    }
  };

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Pendente";
      case "confirmed": return "Confirmado";
      case "ready": return "Pronto para Retirada";
      case "completed": return "Concluído";
      case "cancelled": return "Cancelado";
      default: return status;
    }
  };

  const getStatusOptions = (currentStatus: string) => {
    const allStatuses = [
      { value: "pending", label: "Pendente" },
      { value: "confirmed", label: "Confirmado" },
      { value: "ready", label: "Pronto para Retirada" },
      { value: "completed", label: "Concluído" },
      { value: "cancelled", label: "Cancelado" },
    ];

    switch (currentStatus) {
      case "pending":
        return allStatuses.filter((s) => ["pending", "confirmed", "cancelled"].includes(s.value));
      case "confirmed":
        return allStatuses.filter((s) => ["confirmed", "ready", "cancelled"].includes(s.value));
      case "ready":
        return allStatuses.filter((s) => ["ready", "completed", "cancelled"].includes(s.value));
      case "completed":
        return allStatuses.filter((s) => s.value === "completed");
      case "cancelled":
        return allStatuses.filter((s) => s.value === "cancelled");
      default:
        return allStatuses;
    }
  };

  if (orders === undefined) {
    return (
      <div className="grid gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-3 bg-muted rounded w-1/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">Nenhum pedido ainda</h4>
            <p className="text-muted-foreground">Os pedidos aparecerão aqui quando clientes comprarem seus produtos.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Retiradas de hoje: pedidos confirmados/prontos com retirada agendada para hoje,
  // ordenados pela faixa de horário.
  const today = todayInSaoPaulo();
  const todaysPickups = orders
    .filter(
      (order) =>
        (order.status === "confirmed" || order.status === "ready") &&
        parsePickupTime(order.pickupTime)?.date === today
    )
    .sort((a, b) => (a.pickupTime ?? "").localeCompare(b.pickupTime ?? ""));
  const visibleOrders = filter === "today" ? todaysPickups : orders;

  return (
    <div className="space-y-4">
      <Tabs value={filter} onValueChange={(value) => setFilter(value as "all" | "today")}>
        <TabsList>
          <TabsTrigger value="all">Todos ({orders.length})</TabsTrigger>
          <TabsTrigger value="today">Retiradas de hoje ({todaysPickups.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {visibleOrders.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CalendarClock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h4 className="text-lg font-medium mb-2">Nenhuma retirada para hoje</h4>
              <p className="text-muted-foreground">
                Pedidos confirmados ou prontos com retirada agendada para hoje aparecerão aqui.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {visibleOrders.map((order) => (
        <Card key={order._id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">Pedido #{order._id.slice(-8)}</CardTitle>
                <CardDescription className="flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {order.buyer?.fullName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(order._creationTime).toLocaleDateString("pt-BR")}
                  </span>
                </CardDescription>
                {order.pickupTime && (
                  <p className="flex items-center gap-1 mt-2 text-sm font-medium text-primary">
                    <CalendarClock className="h-4 w-4" />
                    Retirada: {formatPickupLabel(order.pickupTime)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
                <p className="text-lg font-bold text-primary mt-1">R${order.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Itens:</h4>
              <div className="space-y-1">
                {order.orderItems.map((item) => (
                  <div key={item._id} className="flex justify-between text-sm">
                    <span>
                      {item.product?.title} × {item.quantity} {item.product?.unit}
                    </span>
                    <span>R${item.totalPrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Email do Cliente</Label>
                <p className="text-sm">{order.buyer?.email}</p>
              </div>
              {order.buyer?.phone && (
                <div>
                  <Label className="text-xs text-muted-foreground">Telefone</Label>
                  <p className="text-sm flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {order.buyer.phone}
                  </p>
                </div>
              )}
            </div>

            {order.notes && (
              <div>
                <Label className="text-xs text-muted-foreground">Observações do Cliente</Label>
                <div className="mt-1 p-2 bg-muted rounded text-sm">
                  <MessageSquare className="h-4 w-4 inline mr-1" />
                  {order.notes}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 pt-4 border-t">
              <div className="flex-1">
                <Label htmlFor={`status-${order._id}`} className="text-sm font-medium">
                  Atualizar Status:
                </Label>
                <Select
                  value={order.status}
                  onValueChange={(value) =>
                    handleUpdateStatus(order._id, value as "pending" | "confirmed" | "ready" | "completed" | "cancelled")
                  }
                  disabled={updatingStatus === order._id}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getStatusOptions(order.status).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {updatingStatus === order._id && <div className="text-sm text-muted-foreground">Atualizando...</div>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
