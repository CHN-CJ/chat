const { Configuration, OpenAIApi } = require("openai");
const { PassThrough } = require("stream");

/*
isomorphic-fetch是一个支持在Node.js环境和浏览器中使用的通用（isomorphic）fetch库。
Fetch API是用于进行网络请求的现代JavaScript API，但在Node.js环境中，默认情况下是不可用的。
使用isomorphic-fetch可以在Node.js中使用Fetch API，它会根据环境自动选择合适的实现。

stream是Node.js内置模块，用于处理流式数据。
在我们之前的例子中，我们使用了isomorphic-fetch来处理HTTP请求，它自带了流式响应的支持。
因此，在这种情况下，并不需要显式地使用stream模块。
*/


const express = require('express'),
    bodyParser = require('body-parser');

const app = express();
const port = 8001;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.all("*", function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "content-type");
    res.header("Access-Control-Allow-Methods", "DELETE,PUT,POST,GET,OPTIONS");
    if (req.method.toLowerCase() == 'options')
        res.send(200);  //让options尝试请求快速结束
    else
        next();
});

const configuration = new Configuration({
    apiKey: '',
});
const openai = new OpenAIApi(configuration);

app.post('/chatlink', async (req, res) => {
    console.log(req.query.chatname)
    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: req.query.chatname,
        temperature: 0.6,
    });
    // res.status(200).json({ result: completion.data });
    res.status(200).json({ result: completion.data.choices[0].text });
})

app.post('/chatlinkChatmodel', async (req, res) => {
    console.log(req.query.chatname)
    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ "role": "system", "content": req.query.chatname }],
    });
    console.log(completion.data.choices[0].message);
    res.status(200).json({ result: completion.data.choices[0].message });
})

app.get('/trychat', async (req, res) => {
    try {
        res.setHeader('Content-type', 'text/event-stream');
        console.log(req.query.chatname)
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ "role": "system", "content": req.query.chatname }],
            max_tokens: 500,
            stream: true
        }, { responseType: 'stream' });
        const { data } = completion;
        data.pipe(res);
    }
    catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Error occurred' });
    }
})

app.get('/chatlinkStream', async (req, res) => {
    try {
        res.setHeader('Content-type', 'text/event-stream');
        console.log(req.query.chatname)

        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ "role": "system", "content": "You are a helpful assistant." }, { role: "user", content: "Hello world" }],
            max_tokens: 100,
            stream: true
        }, { responseType: 'stream' });

        completion.data.on('data', (data) => {
            res.write(data);
        })

        completion.data.on('end', () => {
            res.end();
        })

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Error occurred' });
    }
})

app.get('/chatlinkS', async (req, res) => {
    try {
        res.setHeader('Content-type', 'text/event-stream');
        console.log(req.query.chatname)

        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ "role": "system", "content": "You are a helpful assistant." }, { role: "user", content: "Hello world" }],
            max_tokens: 100,
            stream: true
        }, { responseType: 'stream' });


        completion.data.on('data', data => {
            /*
                数据类型格式：
                    data: {"id":"chatcmpl-7nqILW5qO3ZN7r69QqOrQawKNUlHT","object":"chat.completion.chunk","created":1692113449,"model":"gpt-3.5-turbo-0613","choices":[{"index":0,"delta":{"content":"?"},"finish_reason":null}]}

                    data: {"id":"chatcmpl-7nqILW5qO3ZN7r69QqOrQawKNUlHT","object":"chat.completion.chunk","created":1692113449,"model":"gpt-3.5-turbo-0613","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

                    data: [DONE]↵↵
            */
            const lines = data.toString().split('\n').filter(line => line.trim() !== '');
            for (const line of lines) {
                const message = line.replace(/^data: /, '');
                if (message === '[DONE]') {
                    res.end();
                    return
                }
                const parsed = JSON.stringify(message.choices);
                res.write(`data: ${parsed}\n\n`)
                // console.log(message)
            }
        });

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Error occurred' });
    }
})


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});