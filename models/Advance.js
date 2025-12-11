import mongoose from 'mongoose';

const advanceSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    reason: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'deducted'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// Index for faster queries
advanceSchema.index({ employee: 1, date: 1 });

const Advance = mongoose.model('Advance', advanceSchema);

export default Advance;
