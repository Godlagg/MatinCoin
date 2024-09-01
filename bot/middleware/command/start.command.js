const express = require("express");
const cors = require('cors');
const { saveUser } = require("../../common/sequelize/saveUser.sequelize");
const UserModel = require("../../models/user.model");
const server = express();
const gameName = "cryptocoin";
const queries = {};

// Настройка CORS
server.use(cors({
    origin: '*', // Разрешить все домены
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: true, // Продолжить обработку preflight-запросов
    optionsSuccessStatus: 204 // Статус для успешных preflight-запросов
}));

server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Обработка GET запроса для получения логина
server.get('/getLogin', (req, res) => {
    // Пример для теста: возвращаем статичный логин
    // В реальной ситуации вы получите логин из базы данных или другого источника
    const login = 'exampleLogin'; 
    res.json(login);
});

// Обработка GET запроса для получения данных пользователя по логину
server.get('/user/:login', async (req, res) => {
    try {
        const { login } = req.params;
        const user = await UserModel.findOne({ where: { login: login } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Возвращаем данные пользователя в формате JSON
        res.json({
            coins: user.coins,
            earnperminute: user.earnperminute,
            earnperminuteadd: user.earnperminuteadd,
            refreshCount: user.refreshCount,
            dailycombotryes: user.dailycombotryes,
            lvlplayer: user.lvlplayer,
            battery: user.battery,
            multitap: user.multitap,
            value: user.value,
            valuecount: user.valuecount,
            lvlplayervalue: user.lvlplayervalue
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Обработка POST запроса для обновления данных пользователя
server.post('/user/:login', async (req, res) => {
    try {
        const { login } = req.params;
        const userData = req.body;

        // Обновляем данные пользователя в базе данных
        const [updated] = await UserModel.update(userData, { where: { login: login } });

        if (updated) {
            res.json({ message: 'User data updated successfully' });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error updating user data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Обработка POST запроса для отладки
server.post('/debug', (req, res) => {
    console.log('Debug message:', req.body.message);
    res.json({ status: 'Debug message received' });
});

// Обработка POST запроса для аутентификации
server.post('/authenticate', async (req, res) => {
    const { login, username } = req.body;

    if (!login || !username) {
        return res.status(400).send('Login and username are required');
    }

    try {
        const result = await saveUser(login, username);
        res.json({ message: result });
    } catch (error) {
        console.error('Error saving user data:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Команда /help
bot.command('help', (ctx) => {
    ctx.reply("Say /game if you want to play.");
});

// Команды /start и /game
bot.command(['start', 'game'], (ctx) => {
    ctx.replyWithGame(gameName);
});

bot.on('callback_query', async (ctx) => {
    const query = ctx.callbackQuery;
    const queryTime = query.date * 1000; // timestamp в миллисекундах
    const currentTime = Date.now();
    const timeElapsed = currentTime - queryTime;

    // Проверка, не старше ли запрос 30 секунд
    if (timeElapsed > 30000) {
        console.log('Query is too old');
        return; // Пропуск этого запроса
    }

    if (query.game_short_name !== gameName) {
        try {
            await ctx.answerCbQuery(`Sorry, '${query.game_short_name}' is not available.`);
        } catch (error) {
            console.error('Error answering callback query:', error);
        }
    } else { // Зашел в игру
        queries[query.id] = query;
        let gameUrl = "https://godlagg.github.io/MatinCoin/";
        try {
            await ctx.answerCbQuery('', { url: gameUrl });
            try {
                const login = String(ctx.from.id);
                const username = ctx.from.username ?? "Anon";
                
                const result = await saveUser(login, username);
                console.log(result);
                
                // Передаем логин в Unity через URL
                const unityUrl = `https://ccca-2-63-102-71.ngrok-free.app/authenticate`;
                await fetch(unityUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ login, username })
                });

                return;
            } catch (err) {
                console.log(err);
            }
        } catch (error) {
            console.error('Error answering callback query with URL:', error);
        }
    }
});

// Обработка inline запросов
bot.on('inline_query', (ctx) => {
    ctx.answerInlineQuery([{
        type: 'game',
        id: '0',
        game_short_name: gameName
    }]);
});

// Обработка запроса на установку результата игры
server.get('/highscore/:score', (req, res, next) => {
    if (!queries.hasOwnProperty(req.query.id)) return next();
    let query = queries[req.query.id];
    let options;
    if (query.message) {
        options = {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id
        };
    } else {
        options = {
            inline_message_id: query.inline_message_id
        };
    }
    bot.telegram.setGameScore(query.from.id, parseInt(req.params.score), options)
        .then(result => {
            res.send('Score updated');
        })
        .catch(err => {
            console.error('Error setting game score:', err);
            next(err);
        });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});