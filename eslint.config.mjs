import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  { ignores: ["__template_fix/**"] },
  ...nextCoreWebVitals,
  ...nextTypescript
];

export default eslintConfig;
