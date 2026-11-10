// AlgoAI for SysOps: welcome screen shown over the app on every page load until the user closes it.
import { useState } from "react";

import builtByAlgorimeUrl from "../../../../assets/algorime/built-by-algorime-dark-blue.png";
import { AlertDialog, AlertDialogFooter, AlertDialogPopup } from "./ui/alert-dialog";
import { Button } from "./ui/button";

const ALGORIME_URL = "https://www.algorime.it";
// Background of the Built By Algorime logo, also used for the screen's border.
const ALGORIME_DARK_BLUE = "#13294B";

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
        // Brand border kept here rather than as an AlertDialogPopup variant, so upstream files stay untouched.
        style={{ borderWidth: 2, borderColor: ALGORIME_DARK_BLUE }}
        aria-labelledby="algoai-welcome-title"
        aria-describedby="algoai-welcome-description"
      >
        <div className="flex flex-col items-center gap-6 px-6 pt-8 pb-2 text-center">
          <a
            href={ALGORIME_URL}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Algorime website"
            className="rounded-xl outline-hidden ring-ring focus-visible:ring-2 focus-visible:ring-inset"
          >
            <img src={builtByAlgorimeUrl} alt="Built by Algorime" className="h-28 w-auto" />
          </a>
          {/* The dialog title and description styles are too small for a welcome screen. */}
          <h2
            id="algoai-welcome-title"
            className="text-3xl leading-tight font-semibold tracking-tight"
          >
            AlgoAI for SysOps and DevOps
          </h2>
          <div
            id="algoai-welcome-description"
            className="flex flex-col gap-2 text-base text-muted-foreground"
          >
            <p>
              The Algorime® AI environment for SysOps and DevOps activities that will change your
              project and development strategy. Enjoy it!
            </p>
            <p>
              This is part of AlgoAI Privé, an AI platform for inference with distributed LLMs,
              built to keep your data truly private.
            </p>
          </div>
        </div>
        <AlertDialogFooter>
          <Button onClick={close}>Close</Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
