import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/products/product-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Leaf } from "lucide-react";
import { UserNav } from "@/components/auth/user-nav";

export default async function NewProductPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  // Get user profile to check if they can create products
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.user_type === "consumer") {
    redirect("/dashboard");
  }

  // Get categories for the form
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

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

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Painel
            </Link>
          </Button>
          <h2 className="text-3xl font-bold mb-2">Adicionar Novo Produto</h2>
          <p className="text-muted-foreground">
            Cadastre seus alimentos excedentes para ajudar a reduzir o
            desperdício e conectar-se com compradores locais.
          </p>
        </div>

        <ProductForm categories={categories || []} />
      </div>
    </div>
  );
}
