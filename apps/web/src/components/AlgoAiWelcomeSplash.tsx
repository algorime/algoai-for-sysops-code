// AlgoAI for SysOps: welcome screen shown over the app on every page load until the user closes it.
import { useState } from "react";

import builtByAlgorimeUrl from "../../../../assets/algorime/built-by-algorime.png";
import { AlertDialog, AlertDialogFooter, AlertDialogPopup } from "./ui/alert-dialog";
import { Button } from "./ui/button";

const ALGORIME_URL = "https://www.algorime.it";

// Module state, so remounting the app shell does not show it again before the next page load.
let closedThisPageLoad = false;

export function AlgoAiWelcomeSplash() {
  const [open, setOpen] = useState(!closedThisPageLoad);
  const close = () => {
    closedThisPageLoad = true;
    setOpen(false);
  };

  return (
    // Only the Close button closes it: Escape and outside presses are ignored.
    <AlertDialog open={open} onOpenChange={() => {}}>
      <AlertDialogPopup
        className="max-w-xl"
        aria-labelledby="algoai-welcome-title"
        aria-describedby="algoai-welcome-description"
      >
        <div className="flex flex-col items-center gap-6 px-6 pt-8 pb-2 text-center">
          <a
            href={ALGORIME_URL}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Algorime website"
            className="rounded-xl bg-white px-4 py-3 outline-hidden ring-ring focus-visible:ring-2 focus-visible:ring-inset"
          >
            <img src={builtByAlgorimeUrl} alt="Built by Algorime" className="h-24 w-auto" />
          </a>
          {/* The dialog title and description styles are too small for a welcome screen. */}
          <h2
            id="algoai-welcome-title"
            className="text-3xl leading-tight font-semibold tracking-tight"
          >
            AlgoAI for SysOps and DevOps
          </h2>
          <p id="algoai-welcome-description" className="text-base text-muted-foreground">
            The Algorime AI environment for SysOps and DevOps activities that will change your
            project and development strategy. Enjoy it!
          </p>
        </div>
        <AlertDialogFooter>
          <Button onClick={close}>Close</Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
