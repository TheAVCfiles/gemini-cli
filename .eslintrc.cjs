module.exports = {
  root: true,
  env: { es2022: true, node: true, browser: true },
  extends: ["eslint:recommended","plugin:import/recommended","prettier"],
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  rules: { "import/order": ["warn", { "newlines-between": "always" }] }
};
