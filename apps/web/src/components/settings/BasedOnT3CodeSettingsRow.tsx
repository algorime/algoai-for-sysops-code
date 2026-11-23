// AlgoAI for SysOps: states the app's origin next to the license notices, as the fork's MIT attribution.
import { T, useGT } from "gt-react";

import { Button } from "../ui/button";
import { SettingsRow } from "./settingsLayout";
import { useSearchableSetting } from "./settingsSearch";

const T3_CODE_URL = "https://github.com/pingdotgg/t3code";

export function BasedOnT3CodeSettingsRow() {
  const gt = useGT();
  const setting = useSearchableSetting();
  return (
    <SettingsRow
      {...setting("based-on-t3-code")}
      description={gt(
        "Algorime's modified version of T3 Code by T3 Tools Inc., used under the MIT License. Not an official T3 Code release. Its notice is listed as @t3code under Open source licenses.",
      )}
      control={
        <Button
          render={<a href={T3_CODE_URL} target="_blank" rel="noreferrer noopener" />}
          size="sm"
          variant="outline"
        >
          <T>View T3 Code</T>
        </Button>
      }
    />
  );
}
