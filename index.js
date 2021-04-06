//Imports
const express = require("express");
const cors = require("cors");
require('dotenv/config');   

const {logger} = require('./middleware/logger');

const postRouter = require("./api/posts");
const userRouter = require("./api/users");
//Initialization
const server = express();

//error loggin
if(!process.env.JWT_PRIVATE_KEY){
    console.error("FATAL ERROR: JWT_PRIVATE_KEY environment variabile not set!");
    process.exit(1);//exit with 1
}

//Middlewares
server.use(express.json()); // get json data
server.use(express.urlencoded({extended: false})); //get encoded URL

server.use(cors());
server.options("*", cors()); //enable pre-flight

server.use(logger);

//Routes
server.get('/', (req, res) => {
    res.send("<h2>Server(REST API) is up!</h2>");
});

server.use('/posts', postRouter);
server.use('/users', userRouter);
// 404 error
server.all('*', (req, res, next) => {
    const err = new HttpException(404, 'Endpoint Not Found');
    next(err);
});


//Listen for events (http requests)
const PORT = process.env.API_PORT || 5000;
server.listen(PORT, () => console.log(`Server(REST API) running on port ${PORT}`));

module.exports = server;