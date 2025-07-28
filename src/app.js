import dotenv from "dotenv";
import express from "express";
import { logger } from "./utils/logger.js";
import routes from "./routes/index.js";
import { docClient, dynamodbAdmin } from "./utils/dynamodbconfig.js";


dotenv.config();
const app = express();

app.use(express.json());

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

app.get('/details', async (req, res) => {
  const { tableName } = req.query;

  if (!tableName) {
    return res.status(400).json({ error: 'Missing tableName query parameter' });
  }

  const params = {
    TableName: tableName,
  };

  try {
    const data = await dynamodbAdmin.describeTable(params).promise();

    const keySchema = data.Table.KeySchema;
    const attributeDefinitions = data.Table.AttributeDefinitions;

    res.json({
      TableName: tableName,
      KeySchema: keySchema,
      AttributeDefinitions: attributeDefinitions,
    });
  } catch (err) {
    console.error('Error describing DynamoDB table:', err);
    res.status(500).json({ error: 'Could not describe table', details: err.message });
  }
});

app.get("/", (req, res) => {
  logger.info("Root endpoint hit")
  res.status(200).json({ message: "daas-x-textvold-api working fine 🚀" });
});

app.use("/api", routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});