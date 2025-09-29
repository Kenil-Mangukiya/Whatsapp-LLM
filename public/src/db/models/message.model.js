export default (sequelize, Sequelize) => {
    const messageModel = sequelize.define("messagesModel", {
        id : {
            type : Sequelize.INTEGER,
            primaryKey : true,
            autoIncrement : true
        },
        messages : {
            type : Sequelize.TEXT,
            allowNull : true
        },
        createdAt : {
            type : Sequelize.DATE,
            allowNull : true
        },
        updatedAt : {
            type : Sequelize.DATE,
            allowNull : true
        }
    })
    return messageModel
}