const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static portfolio from "public" folder
app.use("/", express.static(path.join(__dirname, "public")));

// Proxy "/project" to the project app
app.use(
  "/ambtrack",
  createProxyMiddleware({
    target: "ambtrack.railway.internal:3000",
    changeOrigin: true,
    pathRewrite: {
      "^/ambtrack": "/",
    },
  })
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
