import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Sequelize from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

// Database configuration
const config = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  },
  test: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql'
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql'
  }
};

const db = {};

const sequelize = config[env].use_env_variable 
  ? new Sequelize(process.env[config[env].use_env_variable], config[env])
  : new Sequelize(config[env].database, config[env].username, config[env].password, config[env]);

// Import models directly
import conversationModel from './conversation.model.js';
import messageModel from './message.model.js';

// Initialize models
const conversation = conversationModel(sequelize, Sequelize.DataTypes);
const messagesModel = messageModel(sequelize, Sequelize.DataTypes);

db.conversation = conversation;
db.messagesModel = messagesModel;

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Export specific models for easier imports
db.Conversation = db.conversation;
db.Message = db.messagesModel;

// Export everything
export default db;
export { db };
export const Conversation = db.conversation;
export const Message = db.messagesModel;
export { sequelize };
