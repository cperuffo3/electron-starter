import { useQuery } from "@tanstack/react-query";

import { getAppVersion, getPlatform } from "../actions/app-actions";

export function useAppVersionQuery() {
  return useQuery({
    queryKey: ["app", "version"],
    queryFn: getAppVersion,
    staleTime: Infinity,
  });
}

export function usePlatformQuery() {
  return useQuery({
    queryKey: ["app", "platform"],
    queryFn: getPlatform,
    staleTime: Infinity,
  });
}
