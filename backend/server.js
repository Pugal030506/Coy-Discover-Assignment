import express from 'express';
import cors from 'cors';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const PROFILES_FILE = path.join(DATA_DIR, 'profiles.json');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const USER_ID = 'demo-user';
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
}
async function writeState(state) {
  const temp = `${STATE_FILE}.tmp`;
  await fs.writeFile(temp, JSON.stringify(state, null, 2));
  await fs.rename(temp, STATE_FILE);
}
const profiles = await readJson(PROFILES_FILE, []);
let state = await readJson(STATE_FILE, { swipes: [], matches: [] });

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/feed', (_req, res) => {
  const swiped = new Set(state.swipes.filter(s => s.userId === USER_ID).map(s => s.profileId));
  res.json(profiles.filter(p => !swiped.has(p.id)).map(({ likedCurrentUser, ...safe }) => safe));
});
app.post('/swipe', async (req, res) => {
  const { profileId, action } = req.body ?? {};
  if (typeof profileId !== 'string' || !profiles.some(p => p.id === profileId) || !['like', 'pass'].includes(action)) {
    return res.status(400).json({ error: 'Provide a valid profileId and action (like or pass).' });
  }
  if (state.swipes.some(s => s.userId === USER_ID && s.profileId === profileId)) {
    return res.status(409).json({ error: 'This profile has already been swiped on.' });
  }
  state.swipes.push({ userId: USER_ID, profileId, action, createdAt: new Date().toISOString() });
  let match = null;
  const profile = profiles.find(p => p.id === profileId);
  if (action === 'like' && profile.likedCurrentUser) {
    match = { profileId, createdAt: new Date().toISOString() };
    state.matches.push(match);
  }
  await writeState(state);
  const safeProfile = (({ likedCurrentUser, ...rest }) => rest)(profile);
  res.status(201).json({ action, matched: Boolean(match), match: match ? safeProfile : null });
});
app.get('/matches', (_req, res) => {
  const matchedIds = new Set(state.matches.map(m => m.profileId));
  res.json(profiles.filter(p => matchedIds.has(p.id)).map(({ likedCurrentUser, ...safe }) => safe));
});
app.post('/demo/reset', async (_req, res) => {
  state = { swipes: [], matches: [] };
  await writeState(state);
  res.json({ reset: true });
});
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error.' });
});
const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => console.log(`Coy Discover API running on http://localhost:${PORT}`));
