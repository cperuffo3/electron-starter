import { createFileRoute } from "@tanstack/react-router";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  HeroSection,
  QuickStartCard,
  FeaturesGrid,
  ScriptsCard,
  CustomizationCard,
  AiSectionCard,
} from "@/components/home";

function WelcomePage() {
  const handleTestToast = () => {
    toast.success("Toast is working!", {
      description: "Sonner is properly configured.",
    });
  };

  return (
    <div
      className="relative flex h-full flex-col"
      style={{ background: "var(--gradient-page)" }}
    >
      <ScrollArea className="flex-1">
        <HeroSection />
        <Separator />

        <div className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-6 pt-6">
          {/* Top Row: Quick Start + Features Grid */}
          <div className="grid gap-5 lg:grid-cols-2">
            <QuickStartCard />
            <FeaturesGrid />
          </div>

          {/* Bottom Row: Scripts + Customization */}
          <div className="grid gap-5 lg:grid-cols-2">
            <ScriptsCard />
            <CustomizationCard />
          </div>

          {/* Start with AI */}
          <AiSectionCard />
        </div>
      </ScrollArea>

      {/* Test Toast Button */}
      <Button
        size="lg"
        onClick={handleTestToast}
        className="absolute bottom-4 left-12 w-60"
      >
        Test Toast
      </Button>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: WelcomePage,
});
