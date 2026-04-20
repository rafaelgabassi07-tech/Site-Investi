import express from 'express';
const app = express();
app.get('/api/test', (req, res) => res.json({ ok: true }));
app.listen(3000, () => console.log('Simple server on 3000'));
