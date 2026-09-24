import type { ReactNode } from "react";
import Link from "next/link";
import { Leaf, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface NotFoundStateProps {
  title: string;
  description: string;
  /** Optional content rendered in place of the plain site header (e.g. a header with UserNav). */
  header?: ReactNode;
}

/** Friendly pt-BR "não encontrado" state with a link back to the marketplace. */
export function NotFoundState({ title, description, header }: NotFoundStateProps) {
  return (
    <div className="min-h-screen bg-background">
      {header ?? (
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Leaf className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary">Direto da Terra</span>
            </Link>
          </div>
        </header>
      )}
      <div className="container mx-auto px-4 py-16 max-w-lg">
        <Card>
          <CardContent className="pt-6 text-center py-10">
            <SearchX className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">{title}</h2>
            <p className="text-muted-foreground mb-6">{description}</p>
            <Button asChild>
              <Link href="/marketplace">Ir para o Mercado</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
