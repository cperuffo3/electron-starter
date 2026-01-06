import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCode,
  faPalette,
  faPlug,
  faCog,
} from "@fortawesome/free-solid-svg-icons";

export function FeaturesGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card size="sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xs">
            <FontAwesomeIcon icon={faCode} className="text-teal size-3" />
            IPC with oRPC
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-[11px]">
            Type-safe communication between main and renderer processes
          </p>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xs">
            <FontAwesomeIcon icon={faPalette} className="text-teal size-3" />
            shadcn/ui
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-[11px]">
            Beautiful, accessible components ready to customize
          </p>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xs">
            <FontAwesomeIcon icon={faPlug} className="text-teal size-3" />
            TanStack Router
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-[11px]">
            File-based routing with full type safety
          </p>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xs">
            <FontAwesomeIcon icon={faCog} className="text-teal size-3" />
            Auto Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-[11px]">
            Built-in update system via electron-updater
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
