const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const HOST = '0.0.0.0'; // Listen on all network interfaces

app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Endpoint to save chat history
app.post('/save-chat-history', (req, res) => {
  const chatHistoryPath = path.join(__dirname, 'src', 'data', 'chat_history.json');
  try {
    fs.writeFileSync(chatHistoryPath, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving chat history:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log('Make sure your mobile device/emulator can access this address');
});
