"use client";

import { getErrorMessage } from "@/lib/errors";
import type React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  availableWindows,
  formatPickupDate,
  formatPickupTime,
  formatWindow,
  maxPickupDate,
  pickupDateOptions,
} from "@/lib/pickup";
import { CalendarClock } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
}

interface CheckoutFormProps {
  profile: Profile;
}

export function CheckoutForm({ profile }: CheckoutFormProps) {
  const { items, getTotalPrice, clearCart, removeItem } = useCart();
  const [phone, setPhone] = useState(profile.phone || "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const createOrder = useMutation(api.orders.create);
  const updateProfile = useMutation(api.profiles.updateProfile);
  const [pickupBySeller, setPickupBySeller] = useState<
    Record<string, { date?: string; window?: string }>
  >({});
  const pickupLimits = useQuery(
    api.orders.pickupLimits,
    items.length > 0 ? { productIds: items.map((item) => item.id as Id<"products">) } : "skip"
  );

  // Evita redirecionar para o carrinho logo após finalizar o pedido (clearCart esvazia os itens).
  const orderPlacedRef = useRef(false);

  useEffect(() => {
    if (items.length === 0 && !orderPlacedRef.current) {
      router.replace("/cart");
    }
  }, [items.length, router]);

  if (items.length === 0) {
    return null;
  }

  // Group items by seller
  const itemsBySeller = items.reduce(
    (acc, item) => {
      if (!acc[item.seller_id]) {
        acc[item.seller_id] = [];
      }
      acc[item.seller_id].push(item);
      return acc;
    },
    {} as Record<string, typeof items>
  );

  const expiryByProduct = new Map(
    (pickupLimits ?? []).map((limit) => [limit.productId as string, limit.expiryDate])
  );

  // Datas e faixas de horário de retirada disponíveis para cada vendedor:
  // de hoje até min(validade mais próxima dos itens, hoje + 7 dias).
  const pickupOptionsFor = (sellerItems: typeof items) => {
    const maxDate = maxPickupDate(sellerItems.map((item) => expiryByProduct.get(item.id)));
    return pickupDateOptions(maxDate).filter((date) => availableWindows(date).length > 0);
  };

  const getPickup = (sellerId: string, dateOptions: string[]) => {
    const selected = pickupBySeller[sellerId] ?? {};
    const date =
      selected.date && dateOptions.includes(selected.date) ? selected.date : dateOptions[0];
    const windows = date ? availableWindows(date) : [];
    const window =
      selected.window && (windows as string[]).includes(selected.window)
        ? selected.window
        : undefined;
    return { date, window, windows };
  };

  const setPickup = (sellerId: string, value: { date?: string; window?: string }) => {
    setPickupBySeller((prev) => ({ ...prev, [sellerId]: { ...prev[sellerId], ...value } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pickupLimits === undefined) {
      setError("Aguarde, carregando opções de retirada...");
      return;
    }

    const pickupTimes: Record<string, string> = {};
    for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
      const dateOptions = pickupOptionsFor(sellerItems);
      if (dateOptions.length === 0) {
        setError(
          "Não há datas de retirada disponíveis para alguns itens (produto vencido). Remova-os do carrinho."
        );
        return;
      }
      const { date, window } = getPickup(sellerId, dateOptions);
      if (!date || !window) {
        setError("Escolha a data e o horário de retirada para cada vendedor.");
        return;
      }
      pickupTimes[sellerId] = formatPickupTime(date, window);
    }

    setIsLoading(true);
    // Cada vendedor gera um pedido separado; se um falhar, os já criados saem do
    // carrinho para não serem duplicados ao tentar de novo.
    const placedSellers: string[] = [];
    try {
      for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
        await createOrder({
          sellerId: sellerId as Id<"profiles">,
          notes: notes || undefined,
          pickupTime: pickupTimes[sellerId],
          items: sellerItems.map((item) => ({
            productId: item.id as Id<"products">,
            quantity: item.quantity,
            expectedUnitPrice: item.price,
          })),
        });
        placedSellers.push(sellerId);
      }

      if (phone && phone !== profile.phone) {
        await updateProfile({ phone });
      }

      orderPlacedRef.current = true;
      clearCart();
      router.push("/orders?success=true");
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Não foi possível finalizar o pedido");
      if (placedSellers.length > 0 && placedSellers.length < Object.keys(itemsBySeller).length) {
        for (const sellerId of placedSellers) {
          for (const item of itemsBySeller[sellerId]) removeItem(item.id);
        }
        setError(
          `${message}. ${placedSellers.length} pedido(s) já foram criados e removidos do carrinho — veja em Meus Pedidos.`
        );
      } else if (placedSellers.length > 0) {
        // Todos os pedidos foram criados; só a atualização do telefone falhou.
        orderPlacedRef.current = true;
        clearCart();
        router.push("/orders?success=true");
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações de Contato</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" value={profile.full_name} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={profile.email} disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Seu número de telefone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-3 pt-2">
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    Agendar Retirada
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Escolha quando você vai retirar cada pedido. A data não pode passar da validade dos
                    produtos.
                  </p>
                </div>
                {pickupLimits === undefined ? (
                  <div className="h-16 bg-muted rounded animate-pulse" />
                ) : (
                  Object.entries(itemsBySeller).map(([sellerId, sellerItems], index) => {
                    const dateOptions = pickupOptionsFor(sellerItems);
                    const { date, window, windows } = getPickup(sellerId, dateOptions);
                    return (
                      <div key={sellerId} className="rounded-md border p-3 space-y-2">
                        <p className="text-sm font-medium">
                          Pedido {index + 1}:{" "}
                          <span className="font-normal text-muted-foreground">
                            {sellerItems.map((item) => item.title).join(", ")}
                          </span>
                        </p>
                        {dateOptions.length === 0 ? (
                          <p className="text-sm text-destructive">
                            Nenhuma data de retirada disponível: há produto vencido neste pedido.
                          </p>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <Label htmlFor={`pickup-date-${sellerId}`} className="text-xs">
                                Data
                              </Label>
                              <Select
                                value={date}
                                onValueChange={(value) => setPickup(sellerId, { date: value })}
                              >
                                <SelectTrigger id={`pickup-date-${sellerId}`}>
                                  <SelectValue placeholder="Escolha a data" />
                                </SelectTrigger>
                                <SelectContent>
                                  {dateOptions.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {formatPickupDate(option)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor={`pickup-window-${sellerId}`} className="text-xs">
                                Horário
                              </Label>
                              <Select
                                value={window ?? ""}
                                onValueChange={(value) => setPickup(sellerId, { date, window: value })}
                              >
                                <SelectTrigger id={`pickup-window-${sellerId}`}>
                                  <SelectValue placeholder="Escolha o horário" />
                                </SelectTrigger>
                                <SelectContent>
                                  {windows.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {formatWindow(option)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações do Pedido (Opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Instruções especiais ou observações para os vendedores..."
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="w-full" size="lg">
                {isLoading ? "Processando..." : `Fazer Pedido - R$${getTotalPrice().toFixed(2)}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(itemsBySeller).map(([sellerId, sellerItems]) => (
                <div key={sellerId} className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Pedido do Vendedor</h4>
                  {sellerItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.title} × {item.quantity}
                      </span>
                      <span>R${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium text-sm pt-2 border-t">
                    <span>Subtotal:</span>
                    <span>
                      R${sellerItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}

              <div className="flex justify-between font-bold text-lg pt-4 border-t">
                <span>Total:</span>
                <span className="text-primary">R${getTotalPrice().toFixed(2)}</span>
              </div>

              <div className="text-xs text-muted-foreground pt-4 border-t">
                <p>• O pagamento será feito diretamente com cada vendedor na retirada</p>
                <p>• Retire cada pedido na data e horário agendados</p>
                <p>• Pedidos estão sujeitos à confirmação do vendedor</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
