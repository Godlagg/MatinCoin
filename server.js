const express = require("express");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios"); // Для отправки запросов

const TOKEN = "YOUR_TELEGRAM_BOT_TOKEN";
const server = express();
const bot = new TelegramBot(TOKEN, { polling: true });
const port = process.env.PORT || 10000;
const gameName = "cryptocoin";
const queries = {};

// Устанавливаем папку со статикой
server.use(express.static(path.join(__dirname, 'MatinCoin')));

// Команда /help
bot.onText(/help/, (msg) => {
    bot.sendMessage(msg.from.id, "Say /game if you want to play.");
});

// Команды /start и /game
bot.onText(/start|game/, (msg) => {
    bot.sendGame(msg.from.id, gameName);
});

// Обработка callback queries
bot.on("callback_query", async (query) => {
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
            await bot.answerCallbackQuery(query.id, {
                text: `Sorry, '${query.game_short_name}' is not available.`
            });
        } catch (error) {
            console.error('Error answering callback query:', error);
        }
    } else {
        queries[query.id] = query;
        let gameUrl = "https://your-frontend-url.com";
        try {
            await bot.answerCallbackQuery(query.id, {
                url: gameUrl
            });
        } catch (error) {
            console.error('Error answering callback query with URL:', error);
        }
    }
});

// Обработка inline queries
bot.on("inline_query", (iq) => {
    bot.answerInlineQuery(iq.id, [{
        type: "game",
        id: "0",
        game_short_name: gameName
    }]);
});

// Обработка запроса на установку результата игры
server.get("/highscore/:score", (req, res, next) => {
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
    bot.setGameScore(query.from.id, parseInt(req.params.score), options)
        .then(result => {
            res.send('Score updated');
        })
        .catch(err => {
            console.error('Error setting game score:', err);
            next(err);
        });
});

// Периодический запрос для поддержания активности
const keepAliveInterval = 5 * 60 * 1000; // 5 минут
const keepAliveUrl = `http://localhost:${port}`; // URL для поддержания активности

setInterval(async () => {
    try {
        await axios.get(keepAliveUrl);
        console.log('Keep-alive ping successful');
    } catch (error) {
        console.error('Error during keep-alive ping:', error);
    }
}, keepAliveInterval);

// Запуск сервера
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
