require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);
const app = express();

const PORT = process.env.PORT || 3100;
const REPO_PATH = process.env.REPO_PATH || "/path/to/your/repo";
const SECRET_TOKEN = process.env.SECRET_TOKEN;

if (!SECRET_TOKEN) {
  console.error("SECRET_TOKEN is not set. Exiting.");
  process.exit(1);
}

app.use(express.json());

function verifySignature(req) {
  const signature = crypto
    .createHmac("sha1", SECRET_TOKEN)
    .update(JSON.stringify(req.body))
    .digest("hex");
  return `sha1=${signature}` === req.headers["x-hub-signature"];
}

app.post("/webhook", async (req, res) => {
  console.log("Received webhook request");

  if (!verifySignature(req)) {
    console.warn("Unauthorized webhook request");
    return res.status(401).send("Unauthorized");
  }

  try {
    console.log("Starting deployment process");
    const { stdout, stderr } = await exec(
      `cd ${REPO_PATH} && git pull && ~/dev/MJLog/deploy.sh`
    );
    console.log(`Deployment stdout: ${stdout}`);
    if (stderr) {
      console.error(`Deployment stderr: ${stderr}`);
    }
    console.log("Deployment successful");
    res.status(200).send("Deployment successful");
  } catch (error) {
    console.error(`Deployment failed: ${error.message}`);
    res.status(500).send("Deployment failed");
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
