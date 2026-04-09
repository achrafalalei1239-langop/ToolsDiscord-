const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Proxy endpoint for Discord API
app.post('/api/discord', async (req, res) => {
    const { method, url, token, body, isBot } = req.body;
    
    try {
        const headers = {
            'Authorization': isBot ? `Bot ${token}` : token,
            'Content-Type': 'application/json'
        };
        
        const response = await axios({
            method,
            url: `https://discord.com/api/v10${url}`,
            headers,
            data: body,
            timeout: 30000
        });
        
        res.json({ success: true, data: response.data });
    } catch (error) {
        res.json({ 
            success: false, 
            error: error.response?.data || error.message,
            status: error.response?.status
        });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
