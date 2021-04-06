const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv/config'); 

//const users = require("../models/User_model")
const {User} = require("../models/User_model");

/*-----------------GET requests-----------------*/

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

/*
router.get('/:email', async (req,res,next) => {
    try {
      //res.json(await users.getSingle(req.params.email));
      const data = await users.getSingle(req.params.email);
      console.log("Email seach...", data);
      res.json("ok")
    } catch (err) {
      console.error(`Error while getting quotes `, err.message);
      next(err);
    }
  
  });*/

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

 /* 
router.get('/', async (req,res,next) => {
  try {
    res.json(await users.getAll());
    console.log("All users seach...");
  } catch (err) {
    console.error(`Error while getting quotes `, err.message);
    next(err);
  }

});*/

/*-----------------POST requests-----------------*/

router.post('/', async (req, res, next) =>{
    //create user object
    const user = new User();
  
  //check request body 
  if(!req.body.email || !req.body.password){
    return res.status(400).json({message:'Password or email not provided.'});
  }
  //pass data to object 
  user.email = req.body.email;
  user.password = req.body.password;

  //call method to query db
  try {
      const response = await user.create();
      //give adequate response (see method def.)
      if(response==1){res.status(400).json("User not created (0 rows affected)")}
      if(response==2){res.status(400).json("User not created (already exists)")}
      if(response==3){res.status(400).json("User not created (unknown error occurred)")}
      //else response = 0
      res.status(200).json({message:"User created!", code:201});
      console.log(`Create user with ${req.body}`);
    } catch (err) {
      console.error(`ENDPOINT_CALL_ERROR: at create user `);
      res.status(503);
      next(err);
    }
});

/*router.post('/', async (req, res, next) =>{
  if(!req.body.email || !req.body.password){
    return res.status(400).json({message:'Password or email not provided.'});
  }

    try {
        res.json(await users.create(req.body.email, req.body.password));
        res.status(200);
        console.log(`Create user with ${req.body}`);
      } catch (err) {
        console.error(`Error while posting quotes `, err.message);
        res.status(503)
        next(err);
      }
});*/

//LOGIN
router.post('/login', async (req, res, next) =>{
  //create user object
  const user = new User();

//check request body 
if(!req.body.email || !req.body.password){
  return res.status(400).json({message:'Password or email not provided.', code:401});
}
//pass data to object 

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

      const token = jwt.sign({id: user.id }, process.env.JWT_PRIVATE_KEY);
      return res.status(200).json({message:'Login successfull!', code:201, token:token});
    
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

module.exports = router;