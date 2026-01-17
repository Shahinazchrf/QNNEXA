#!/bin/bash

echo "Création de la structure du projet..."

# Racine
mkdir -p bank-queue-system
cd bank-queue-system
git init
touch .gitignore .gitattributes README.md LICENSE

# Backend
mkdir -p backend/src/{config,controllers,models,routes,middlewares,services,utils,socket,tests/{unit,integration}}
cd backend
touch .env .env.example package.json README.md
cd src
touch app.js server.js
touch config/{database.js,socket.js,constants.js}
touch controllers/{authController.js,ticketController.js,queueController.js,counterController.js,statsController.js,notificationController.js,surveyController.js}
touch models/{User.js,Ticket.js,Service.js,Counter.js,Notification.js,Survey.js}
touch routes/{authRoutes.js,ticketRoutes.js,queueRoutes.js,counterRoutes.js,statsRoutes.js,notificationRoutes.js,surveyRoutes.js}
touch middlewares/{auth.js,roles.js,validation.js,errorHandler.js}
touch services/{queueService.js,ticketService.js,vipService.js,notificationService.js,statsService.js,emailService.js}
touch utils/{helpers.js,qrGenerator.js,timeCalculator.js,logger.js}
touch socket/{handlers.js,events.js}
cd ../..

# Frontend
mkdir -p frontend/public
mkdir -p frontend/src/{components/{common,client,counter,admin,layout},pages/{client,counter,admin,auth,survey},services,contexts,hooks,utils,assets/{images,icons,styles,fonts}}
cd frontend
touch .env package.json README.md
touch public/{index.html,favicon.ico,manifest.json}
cd src
touch App.jsx index.js routes.js
touch services/{api.js,authService.js,ticketService.js,queueService.js,statsService.js,socketService.js}
touch contexts/{AuthContext.jsx,QueueContext.jsx,NotificationContext.jsx}
touch hooks/{useAuth.js,useQueue.js,useWebSocket.js}
touch utils/{formatters.js,validators.js,constants.js}
touch assets/styles/{global.css,variables.css}
cd ../..

# Autres dossiers
mkdir -p database/{migrations,seeds}
touch database/{schema.sql,dump.sql}
mkdir -p docker
touch docker/{docker-compose.yml,Dockerfile.backend,Dockerfile.frontend,nginx.conf}
mkdir -p docs/diagrams
touch docs/{API_Documentation.md,Setup_Guide.md,User_Manual.md}
touch docs/diagrams/{use-case.drawio,class-diagram.drawio}
mkdir scripts
touch scripts/{deploy.sh,backup-db.sh,generate-test-data.js}

echo "Structure créée avec succès !"
