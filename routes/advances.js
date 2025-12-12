import express from 'express';
import Advance from '../models/Advance.js';
import Employee from '../models/Employee.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/isAdmin.js';

const router = express.Router();

// Get all advances with optional filters (authenticated users)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { employeeId, status } = req.query;
        let query = {};

        if (employeeId) {
            query.employee = employeeId;
        }

        if (status) {
            query.status = status;
        }

        const advances = await Advance.find(query)
            .populate('employee', 'name employeeId')
            .sort({ date: -1 });

        res.json(advances);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching advances', error: error.message });
    }
});

// Get advances for specific employee (authenticated users)
router.get('/employee/:employeeId', authMiddleware, async (req, res) => {
    try {
        const { status } = req.query;
        let query = { employee: req.params.employeeId };

        if (status) {
            query.status = status;
        }

        const advances = await Advance.find(query)
            .populate('employee', 'name employeeId')
            .sort({ date: -1 });

        res.json(advances);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching advances', error: error.message });
    }
});

// Create advance payment record (Admin only)
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { employee, amount, date, reason } = req.body;

        // Verify employee exists
        const employeeExists = await Employee.findById(employee);
        if (!employeeExists) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const advance = new Advance({
            employee,
            amount,
            date,
            reason
        });

        const savedAdvance = await advance.save();
        const populatedAdvance = await Advance.findById(savedAdvance._id)
            .populate('employee', 'name employeeId');

        res.status(201).json(populatedAdvance);
    } catch (error) {
        res.status(400).json({ message: 'Error creating advance record', error: error.message });
    }
});

// Update advance status (Admin only)
router.put('/:id', requireAdmin, async (req, res) => {
    try {
        const { status, amount, date, reason } = req.body;

        const advance = await Advance.findByIdAndUpdate(
            req.params.id,
            { status, amount, date, reason },
            { new: true, runValidators: true }
        ).populate('employee', 'name employeeId');

        if (!advance) {
            return res.status(404).json({ message: 'Advance record not found' });
        }

        res.json(advance);
    } catch (error) {
        res.status(400).json({ message: 'Error updating advance', error: error.message });
    }
});

// Delete advance record (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const advance = await Advance.findByIdAndDelete(req.params.id);
        if (!advance) {
            return res.status(404).json({ message: 'Advance record not found' });
        }
        res.json({ message: 'Advance record deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting advance', error: error.message });
    }
});

export default router;
