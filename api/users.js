const express = require('express');
const router = express.Router();
const users = require("../models/User_model")
/* GET posts */
router.get('/', async (req,res,next) => {
  try {
    res.json(await users.getAll());
  } catch (err) {
    console.error(`Error while getting quotes `, err.message);
    next(err);
  }

});

router.get('/:email', async (req,res,next) => {
    try {
      res.json(await users.getSingle(req.params.email));
    } catch (err) {
      console.error(`Error while getting quotes `, err.message);
      next(err);
    }
  
  });

module.exports = router;