const express = require('express');
const router = express.Router();

router.get('/test', (req, res) => {
  res.json({ message: 'Test route working!' });
});

router.post('/echo', (req, res) => {
  res.json({ received: req.body });
});

module.exports = router;
