import { describe, expect, it } from "vite-plus/test";

import {
  decodeThirdPartyLicenseManifest,
  presentThirdPartyLicenseEntries,
  thirdPartyLicenseEntryKey,
  type ThirdPartyLicenseEntry,
} from "./thirdPartyLicenses.js";

const ENTRIES: ReadonlyArray<ThirdPartyLicenseEntry> = [
  {
    bundles: ["web"],
    kind: "package",
    license: "MIT",
    name: "react",
    noticeText: "React license",
    sourceUrl: "https://react.dev",
    version: "19.2.6",
  },
  {
    bundles: ["assets", "mobile"],
    kind: "custom",
    license: "CC-BY-4.0",
    name: "sample-icons",
    noticeText: "Icon notice",
    sourceUrl: null,
    version: null,
  },
];

describe("third-party license manifests", () => {
  it("rejects unsafe source links", () => {
    expect(() =>
      decodeThirdPartyLicenseManifest({
        schemaVersion: 1,
        entries: [{ ...ENTRIES[0]!, sourceUrl: "javascript:alert(1)" }],
      }),
    ).toThrow("invalid shape");
  });

  it("puts the T3 Code notice first and leaves every other notice in place", () => {
    const upstream: ThirdPartyLicenseEntry = {
      ...ENTRIES[0]!,
      kind: "custom",
      name: "T3 Code",
      version: null,
    };
    const presented = presentThirdPartyLicenseEntries([ENTRIES[0]!, upstream, ENTRIES[1]!]);

    expect(presented.map((entry) => entry.name)).toEqual(["T3 Code", "react", "sample-icons"]);
    expect(presentThirdPartyLicenseEntries(ENTRIES)).toBe(ENTRIES);
  });

  it("uses distinct navigation keys when names and versions contain delimiters", () => {
    const first = thirdPartyLicenseEntryKey({ ...ENTRIES[0]!, name: "a:1", version: null });
    const second = thirdPartyLicenseEntryKey({ ...ENTRIES[0]!, name: "a", version: "1:custom" });

    expect(first).not.toBe(second);
  });
});
