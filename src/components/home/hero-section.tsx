import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  return (
    <div className="from-teal/10 via-teal/5 flex flex-col items-center gap-5 bg-linear-to-b to-transparent px-6 pt-10 pb-6">
      <div className="bg-card ring-border flex size-20 items-center justify-center rounded-2xl shadow-lg ring-1">
        <img src="assets/icons/icon.svg" alt="App Icon" className="size-12" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Electron Starter</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          A modern Electron app with React, Tailwind CSS 4, and shadcn/ui
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Badge variant="secondary">Electron Forge</Badge>
        <Badge variant="secondary">Vite</Badge>
        <Badge variant="secondary">React 19</Badge>
        <Badge variant="secondary">TypeScript</Badge>
        <Badge variant="secondary">oRPC</Badge>
      </div>
    </div>
  );
}
