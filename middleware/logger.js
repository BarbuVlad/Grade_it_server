const moment = require('moment');

/*Middleware logger*/
const logger = (req, res, next) => {
    //get the link accessed:
    console.log(`${req.protocol}://${req.get('host')}${req.originalUrl} 
Time: ${moment().format()} \n`);
    next();
} 

module.exports = {
    logger

};