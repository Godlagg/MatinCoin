const db = require("../../connections/db.connection");
const UserModel = require("../../models/user.model");

exports.saveUser = async (login, username) => {
    await db.sync();

    const textAfterSaving = `User ${login}-${username} is saved`; // logs
    const textAfterUpdate = `User ${login}-${username} has been updated`;

    const foundUser = await UserModel.findOne({ where: { login } });

    if (!foundUser) {
        await UserModel.create({ login, username });
        return textAfterSaving;
    }

    if (foundUser.username !== username) {
        await UserModel.update({ username }, { where: { login } });
        return textAfterUpdate;
    }
};