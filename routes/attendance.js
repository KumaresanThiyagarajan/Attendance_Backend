import express from 'express';
import Attendance from '../models/Attendance.js';
import Employee from '../models/Employee.js';

const router = express.Router();

// Get all attendance records with optional filters
router.get('/', async (req, res) => {
    try {
        const { employeeId, startDate, endDate } = req.query;
        let query = {};

        if (employeeId) {
            query.employee = employeeId;
        }

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const attendance = await Attendance.find(query)
            .populate('employee', 'name employeeId')
            .sort({ date: -1 });

        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance', error: error.message });
    }
});

// Get attendance for specific employee
router.get('/employee/:employeeId', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = { employee: req.params.employeeId };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const attendance = await Attendance.find(query)
            .populate('employee', 'name employeeId hourlyRate')
            .sort({ date: -1 });

        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance', error: error.message });
    }
});

// Create attendance record
router.post('/', async (req, res) => {
    try {
        const { employee, date, regularHours, overtimeHours, notes } = req.body;

        // Verify employee exists
        const employeeExists = await Employee.findById(employee);
        if (!employeeExists) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const attendance = new Attendance({
            employee,
            date,
            regularHours,
            overtimeHours,
            notes
        });

        const savedAttendance = await attendance.save();
        const populatedAttendance = await Attendance.findById(savedAttendance._id)
            .populate('employee', 'name employeeId');

        res.status(201).json(populatedAttendance);
    } catch (error) {
        res.status(400).json({ message: 'Error creating attendance record', error: error.message });
    }
});

// Update attendance record
router.put('/:id', async (req, res) => {
    try {
        const { date, regularHours, overtimeHours, notes } = req.body;

        const attendance = await Attendance.findByIdAndUpdate(
            req.params.id,
            { date, regularHours, overtimeHours, notes },
            { new: true, runValidators: true }
        ).populate('employee', 'name employeeId');

        if (!attendance) {
            return res.status(404).json({ message: 'Attendance record not found' });
        }

        res.json(attendance);
    } catch (error) {
        res.status(400).json({ message: 'Error updating attendance', error: error.message });
    }
});

// Delete attendance record
router.delete('/:id', async (req, res) => {
    try {
        const attendance = await Attendance.findByIdAndDelete(req.params.id);
        if (!attendance) {
            return res.status(404).json({ message: 'Attendance record not found' });
        }
        res.json({ message: 'Attendance record deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting attendance', error: error.message });
    }
});

export default router;
