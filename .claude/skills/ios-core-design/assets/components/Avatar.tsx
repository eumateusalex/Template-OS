/**
 * Avatar — pessoa ou conta em círculo: foto → iniciais → glifo de pessoa.
 * Referência: references/components/avatar.md · Valores: assets/tokens.css
 */
import { User } from "@phosphor-icons/react";

export interface AvatarProps {
  /** URL da foto. Sem foto, caem as iniciais do nome; sem nome, o glifo. */
  src?: string;
  /** Nome da pessoa — vira alt da foto e fonte das iniciais. */
  name?: string;
  size?: "sm" | "md" | "lg";
  /** true quando o nome já está escrito ao lado (evita repetição no leitor). */
  decorative?: boolean;
  className?: string;
}

const SIZE: Record<string, string> = {
  sm: "h-8 w-8 text-ios-caption1",
  md: "h-10 w-10 text-ios-subheadline",
  lg: "h-16 w-16 text-ios-title3",
};

/* "Ana Ribeiro" → "AR" (primeira letra do primeiro e do último nome) */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function Avatar({ src, name, size = "md", decorative = false, className }: AvatarProps) {
  const base = [
    "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-ios-pill select-none",
    SIZE[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (src) {
    return (
      <img src={src} alt={decorative ? "" : name ? `Foto de ${name}` : ""} className={[base, "object-cover"].join(" ")} />
    );
  }

  return (
    <span className={[base, "bg-ios-fill text-ios-label-secondary"].join(" ")} aria-hidden={decorative || undefined}>
      {name ? (
        <span aria-hidden="true" className="font-semibold uppercase">
          {initials(name)}
        </span>
      ) : (
        <User aria-hidden="true" />
      )}
      {/* nome acessível quando o avatar está sozinho (não decorativo) */}
      {!decorative && name && <span className="sr-only">{name}</span>}
    </span>
  );
}
