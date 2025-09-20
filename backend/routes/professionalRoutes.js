const express = require('express');
const router = express.Router();
const { getDemandInsights, getDemandInsightsSummary } = require('../controllers/professionalController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// All routes require authentication and professional role
router.use(protect);
router.use(requireRole(['doctor', 'nurse']));

// @route   GET /api/professionals/demand-insights
// @desc    Get demand insights heatmap data
// @access  Private (professionals only)
router.get('/demand-insights', getDemandInsights);

// @route   GET /api/professionals/demand-insights/summary
// @desc    Get demand insights summary
// @access  Private (professionals only)
router.get('/demand-insights/summary', getDemandInsightsSummary);

module.exports = router;