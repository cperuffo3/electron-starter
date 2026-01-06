import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRobot,
  faFileLines,
  faLayerGroup,
  faListCheck,
} from "@fortawesome/free-solid-svg-icons";

export function AiSectionCard() {
  return (
    <Card size="sm" className="border-teal/30 bg-teal/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FontAwesomeIcon icon={faRobot} className="text-teal size-4" />
          Start with AI
        </CardTitle>
        <CardDescription>
          Use Claude Code to design and build your app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-muted rounded-md px-3 py-2 font-mono text-xs">
          <code className="text-teal">/create-app-spec</code>{" "}
          <span className="text-muted-foreground">your app description</span>
        </div>
        <p className="text-muted-foreground text-[11px]">
          This command walks you through creating a complete specification for
          your app in three phases:
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="bg-background flex items-center gap-2 rounded-md px-3 py-2">
            <FontAwesomeIcon
              icon={faFileLines}
              className="text-teal size-3 shrink-0"
            />
            <div>
              <p className="text-xs font-medium">Project Brief</p>
              <p className="text-muted-foreground text-[10px]">
                Goals, users & scope
              </p>
            </div>
          </div>
          <div className="bg-background flex items-center gap-2 rounded-md px-3 py-2">
            <FontAwesomeIcon
              icon={faLayerGroup}
              className="text-teal size-3 shrink-0"
            />
            <div>
              <p className="text-xs font-medium">UI/UX Spec</p>
              <p className="text-muted-foreground text-[10px]">
                Screens & components
              </p>
            </div>
          </div>
          <div className="bg-background flex items-center gap-2 rounded-md px-3 py-2">
            <FontAwesomeIcon
              icon={faListCheck}
              className="text-teal size-3 shrink-0"
            />
            <div>
              <p className="text-xs font-medium">Implementation</p>
              <p className="text-muted-foreground text-[10px]">
                Tasks & file paths
              </p>
            </div>
          </div>
        </div>
        <p className="text-muted-foreground text-[11px]">
          After completing the spec, Claude can implement your app step-by-step
          following the generated plan.
        </p>
      </CardContent>
    </Card>
  );
}
