export const packageConfig = {
  name: "digital-twin-web",
  version: "1.0.0",
  description: "Web package for digital twin project",
  main: "index.ts",
  scripts: {
    start: "npm run dev",
    dev: "webpack serve --config webpack.config.ts",
    build: "webpack --config webpack.config.ts"
  },
  repository: {
    type: "git",
    url: "git+https://github.com/PredictiveMovement/digital-twin.git"
  },
  author: "",
  license: "ISC",
  bugs: {
    url: "https://github.com/PredictiveMovement/digital-twin/issues"
  },
  homepage: "https://github.com/PredictiveMovement/digital-twin#readme",
  dependencies: {
    react: "^18.0.0",
    "react-dom": "^18.0.0"
  },
  devDependencies: {
    typescript: "^5.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    webpack: "^5.0.0",
    "webpack-cli": "^5.0.0",
    "webpack-dev-server": "^5.0.0"
  }
};
