-- Database Update Script for Subscription Fields
-- Run this script on both local and server databases

-- Add subscription-related columns to conversations table
ALTER TABLE conversations 
ADD COLUMN subscription_plan VARCHAR(100) NULL COMMENT 'Selected subscription plan name (e.g., "3 Month")',
ADD COLUMN subscription_plan_id VARCHAR(50) NULL COMMENT 'Selected subscription plan ID from API',
ADD COLUMN payment_method VARCHAR(50) NULL COMMENT 'Payment method (Bank Transfer, Cheque)',
ADD COLUMN payment_tx_id VARCHAR(100) NULL COMMENT 'Payment transaction ID provided by customer',
ADD COLUMN pickup_days JSON NULL COMMENT 'Selected pickup days array (e.g., ["Mon", "Sun", "Fri"])',
ADD COLUMN bin_size VARCHAR(50) NULL COMMENT 'Selected bin size (e.g., "120ltr", "500ltr")',
ADD COLUMN frequency VARCHAR(50) NULL COMMENT 'Pickup frequency (e.g., "1x_per_week", "2x_per_week")',
ADD COLUMN pricing_data JSON NULL COMMENT 'Complete pricing options from API response',
ADD COLUMN order_status VARCHAR(50) NULL DEFAULT 'pending' COMMENT 'Order status (pending, confirmed, completed, cancelled)',
ADD COLUMN total_amount DECIMAL(10,2) NULL COMMENT 'Total amount for the subscription',
ADD COLUMN currency VARCHAR(10) NULL DEFAULT 'LE' COMMENT 'Currency for the subscription';

-- Add indexes for better query performance
CREATE INDEX idx_conversations_subscription_plan_id ON conversations (subscription_plan_id);
CREATE INDEX idx_conversations_payment_tx_id ON conversations (payment_tx_id);
CREATE INDEX idx_conversations_order_status ON conversations (order_status);
CREATE INDEX idx_conversations_contact_order_status ON conversations (contact_id, order_status);

-- Verify the changes
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM 
    INFORMATION_SCHEMA.COLUMNS 
WHERE 
    TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'conversations'
    AND COLUMN_NAME IN (
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
    )
ORDER BY ORDINAL_POSITION;
