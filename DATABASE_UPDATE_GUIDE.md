# Database Update Guide

This guide explains how to update your database to support the new subscription fields for pickup days, pricing plans, payment methods, and transaction IDs.

## 🎯 What's Being Added

The following new columns will be added to the `conversations` table:

- `subscription_plan` - Selected plan name (e.g., "3 Month")
- `subscription_plan_id` - Plan ID from API
- `payment_method` - Payment method (Bank Transfer/Cheque)
- `payment_tx_id` - Transaction ID provided by customer
- `pickup_days` - Selected pickup days array
- `bin_size` - Selected bin size
- `frequency` - Pickup frequency
- `pricing_data` - Complete pricing options from API
- `order_status` - Order status (pending/confirmed/completed/cancelled)
- `total_amount` - Total subscription amount
- `currency` - Currency (default: LE)

## 🚀 Update Methods

### Method 1: Automated Script (Recommended)

```bash
# Make the script executable
chmod +x update-database.js

# Run the update script
node update-database.js
```

### Method 2: Manual SQL Script

```bash
# Connect to your MySQL database
mysql -u your_username -p your_database_name

# Run the SQL script
source database-update.sql
```

### Method 3: Using Sequelize Migrations

```bash
# If you have Sequelize CLI set up
npx sequelize-cli db:migrate
```

## 📋 Local Development Update

1. **Backup your local database** (optional but recommended):
   ```bash
   mysqldump -u root -p your_database_name > backup_before_update.sql
   ```

2. **Run the update**:
   ```bash
   # Set your environment variables
   export DB_USERNAME=root
   export DB_PASSWORD=your_password
   export DB_NAME=whatsapp_bot
   export DB_HOST=localhost
   export DB_PORT=3306
   export NODE_ENV=development

   # Run the update script
   node update-database.js
   ```

3. **Verify the changes**:
   ```sql
   DESCRIBE conversations;
   ```

## 🌐 Server Production Update

1. **SSH into your server**:
   ```bash
   ssh your_username@your_server_ip
   ```

2. **Navigate to your project directory**:
   ```bash
   cd /path/to/your/whatsapp.yogreet.com
   ```

3. **Backup your production database**:
   ```bash
   mysqldump -u your_username -p your_database_name > production_backup_$(date +%Y%m%d_%H%M%S).sql
   ```

4. **Set production environment variables**:
   ```bash
   export DB_USERNAME=your_production_username
   export DB_PASSWORD=your_production_password
   export DB_NAME=your_production_database
   export DB_HOST=your_production_host
   export DB_PORT=3306
   export NODE_ENV=production
   ```

5. **Run the update**:
   ```bash
   node update-database.js
   ```

6. **Restart your application**:
   ```bash
   # If using PM2
   pm2 restart your_app_name
   
   # If using systemd
   sudo systemctl restart your_service_name
   
   # If using Docker
   docker-compose restart
   ```

## ✅ Verification

After running the update, verify the changes:

```sql
-- Check if all columns were added
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'conversations'
AND COLUMN_NAME IN (
    'subscription_plan', 'subscription_plan_id', 'payment_method', 
    'payment_tx_id', 'pickup_days', 'bin_size', 'frequency', 
    'pricing_data', 'order_status', 'total_amount', 'currency'
)
ORDER BY ORDINAL_POSITION;

-- Check if indexes were created
SHOW INDEX FROM conversations WHERE Key_name LIKE 'idx_conversations_%';
```

## 🔄 Rollback (If Needed)

If you need to rollback the changes:

```sql
-- Remove the added columns
ALTER TABLE conversations 
DROP COLUMN subscription_plan,
DROP COLUMN subscription_plan_id,
DROP COLUMN payment_method,
DROP COLUMN payment_tx_id,
DROP COLUMN pickup_days,
DROP COLUMN bin_size,
DROP COLUMN frequency,
DROP COLUMN pricing_data,
DROP COLUMN order_status,
DROP COLUMN total_amount,
DROP COLUMN currency;

-- Remove the added indexes
DROP INDEX idx_conversations_subscription_plan_id ON conversations;
DROP INDEX idx_conversations_payment_tx_id ON conversations;
DROP INDEX idx_conversations_order_status ON conversations;
DROP INDEX idx_conversations_contact_order_status ON conversations;
```

## 🚨 Important Notes

1. **Backup First**: Always backup your database before making changes
2. **Test Locally**: Test the update on your local development environment first
3. **Maintenance Window**: Consider running production updates during low-traffic periods
4. **Monitor**: Watch your application logs after the update to ensure everything works correctly

## 📞 Support

If you encounter any issues during the update process:

1. Check the error messages in the console output
2. Verify your database connection settings
3. Ensure you have the necessary permissions to alter the table
4. Check that your MySQL version supports JSON columns (MySQL 5.7+)

The update is designed to be safe and non-destructive - it only adds new columns without modifying existing data.
