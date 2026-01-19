#!/bin/bash

echo "🔧 Configuration du backend..."

# 1. Créer les fichiers de configuration
echo "📝 Création des fichiers de configuration..."

# Fichier database.js
cat > src/config/database.js << 'DBEOF'
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'bank_queue_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    timezone: '+01:00'
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie avec succès.');
    return true;
  } catch (error) {
    console.error('❌ Impossible de se connecter à la base de données:', error.message);
    return false;
  }
};

const syncDatabase = async (force = false) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ force });
      console.log(`✅ Base de données synchronisée (force: ${force})`);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error.message);
  }
};

module.exports = { sequelize, testConnection, syncDatabase };
DBEOF

echo "✅ database.js créé"

# Fichier constants.js
cat > src/config/constants.js << 'CONSTEOF'
module.exports = {
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    EMPLOYEE: 'employee',
    CLIENT: 'client'
  },
  
  SERVICES: {
    ACCOUNT_OPENING: { code: 'A', name: 'Ouverture de compte', estimated_time: 30 },
    WITHDRAWAL: { code: 'W', name: 'Retrait', estimated_time: 5 },
    DEPOSIT: { code: 'D', name: 'Dépôt', estimated_time: 10 },
    COMPLAINT: { code: 'C', name: 'Réclamation', estimated_time: 20 },
    LOAN: { code: 'L', name: 'Prêt', estimated_time: 45 },
    CARD: { code: 'CD', name: 'Carte', estimated_time: 15 },
    TRANSFER: { code: 'T', name: 'Virement', estimated_time: 10 },
    OTHER: { code: 'O', name: 'Autre', estimated_time: 15 }
  },
  
  TICKET_STATUS: {
    PENDING: 'pending',
    WAITING: 'waiting',
    CALLED: 'called',
    SERVING: 'serving',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    NO_SHOW: 'no_show',
    TRANSFERRED: 'transferred'
  },
  
  PRIORITIES: {
    NORMAL: 'normal',
    VIP: 'vip',
    URGENT: 'urgent',
    DISABLED: 'disabled',
    PREGNANT: 'pregnant',
    ELDERLY: 'elderly'
  },
  
  COUNTER_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    BUSY: 'busy',
    BREAK: 'break',
    CLOSED: 'closed'
  }
};
CONSTEOF

echo "✅ constants.js créé"

# Fichier app.js
cat > src/app.js << 'APPEOF'
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: '🏦 API de Gestion des Files d\'Attente Bancaires',
    version: '1.0.0',
    status: '✅ En ligne'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;
APPEOF

echo "✅ app.js créé"

# Fichier server.js
cat > src/server.js << 'SERVEREOF'
const app = require('./app');
const { testConnection, syncDatabase } = require('./config/database');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  console.log('🚀 Démarrage du serveur...');
  
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Impossible de démarrer sans connexion à la base de données.');
      process.exit(1);
    }

    // Sync database in development
    if (process.env.NODE_ENV === 'development') {
      await syncDatabase(false);
    }

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
      });
    });

  } catch (error) {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  }
};

startServer();
SERVEREOF

echo "✅ server.js créé"

echo "🎉 Configuration terminée !"
echo "📁 Structure créée:"
echo "   - src/config/database.js"
echo "   - src/config/constants.js"
echo "   - src/app.js"
echo "   - src/server.js"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Vérifier MySQL: sudo systemctl status mysql"
echo "   2. Démarrer le serveur: npm run dev"
echo "   3. Tester: curl http://localhost:5000"
