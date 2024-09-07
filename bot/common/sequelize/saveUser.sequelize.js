const db = require("../../connections/db.connection");
const UserModel = require("../../models/user.model");

exports.saveUser = async (login, username, userData = {}) => {
    await db.sync();
    console.log('Saving user with the following data:');
    console.log('Login:', login);
    console.log('Username:', username);
    console.log('UserData:', userData);
    const textAfterSaving = `User ${login}-${username} is saved`;
    const textAfterUpdate = `User ${login}-${username} has been updated`;

    // Находим пользователя по логину
    const foundUser = await UserModel.findOne({ where: { login } });

    if (!foundUser) {
        // Если пользователь не найден, создаем его
        await UserModel.create({
            login,
            username,
            ...userData // Распаковываем данные пользователя для создания
        });
        return textAfterSaving;
    }

    // Если пользователь найден, обновляем его данные
    if (foundUser.username !== username || Object.keys(userData).length > 0) {
        await UserModel.update(userData, { where: { login } });
        if (foundUser.username !== username) {
            await UserModel.update({ username }, { where: { login } });
        }
        return textAfterUpdate;
    }

    return `User ${login}-${username} is already up-to-date`;
};