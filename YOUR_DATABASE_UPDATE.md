# Your Database Update Guide

## 🎯 Your Database Credentials
- **Database**: `whatsapp_llm`
- **Username**: `root`
- **Password**: `Kenil@333`
- **Host**: `localhost`
- **Port**: `3306`

## 🚀 Quick Update Steps

### Step 1: Update Your Database
```bash
# Navigate to your project directory
cd F:\Kenil\whatsapp.yogreet.com

# Run the update script
node update-my-database.js
```

### Step 2: Test the Update
```bash
# Test that everything was added correctly
node test-my-database.js
```

### Step 3: Verify in MySQL (Optional)
```bash
# Connect to your MySQL database
mysql -u root -p
# Enter password: Kenil@333

# Use your database
USE whatsapp_llm;

# Check the table structure
DESCRIBE conversations;

# Check for new columns
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'whatsapp_llm' 
AND TABLE_NAME = 'conversations'
AND COLUMN_NAME IN (
    'subscription_plan', 'subscription_plan_id', 'payment_method', 
    'payment_tx_id', 'pickup_days', 'bin_size', 'frequency', 
    'pricing_data', 'order_status', 'total_amount', 'currency'
)
ORDER BY ORDINAL_POSITION;
```

## 📋 What Will Be Added

The following columns will be added to your `conversations` table:

| Column Name | Type | Description |
|-------------|------|-------------|
| `subscription_plan` | VARCHAR(100) | Selected plan name (e.g., "3 Month") |
| `subscription_plan_id` | VARCHAR(50) | Plan ID from API |
| `payment_method` | VARCHAR(50) | Payment method (Bank Transfer/Cheque) |
| `payment_tx_id` | VARCHAR(100) | Transaction ID from customer |
| `pickup_days` | JSON | Selected pickup days array |
| `bin_size` | VARCHAR(50) | Selected bin size |
| `frequency` | VARCHAR(50) | Pickup frequency |
| `pricing_data` | JSON | Complete pricing options from API |
| `order_status` | VARCHAR(50) | Order status (pending/confirmed/completed/cancelled) |
| `total_amount` | DECIMAL(10,2) | Total subscription amount |
| `currency` | VARCHAR(10) | Currency (default: LE) |

## 🔧 Manual SQL Update (Alternative)

If you prefer to run the SQL manually:

```sql
-- Connect to your database
USE whatsapp_llm;

-- Add the new columns
ALTER TABLE conversations 
ADD COLUMN subscription_plan VARCHAR(100) NULL COMMENT 'Selected subscription plan name',
ADD COLUMN subscription_plan_id VARCHAR(50) NULL COMMENT 'Selected subscription plan ID from API',
ADD COLUMN payment_method VARCHAR(50) NULL COMMENT 'Payment method (Bank Transfer, Cheque)',
ADD COLUMN payment_tx_id VARCHAR(100) NULL COMMENT 'Payment transaction ID provided by customer',
ADD COLUMN pickup_days JSON NULL COMMENT 'Selected pickup days array',
ADD COLUMN bin_size VARCHAR(50) NULL COMMENT 'Selected bin size',
ADD COLUMN frequency VARCHAR(50) NULL COMMENT 'Pickup frequency',
ADD COLUMN pricing_data JSON NULL COMMENT 'Complete pricing options from API response',
ADD COLUMN order_status VARCHAR(50) NULL DEFAULT 'pending' COMMENT 'Order status',
ADD COLUMN total_amount DECIMAL(10,2) NULL COMMENT 'Total amount for the subscription',
ADD COLUMN currency VARCHAR(10) NULL DEFAULT 'LE' COMMENT 'Currency for the subscription';

-- Add indexes for better performance
CREATE INDEX idx_conversations_subscription_plan_id ON conversations (subscription_plan_id);
CREATE INDEX idx_conversations_payment_tx_id ON conversations (payment_tx_id);
CREATE INDEX idx_conversations_order_status ON conversations (order_status);
CREATE INDEX idx_conversations_contact_order_status ON conversations (contact_id, order_status);
```

## ✅ Expected Output

When you run the update script, you should see:

```
🚀 Starting database update for whatsapp_llm...
📊 Database: whatsapp_llm@localhost:3306
✅ Database connection established successfully.
✅ Conversations table exists.
📋 Adding subscription-related columns...
✅ Added column: subscription_plan
✅ Added column: subscription_plan_id
✅ Added column: payment_method
✅ Added column: payment_tx_id
✅ Added column: pickup_days
✅ Added column: bin_size
✅ Added column: frequency
✅ Added column: pricing_data
✅ Added column: order_status
✅ Added column: total_amount
✅ Added column: currency
📊 Adding indexes...
✅ Added index: idx_conversations_subscription_plan_id
✅ Added index: idx_conversations_payment_tx_id
✅ Added index: idx_conversations_order_status
✅ Added index: idx_conversations_contact_order_status
🎉 Database update completed successfully!
```

## 🧪 Testing

After the update, run the test script to verify everything works:

```bash
node test-my-database.js
```

You should see:
```
🧪 Testing database update for whatsapp_llm...
✅ Database connection established successfully.
✅ Conversations table exists.
🔍 Checking for new columns...
✅ Column exists: subscription_plan
✅ Column exists: subscription_plan_id
✅ Column exists: payment_method
✅ Column exists: payment_tx_id
✅ Column exists: pickup_days
✅ Column exists: bin_size
✅ Column exists: frequency
✅ Column exists: pricing_data
✅ Column exists: order_status
✅ Column exists: total_amount
✅ Column exists: currency
🔍 Checking for new indexes...
✅ Index exists: idx_conversations_subscription_plan_id
✅ Index exists: idx_conversations_payment_tx_id
✅ Index exists: idx_conversations_order_status
✅ Index exists: idx_conversations_contact_order_status
🧪 Testing data insertion...
✅ Test data inserted successfully.
✅ Test data cleaned up.
🎉 Database update test completed successfully!
📋 All new subscription fields are properly configured.
✅ Your database is ready for the new subscription flow!
```

## 🚨 Troubleshooting

If you encounter any issues:

1. **Connection Error**: Make sure MySQL is running and your credentials are correct
2. **Permission Error**: Make sure the `root` user has ALTER privileges
3. **Column Already Exists**: This is normal if you've run the script before

## 🎉 After Update

Once the database is updated:

1. **Restart your WhatsApp bot** if it's running
2. **Test the new flow** by going through the subscription process
3. **Check the database** to see the new subscription data being saved

Your WhatsApp bot will now properly store all subscription details including:
- Selected pricing plans
- Payment methods
- Transaction IDs
- Pickup days
- Order status

The update is **safe and non-destructive** - it only adds new columns without affecting existing data! 🎯
