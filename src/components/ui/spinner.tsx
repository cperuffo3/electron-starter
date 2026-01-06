import { cn } from "@/utils/tailwind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

function Spinner({
  className,
  ...props
}: React.ComponentProps<typeof FontAwesomeIcon>) {
  return (
    <FontAwesomeIcon
      icon={faSpinner}
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
