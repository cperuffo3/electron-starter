import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWandMagicSparkles,
  faBoxOpen,
  faPalette,
  faCode,
} from "@fortawesome/free-solid-svg-icons";

export function CustomizationCard() {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FontAwesomeIcon
            icon={faWandMagicSparkles}
            className="text-teal size-4"
          />
          Customize Your App
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-start gap-2">
          <FontAwesomeIcon
            icon={faBoxOpen}
            className="text-muted-foreground mt-0.5 size-3"
          />
          <p className="text-muted-foreground text-[11px]">
            Run <code className="text-foreground">pnpm init-project</code> to
            set your app name, ID, and author info
          </p>
        </div>
        <div className="flex items-start gap-2">
          <FontAwesomeIcon
            icon={faPalette}
            className="text-muted-foreground mt-0.5 size-3"
          />
          <p className="text-muted-foreground text-[11px]">
            Replace{" "}
            <code className="text-foreground">assets/icons/icon.svg</code> and
            run <code className="text-foreground">pnpm generate-icons</code>
          </p>
        </div>
        <div className="flex items-start gap-2">
          <FontAwesomeIcon
            icon={faCode}
            className="text-muted-foreground mt-0.5 size-3"
          />
          <p className="text-muted-foreground text-[11px]">
            Add routes in <code className="text-foreground">src/routes/</code>{" "}
            and IPC handlers in{" "}
            <code className="text-foreground">src/ipc/</code>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
