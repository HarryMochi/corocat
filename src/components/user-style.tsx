"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";



export type UsernameStyleKey =
  | "none"
  | "golden"
  | "sunset"
  | "aurora"
  | "neon"
  | "pastel";

export const USERNAME_STYLES = [
  {
    key: "none",
    label: "Clean",
    description: "Minimal, elegant solid color.",
    className: "text-primary",
    chipClassName:
      "bg-muted text-foreground border border-border/60 hover:border-primary/70",
  },
  {
    key: "golden",
    label: "Royal Gold",
    description: "Rich golden gradient for premium flex.",
    className:
      "bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(250,204,21,0.55)]",
    chipClassName:
      "bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-black shadow-sm",
  },
  {
    key: "sunset",
    label: "Sunset Bloom",
    description: "Warm pink–orange sunset glow.",
    className:
      "bg-gradient-to-r from-pink-400 via-rose-400 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_16px_rgba(251,113,133,0.6)]",
    chipClassName:
      "bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 text-white shadow-sm",
  },
  {
    key: "aurora",
    label: "Aurora Sky",
    description: "Cool cyan–emerald aurora.",
    className:
      "bg-gradient-to-r from-sky-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(45,212,191,0.7)]",
    chipClassName:
      "bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 text-white shadow-sm",
  },
  {
    key: "neon",
    label: "Neon Pulse",
    description: "Electric neon magenta + blue.",
    className:
      "bg-gradient-to-r from-fuchsia-400 via-purple-400 to-sky-400 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(192,132,252,0.8)]",
    chipClassName:
      "bg-gradient-to-r from-fuchsia-500 via-purple-500 to-sky-400 text-white shadow-sm",
  },
  {
    key: "pastel",
    label: "Soft Pastel",
    description: "Subtle, airy pastel blend.",
    className:
      "bg-gradient-to-r from-slate-300 via-rose-200 to-sky-200 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(148,163,184,0.6)]",
    chipClassName:
      "bg-gradient-to-r from-slate-200 via-rose-100 to-sky-100 text-slate-900 shadow-inner",
  },
] as const;



type UsernameProps = {
  name: string;
  styleKey?: UsernameStyleKey | string | null;
  isPremium: boolean;
  className?: string;
};

export function PremiumUsername({
  name,
  styleKey,
  isPremium,
  className,
}: UsernameProps) {
  const effectiveKey: UsernameStyleKey = isPremium
    ? ((styleKey as UsernameStyleKey) || "golden")
    : "none";

  const style =
    USERNAME_STYLES.find((s) => s.key === effectiveKey) ||
    USERNAME_STYLES[0];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-balance",
        isPremium && "relative",
        className
      )}
    >
      <span className={cn("font-headline", style.className)}>{name}</span>

      {isPremium && (
        <span className="pointer-events-none absolute inset-0 -z-10 blur-2xl opacity-40 bg-gradient-to-r from-yellow-300/60 via-fuchsia-300/50 to-cyan-300/60" />
      )}
    </span>
  );
}



export type AvatarEffectKey =
  | "none"
  | "sparkles-gold"
  | "sparkles-cyan"
  | "halo-gold"
  | "glow-purple"
  | "ring-gradient";

