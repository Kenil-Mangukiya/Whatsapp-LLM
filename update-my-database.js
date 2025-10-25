#!/usr/bin/env node

/**
 * Database Update Script for Your Specific Setup
 * Database: whatsapp_llm
 * User: root
 * Password: Kenil@333
 */

import { Sequelize } from 'sequelize';

// Your specific database configuration
const dbConfig = {
  username: 'root',
  password: 'Kenil@333',
  database: 'whatsapp_llm',
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: console.log
};

console.log('🚀 Starting database update for whatsapp_llm...');
console.log('📊 Database: whatsapp_llm@localhost:3306');

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
      WHERE table_schema = 'whatsapp_llm' 
      AND table_name = 'conversations'
    `);

    if (results[0].count === 0) {
      console.log('❌ Conversations table does not exist. Please run the initial migration first.');
      process.exit(1);
    }

    console.log('✅ Conversations table exists.');
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
          WHERE table_schema = 'whatsapp_llm' 
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
    console.log('📋 New columns added to whatsapp_llm database:');
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

    // Show current table structure
    console.log('\n📊 Current conversations table structure:');
    const [tableStructure] = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'whatsapp_llm' 
      AND TABLE_NAME = 'conversations'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.table(tableStructure);

  } catch (error) {
    console.error('❌ Database update failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the update
updateDatabase();
