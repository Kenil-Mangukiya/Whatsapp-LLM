#!/usr/bin/env node

/**
 * Test MySQL Connection Script
 * This script will help diagnose connection issues
 */

import { Sequelize } from 'sequelize';

console.log('🔍 Testing MySQL connection...');

// Test different connection configurations
const connectionTests = [
  {
    name: 'Test 1: Standard connection',
    config: {
      username: 'root',
      password: 'Kenil@333',
      database: 'whatsapp_llm',
      host: 'localhost',
      port: 3306,
      dialect: 'mysql'
    }
  },
  {
    name: 'Test 2: Without database name',
    config: {
      username: 'root',
      password: 'Kenil@333',
      host: 'localhost',
      port: 3306,
      dialect: 'mysql'
    }
  },
  {
    name: 'Test 3: Different password format',
    config: {
      username: 'root',
      password: 'Kenil@333',
      database: 'whatsapp_llm',
      host: '127.0.0.1',
      port: 3306,
      dialect: 'mysql'
    }
  }
];

async function testConnection(testConfig) {
  try {
    console.log(`\n🧪 ${testConfig.name}`);
    console.log(`📊 Config: ${testConfig.config.username}@${testConfig.config.host}:${testConfig.config.port}`);
    
    const sequelize = new Sequelize(testConfig.config.database || 'mysql', testConfig.config.username, testConfig.config.password, {
      host: testConfig.config.host,
      port: testConfig.config.port,
      dialect: testConfig.config.dialect,
      logging: false,
      pool: {
        max: 1,
        min: 0,
        acquire: 5000,
        idle: 1000
      }
    });

    await sequelize.authenticate();
    console.log('✅ Connection successful!');
    
    // Test if we can query
    const [results] = await sequelize.query('SELECT 1 as test');
    console.log('✅ Query test successful!');
    
    await sequelize.close();
    return true;
    
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting connection tests...\n');
  
  let successCount = 0;
  
  for (const test of connectionTests) {
    const success = await testConnection(test);
    if (success) successCount++;
  }
  
  console.log(`\n📊 Test Results: ${successCount}/${connectionTests.length} connections successful`);
  
  if (successCount === 0) {
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('1. Make sure MySQL is running');
    console.log('2. Check if the password is correct');
    console.log('3. Try connecting manually: mysql -u root -p');
    console.log('4. Check if the database "whatsapp_llm" exists');
    console.log('5. Try creating the database: CREATE DATABASE whatsapp_llm;');
  } else {
    console.log('\n✅ At least one connection method works!');
  }
}

runTests();
