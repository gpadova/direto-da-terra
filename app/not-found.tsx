import { NotFoundState } from "@/components/not-found-state";

export default function NotFound() {
  return (
    <NotFoundState
      title="Página não encontrada"
      description="A página que você procura não existe ou foi removida."
    />
  );
}
