import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRocket } from "@fortawesome/free-solid-svg-icons";

export function QuickStartCard() {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FontAwesomeIcon icon={faRocket} className="text-teal size-4" />
          Quick Start
        </CardTitle>
        <CardDescription>Get up and running in seconds</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="bg-muted flex items-center justify-between rounded-md px-3 py-2 font-mono text-xs">
          <code>pnpm init-project</code>
          <span className="text-muted-foreground">Setup wizard</span>
        </div>
        <div className="bg-muted flex items-center justify-between rounded-md px-3 py-2 font-mono text-xs">
          <code>pnpm start</code>
          <span className="text-muted-foreground">Development mode</span>
        </div>
        <div className="bg-muted flex items-center justify-between rounded-md px-3 py-2 font-mono text-xs">
          <code>pnpm make</code>
          <span className="text-muted-foreground">Build distributable</span>
        </div>
      </CardContent>
    </Card>
  );
}
