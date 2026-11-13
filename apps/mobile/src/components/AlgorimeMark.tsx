// The Algorime fan mark that replaces the T3 wordmark in this fork's branding.
import { Image } from "expo-image";

const ALGORIME_MARK_SOURCE = require("../../../../assets/algorime/algorime-mark-64.png");

export function AlgorimeMark(props: { readonly size: number }) {
  return (
    <Image
      source={ALGORIME_MARK_SOURCE}
      accessibilityIgnoresInvertColors
      style={{ width: props.size, height: props.size }}
    />
  );
}
