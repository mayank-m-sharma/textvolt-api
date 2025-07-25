import { Router } from "express";
import path from "path";
import fs from "fs";

const __dirname = path.resolve();

const logsRouter = Router();

logsRouter.get("/", (req, res) => {
    const logDir = path.join(__dirname, "../logs");

    const latestLogFile = fs
      .readdirSync(logDir)
      .filter((f) => f.startsWith("app-") && f.endsWith(".log"))
      .sort()
      .reverse()[0];
  
    if (!latestLogFile) {
      return res.status(404).send("No log files found");
    }
  
    const fullPath = path.join(logDir, latestLogFile);
    fs.readFile(fullPath, "utf8", (err, data) => {
      if (err) return res.status(500).send("Could not read latest log file");
      res.setHeader("Content-Type", "text/plain");
      res.send(data);
    });
})

export default logsRouter; 