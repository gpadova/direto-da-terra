import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import {
  Leaf,
  Sprout,
  ArrowRight,
  MapPin,
  Recycle,
  Sun,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* ─── HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <Leaf className="h-7 w-7 text-primary transition-transform duration-500 group-hover:rotate-12" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-secondary rounded-full" />
            </div>
            <span className="font-display text-xl font-semibold text-foreground tracking-tight">
              Direto da Terra
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <Link
              href="/marketplace"
              className="hover:text-foreground transition-colors"
            >
              Marketplace
            </Link>
            <Link
              href="#como-funciona"
              className="hover:text-foreground transition-colors"
            >
              Como funciona
            </Link>
            <Link
              href="#impacto"
              className="hover:text-foreground transition-colors"
            >
              Impacto
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login">Entrar</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full px-5">
              <Link href="/auth/signup">Começar</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative pt-32 pb-24 md:pt-44 md:pb-36 px-6">
        {/* Organic background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-3xl" />
          <div className="absolute top-1/2 -left-48 w-[400px] h-[400px] rounded-full bg-secondary/[0.06] blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-primary/[0.03] blur-2xl" />

          {/* Decorative grid dots */}
          <svg
            className="absolute top-24 right-12 opacity-[0.08] text-primary"
            width="120"
            height="120"
            viewBox="0 0 120 120"
          >
            {Array.from({ length: 36 }).map((_, i) => (
              <circle
                key={i}
                cx={(i % 6) * 24 + 4}
                cy={Math.floor(i / 6) * 24 + 4}
                r="2"
                fill="currentColor"
              />
            ))}
          </svg>

          {/* Organic curve */}
          <svg
            className="absolute bottom-0 left-0 w-full h-32 text-primary/[0.04]"
            viewBox="0 0 1440 128"
            preserveAspectRatio="none"
          >
            <path
              d="M0,64 C360,128 720,0 1080,64 C1260,96 1380,32 1440,64 L1440,128 L0,128 Z"
              fill="currentColor"
            />
          </svg>
        </div>

        <div className="container mx-auto max-w-6xl relative">
          <div className="grid md:grid-cols-[1fr_auto] gap-12 items-center">
            <div className="max-w-2xl">
              {/* Tag */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/[0.08] text-primary text-xs font-medium mb-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
                <Sprout className="w-3.5 h-3.5" />
                Mercado consciente de alimentos
              </div>

              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-foreground leading-[1.05] tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                Da terra
                <br />
                <span className="relative inline-block">
                  para a sua
                  <svg
                    className="absolute -bottom-1 left-0 w-full h-3 text-secondary/40"
                    viewBox="0 0 200 12"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,8 Q50,0 100,8 Q150,16 200,8"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <br />
                <span className="text-primary">mesa.</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                Conectamos produtores locais a consumidores conscientes. Alimentos
                frescos, preços justos, desperdício zero.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full px-8 text-base h-12 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                >
                  <Link href="/auth/signup">
                    Explorar produtos
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 text-base h-12 bg-transparent"
                >
                  <Link href="/marketplace">Sou produtor</Link>
                </Button>
              </div>
            </div>

            {/* Hero image */}
            <div className="hidden md:block relative w-80 h-80 lg:w-96 lg:h-96 animate-in fade-in zoom-in-95 duration-1000 delay-500">
              {/* Decorative frame layers */}
              <div className="absolute -inset-3 rounded-[3rem] bg-gradient-to-br from-primary/15 via-transparent to-secondary/10 rotate-3" />
              <div className="absolute -inset-1.5 rounded-[2.5rem] bg-background rotate-3" />

              {/* Image */}
              <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-2xl shadow-primary/10">
                <Image
                  src="/images/hero.png"
                  alt="Agricultor segurando cesta de vegetais frescos colhidos da horta"
                  fill
                  className="object-cover"
                  priority
                />
                {/* Subtle gradient overlay at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>

              {/* Floating badges */}
              <div className="absolute -left-8 top-10 bg-background border border-border rounded-2xl px-4 py-2.5 shadow-lg shadow-black/[0.06] animate-in fade-in slide-in-from-left-4 duration-700 delay-700">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Local</p>
                    <p className="text-[10px] text-muted-foreground">Produtores próximos</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-6 bottom-14 bg-background border border-border rounded-2xl px-4 py-2.5 shadow-lg shadow-black/[0.06] animate-in fade-in slide-in-from-right-4 duration-700 delay-900">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Recycle className="w-4 h-4 text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Zero desperdício</p>
                    <p className="text-[10px] text-muted-foreground">Alimentos salvos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <section className="border-y border-border/50 bg-muted/20">
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "500+", label: "Produtores locais" },
              { value: "12 ton", label: "Alimentos salvos" },
              { value: "8.000+", label: "Famílias atendidas" },
              { value: "30+", label: "Cidades" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-2xl md:text-3xl font-semibold text-foreground">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMO FUNCIONA ─── */}
      <section id="como-funciona" className="py-24 md:py-32 px-6 relative">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-secondary/[0.04] blur-3xl pointer-events-none" />

        <div className="container mx-auto max-w-5xl relative">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-secondary uppercase tracking-widest mb-3">
              Simplicidade
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-semibold text-foreground tracking-tight">
              Como funciona
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: Sprout,
                title: "Produtores listam",
                description:
                  "Agricultores e produtores locais cadastram seus excedentes de frutas, verduras e produtos artesanais com preços acessíveis.",
                accent: "primary" as const,
              },
              {
                step: "02",
                icon: MapPin,
                title: "Você descobre",
                description:
                  "Encontre produtos frescos perto de você. Filtre por tipo, distância e disponibilidade. Tudo transparente, do campo à mesa.",
                accent: "secondary" as const,
              },
              {
                step: "03",
                icon: Leaf,
                title: "Todos ganham",
                description:
                  "Produtores vendem mais, você come melhor, e juntos reduzimos o desperdício de alimentos na nossa comunidade.",
                accent: "primary" as const,
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group relative bg-background border border-border/60 rounded-2xl p-8 hover:border-border transition-all duration-300 hover:shadow-lg hover:shadow-black/[0.03]"
              >
                <span className="font-display text-6xl font-bold text-muted/60 absolute top-4 right-6 select-none">
                  {item.step}
                </span>
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${
                    item.accent === "primary"
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary/10 text-secondary"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PILARES ─── */}
      <section className="py-24 md:py-32 px-6 bg-foreground text-primary-foreground relative overflow-hidden">
        {/* Earth texture background */}
        <Image
          src="/images/move.png"
          alt=""
          fill
          className="object-cover opacity-50"
          aria-hidden="true"
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-foreground/10" />

        <div className="container mx-auto max-w-5xl relative">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-primary-foreground/60 uppercase tracking-widest mb-3">
              Nossos valores
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight">
              O que nos move
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-px bg-primary-foreground/10 rounded-2xl overflow-hidden">
            {[
              {
                icon: Sprout,
                title: "Frescor garantido",
                description:
                  "Produtos colhidos e disponibilizados no mesmo dia. Sem longas cadeias de distribuição.",
              },
              {
                icon: MapPin,
                title: "Proximidade real",
                description:
                  "Conheça quem produz o seu alimento. Fortaleça a economia local e as relações comunitárias.",
              },
              {
                icon: Recycle,
                title: "Desperdício zero",
                description:
                  "Cada produto excedente encontra um destino. Transformamos sobras em oportunidades.",
              },
              {
                icon: Sun,
                title: "Preço justo",
                description:
                  "Sem intermediários. Produtores ganham mais, consumidores pagam menos. Todos saem ganhando.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-foreground p-8 md:p-10 group hover:bg-primary-foreground/[0.03] transition-colors duration-300"
              >
                <item.icon className="w-6 h-6 text-secondary mb-4" />
                <h3 className="font-display text-lg font-semibold mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-primary-foreground/60 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── IMPACTO ─── */}
      <section id="impacto" className="py-24 md:py-32 px-6 relative">
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-primary/[0.03] blur-3xl pointer-events-none" />

        <div className="container mx-auto max-w-5xl relative">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-medium text-secondary uppercase tracking-widest mb-3">
                Impacto
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground tracking-tight mb-6">
                Cada escolha conta.
                <br />
                <span className="text-primary">A sua também.</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                No Brasil, 27 milhões de toneladas de alimentos são desperdiçados por
                ano. A maior parte acontece entre o campo e a mesa. O Direto da Terra
                encurta esse caminho.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Quando você compra de um produtor local, não está apenas economizando
                — está sustentando famílias, protegendo o meio ambiente e
                fortalecendo a sua comunidade.
              </p>
              <Button
                asChild
                variant="outline"
                className="rounded-full px-6"
              >
                <Link href="/marketplace">
                  Ver produtos disponíveis
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>

            {/* Visual element with background image */}
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden relative">
                {/* Background photo */}
                <Image
                  src="/images/impacto.png"
                  alt="Campo agrícola brasileiro ao amanhecer"
                  fill
                  className="object-cover"
                />
                {/* Overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />

                {/* Content over image */}
                <div className="relative z-10 h-full p-10 flex flex-col justify-between text-white">
                  <div>
                    <p className="font-display text-5xl md:text-6xl font-bold">
                      27M
                    </p>
                    <p className="text-sm text-white/70 mt-1">
                      toneladas desperdiçadas/ano
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-white/70">Campo &rarr; Mesa</span>
                        <span className="font-medium text-white">64%</span>
                      </div>
                      <div className="h-2 bg-white/15 rounded-full overflow-hidden">
                        <div className="h-full w-[64%] bg-primary rounded-full" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-white/70">No consumidor</span>
                        <span className="font-medium text-white">22%</span>
                      </div>
                      <div className="h-2 bg-white/15 rounded-full overflow-hidden">
                        <div className="h-full w-[22%] bg-secondary rounded-full" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-white/70">Outros</span>
                        <span className="font-medium text-white">14%</span>
                      </div>
                      <div className="h-2 bg-white/15 rounded-full overflow-hidden">
                        <div className="h-full w-[14%] bg-white/40 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="relative py-32 md:py-44 px-6 overflow-hidden bg-gradient-to-b from-primary/[0.03] via-muted/40 to-primary/[0.06]">
        {/* Organic botanical SVG shapes scattered */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Large leaf top-left */}
          <svg className="absolute -top-8 -left-12 w-64 h-64 text-primary/[0.06]" viewBox="0 0 200 200">
            <path d="M100,10 C100,10 170,50 180,120 C190,190 130,195 100,190 C70,195 10,190 20,120 C30,50 100,10 100,10Z" fill="currentColor" />
            <path d="M100,40 L100,170 M60,100 Q100,70 140,100" stroke="white" strokeWidth="2" fill="none" opacity="0.3" />
          </svg>

          {/* Small leaf mid-right */}
          <svg className="absolute top-1/4 -right-6 w-40 h-40 text-secondary/[0.07] rotate-45" viewBox="0 0 200 200">
            <path d="M100,10 C100,10 170,50 180,120 C190,190 130,195 100,190 C70,195 10,190 20,120 C30,50 100,10 100,10Z" fill="currentColor" />
          </svg>

          {/* Branch bottom-left */}
          <svg className="absolute bottom-12 left-8 w-48 h-48 text-primary/[0.05] -rotate-12" viewBox="0 0 200 200">
            <path d="M30,170 Q60,120 100,100 Q140,80 170,30" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="170" cy="30" r="12" fill="currentColor" />
            <circle cx="140" cy="60" r="8" fill="currentColor" />
            <circle cx="60" cy="130" r="10" fill="currentColor" />
          </svg>

          {/* Seed dots top-right */}
          <svg className="absolute top-16 right-1/4 w-32 h-32 text-secondary/[0.06]" viewBox="0 0 120 120">
            <circle cx="20" cy="20" r="6" fill="currentColor" />
            <circle cx="60" cy="10" r="4" fill="currentColor" />
            <circle cx="95" cy="30" r="7" fill="currentColor" />
            <circle cx="40" cy="55" r="3" fill="currentColor" />
            <circle cx="80" cy="65" r="5" fill="currentColor" />
            <circle cx="110" cy="80" r="4" fill="currentColor" />
          </svg>

          {/* Small leaf bottom-right */}
          <svg className="absolute -bottom-4 right-12 w-36 h-36 text-primary/[0.05] rotate-180" viewBox="0 0 200 200">
            <path d="M100,10 C100,10 170,50 180,120 C190,190 130,195 100,190 C70,195 10,190 20,120 C30,50 100,10 100,10Z" fill="currentColor" />
          </svg>

          {/* Subtle noise texture */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          }} />

          {/* Soft radial glow center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-3xl" />
        </div>

        <div className="container mx-auto max-w-4xl text-center relative">
          {/* Organic ring decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border-2 border-dashed border-primary/[0.08] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] rounded-full border border-primary/[0.05] pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/[0.08] text-primary text-xs font-medium mb-8">
            <Sprout className="w-3.5 h-3.5" />
            Junte-se ao movimento
          </div>

          <h2 className="font-display text-4xl md:text-6xl font-semibold text-foreground tracking-tight mb-6">
            Faça parte dessa
            <br />
            <span className="text-primary relative inline-block">
              mudança.
              <svg
                className="absolute -bottom-2 left-0 w-full h-3 text-secondary/30"
                viewBox="0 0 200 12"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,8 Q50,0 100,8 Q150,16 200,8"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto mb-12 leading-relaxed">
            Seja como produtor ou consumidor, cada pessoa que se junta ao Direto
            da Terra fortalece a cadeia de alimentos locais.
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto mb-12">
            {[
              { value: "2min", label: "para cadastrar" },
              { value: "100%", label: "gratuito" },
              { value: "0", label: "intermediários" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-2xl font-semibold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="rounded-full px-10 text-base h-13 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              <Link href="/auth/signup">
                Criar conta gratuita
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full px-10 text-base h-13 bg-background/80 backdrop-blur-sm"
            >
              <Link href="/marketplace">Explorar marketplace</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border/50 py-12 px-6 bg-muted/20">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <Leaf className="h-6 w-6 text-primary" />
                <span className="font-display text-lg font-semibold text-foreground">
                  Direto da Terra
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Combatendo o desperdício alimentar e conectando comunidades a
                alimentos frescos e locais.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-4">
                Plataforma
              </h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <Link href="/marketplace" className="hover:text-foreground transition-colors">
                    Marketplace
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="hover:text-foreground transition-colors">
                    Cadastre-se
                  </Link>
                </li>
                <li>
                  <Link href="/auth/login" className="hover:text-foreground transition-colors">
                    Entrar
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-4">
                Para produtores
              </h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <Link href="/auth/signup" className="hover:text-foreground transition-colors">
                    Comece a vender
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-foreground transition-colors">
                    Painel do produtor
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Direto da Terra. Todos os direitos reservados.
            </p>
            <p className="text-xs text-muted-foreground">
              Feito com cuidado pela terra e pelas pessoas.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
