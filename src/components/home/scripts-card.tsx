import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTerminal } from "@fortawesome/free-solid-svg-icons";

export function ScriptsCard() {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FontAwesomeIcon icon={faTerminal} className="text-teal size-4" />
          Available Scripts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between">
            <code className="text-teal">lint</code>
            <span className="text-muted-foreground">ESLint check</span>
          </div>
          <div className="flex justify-between">
            <code className="text-teal">format</code>
            <span className="text-muted-foreground">Prettier format</span>
          </div>
          <div className="flex justify-between">
            <code className="text-teal">package</code>
            <span className="text-muted-foreground">Package app</span>
          </div>
          <div className="flex justify-between">
            <code className="text-teal">publish</code>
            <span className="text-muted-foreground">GitHub release</span>
          </div>
          <div className="flex justify-between">
            <code className="text-teal">release</code>
            <span className="text-muted-foreground">Version bump</span>
          </div>
          <div className="flex justify-between">
            <code className="text-teal">init-project</code>
            <span className="text-muted-foreground">Setup wizard</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
