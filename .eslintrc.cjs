module.exports = {
  env: {
    browser: true,
    es2022: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["./tsconfig.json"],
  },
  plugins: ["@typescript-eslint", "react-hooks"],
  rules: {
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-empty-object-type": "off",
  },
  overrides: [
    {
      files: ["vite.config.ts", "tailwind.config.ts", "eslint.config.js", ".eslintrc.cjs"],
      parserOptions: {
        project: null,
      },
    },
  ],
  ignorePatterns: ["dist/", "node_modules/"],
};
