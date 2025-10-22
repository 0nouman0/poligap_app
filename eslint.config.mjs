import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // TypeScript rules (relaxed for legacy code)
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-empty-object-type": ["warn", { allowObjectTypes: "always" }],
      "@typescript-eslint/ban-ts-comment": "warn",
      
      // React rules
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "warn",
      
      // Next.js rules
      "@next/next/no-img-element": "warn",
      "@next/next/no-assign-module-variable": "off",
      
      // Code quality rules (NEW)
      "no-console": ["error", { "allow": ["warn", "error"] }],
      "prefer-const": "warn",
      "no-var": "error",
      "no-debugger": "error",
      
      // Accessibility rules (NEW - basic set)
      // Note: Install eslint-plugin-jsx-a11y for full a11y support
      // For now, these are placeholder comments for future enhancement
    },
  },
];

export default eslintConfig;
