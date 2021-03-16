const express = require('express');
const router = express.Router();
const posts = require("../models/Post_model")
/* GET posts */
router.get('/', async (req,res,next) => {
  try {
    res.json(await posts.getAll());
  } catch (err) {
    console.error(`Error while getting quotes `, err.message);
    next(err);
  }

});

module.exports = router;