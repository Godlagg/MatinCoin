const { bot } = require('../../connections/token.connection');
const express = require("express");
const path = require("path");
const cors = require('cors');
const { saveUser } = require("../../common/sequelize/saveUser.sequelize");
const UserModel = require("../../models/user.model");
const server = express();
const gameName = "cryptocoin";
const queries = {};

server.use(cors({
    origin: '*', // Разрешить все домены
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
server.use(express.json());


server.post('/debug', (req, res) => {
    const { message } = req.body;
    console.log('Received request body:', req.body); // Логирование всего тела запроса
    console.log(`Debug message from Unity: ${message}`);
    
    // Добавляем заголовок, чтобы избежать предупреждения ngrok
    res.setHeader('ngrok-skip-browser-warning', 'skip-browser-warning');
    
    res.status(200).send('Message received');
});

server.get('/getLogin', async (req, res) => {
    const { login } = req.query;

    if (!login) {
        return res.status(400).send('Login is required');
    }

    try {
        const user = await UserModel.findOne({ where: { login } });

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.setHeader('ngrok-skip-browser-warning', 'skip-browser-warning');
        res.status(200).json({ login: user.login });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('Internal Server Error');
    }
});


server.post('/user/:login', async (req, res) => {
    const login = req.params.login;
    const { coins, earnperminute, earnperminuteadd, refreshCount, dailycombotryes, lvlplayer, battery, multitap, value, valuecount, lvlplayervalue } = req.body;

    try {
        const user = await UserModel.findOne({ where: { login } });

        if (!user) {
            return res.status(404).send('User not found');
        }

        await UserModel.update({
            coins,
            earnperminute,
            earnperminuteadd,
            refreshCount,
            dailycombotryes,
            lvlplayer,
            battery,
            multitap,
            value,
            valuecount,
            lvlplayervalue
        }, {
            where: { login }
        });

        res.setHeader('ngrok-skip-browser-warning', 'skip-browser-warning');
        res.status(200).send('User data updated successfully');
    } catch (error) {
        console.error('Error updating user data:', error);
        res.status(500).send('Internal Server Error');
    }
});

server.post('/authenticate', async (req, res) => {
    const { login, username } = req.body;

    if (!login || !username) {
        return res.status(400).send('Login and username are required');
    }

    try {
        const result = await saveUser(login, username);
        res.setHeader('ngrok-skip-browser-warning', 'skip-browser-warning');
        res.status(200).json({ message: result });
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
                const unityUrl = `https://b13c-91-222-218-191.ngrok-free.app/authenticate`;
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

// Обработка inline queries
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

const port = process.env.PORT || 5000;
server.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
});

server.use((req, res, next) => {
    console.log(`Request Method: ${req.method}`);
    console.log(`Request URL: ${req.url}`);
    console.log(`Request Body: ${JSON.stringify(req.body)}`);
    next();
});

server.use((req, res, next) => {
    res.setHeader('ngrok-skip-browser-warning', 'skip-browser-warning');
    next();
});

server.use(express.static(path.join(__dirname, 'MatinCoin')));