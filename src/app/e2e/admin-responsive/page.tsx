import { notFound } from "next/navigation";
import { HarnessClient } from "./HarnessClient";

export default function ResponsiveAdminHarness(): React.ReactElement {
  if (process.env.E2E_HARNESS !== "1") notFound();
  return <HarnessClient />;
}
