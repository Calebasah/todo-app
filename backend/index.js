import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
app.use(cors());
app.use(express.json());

console.log("Backend starting...");
console.log("DATABASE_URL:", process.env.DATABASE_URL || "MISSING - check .env and compose!");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test connection
pool.query('SELECT NOW()')
  .then(() => console.log("✅ Connected to PostgreSQL!"))
  .catch(err => {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1); // crash if can't connect
  });

// Create table with retry (runs once on startup)
(async () => {
  const createSql = `
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      task TEXT NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const maxAttempts = 10;
  const delayMs = 2000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await pool.query(createSql);
      console.log(`✅ Table 'todos' ready (attempt ${attempt})`);
      break;
    } catch (err) {
      console.error(`Table creation attempt ${attempt} failed: ${err.message}`);
      if (attempt === maxAttempts) {
        console.error("Max attempts reached - table might be missing!");
        break;
      }
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
})();

// Routes
app.get('/api/todos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM todos ORDER BY created_at DESC LIMIT 20');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/todos', async (req, res) => {
  const { task } = req.body;
  if (!task?.trim()) return res.status(400).json({ error: 'Task required' });

  try {
    const result = await pool.query(
      'INSERT INTO todos (task) VALUES ($1) RETURNING *',
      [task.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(5000, '0.0.0.0', () => {
  console.log("Backend listening on http://0.0.0.0:5000");
});