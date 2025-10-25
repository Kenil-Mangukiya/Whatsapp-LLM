export default {
  up: async (queryInterface, Sequelize) => {
    // Add subscription-specific columns for better data management
    await queryInterface.addColumn('conversations', 'subscription_plan', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Selected subscription plan name (e.g., "3 Month")'
    });

    await queryInterface.addColumn('conversations', 'subscription_plan_id', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Selected subscription plan ID from API'
    });

    await queryInterface.addColumn('conversations', 'payment_method', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Payment method (Bank Transfer, Cheque)'
    });

    await queryInterface.addColumn('conversations', 'payment_tx_id', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Payment transaction ID provided by customer'
    });

    await queryInterface.addColumn('conversations', 'pickup_days', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Selected pickup days array (e.g., ["Mon", "Sun", "Fri"])'
    });

    await queryInterface.addColumn('conversations', 'bin_size', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Selected bin size (e.g., "120ltr", "500ltr")'
    });

    await queryInterface.addColumn('conversations', 'frequency', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Pickup frequency (e.g., "1x_per_week", "2x_per_week")'
    });

    await queryInterface.addColumn('conversations', 'pricing_data', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Complete pricing options from API response'
    });

    await queryInterface.addColumn('conversations', 'order_status', {
      type: Sequelize.STRING(50),
      allowNull: true,
      defaultValue: 'pending',
      comment: 'Order status (pending, confirmed, completed, cancelled)'
    });

    await queryInterface.addColumn('conversations', 'total_amount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Total amount for the subscription'
    });

    await queryInterface.addColumn('conversations', 'currency', {
      type: Sequelize.STRING(10),
      allowNull: true,
      defaultValue: 'LE',
      comment: 'Currency for the subscription'
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('conversations', ['subscription_plan_id']);
    await queryInterface.addIndex('conversations', ['payment_tx_id']);
    await queryInterface.addIndex('conversations', ['order_status']);
    await queryInterface.addIndex('conversations', ['contact_id', 'order_status']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the added columns
    await queryInterface.removeColumn('conversations', 'subscription_plan');
    await queryInterface.removeColumn('conversations', 'subscription_plan_id');
    await queryInterface.removeColumn('conversations', 'payment_method');
    await queryInterface.removeColumn('conversations', 'payment_tx_id');
    await queryInterface.removeColumn('conversations', 'pickup_days');
    await queryInterface.removeColumn('conversations', 'bin_size');
    await queryInterface.removeColumn('conversations', 'frequency');
    await queryInterface.removeColumn('conversations', 'pricing_data');
    await queryInterface.removeColumn('conversations', 'order_status');
    await queryInterface.removeColumn('conversations', 'total_amount');
    await queryInterface.removeColumn('conversations', 'currency');

    // Remove the added indexes
    await queryInterface.removeIndex('conversations', ['subscription_plan_id']);
    await queryInterface.removeIndex('conversations', ['payment_tx_id']);
    await queryInterface.removeIndex('conversations', ['order_status']);
    await queryInterface.removeIndex('conversations', ['contact_id', 'order_status']);
  }
};
