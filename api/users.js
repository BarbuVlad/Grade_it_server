const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const auth = require('../middleware/auth');
const {User} = require("../models/User_model");

/*-----------------GET requests-----------------*/

//READ SINGLE USER BY EMAIL
router.get('/:email', async (req,res,next) => {
  //create user object
  const user = new User();

  //call method to query db
  try {
    const response = await user.getSingle(req.params.email);
    if(!response){res.status(400).json("User not found")}
    
    console.log("Email seach...", response);
    res.status(200).json({id:user.id, email:user.email, password:user.password});
  } catch (err) {
    console.error(`Error while getting user `, err.message);
    next(err);
  }

});

//READ ALL USERS
  router.get('/', async (req,res,next) => {
    //create user object
    const user = new User();

    //call method to query db
    try {
      const response = await user.getAll();
      if(!response){res.status(404).json("Users not found")}

      console.log("All users seach...");
      res.status(200).json(response);
    } catch (err) {
      console.error(`Error while getting quotes `, err.message);
      next(err);
    }
  
  });

/*-----------------POST requests-----------------*/

//CREATE
router.post('/', async (req, res, next) =>{
    //create user object
    const user = new User();
  
  //check request body 
  const validateError = User.validateUserData({email: req.body.email, password: req.body.password})
  if(validateError){
    return res.status(400).json({message:validateError, code:403});
  }
  

  //pass data to object 
  user.email = req.body.email;
  user.password = req.body.password;

  //call method to query db
  try {
      const response = await user.create();
      //give adequate response (see method def.)
      if(response==1){res.status(400).json({message:"User not created (0 rows affected)", code:401})}
      if(response==2){res.status(400).json({message:"User not created (already exists)",code:402})}
      if(response==3){res.status(400).json({message:"User not created (unknown error occurred)", code:401})}
      //else response = 0
      res.status(200).json({message:"User created!", code:201});
      console.log(`Create user with ${req.body}`);
    } catch (err) {
      console.error(`ENDPOINT_CALL_ERROR: at create user `);
      res.status(503);
      next(err);
    }
});


//LOGIN
router.post('/login', async (req, res, next) =>{
  //create user object
  const user = new User();

//check request body 
if(!req.body.email || !req.body.password){
  return res.status(400).json({message:'Password or email not provided.', code:401});
}

//call method to query db
try {
    const response = await user.getSingle(req.body.email);
    // response false - no data retured by query
    if(!response){return res.status(200).json({message:'Wrong credentials!', code:402})}

    //else -> data retured by query; user email exists -> check password
    const valid = await bcrypt.compare(req.body.password, user.password);

    if(!valid){return res.status(200).json({message:'Wrong credentials!', code:403})}

    //else -> user exists and password matched = login successfull
    if(valid){ //also send jwt token

      const token = user.generateAuthToken();
      return res.status(200).json({message:'Login successfull!', code:201, token:token, id:user.id});
    
    }

    console.log(`Login with ${req.body}`);
  } catch (err) {
    console.error(`ENDPOINT_CALL_ERROR: at login user `);
    res.status(503);
    next(err);
  }
});



/*-----------------PUT/PATCH requests-----------------*/


/*-----------------DELETE requests-----------------*/


/*-----------------other requests-----------------*/

//router.post('/',auth, async (req, res, next) =>{
module.exports = router;