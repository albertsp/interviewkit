import Image from "next/image";

export function BrowserMockup({ src, alt, width = 1440, height = 900, label = "interviewkit.app", className = "", priority = false }) {
  return (
    <div className={`rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/20 ${className}`}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/50">
        <div className="size-2.5 rounded-full bg-destructive/60" />
        <div className="size-2.5 rounded-full bg-yellow-500/60" />
        <div className="size-2.5 rounded-full bg-emerald-500/60" />
        <span className="ml-2 text-xs text-muted-foreground font-mono truncate">{label}</span>
      </div>
      <Image src={src} alt={alt} width={width} height={height} priority={priority} className="w-full h-auto" />
    </div>
  );
}

export function CardMockup({ src, alt, width = 800, height = 600, className = "", priority = false }) {
  return (
    <div className={`rounded-2xl border border-border bg-card overflow-hidden shadow-2xl shadow-black/20 ${className}`}>
      <Image src={src} alt={alt} width={width} height={height} priority={priority} className="w-full h-auto" />
    </div>
  );
}
