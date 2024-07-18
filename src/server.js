require("dotenv").config();
const express = require("express");
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);
const app = express();

const PORT = process.env.PORT || 3100;
const file_path = "~/dev/MJLog";
const SECRET_TOKEN = process.env.SECRET_TOKEN;

if (!SECRET_TOKEN) {
  console.error("SECRET_TOKEN is not set. Exiting.");
  process.exit(1);
}

app.use(express.json());

function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.split(" ")[1];
  return token === SECRET_TOKEN;
}

app.post("/webhook/pull", async (req, res) => {
  console.log("Received webhook request");

  if (!verifyToken(req)) {
    console.warn("Unauthorized webhook request");
    return res.status(401).json({ error: "Unauthorized" }); // Return and terminate function
  }

  try {
    console.log("Starting deployment process");
    const { stdout, stderr } = await exec(`cd ${file_path} && ./deploy.sh`, {
      timeout: 2 * 60 * 1000,
    });
    console.log(`Deployment stdout: ${stdout}`);
    if (stderr) {
      console.error(`Deployment stderr: ${stderr}`);
    }
    console.log("Deployment successful");
    return res.status(200).json({ status: 200, message: "success" }); // Return and terminate function
  } catch (error) {
    console.error(`Deployment failed: ${error.message}`);
    return res.status(500).json({ status: 500, error: "Deployment failed" }); // Return and terminate function
  }
});

app.use((req, res) => {
  res.status(404).send("Not Found");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
