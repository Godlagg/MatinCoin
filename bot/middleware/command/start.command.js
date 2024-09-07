    const { bot } = require('../../connections/token.connection');
    const express = require("express");
    const session = require('express-session');
    const path = require("path");
    const cors = require('cors');
    const { saveUser } = require("../../common/sequelize/saveUser.sequelize");
    const UserModel = require("../../models/user.model");
    const server = express();
    const gameName = "cryptocoin";
    const queries = {};


    server.use(express.json());
    server.use(express.urlencoded({ extended: true }));

    server.use(session({
        secret: 'y41!cosu7^fj@#x--#41!9_u8lg&+xw%v03%*e^&5h0lk*b&3!', // Секретный ключ для подписи идентификаторов сессий
        resave: false,
        saveUninitialized: true,
        cookie: { secure: true, httpOnly: true } // Установите в true для HTTPS
    }));

        // Настройка CORS
    server.use(cors({
        origin: '*', // Разрешить все домены
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
        preflightContinue: true, // Продолжить обработку preflight-запросов
        optionsSuccessStatus: 204 // Статус для успешных preflight-запросов
    }));

    // Обработка GET запроса для получения логина
    server.get('/getLogin', async (req, res) => {
        try {
            const login = req.session?.login;
            console.log('Retrieved login from session:', login); // Логирование

            if (!login) {
                return res.status(400).json({ error: 'Login is not available' });
            }

            const user = await UserModel.findOne({ where: { login } });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ login: user.login });
        } catch (error) {
            console.error('Error fetching login:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
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
        const login = req.params.login;
        const userData = req.body;
        
        console.log('Received request on /user/:login');
        console.log('Request body:', req.body);
        console.log('Request params:', req.params);
        
        try {
            // Найти пользователя
            const foundUser = await UserModel.findOne({ where: { login } });
            
            if (!foundUser) {
                // Если пользователь не найден, создать нового
                await UserModel.create({
                    login,
                    ...userData // Создаем пользователя с данными из тела запроса
                });
                res.send('User created');
            } else {
                // Если пользователь найден, обновить данные
                await UserModel.update(userData, { where: { login } });
                res.send('User updated');
            }
        } catch (error) {
            console.error('Error handling /user/:login request:', error);
            res.status(500).send('Internal server error');
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
        // Сохранение логина в сессии
        req.session.login = login;

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
                    const unityUrl = `https://7f72-91-222-218-191.ngrok-free.app/authenticate`;
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