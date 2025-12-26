const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data', 'records');

app.use(cors());
app.use(express.json({ limit: '1mb' }));
// Serve static frontend files from repo root
const staticRoot = path.join(__dirname);
app.use(express.static(staticRoot));

async function ensureDir(){
  try{ await fs.mkdir(DATA_DIR, { recursive: true }); }catch(e){ console.error('mkdir failed', e); }
}

app.get('/health', (req,res)=> res.json({ ok: true, ts: Date.now() }));

app.get('/records/:date', async (req,res)=>{
  const date = req.params.date;
  try{
    const file = path.join(DATA_DIR, date + '.json');
    const raw = await fs.readFile(file, 'utf8');
    const obj = JSON.parse(raw);
    return res.json(obj);
  }catch(e){ return res.status(404).json({ error: 'not_found' }); }
});

app.post('/records/:date', async (req,res)=>{
  const date = req.params.date;
  const body = req.body || {};
  try{
    await ensureDir();
    const file = path.join(DATA_DIR, date + '.json');
    await fs.writeFile(file, JSON.stringify(body, null, 2), 'utf8');
    return res.json({ ok: true });
  }catch(e){ console.error('save failed', e); return res.status(500).json({ error: 'save_failed' }); }
});

app.get('/records', async (req,res)=>{
  try{
    await ensureDir();
    const files = await fs.readdir(DATA_DIR);
    const dates = files.filter(f=> f.endsWith('.json')).map(f=> f.replace('.json',''));
    return res.json({ dates });
  }catch(e){ return res.status(500).json({ error: 'list_failed' }); }
});

app.listen(PORT, ()=> console.log('Server running on port', PORT));
