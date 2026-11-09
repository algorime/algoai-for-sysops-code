// AlgoAI for SysOps: states the app's origin next to the license notices, as the fork's MIT attribution.
import { Button } from "../ui/button";
import { SettingsRow } from "./settingsLayout";
import { searchableSetting } from "./settingsSearch";

const T3_CODE_URL = "https://github.com/pingdotgg/t3code";

export function BasedOnT3CodeSettingsRow() {
  return (
    <SettingsRow
      {...searchableSetting("based-on-t3-code")}
      description="AlgoAI for SysOps is Algorime's modified version of T3 Code by T3 Tools Inc., used under the MIT License. It is not an official T3 Code release. T3 Code's license notice is listed under Open source licenses."
      control={
        <Button
          render={<a href={T3_CODE_URL} target="_blank" rel="noreferrer noopener" />}
          size="sm"
          variant="outline"
        >
          View T3 Code
        </Button>
      }
    />
  );
}
