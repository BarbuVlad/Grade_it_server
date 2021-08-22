const jwt = require('jsonwebtoken');
require('dotenv/config');

/*Middleware Authorization (JWT)*/
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if(!token) res.status(401).json({message:"Access denied. No token", code:-10});
    try{
    const decodedPayload = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
    req.user = decodedPayload;//for now just the id
    next();

    } catch (err){
        res.status(401).json({message:"Access denied. Bad token", code:-11});
    }
} 

module.exports = {
    auth
};