"use client";

import type React from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/use-cart";
import { useState } from "react";
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
  const { items, getTotalPrice, clearCart } = useCart();
  const [phone, setPhone] = useState(profile.phone || "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const createOrder = useMutation(api.orders.create);
  const updateProfile = useMutation(api.profiles.updateProfile);

  if (items.length === 0) {
    router.push("/cart");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
        const orderTotal = sellerItems.reduce((total, item) => total + item.price * item.quantity, 0);

        await createOrder({
          sellerId: sellerId as Id<"profiles">,
          totalAmount: orderTotal,
          notes: notes || undefined,
          items: sellerItems.map((item) => ({
            productId: item.id as Id<"products">,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
          })),
        });
      }

      if (phone && phone !== profile.phone) {
        await updateProfile({ phone });
      }

      clearCart();
      router.push("/orders?success=true");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocorreu um erro");
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
                <p>• Você receberá instruções de retirada de cada vendedor</p>
                <p>• Pedidos estão sujeitos à confirmação do vendedor</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
