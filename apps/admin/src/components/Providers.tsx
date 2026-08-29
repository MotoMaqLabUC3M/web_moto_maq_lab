"use client";

import { ConfirmProvider } from "./ConfirmProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ConfirmProvider>{children}</ConfirmProvider>;
}
