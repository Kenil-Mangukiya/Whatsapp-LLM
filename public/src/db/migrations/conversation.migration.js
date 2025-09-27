export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('conversations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      contact_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Contact ID from the webhook'
      },
      sender_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'WhatsApp sender ID (phone number)'
      },
      receiver_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'WhatsApp receiver ID (phone number)'
      },
      whatsapp_message_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'WhatsApp message ID'
      },
      message_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Type of message (text, image, etc.)'
      },
      message_content: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Message content/body'
      },
      sender_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'Sender type (contact, agent)'
      },
      receiver_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'Receiver type (contact, agent)'
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'Message status (received, sent, delivered, read)'
      },
      thread_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Thread ID for grouping messages'
      },
      is_sent_to_contact: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether message was sent to contact'
      },
      is_delivered_to_contact: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether message was delivered to contact'
      },
      is_read_by_contact: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether message was read by contact'
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether message was read'
      },
      is_failed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether message failed to send'
      },
      error_response: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Error response if message failed'
      },
      in_reply_to: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Message ID this message is replying to'
      },
      reaction_emoji: {
        type: Sequelize.STRING(10),
        allowNull: true,
        comment: 'Reaction emoji if any'
      },
      user_reaction_emoji: {
        type: Sequelize.STRING(10),
        allowNull: true,
        comment: 'User reaction emoji if any'
      },
      contact_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Contact name for easy reference'
      },
      contact_phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Contact phone number'
      },
      contact_wa_id: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Contact WhatsApp ID'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('conversations', ['contact_id']);
    await queryInterface.addIndex('conversations', ['sender_id']);
    await queryInterface.addIndex('conversations', ['thread_id']);
    await queryInterface.addIndex('conversations', ['created_at']);
    await queryInterface.addIndex('conversations', ['contact_id', 'created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('conversations');
  }
};
