#!/usr/bin/env node

/**
 * Test Database Update Script for Your Setup
 * Database: whatsapp_llm
 * User: root
 * Password: Kenil@333
 */

import { Sequelize } from 'sequelize';

// Your specific database configuration
const dbConfig = {
  username: 'root',
  password: 'Yogreet@802',
  database: 'whatsapp',
  host: '127.0.0.1',
  port: 3306,
  dialect: 'mysql',
  logging: false
};

console.log('🧪 Testing database update for whatsapp_llm...');

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
      WHERE table_schema = 'whatsapp_llm' 
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
    
    let allColumnsExist = true;
    for (const columnName of expectedColumns) {
      const [columnCheck] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.columns 
        WHERE table_schema = 'whatsapp_llm' 
        AND table_name = 'conversations' 
        AND column_name = '${columnName}'
      `);

      if (columnCheck[0].count > 0) {
        console.log(`✅ Column exists: ${columnName}`);
      } else {
        console.log(`❌ Column missing: ${columnName}`);
        allColumnsExist = false;
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

    let allIndexesExist = true;
    for (const indexName of expectedIndexes) {
      const [indexCheck] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.statistics 
        WHERE table_schema = 'whatsapp_llm' 
        AND table_name = 'conversations' 
        AND index_name = '${indexName}'
      `);

      if (indexCheck[0].count > 0) {
        console.log(`✅ Index exists: ${indexName}`);
      } else {
        console.log(`❌ Index missing: ${indexName}`);
        allIndexesExist = false;
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
        message_content: 'Test message for subscription data',
        sender_type: 'contact',
        receiver_type: 'agent',
        status: 'sent',
        subscription_plan: '3 Month',
        subscription_plan_id: '6835a191289e45ec68bb74e7',
        payment_method: 'Bank Transfer',
        payment_tx_id: 'TXN123456789',
        pickup_days: JSON.stringify(['Mon', 'Wed', 'Fri']),
        bin_size: '120ltr',
        frequency: '1x_per_week',
        pricing_data: JSON.stringify([
          {
            "_id": "6835a191289e45ec68bb74e7",
            "name": "3 Month",
            "price": 150,
            "currency": "LE",
            "total": 5400,
            "discountLable": "2.5%",
            "discountedPrice": 5265,
            "discountValue": 135
          }
        ]),
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

      // Verify the inserted data
      const [insertedData] = await sequelize.query(`
        SELECT subscription_plan, payment_method, payment_tx_id, total_amount, order_status
        FROM conversations 
        WHERE contact_id = 999999
      `);

      console.log('📊 Inserted test data:');
      console.table(insertedData);

      // Clean up test data
      await sequelize.query(`
        DELETE FROM conversations WHERE contact_id = 999999
      `);
      console.log('✅ Test data cleaned up.');

    } catch (insertError) {
      console.log('❌ Error inserting test data:', insertError.message);
    }

    // Final summary
    if (allColumnsExist && allIndexesExist) {
      console.log('🎉 Database update test completed successfully!');
      console.log('📋 All new subscription fields are properly configured.');
      console.log('✅ Your database is ready for the new subscription flow!');
    } else {
      console.log('⚠️ Some columns or indexes are missing. Please run the update script first.');
    }

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testDatabaseUpdate();
