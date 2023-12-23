import Prism from "prism";
import typescript from "https://esm.sh/v131/prismjs@1.29.0/denonext/components/prism-typescript.js";
import jsx from "https://esm.sh/v131/prismjs@1.29.0/denonext/components/prism-jsx.js";
import tsx from "https://esm.sh/v131/prismjs@1.29.0/denonext/components/prism-tsx.js";
import type { Lang } from "./MdastNode.ts";

Prism.languages.typescript = typescript;
Prism.languages.jsx = jsx;
Prism.languages.tsx = tsx;

export default (code: string | undefined, lang: Lang | undefined) => {
  if (!code) return "";
  if (!lang) return code;

  try {
    return Prism.highlight(code, Prism.languages[lang], lang);
  } catch (e) {
    console.warn("Prism highlighting failed", e);
    return code;
  }
};
