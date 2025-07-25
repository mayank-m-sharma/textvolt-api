import dotenv from "dotenv";
import express from "express";
import { logger } from "./utils/logger.js";
import routes from "./routes/index.js";
import { docClient } from "./utils/dynamodbconfig.js";


dotenv.config();
const app = express();



app.get('/numbers', async (req, res) => {
  const params = {
    TableName: 'analytics',
  };

  try {
    const data = await docClient.scan(params).promise();
    res.json(data.Items);
  } catch (err) {
    console.error('Error scanning DynamoDB:', err);
    res.status(500).json({ error: 'Could not retrieve data' });
  }
});

app.use(express.json());
app.get("/", (req, res) => {
  logger.info("Root endpoint hit")
  res.status(200).json({ message: "daas-x-textvold-api working fine 🚀" });
});

app.use("/api", routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});