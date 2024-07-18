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
    return res.status(401).send("Unauthorized");
  }

  try {
    console.log("Starting deployment process");
    const { stdout, stderr } = await exec(`cd ${file_path} && ./deploy.sh`);
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
