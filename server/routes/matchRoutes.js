const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { getMatches } = require('../controllers/matchController');

const matchRouter = express.Router();

// Protected route for fetching matches
matchRouter.get('/', protect, getMatches);

module.exports = matchRouter;
