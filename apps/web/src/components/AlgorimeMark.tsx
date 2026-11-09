// The Algorime fan mark that replaces the T3 wordmark in this fork's branding.
import algorimeMarkUrl from "../../../../assets/algorime/algorime-mark-64.png";

export function AlgorimeMark(props: { readonly className?: string }) {
  return <img src={algorimeMarkUrl} alt="" className={props.className} />;
}
