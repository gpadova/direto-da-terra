"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./star-rating";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ReviewDialogProps {
  orderId: Id<"orders">;
  sellerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReviewDialog({
  orderId,
  sellerName,
  open,
  onOpenChange,
}: ReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createReview = useMutation(api.reviews.create);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Selecione uma avaliação");
      return;
    }

    setIsSubmitting(true);
    try {
      await createReview({
        orderId,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success("Avaliação enviada com sucesso!");
      setRating(0);
      setComment("");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao enviar avaliação"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar Vendedor</DialogTitle>
          <DialogDescription>
            Como foi sua experiência com {sellerName}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex flex-col items-center gap-2">
            <StarRating value={rating} onChange={setRating} size="lg" />
            <span className="text-sm text-muted-foreground">
              {rating === 0
                ? "Clique para avaliar"
                : rating === 1
                  ? "Ruim"
                  : rating === 2
                    ? "Regular"
                    : rating === 3
                      ? "Bom"
                      : rating === 4
                        ? "Muito bom"
                        : "Excelente"}
            </span>
          </div>

          <Textarea
            placeholder="Deixe um comentário (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Avaliação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
