const OFF = 0;

module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "plugin:@typescript-eslint/recommended",
    "prettier/@typescript-eslint",
    "plugin:prettier/recommended"
  ],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module" 
  },
  rules: {
     "@typescript-eslint/no-var-requires": OFF,
    "@typescript-eslint/no-explicit-any": OFF
  }
};
