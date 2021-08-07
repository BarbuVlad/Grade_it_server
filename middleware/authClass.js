const jwt = require('jsonwebtoken');
require('dotenv/config');

/*Middleware Authorization for class (JWT)
 * This middleware must be used after the app access auth middleware
 * Used to validate all operations on class (see docs)
 * An important component regarding authorization is the "role" contained in JWT token
 * The role can have 2 values: student and teacher. 
 * Role validation is implemented at the REST API route level (determined per route) 
 * Frontend request must contain 2 headers:
    1) x-auth-token-class - JWT token given after "entering" in a class
    2) x-class-id - id of class
    Why? To avoid CSRF kind of attack: 
        obtain a token for a class and use it to make requests to another class
        If the plain text class id dose not match the payload class id from token, 
        a request to a class to which this token was NOT issued for is made, 
        deny access.
*/
const authClass = (req, res, next) => {
    const class_token = req.header('x-auth-token-class');
    //const class_id = req.header('x-class-id');
    if(!class_token) res.status(401).json({message:"Access denied. No class token", code:-12});
    //if(!class_id) res.status(401).json({message:"Access denied. Class id header missing", code:-13});
    try{
        const decodedPayload = jwt.verify(class_token, process.env.JWT_PRIVATE_KEY);
        //if(decodedPayload.id_class !== class_id){
        //    res.status(401).json({message:"Access denied. Bad class id header - token combination", code:-15});
        //}
        req.class = decodedPayload;
        next();
    } catch (err){
        res.status(401).json({message:"Access denied. Bad class token", code:-13});
    }
} 

module.exports = {
    authClass
};