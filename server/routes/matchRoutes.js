const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { getMatches, updateMatchStatus } = require('../controllers/matchController');

const matchRouter = express.Router();

// Protected route for fetching matches
matchRouter.get('/', protect, getMatches);

// Protected route for updating match pipeline status (e.g. from Kanban board drag)
matchRouter.put('/:id/status', protect, updateMatchStatus);

module.exports = matchRouter;
