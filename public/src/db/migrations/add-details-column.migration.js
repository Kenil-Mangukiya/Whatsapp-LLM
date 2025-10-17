export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('conversations', 'details', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Structured data in JSON format (fullname, block, property_type, address, ward_number)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('conversations', 'details');
  }
};
