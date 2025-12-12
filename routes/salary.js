import express from 'express';
import PDFDocument from 'pdfkit';
import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import Advance from '../models/Advance.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Calculate salary for an employee (authenticated users)
router.get('/calculate/:employeeId', authMiddleware, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required' });
        }

        const employee = await Employee.findById(req.params.employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Get attendance records
        const attendanceRecords = await Attendance.find({
            employee: req.params.employeeId,
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        });

        // Get pending advances
        const advances = await Advance.find({
            employee: req.params.employeeId,
            status: 'pending',
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        });

        // Calculate totals
        let totalRegularHours = 0;
        let totalOvertimeHours = 0;

        attendanceRecords.forEach(record => {
            totalRegularHours += record.regularHours;
            totalOvertimeHours += record.overtimeHours;
        });

        const regularPay = totalRegularHours * employee.hourlyRate;
        const overtimePay = totalOvertimeHours * employee.hourlyRate * 1.5;
        const grossSalary = regularPay + overtimePay;

        const totalAdvances = advances.reduce((sum, adv) => sum + adv.amount, 0);
        const netSalary = grossSalary - totalAdvances;

        const salaryData = {
            employee: {
                id: employee._id,
                employeeId: employee.employeeId,
                name: employee.name,
                hourlyRate: employee.hourlyRate
            },
            period: {
                startDate,
                endDate
            },
            attendance: {
                totalDays: attendanceRecords.length,
                regularHours: totalRegularHours,
                overtimeHours: totalOvertimeHours
            },
            salary: {
                regularPay,
                overtimePay,
                grossSalary,
                totalAdvances,
                netSalary
            },
            advances: advances.map(adv => ({
                id: adv._id,
                amount: adv.amount,
                date: adv.date,
                reason: adv.reason
            })),
            attendanceDetails: attendanceRecords.map(att => ({
                date: att.date,
                regularHours: att.regularHours,
                overtimeHours: att.overtimeHours,
                notes: att.notes
            }))
        };

        res.json(salaryData);
    } catch (error) {
        res.status(500).json({ message: 'Error calculating salary', error: error.message });
    }
});

// Generate PDF salary report (authenticated users)
router.get('/report/:employeeId', authMiddleware, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required' });
        }

        const employee = await Employee.findById(req.params.employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Get attendance records
        const attendanceRecords = await Attendance.find({
            employee: req.params.employeeId,
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }).sort({ date: 1 });

        // Get pending advances
        const advances = await Advance.find({
            employee: req.params.employeeId,
            status: 'pending',
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }).sort({ date: 1 });

        // Calculate totals
        let totalRegularHours = 0;
        let totalOvertimeHours = 0;

        attendanceRecords.forEach(record => {
            totalRegularHours += record.regularHours;
            totalOvertimeHours += record.overtimeHours;
        });

        const regularPay = totalRegularHours * employee.hourlyRate;
        const overtimePay = totalOvertimeHours * employee.hourlyRate * 1.5;
        const grossSalary = regularPay + overtimePay;
        const totalAdvances = advances.reduce((sum, adv) => sum + adv.amount, 0);
        const netSalary = grossSalary - totalAdvances;

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=salary-report-${employee.employeeId}-${Date.now()}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('SALARY REPORT', { align: 'center' });
        doc.moveDown();

        // Employee Info
        doc.fontSize(12).font('Helvetica-Bold').text('Employee Information', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Employee ID: ${employee.employeeId}`);
        doc.text(`Name: ${employee.name}`);
        doc.text(`Position: ${employee.position || 'N/A'}`);
        doc.text(`Hourly Rate: ₹${employee.hourlyRate.toFixed(2)}`);
        doc.moveDown();

        // Period
        doc.fontSize(12).font('Helvetica-Bold').text('Salary Period', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        doc.text(`From: ${new Date(startDate).toLocaleDateString()}`);
        doc.text(`To: ${new Date(endDate).toLocaleDateString()}`);
        doc.moveDown();

        // Attendance Summary
        doc.fontSize(12).font('Helvetica-Bold').text('Attendance Summary', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Total Days Worked: ${attendanceRecords.length}`);
        doc.text(`Regular Hours: ${totalRegularHours.toFixed(2)} hrs`);
        doc.text(`Overtime Hours: ${totalOvertimeHours.toFixed(2)} hrs`);
        doc.moveDown();

        // Salary Breakdown
        doc.fontSize(12).font('Helvetica-Bold').text('Salary Breakdown', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Regular Pay (${totalRegularHours.toFixed(2)} hrs × ₹${employee.hourlyRate.toFixed(2)}): ₹${regularPay.toFixed(2)}`);
        doc.text(`Overtime Pay (${totalOvertimeHours.toFixed(2)} hrs × ₹${(employee.hourlyRate * 1.5).toFixed(2)}): ₹${overtimePay.toFixed(2)}`);
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text(`Gross Salary: ₹${grossSalary.toFixed(2)}`);
        doc.moveDown();

        // Advances/Deductions
        if (advances.length > 0) {
            doc.fontSize(12).font('Helvetica-Bold').text('Advances/Deductions', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica');

            advances.forEach((adv, index) => {
                doc.text(`${index + 1}. ${new Date(adv.date).toLocaleDateString()} - ₹${adv.amount.toFixed(2)} ${adv.reason ? `(${adv.reason})` : ''}`);
            });

            doc.moveDown(0.5);
            doc.font('Helvetica-Bold').text(`Total Advances: ₹${totalAdvances.toFixed(2)}`);
            doc.moveDown();
        }

        // Net Salary
        doc.fontSize(14).font('Helvetica-Bold');
        doc.text(`NET SALARY: ₹${netSalary.toFixed(2)}`, { align: 'center' });
        doc.moveDown();

        // Attendance Details Table
        if (attendanceRecords.length > 0) {
            doc.addPage();
            doc.fontSize(12).font('Helvetica-Bold').text('Detailed Attendance Records', { underline: true });
            doc.moveDown();

            doc.fontSize(9).font('Helvetica');
            const tableTop = doc.y;
            const colWidths = { date: 100, regular: 80, overtime: 80, notes: 220 };

            // Table headers
            doc.font('Helvetica-Bold');
            doc.text('Date', 50, tableTop, { width: colWidths.date });
            doc.text('Regular Hrs', 150, tableTop, { width: colWidths.regular });
            doc.text('Overtime Hrs', 230, tableTop, { width: colWidths.overtime });
            doc.text('Notes', 310, tableTop, { width: colWidths.notes });

            doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

            // Table rows
            doc.font('Helvetica');
            let yPos = tableTop + 20;

            attendanceRecords.forEach((record, index) => {
                if (yPos > 700) {
                    doc.addPage();
                    yPos = 50;
                }

                doc.text(new Date(record.date).toLocaleDateString(), 50, yPos, { width: colWidths.date });
                doc.text(record.regularHours.toFixed(2), 150, yPos, { width: colWidths.regular });
                doc.text(record.overtimeHours.toFixed(2), 230, yPos, { width: colWidths.overtime });
                doc.text(record.notes || '-', 310, yPos, { width: colWidths.notes });

                yPos += 20;
            });
        }

        // Footer
        doc.fontSize(8).font('Helvetica').text(
            `Generated on ${new Date().toLocaleString()}`,
            50,
            doc.page.height - 50,
            { align: 'center' }
        );

        doc.end();
    } catch (error) {
        res.status(500).json({ message: 'Error generating PDF report', error: error.message });
    }
});

export default router;
