const express = require("express");
const crypto = require("crypto");
const { exec } = require("child_process");
const app = express();

const PORT = 3100;
const REPO_PATH = "https://github.com/minai621/MJLog";
const SECRET_TOKEN = process.env.PAT;

if (!SECRET_TOKEN) {
  console.log("not found sercet token");
}

app.use(express.json());

function verifySignature(req) {
  const signature = crypto
    .createHmac("sha1", SECRET_TOKEN)
    .update(JSON.stringify(req.body))
    .digest("hex");
  return `sha1=${signature}` === req.headers["x-hub-signature"];
}

app.post("/webhook", (req, res) => {
  if (!verifySignature(req)) {
    return res.status(401).send("Unauthorized");
  }

  exec(`cd ${REPO_PATH} && git pull && ./deploy`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send("Deployment failed");
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
    res.status(200).send("Deployment successful");
  });
});

app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
