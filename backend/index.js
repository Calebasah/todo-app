import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { createClient } from 'redis';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ── Database ────────────────────────────────────────────────────────────────
console.log("DATABASE_URL:", process.env.DATABASE_URL || "MISSING - check .env!");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.query('SELECT NOW()')
  .then(() => console.log("✅ Connected to PostgreSQL!"))
  .catch(err => {
    console.error("❌ PostgreSQL connection failed:", err.message);
    process.exit(1);
  });

// ── Redis ───────────────────────────────────────────────────────────────────
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379',
  // password: process.env.REDIS_PASSWORD, // uncomment if using password
});

redisClient.on('error', err => console.error('Redis Client Error:', err));

let redisConnected = false;

(async () => {
  try {
    await redisClient.connect();
    redisConnected = true;
    console.log('✅ Connected to Redis!');
  } catch (err) {
    console.error('❌ Redis connection failed:', err.message);
    // Continue without Redis – fallback to DB only
  }
})();

// ── Table Creation with Retry ───────────────────────────────────────────────
(async () => {
  const createSql = `
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      task TEXT NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      await pool.query(createSql);
      console.log(`✅ Table 'todos' ready (attempt ${attempt})`);
      break;
    } catch (err) {
      console.error(`Table creation attempt ${attempt} failed: ${err.message}`);
      if (attempt === 10) {
        console.error("Max attempts reached – table might be missing!");
      }
      await new Promise(r => setTimeout(r, 2000));
    }
  }
})();

// ── Routes ──────────────────────────────────────────────────────────────────
app.get('/api/todos', async (req, res) => {
  const cacheKey = 'todos:all';
  try {
    // Try cache first (only if Redis is connected)
    if (redisConnected) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log('Cache hit');
        return res.json(JSON.parse(cached));
      }
    }

    // Cache miss or Redis unavailable → go to DB
    const result = await pool.query(
      'SELECT * FROM todos ORDER BY created_at DESC LIMIT 20'
    );
    const todos = result.rows;

    // Cache the result if Redis is available
    if (redisConnected) {
      await redisClient.setEx(cacheKey, 60, JSON.stringify(todos));
      console.log('Cache miss – stored new todos');
    }

    res.json(todos);
  } catch (err) {
    console.error('GET /api/todos error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/todos', async (req, res) => {
  const { task } = req.body;
  if (!task?.trim()) {
    return res.status(400).json({ error: 'Task is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO todos (task) VALUES ($1) RETURNING *',
      [task.trim()]
    );

    // Invalidate cache after new todo
    if (redisConnected) {
      await redisClient.del('todos:all');
      console.log('Cache invalidated after POST');
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /api/todos error:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend listening on http://0.0.0.0:${port}`);
});