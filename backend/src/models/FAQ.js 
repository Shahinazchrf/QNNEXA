module.exports = (sequelize, DataTypes) => {
  const FAQ = sequelize.define('FAQ', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    question: {
      type: DataTypes.STRING,
      allowNull: false
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('general', 'tickets', 'services', 'vip', 'procedures'),
      defaultValue: 'general'
    },
    serviceId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  });

  return FAQ;
};

// routes/faqRoutes.js
router.get('/faq', async (req, res) => {
  try {
    const { category, serviceId } = req.query;
    
    const where = { isActive: true };
    if (category) where.category = category;
    if (serviceId) where.serviceId = serviceId;

    const faqs = await FAQ.findAll({
      where,
      order: [['order', 'ASC'], ['createdAt', 'DESC']],
      attributes: ['id', 'question', 'answer', 'category']
    });

    // Procédures statiques (à adapter selon tes besoins)
    const procedures = {
      general: [
        {
          title: "Comment obtenir un ticket",
          steps: [
            "Scannez le QR code ou utilisez le terminal",
            "Sélectionnez le service désiré",
            "Prenez votre ticket",
            "Attendez votre tour dans la zone d'attente"
          ]
        },
        {
          title: "En cas d'oubli de ticket",
          steps: [
            "Rapprochez-vous d'un agent",
            "Fournissez votre numéro de ticket ou heure d'arrivée",
            "Votre position sera vérifiée et restaurée"
          ]
        }
      ]
    };

    res.json({
      success: true,
      data: {
        faqs,
        procedures
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération FAQ:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});