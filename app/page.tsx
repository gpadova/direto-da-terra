import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Leaf, Users, ShoppingCart, Heart } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Direto da Terra</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline">
              <Link href="/auth/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Começar</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl md:text-6xl font-bold text-balance mb-6">
            Reduzindo o desperdício alimentar, <span className="text-primary">uma refeição de cada vez</span>
          </h2>
          <p className="text-xl text-muted-foreground text-balance mb-8 max-w-2xl mx-auto">
            Conecte-se com produtores locais, restaurantes e sua comunidade para comprar alimentos excedentes a preços
            excelentes enquanto combate o desperdício alimentar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/auth/signup">Começar a poupar alimentos</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 bg-transparent">
              <Link href="/marketplace">Explorar marketplace</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-3xl font-bold text-center mb-12">Como funciona</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Para Produtores</CardTitle>
                <CardDescription>Venda seus produtos excedentes diretamente aos consumidores</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center">
                  Liste seus excedentes de frutas, vegetais e produtos. Defina seus próprios preços e conecte-se com
                  compradores locais que apreciam alimentos frescos e de qualidade.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-secondary" />
                </div>
                <CardTitle>Para Consumidores</CardTitle>
                <CardDescription>Compre alimentos frescos a preços com desconto</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center">
                  Descubra ofertas incríveis em produtos frescos e alimentos preparados de produtores locais e
                  restaurantes na sua área.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>Para a Comunidade</CardTitle>
                <CardDescription>Construa um sistema alimentar local sustentável</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center">
                  Reduza o desperdício alimentar, apoie negócios locais e fortaleça as conexões comunitárias através da
                  partilha sustentável de alimentos.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <h3 className="text-3xl font-bold mb-6">Pronto para fazer a diferença?</h3>
          <p className="text-lg text-muted-foreground mb-8">
            Junte-se a milhares de pessoas que já estão reduzindo o desperdício alimentar nas suas comunidades.
          </p>
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/auth/signup">Juntar-se ao Direto da Terra</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-primary">Direto da Terra</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Combatendo o desperdício alimentar, uma comunidade de cada vez.
          </p>
        </div>
      </footer>
    </div>
  )
}
