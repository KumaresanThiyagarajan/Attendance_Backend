import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    regularHours: {
        type: Number,
        required: true,
        min: 0,
        max: 24,
        default: 0
    },
    overtimeHours: {
        type: Number,
        default: 0,
        min: 0,
        max: 24
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Index for faster queries
attendanceSchema.index({ employee: 1, date: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
