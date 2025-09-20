const express = require('express');
const router = express.Router();
const { bookLabTest, getTechnicianLabTests, updateLabTestStatus } = require('../controllers/labTestController');
const { protect } = require('../middleware/authMiddleware');
const { 
  validate, 
  labTestSchemas, 
  limitRequestSize, 
  detectXSS 
} = require('../middleware/validation');

// Apply comprehensive security middleware to all lab test routes
router.use(limitRequestSize);
router.use(detectXSS);

// POST /api/lab-tests - Book a lab test with comprehensive validation
// The route is protected; only logged-in users can book tests.
router.route('/')
    .post(protect, 
          validate(labTestSchemas.create), 
          bookLabTest);

// GET /api/lab-tests/technician - Get lab tests assigned to technician
router.route('/technician')
    .get(protect, getTechnicianLabTests);

// PUT /api/lab-tests/:id/status - Update lab test status
router.route('/:id/status')
    .put(protect, updateLabTestStatus);

module.exports = router;