// AlgoAI for SysOps: warns every user of the web client when its build and the T3 server differ.
// The server updates itself and this client does not; upstream's own mismatch banner only
// covers a server older than the client, so a client left behind would go unnoticed.
import { useAtomValue } from "@effect/atom-react";
import { TriangleAlertIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { APP_VERSION } from "../branding";
import { primaryServerConfigAtom } from "../state/server";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";

// Issues opened by `scripts/algoai-update.sh --notify` when the versions differ.
const ALIGN_ISSUES_URL =
  "https://github.com/algorime/algoai-for-sysops/issues?q=is%3Aissue%20is%3Aopen%20%22Align%20the%20branded%20web%20client%22";

// Module state: closing hides it until the next page load, not for good.
let closedThisPageLoad = false;

function versionCore(version: string): string {
  return version.trim().replace(/[-+].*$/, "");
}

export function AlgoAiVersionBanner() {
  const serverVersion = useAtomValue(primaryServerConfigAtom)?.environment.serverVersion;
  const [closed, setClosed] = useState(closedThisPageLoad);
  if (closed || !serverVersion || versionCore(serverVersion) === versionCore(APP_VERSION)) {
    return null;
  }
  const close = () => {
    closedThisPageLoad = true;
    setClosed(true);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-2 z-50 flex justify-center px-2">
      {/* The shadow sits on a wrapper: Alert owns its own effects. */}
      <div className="pointer-events-auto w-full max-w-2xl rounded-xl shadow-lg">
        <Alert variant="warning" role="alert">
          <TriangleAlertIcon />
          <AlertTitle>
            AlgoAI for SysOps is {APP_VERSION}, the T3 server is {serverVersion}
          </AlertTitle>
          <AlertDescription>
            <p>
              Some features may not work until the client is updated. The administrator has been
              notified:{" "}
              <a
                href={ALIGN_ISSUES_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="underline underline-offset-2"
              >
                update issue
              </a>
              .
            </p>
          </AlertDescription>
          <AlertAction>
            <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={close}>
              <XIcon />
            </Button>
          </AlertAction>
        </Alert>
      </div>
    </div>
  );
}
