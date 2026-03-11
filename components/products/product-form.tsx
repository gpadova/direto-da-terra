"use client";

import type React from "react";
import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ImagePlus, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface ProductFormProps {
  categories: Category[];
  product?: {
    _id: Id<"products">;
    title: string;
    description?: string;
    categoryId: Id<"categories">;
    price: number;
    originalPrice?: number;
    quantity: number;
    unit: string;
    expiryDate?: string;
    pickupLocation?: string;
    pickupInstructions?: string;
    isAvailable: boolean;
    images?: Id<"_storage">[];
    imageUrls?: string[];
  };
  isEditing?: boolean;
}

interface ImagePreview {
  storageId: Id<"_storage">;
  url: string;
}

export function ProductForm({ categories, product, isEditing = false }: ProductFormProps) {
  const [title, setTitle] = useState(product?.title || "");
  const [description, setDescription] = useState(product?.description || "");
  const [categoryId, setCategoryId] = useState(product?.categoryId || "");
  const [price, setPrice] = useState(product?.price?.toString() || "");
  const [originalPrice, setOriginalPrice] = useState(product?.originalPrice?.toString() || "");
  const [quantity, setQuantity] = useState(product?.quantity?.toString() || "");
  const [unit, setUnit] = useState(product?.unit || "");
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(
    product?.expiryDate ? new Date(product.expiryDate) : undefined
  );
  const [pickupLocation, setPickupLocation] = useState(product?.pickupLocation || "");
  const [pickupInstructions, setPickupInstructions] = useState(product?.pickupInstructions || "");
  const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Image state
  const [images, setImages] = useState<ImagePreview[]>(() => {
    if (product?.images && product?.imageUrls) {
      return product.images.map((id, i) => ({
        storageId: id,
        url: product.imageUrls![i] || "",
      })).filter((img) => img.url);
    }
    return [];
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const generateUploadUrl = useMutation(api.products.generateUploadUrl);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = 5 - images.length;
    if (remaining <= 0) {
      toast.error("Máximo de 5 imagens por produto");
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);
    setIsUploading(true);

    try {
      for (const file of filesToUpload) {
        if (!file.type.startsWith("image/")) {
          toast.error(`"${file.name}" não é uma imagem`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`"${file.name}" excede 5MB`);
          continue;
        }

        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) {
          toast.error(`Erro ao enviar "${file.name}"`);
          continue;
        }

        const { storageId } = await result.json();
        const objectUrl = URL.createObjectURL(file);
        setImages((prev) => [...prev, { storageId, url: objectUrl }]);
      }
    } catch {
      toast.error("Erro ao enviar imagens");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const productData = {
        title,
        description: description || undefined,
        categoryId: categoryId as Id<"categories">,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        quantity: parseInt(quantity),
        unit,
        expiryDate: expiryDate ? format(expiryDate, "yyyy-MM-dd") : undefined,
        pickupLocation: pickupLocation || undefined,
        pickupInstructions: pickupInstructions || undefined,
        isAvailable,
        images: images.length > 0 ? images.map((img) => img.storageId) : undefined,
      };

      if (isEditing && product) {
        await updateProduct({ id: product._id, ...productData });
      } else {
        await createProduct(productData);
      }

      router.push("/dashboard");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const unitOptions = [
    { value: "kg", label: "Quilogramas (kg)" },
    { value: "g", label: "Gramas (g)" },
    { value: "pieces", label: "Peças" },
    { value: "liters", label: "Litros (L)" },
    { value: "ml", label: "Mililitros (ml)" },
    { value: "portions", label: "Porções" },
    { value: "boxes", label: "Caixas" },
    { value: "bags", label: "Sacos" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Produto" : "Adicionar Novo Produto"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Atualize as informações do seu produto"
            : "Preencha os detalhes do seu item alimentar excedente"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Produto *</Label>
              <Input
                id="title"
                placeholder="ex: Maçãs Orgânicas Frescas"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva o seu produto, o seu estado e quaisquer notas especiais..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Imagens (até 5)</Label>
            <div className="flex flex-wrap gap-3">
              {images.map((img, index) => (
                <div
                  key={index}
                  className="relative w-24 h-24 rounded-lg overflow-hidden border border-border group"
                >
                  <img
                    src={img.url}
                    alt={`Imagem ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {images.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="h-5 w-5" />
                      <span className="text-xs">Adicionar</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground">
              JPG, PNG ou WebP. Máximo 5MB por imagem.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price">Preço de Venda (€) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="originalPrice">Preço Original (€)</Label>
              <Input
                id="originalPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="unit">Unidade *</Label>
              <Select value={unit} onValueChange={setUnit} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar unidade" />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de Validade</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !expiryDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? format(expiryDate, "PPP") : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={expiryDate} onSelect={setExpiryDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickupLocation">Local de Recolha *</Label>
            <Input
              id="pickupLocation"
              placeholder="ex: Rua Principal 123, Cidade, Código Postal"
              required
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickupInstructions">Instruções de Recolha</Label>
            <Textarea
              id="pickupInstructions"
              placeholder="Quaisquer instruções especiais para recolha (ex: tocar campainha, entrada traseira, etc.)"
              rows={2}
              value={pickupInstructions}
              onChange={(e) => setPickupInstructions(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="available" checked={isAvailable} onCheckedChange={setIsAvailable} />
            <Label htmlFor="available">Disponível para compra</Label>
          </div>

          {error && (
            <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading || isUploading} className="flex-1">
              {isLoading
                ? isEditing
                  ? "Atualizando..."
                  : "Criando..."
                : isEditing
                  ? "Atualizar Produto"
                  : "Criar Produto"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
