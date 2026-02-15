const express = require('express');
const router = express.Router();

const faqs = [
  { id: 1, question: "Comment obtenir un ticket?", answer: "Scannez le QR code ou utilisez le terminal" },
  { id: 2, question: "Comment suivre ma position?", answer: "Entrez votre numéro de ticket sur le site" },
  { id: 3, question: "Que faire si je rate mon tour?", answer: "Reprenez un ticket ou contactez un agent" }
];

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      faqs: faqs,
      procedures: [
        "1. Prenez votre ticket",
        "2. Attendez votre tour",
        "3. Rendez-vous au guichet indiqué"
      ]
    }
  });
});

module.exports = router;
