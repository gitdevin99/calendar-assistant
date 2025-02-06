const express = require('express');
const router = express.Router();
const conversationService = require('../services/conversation');

router.post('/chat', async (req, res) => {
    try {
        const { input } = req.body;
        const response = await conversationService.handleConversation(input);
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
