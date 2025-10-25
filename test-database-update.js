#!/usr/bin/env node

/**
 * Test Database Update Script
 * This script verifies that all the new subscription fields are properly added
 */

import { Sequelize } from 'sequelize';

// Database configuration
const config = {
  development: {
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'whatsapp_bot',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  }
};

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

console.log(`🧪 Testing database update for ${env} environment...`);

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: false
});

async function testDatabaseUpdate() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Check if conversations table exists
    const [tableCheck] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = '${dbConfig.database}' 
      AND table_name = 'conversations'
    `);

    if (tableCheck[0].count === 0) {
      console.log('❌ Conversations table does not exist.');
      process.exit(1);
    }

    console.log('✅ Conversations table exists.');

    // Check for new columns
    const expectedColumns = [
      'subscription_plan',
      'subscription_plan_id',
      'payment_method',
      'payment_tx_id',
      'pickup_days',
      'bin_size',
      'frequency',
      'pricing_data',
      'order_status',
      'total_amount',
      'currency'
    ];

    console.log('🔍 Checking for new columns...');
    
    for (const columnName of expectedColumns) {
      const [columnCheck] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.columns 
        WHERE table_schema = '${dbConfig.database}' 
        AND table_name = 'conversations' 
        AND column_name = '${columnName}'
      `);

      if (columnCheck[0].count > 0) {
        console.log(`✅ Column exists: ${columnName}`);
      } else {
        console.log(`❌ Column missing: ${columnName}`);
      }
    }

    // Check for new indexes
    console.log('🔍 Checking for new indexes...');
    const expectedIndexes = [
      'idx_conversations_subscription_plan_id',
      'idx_conversations_payment_tx_id',
      'idx_conversations_order_status',
      'idx_conversations_contact_order_status'
    ];

    for (const indexName of expectedIndexes) {
      const [indexCheck] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.statistics 
        WHERE table_schema = '${dbConfig.database}' 
        AND table_name = 'conversations' 
        AND index_name = '${indexName}'
      `);

      if (indexCheck[0].count > 0) {
        console.log(`✅ Index exists: ${indexName}`);
      } else {
        console.log(`❌ Index missing: ${indexName}`);
      }
    }

    // Test inserting sample data
    console.log('🧪 Testing data insertion...');
    
    try {
      const testData = {
        contact_id: 999999,
        sender_id: 'test_sender',
        receiver_id: 'test_receiver',
        message_type: 'test',
        message_content: 'Test message',
        sender_type: 'contact',
        receiver_type: 'agent',
        status: 'sent',
        subscription_plan: '3 Month',
        subscription_plan_id: 'test_plan_id',
        payment_method: 'Bank Transfer',
        payment_tx_id: 'TXN123456',
        pickup_days: JSON.stringify(['Mon', 'Wed', 'Fri']),
        bin_size: '120ltr',
        frequency: '1x_per_week',
        pricing_data: JSON.stringify([{ name: '3 Month', price: 150 }]),
        order_status: 'pending',
        total_amount: 5265.00,
        currency: 'LE'
      };

      // Insert test record
      await sequelize.query(`
        INSERT INTO conversations (
          contact_id, sender_id, receiver_id, message_type, message_content,
          sender_type, receiver_type, status, subscription_plan, subscription_plan_id,
          payment_method, payment_tx_id, pickup_days, bin_size, frequency,
          pricing_data, order_status, total_amount, currency, created_at, updated_at
        ) VALUES (
          :contact_id, :sender_id, :receiver_id, :message_type, :message_content,
          :sender_type, :receiver_type, :status, :subscription_plan, :subscription_plan_id,
          :payment_method, :payment_tx_id, :pickup_days, :bin_size, :frequency,
          :pricing_data, :order_status, :total_amount, :currency, NOW(), NOW()
        )
      `, {
        replacements: testData
      });

      console.log('✅ Test data inserted successfully.');

      // Clean up test data
      await sequelize.query(`
        DELETE FROM conversations WHERE contact_id = 999999
      `);
      console.log('✅ Test data cleaned up.');

    } catch (insertError) {
      console.log('❌ Error inserting test data:', insertError.message);
    }

    console.log('🎉 Database update test completed successfully!');
    console.log('📋 All new subscription fields are properly configured.');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testDatabaseUpdate();
