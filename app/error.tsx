"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">Direto da Terra</span>
          </Link>
        </div>
      </header>
      <div className="container mx-auto px-4 py-16 max-w-lg">
        <Card>
          <CardContent className="pt-6 text-center py-10">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Algo deu errado</h2>
            <p className="text-muted-foreground mb-6">
              Não foi possível carregar esta página. Tente novamente em instantes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => reset()}>Tentar novamente</Button>
              <Button asChild variant="outline">
                <Link href="/marketplace">Ir para o Mercado</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
