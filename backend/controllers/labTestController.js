const LabTest = require('../models/LabTest');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Book a new lab test
// @route   POST /api/lab-tests
exports.bookLabTest = asyncHandler(async (req, res) => {
    // Add the patient's ID from the authenticated user token
    req.body.patient = req.user.id;
    
    // Set the fee based on your business logic
    req.body.totalFee = 800; // As per your request

    // Find available technicians in the patient's city
    const technicians = await User.find({ 
        role: 'technician', 
        city: req.user.city,
        isVerified: true 
    });

    if (technicians.length > 0) {
        // Simple round-robin: find technician with least assigned tests today
        const today = new Date().toISOString().split('T')[0];
        
        let assignedTechnician = null;
        let minTests = Infinity;
        
        for (const tech of technicians) {
            const testCount = await LabTest.countDocuments({
                technician: tech._id,
                collectionDate: today
            });
            
            if (testCount < minTests) {
                minTests = testCount;
                assignedTechnician = tech;
            }
        }
        
        req.body.technician = assignedTechnician._id;
    }

    const labTestBooking = await LabTest.create(req.body);

    res.status(201).json({
      success: true,
      data: labTestBooking
    });
});

// @desc    Get lab tests assigned to a technician
// @route   GET /api/lab-tests/technician
exports.getTechnicianLabTests = asyncHandler(async (req, res) => {
    const technicianId = req.user.id;
    
    const labTests = await LabTest.find({ technician: technicianId })
        .populate('patient', 'name email phone')
        .sort({ collectionDate: 1, collectionTime: 1 });

    res.status(200).json({
        success: true,
        count: labTests.length,
        data: labTests
    });
});

// @desc    Update lab test status
// @route   PUT /api/lab-tests/:id/status
exports.updateLabTestStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    
    const labTest = await LabTest.findById(req.params.id);
    
    if (!labTest) {
        return res.status(404).json({
            success: false,
            message: 'Lab test not found'
        });
    }
    
    // Check if technician is assigned to this test
    if (labTest.technician.toString() !== req.user.id) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to update this lab test'
        });
    }
    
    labTest.status = status;
    await labTest.save();
    
    res.status(200).json({
        success: true,
        data: labTest
    });
});