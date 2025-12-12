import express from 'express';
import Employee from '../models/Employee.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/isAdmin.js';

const router = express.Router();

// Get all employees (authenticated users)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const employees = await Employee.find().sort({ createdAt: -1 });
        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching employees', error: error.message });
    }
});

// Get single employee (authenticated users)
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json(employee);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching employee', error: error.message });
    }
});

// Create new employee (Admin only)
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { employeeId, name, email, phone, hourlyRate, position } = req.body;

        // Check if employee ID already exists
        const existingEmployee = await Employee.findOne({ employeeId });
        if (existingEmployee) {
            return res.status(400).json({ message: 'Employee ID already exists' });
        }

        const employee = new Employee({
            employeeId,
            name,
            email,
            phone,
            hourlyRate,
            position
        });

        const savedEmployee = await employee.save();
        res.status(201).json(savedEmployee);
    } catch (error) {
        res.status(400).json({ message: 'Error creating employee', error: error.message });
    }
});

// Update employee (Admin only)
router.put('/:id', requireAdmin, async (req, res) => {
    try {
        const { name, email, phone, hourlyRate, position, isActive } = req.body;

        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            { name, email, phone, hourlyRate, position, isActive },
            { new: true, runValidators: true }
        );

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.json(employee);
    } catch (error) {
        res.status(400).json({ message: 'Error updating employee', error: error.message });
    }
});

// Delete employee (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const employee = await Employee.findByIdAndDelete(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting employee', error: error.message });
    }
});

export default router;
