#!/usr/bin/env node

/**
 * Database Update Script
 * This script updates the database schema to support subscription data
 * Run this script locally and on your server
 */

import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';

// Database configuration
const config = {
  development: {
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'whatsapp_bot',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: console.log
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  }
};

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

console.log(`🚀 Starting database update for ${env} environment...`);
console.log(`📊 Database: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`);

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: dbConfig.logging,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

async function updateDatabase() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Check if conversations table exists
    const [results] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = '${dbConfig.database}' 
      AND table_name = 'conversations'
    `);

    if (results[0].count === 0) {
      console.log('❌ Conversations table does not exist. Please run the initial migration first.');
      process.exit(1);
    }

    console.log('📋 Adding subscription-related columns...');

    // Add new columns
    const columns = [
      {
        name: 'subscription_plan',
        type: 'VARCHAR(100)',
        comment: 'Selected subscription plan name'
      },
      {
        name: 'subscription_plan_id',
        type: 'VARCHAR(50)',
        comment: 'Selected subscription plan ID from API'
      },
      {
        name: 'payment_method',
        type: 'VARCHAR(50)',
        comment: 'Payment method (Bank Transfer, Cheque)'
      },
      {
        name: 'payment_tx_id',
        type: 'VARCHAR(100)',
        comment: 'Payment transaction ID provided by customer'
      },
      {
        name: 'pickup_days',
        type: 'JSON',
        comment: 'Selected pickup days array'
      },
      {
        name: 'bin_size',
        type: 'VARCHAR(50)',
        comment: 'Selected bin size'
      },
      {
        name: 'frequency',
        type: 'VARCHAR(50)',
        comment: 'Pickup frequency'
      },
      {
        name: 'pricing_data',
        type: 'JSON',
        comment: 'Complete pricing options from API response'
      },
      {
        name: 'order_status',
        type: 'VARCHAR(50)',
        comment: 'Order status (pending, confirmed, completed, cancelled)',
        defaultValue: "'pending'"
      },
      {
        name: 'total_amount',
        type: 'DECIMAL(10,2)',
        comment: 'Total amount for the subscription'
      },
      {
        name: 'currency',
        type: 'VARCHAR(10)',
        comment: 'Currency for the subscription',
        defaultValue: "'LE'"
      }
    ];

    for (const column of columns) {
      try {
        // Check if column already exists
        const [columnCheck] = await sequelize.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.columns 
          WHERE table_schema = '${dbConfig.database}' 
          AND table_name = 'conversations' 
          AND column_name = '${column.name}'
        `);

        if (columnCheck[0].count === 0) {
          const defaultValue = column.defaultValue ? ` DEFAULT ${column.defaultValue}` : '';
          await sequelize.query(`
            ALTER TABLE conversations 
            ADD COLUMN ${column.name} ${column.type}${defaultValue} 
            COMMENT '${column.comment}'
          `);
          console.log(`✅ Added column: ${column.name}`);
        } else {
          console.log(`ℹ️ Column already exists: ${column.name}`);
        }
      } catch (error) {
        console.log(`⚠️ Error adding column ${column.name}:`, error.message);
      }
    }

    // Add indexes
    console.log('📊 Adding indexes...');
    const indexes = [
      'subscription_plan_id',
      'payment_tx_id', 
      'order_status',
      'contact_id, order_status'
    ];

    for (const index of indexes) {
      try {
        const indexName = `idx_conversations_${index.replace(', ', '_')}`;
        await sequelize.query(`
          CREATE INDEX ${indexName} ON conversations (${index})
        `);
        console.log(`✅ Added index: ${indexName}`);
      } catch (error) {
        if (error.message.includes('Duplicate key name')) {
          console.log(`ℹ️ Index already exists: ${index}`);
        } else {
          console.log(`⚠️ Error adding index ${index}:`, error.message);
        }
      }
    }

    console.log('🎉 Database update completed successfully!');
    console.log('📋 New columns added:');
    console.log('   - subscription_plan');
    console.log('   - subscription_plan_id');
    console.log('   - payment_method');
    console.log('   - payment_tx_id');
    console.log('   - pickup_days');
    console.log('   - bin_size');
    console.log('   - frequency');
    console.log('   - pricing_data');
    console.log('   - order_status');
    console.log('   - total_amount');
    console.log('   - currency');

  } catch (error) {
    console.error('❌ Database update failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the update
updateDatabase();