export const AVATAR_EFFECTS = [
  {
    key: "none",
    label: "No Effect",
    description: "Clean circular avatar.",
    wrapperClassName: "",
    ringClassName: "border-primary/20",
    glowClassName: undefined,
    sparkleClassName: undefined,
  },
  {
    key: "sparkles-gold",
    label: "Golden Sparkles",
    description: "Soft golden sparkles orbiting your avatar.",
    wrapperClassName:
      "relative drop-shadow-[0_0_20px_rgba(250,204,21,0.85)] motion-safe:animate-[spin_18s_linear_infinite]",
    ringClassName:
      "border-transparent bg-gradient-to-tr from-yellow-300 via-amber-400 to-yellow-500 p-[2px]",
    glowClassName:
      "absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-300/40 via-amber-400/30 to-yellow-500/40 blur-2xl opacity-90 animate-[pulse_2.4s_ease-in-out_infinite]",
    sparkleClassName:
      "bg-yellow-300/80 shadow-[0_0_18px_rgba(250,204,21,0.9)]",
  },
  {
    key: "sparkles-cyan",
    label: "Cyan Comets",
    description: "Cool cyan sparkles with a futuristic aura.",
    wrapperClassName:
      "relative drop-shadow-[0_0_22px_rgba(56,189,248,0.9)] motion-safe:animate-[spin_22s_linear_infinite]",
    ringClassName:
      "border-transparent bg-gradient-to-tr from-cyan-300 via-sky-400 to-emerald-400 p-[2px]",
    glowClassName:
      "absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-300/40 via-sky-400/30 to-emerald-400/40 blur-2xl opacity-80 animate-[pulse_2.8s_ease-in-out_infinite]",
    sparkleClassName:
      "bg-cyan-300/90 shadow-[0_0_18px_rgba(56,189,248,0.95)]",
  },
  {
    key: "halo-gold",
    label: "Crown Halo",
    description: "Elegant golden halo floating above your avatar.",
    wrapperClassName:
      "relative drop-shadow-[0_0_24px_rgba(234,179,8,0.8)] pt-3",
    ringClassName:
      "border-2 border-yellow-300/80 ring-2 ring-yellow-400/60 ring-offset-2 ring-offset-background",
    glowClassName:
      "absolute -top-3 left-1/2 h-2 w-10 -translate-x-1/2 rounded-full bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-200 opacity-80 blur-md animate-[pulse_2.4s_ease-in-out_infinite]",
  },
  {
    key: "glow-purple",
    label: "Nebula Glow",
    description: "Deep purple nebula with soft breathing glow.",
    wrapperClassName:
      "relative drop-shadow-[0_0_26px_rgba(168,85,247,0.85)]",
    ringClassName:
      "border-transparent bg-gradient-to-tr from-fuchsia-400 via-purple-500 to-indigo-500 p-[2px]",
    glowClassName:
      "absolute inset-0 rounded-full bg-gradient-to-tr from-fuchsia-400/40 via-purple-500/30 to-indigo-500/40 blur-3xl opacity-90 animate-[pulse_3s_ease-in-out_infinite]",
  },
  {
    key: "ring-gradient",
    label: "Orbit Ring",
    description: "Sharp, crisp gradient ring with subtle orbit.",
    wrapperClassName:
      "relative drop-shadow-[0_0_18px_rgba(59,130,246,0.75)]",
    ringClassName:
      "border-2 border-transparent bg-gradient-to-tr from-sky-400 via-cyan-400 to-emerald-400 p-[2px] ring-2 ring-sky-400/50 ring-offset-2 ring-offset-background",
  },
] as const;



type AvatarSize = "sm" | "md" | "lg" | "xl";

const sizeToClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-16 w-16",
  xl: "h-32 w-32",
};

type PremiumAvatarProps = {
  src?: string | null;
  alt?: string | null;
  initials: string;
  effectKey?: AvatarEffectKey | string | null;
  isPremium: boolean;
  size?: AvatarSize;
  className?: string;
};

export function PremiumAvatar({
  src,
  alt,
  initials,
  effectKey,
  isPremium,
  size = "md",
  className,
}: PremiumAvatarProps) {
  const effectiveKey: AvatarEffectKey = isPremium
    ? ((effectKey as AvatarEffectKey) || "sparkles-gold")
    : "none";

  const effect =
    AVATAR_EFFECTS.find((e) => e.key === effectiveKey) ||
    AVATAR_EFFECTS[0];

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center",
        sizeToClasses[size],
        effect.wrapperClassName,
        className
      )}
    >
      {isPremium && effect.glowClassName && (
        <div aria-hidden className={effect.glowClassName} />
      )}

      {isPremium && effect?.sparkleClassName && (
        <>
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute -top-1.5 -left-1.5 h-2.5 w-2.5 rounded-full animate-ping",
              effect.sparkleClassName
            )}
          />
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute -bottom-1 -right-2 h-2 w-2 rounded-full animate-[ping_2.2s_ease-out_infinite]",
              effect.sparkleClassName
            )}
          />
        </>
      )}

      <div
        className={cn(
          "relative rounded-full flex items-center justify-center",
          effect.ringClassName
        )}
      >
        <Avatar className={cn(sizeToClasses[size], "border-0 bg-background")}>
          <AvatarImage
            src={src ?? undefined}
            alt={alt ?? undefined}
            className="object-cover"
          />
          <AvatarFallback className="bg-[#f5f5dc] text-black font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}