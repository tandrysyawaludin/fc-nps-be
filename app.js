const express = require('express');
const bodyParser = require('body-parser');
const mariadb = require('mariadb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Database connection pool
const pool = mariadb.createPool({
    host: 'localhost',
    port: '3306',
    user: 'root',  // Change to your DB user if necessary
    password: 'dbpassword',
    database: 'fc_nps',
    connectionLimit: 5
});

app.get('/api/health-check', async (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Get NPS scores for a specific Instagram account
app.get('/api/nps/:account', async (req, res) => {
    const account = req.params.account;
    try {
        const conn = await pool.getConnection();
        const rows = await conn.query('SELECT * FROM nps_score_tab WHERE instagram_account = ?', [account]);
        conn.release();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
        console.error(err);
    }
});

// Post new NPS score
app.post('/api/nps', async (req, res) => {
    const { score, instagram_account } = req.body;
    if (!score || !instagram_account) {
        return res.status(400).json({ error: 'Score and Instagram account are required' });
    }
    try {
        const conn = await pool.getConnection();
        await conn.query('INSERT INTO nps_score_tab (score, instagram_account) VALUES (?, ?)', [score, instagram_account]);
        conn.release();
        res.status(201).json({ message: 'NPS score submitted' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
        console.error(err);
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
