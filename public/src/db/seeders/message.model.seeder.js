'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('messagesModel', [
      {
        messages: 'Hello from seeder!',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('messagesModel', { id: 1 }, {});
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('messagesModel', { id: 1 }, {});
  }
};