"use client";

import type React from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [userType, setUserType] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const createProfile = useMutation(api.profiles.createProfile);

  // Store pending profile data after signup
  const pendingProfile = useRef<{
    email: string;
    fullName: string;
    userType: "consumer" | "producer" | "restaurant";
  } | null>(null);

  // When auth becomes ready after signup, create the profile
  useEffect(() => {
    if (isAuthenticated && pendingProfile.current) {
      const data = pendingProfile.current;
      pendingProfile.current = null;
      createProfile(data)
        .then(() => {
          router.push("/dashboard");
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Erro ao criar perfil");
          setIsLoading(false);
        });
    }
  }, [isAuthenticated, createProfile, router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      setIsLoading(false);
      return;
    }

    if (!userType) {
      setError("Por favor, selecione o tipo de conta");
      setIsLoading(false);
      return;
    }

    try {
      // Store profile data to be created after auth is ready
      pendingProfile.current = {
        email,
        fullName,
        userType: userType as "consumer" | "producer" | "restaurant",
      };

      await signIn("password", { email, password, flow: "signUp" });
      // After signIn resolves, the useEffect above will handle profile creation
      // once isAuthenticated becomes true
    } catch (error: unknown) {
      pendingProfile.current = null;
      setError(error instanceof Error ? error.message : "Ocorreu um erro");
      setIsLoading(false);
    }
  };

  const userTypeOptions = [
    {
      value: "consumer",
      label: "Consumidor",
      description: "Compre alimentos excedentes de produtores locais",
    },
    {
      value: "producer",
      label: "Produtor",
      description: "Venda os seus produtos excedentes diretamente",
    },
    {
      value: "restaurant",
      label: "Restaurante",
      description: "Ofereça refeições e ingredientes excedentes",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-primary mb-2 hover:opacity-80 transition-opacity">
              Direto da Terra
            </h1>
          </Link>
          <p className="text-muted-foreground">
            Junte-se à nossa comunidade contra o desperdício alimentar
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Crie a sua conta</CardTitle>
            <CardDescription>
              Comece a reduzir o desperdício alimentar na sua comunidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="O seu nome completo"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userType">Tipo de Conta</Label>
                <Select value={userType} onValueChange={setUserType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o seu tipo de conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {userTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {error && (
                <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Criando conta..." : "Criar conta"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm">
              Já tem uma conta?{" "}
              <Link
                href="/auth/login"
                className="text-primary hover:underline font-medium"
              >
                Entrar
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
