import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      // Flags the classic "setLoading(true) before an async fetch" effect
      // pattern used throughout this app; that pattern is intentional here,
      // not a bug the rule is meant to catch.
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
