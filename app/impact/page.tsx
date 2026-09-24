"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Leaf,
  Scale,
  Users,
  MapPin,
  Sprout,
  UtensilsCrossed,
  PiggyBank,
  Package,
  ArrowRight,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Metas do projeto de extensão até o 3º trimestre de 2026.
const TARGETS = {
  foodSavedKg: 12_000,
  familiesServed: 8_000,
  activeCities: 30,
  producers: 500,
};

const numberFmt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const currencyFmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatWeight(kg: number) {
  if (kg >= 1000) {
    return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(kg / 1000)} t`;
  }
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(kg)} kg`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string | undefined;
  hint?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
        {value === undefined ? (
          <Skeleton className="h-9 w-28" />
        ) : (
          <p className="font-display text-3xl font-semibold text-foreground tracking-tight">
            {value}
          </p>
        )}
        {hint && <p className="text-xs text-muted-foreground mt-2">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function GoalRow({
  label,
  current,
  target,
  format,
}: {
  label: string;
  current: number | undefined;
  target: number;
  format: (n: number) => string;
}) {
  const pct =
    current === undefined ? 0 : Math.min(100, (current / target) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground tabular-nums">
          {current === undefined ? "…" : format(current)}{" "}
          <span className="text-muted-foreground/70">/ {format(target)}</span>
        </p>
      </div>
      <Progress
        value={pct}
        aria-label={`${label}: ${pct.toFixed(0)}% da meta`}
      />
      <p className="text-xs text-muted-foreground mt-1.5">
        {pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% da meta
      </p>
    </div>
  );
}

export default function ImpactPage() {
  const impact = useQuery(api.impact.getPlatformImpact);

  const fmt = (n: number | undefined) =>
    n === undefined ? undefined : numberFmt.format(n);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Leaf className="h-7 w-7 text-primary" />
            <span className="font-display text-xl font-semibold text-foreground tracking-tight">
              Direto da Terra
            </span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/marketplace">Marketplace</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-6 py-16 md:py-20">
        <section className="mb-12">
          <p className="text-sm font-medium text-secondary uppercase tracking-widest mb-3">
            Nosso impacto
          </p>
          <h1 className="font-display text-3xl md:text-5xl font-semibold text-foreground tracking-tight mb-4">
            Alimento que chegou à mesa,
            <br />
            <span className="text-primary">não ao lixo.</span>
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            Números reais da plataforma, calculados a partir dos pedidos
            concluídos. Cada compra de excedente ou alimento próximo do
            vencimento evita desperdício e fortalece produtores locais.
          </p>
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          <StatCard
            icon={Scale}
            label="Alimento salvo"
            value={
              impact === undefined ? undefined : formatWeight(impact.foodSavedKg)
            }
            hint="Produtos vendidos por peso (kg/g)"
          />
          <StatCard
            icon={Package}
            label="Itens salvos"
            value={fmt(impact?.itemsSaved)}
            hint="Unidades, porções, caixas e afins"
          />
          <StatCard
            icon={Users}
            label="Famílias atendidas"
            value={fmt(impact?.familiesServed)}
            hint="Compradores com pedidos concluídos"
          />
          <StatCard
            icon={MapPin}
            label="Cidades ativas"
            value={fmt(impact?.activeCities)}
            hint="Cidades com vendedores anunciando"
          />
          <StatCard
            icon={Sprout}
            label="Produtores"
            value={fmt(impact?.producers)}
          />
          <StatCard
            icon={UtensilsCrossed}
            label="Restaurantes"
            value={fmt(impact?.restaurants)}
          />
        </section>

        <section className="mb-16">
          <Card className="border-primary/20 bg-primary/[0.04]">
            <CardContent className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-secondary/15 flex items-center justify-center shrink-0">
                <PiggyBank className="w-7 h-7 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">
                  Economia gerada para os consumidores
                </p>
                {impact === undefined ? (
                  <Skeleton className="h-10 w-40" />
                ) : (
                  <p className="font-display text-4xl font-semibold text-foreground tracking-tight">
                    {currencyFmt.format(impact.moneySaved)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Diferença entre o preço original e o preço pago nos
                  produtos com desconto.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mb-16">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="font-display text-2xl font-semibold text-foreground tracking-tight">
              Metas até o 3º trimestre de 2026
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-8">
            Objetivos do projeto de extensão Direto da Terra.
          </p>
          <Card className="border-border/60">
            <CardContent className="p-6 md:p-8 space-y-8">
              <GoalRow
                label="Alimento salvo"
                current={impact?.foodSavedKg}
                target={TARGETS.foodSavedKg}
                format={formatWeight}
              />
              <GoalRow
                label="Famílias atendidas"
                current={impact?.familiesServed}
                target={TARGETS.familiesServed}
                format={(n) => numberFmt.format(n)}
              />
              <GoalRow
                label="Cidades ativas"
                current={impact?.activeCities}
                target={TARGETS.activeCities}
                format={(n) => numberFmt.format(n)}
              />
              <GoalRow
                label="Produtores parceiros"
                current={impact?.producers}
                target={TARGETS.producers}
                format={(n) => numberFmt.format(n)}
              />
            </CardContent>
          </Card>
        </section>

        <section className="text-center">
          <h2 className="font-display text-2xl font-semibold text-foreground tracking-tight mb-3">
            Faça parte desses números
          </h2>
          <p className="text-muted-foreground mb-6">
            Compre excedentes perto de você ou anuncie os seus.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="rounded-full px-6">
              <Link href="/marketplace">
                Explorar marketplace
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-6">
              <Link href="/auth/signup">Quero vender</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
