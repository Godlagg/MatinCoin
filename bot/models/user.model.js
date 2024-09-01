const db = require("../connections/db.connection");
const { DataTypes } = require("sequelize");

module.exports = db.define("user", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        unique: true,
        allowNull: false,

    },
    login:{
        type: DataTypes.STRING,
        allowNull: false,

    },
    username: {
        type: DataTypes.STRING,
        allowNull: true,

    },
    coins:{
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    earnperminute:{
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    earnperminuteadd:{
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    refreshCount:{
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    dailycombotryes:{
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    lvlplayer:{
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    battery:{
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    multitap:{
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    value:{
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    valuecount:{
        type: DataTypes.FLOAT,
        defaultValue: 0,
        allowNull: false
    },
    lvlplayervalue:{
        type: DataTypes.FLOAT,
        defaultValue: 0,
        allowNull: false
    },
}, {
     timestamps: true,
     updatedAt: false,
});