import { Hono } from 'hono';
import { z } from 'zod';
import { collectiveMemory } from '../services/collective-memory.js';
import { apiRateLimit } from '../middleware/rate-limit.js';

const app = new Hono();

app.get('/facts', apiRateLimit(), async (c) => {
  const query = c.req.query('q');
  let facts;
  
  if (query) {
    facts = await collectiveMemory.searchFacts(query);
  } else {
    facts = await collectiveMemory.getAllFacts();
  }
  
  return c.json({ success: true, data: facts });
});

app.post('/facts', apiRateLimit(), async (c) => {
  const body = factSchema.parse(await c.req.json());
  const fact = await collectiveMemory.storeFact({
    ...body,
    tags: body.tags || []
  });
  return c.json({ success: true, data: fact });
});

app.get('/recall/:key', apiRateLimit(), async (c) => {
  const key = c.req.param('key');
  const facts = await collectiveMemory.recallFact(key);
  return c.json({ success: true, data: facts });
});

export default app;
const factSchema = z.object({
  key: z.string(),
  value: z.string(),
  sourceSession: z.string(),
  confidence: z.number().min(0).max(1),
  tags: z.array(z.string()).optional(),
});
