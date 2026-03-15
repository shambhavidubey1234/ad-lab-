const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    default: '14:30'
  },
  venue: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    default: 50
  },
  // ✅ ADDED: confirmedCount field to track confirmed registrations
  confirmedCount: {
    type: Number,
    default: 0
  },
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled'],
    default: 'published'
  },
  category: {
    type: String,
    enum: ['Academic', 'Cultural', 'Sports', 'Technical', 'Workshop', 'Seminar'],
    default: 'Technical'
  },
  posterUrl: {
    type: String,
    default: ''
  },
  
  // ========== ANALYTICS TRACKING FIELDS ==========
  approvalTime: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  editedAfterApproval: {
    type: Boolean,
    default: false
  },
  approvalAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  viewCount: {
    type: Number,
    default: 0
  },
  registrationRate: {
    type: Number,
    default: 0
  },
  performanceScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  tags: [{
    type: String
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // ========== END ANALYTICS FIELDS ==========
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

/* ✅ CORRECT pre-save hook (NO next misuse) */
EventSchema.pre('save', function () {
  this.updatedAt = Date.now();
  
  // Track if event was edited after approval
  if (this.isModified() && this.status === 'published' && !this.isNew) {
    this.editedAfterApproval = true;
  }
});

// Method to update registration rate
EventSchema.methods.updateRegistrationRate = async function () {
  const Registration = require('./registration');
  const registrationCount = await Registration.countDocuments({ event: this._id });
  this.registrationRate = this.capacity > 0 ? (registrationCount / this.capacity) * 100 : 0;
  
  // Calculate performance score
  if (this.status === 'published') {
    const daysUntilEvent = Math.ceil((this.date - new Date()) / (1000 * 60 * 60 * 24));
    const timeFactor = daysUntilEvent > 0 ? Math.min(100, (30 / daysUntilEvent) * 100) : 100;
    
    this.performanceScore = Math.min(100,
      (this.registrationRate * 0.6) + // 60% weight for registration rate
      (timeFactor * 0.4) // 40% weight for time factor
    );
  }
  
  return this.save();
};

// Method to approve event
EventSchema.methods.approveEvent = function (adminId) {
  this.status = 'published';
  this.approvalTime = new Date();
  this.approvalAdminId = adminId;
  
  // Update club admin's approved events count
  const User = require('./user');
  User.findById(this.clubId).then(user => {
    if (user && user.role === 'club_admin') {
      user.approvedEventsCount += 1;
      user.save();
    }
  });
  
  return this.save();
};

// Method to reject event
EventSchema.methods.rejectEvent = function (adminId, reason) {
  this.status = 'cancelled';
  this.rejectionReason = reason;
  
  // Update club admin's rejected events count
  const User = require('./user');
  User.findById(this.clubId).then(user => {
    if (user && user.role === 'club_admin') {
      user.rejectedEventsCount += 1;
      user.save();
    }
  });
  
  return this.save();
};

// Static method to get event statistics
EventSchema.statics.getEventStats = async function (clubId = null) {
  const matchStage = clubId ? { clubId } : {};
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalEvents: { $sum: 1 },
        draftEvents: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
        publishedEvents: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
        cancelledEvents: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        avgRegistrationRate: { $avg: '$registrationRate' },
        avgPerformanceScore: { $avg: '$performanceScore' },
        totalViews: { $sum: '$viewCount' }
      }
    },
    {
      $project: {
        totalEvents: 1,
        draftEvents: 1,
        publishedEvents: 1,
        cancelledEvents: 1,
        avgRegistrationRate: { $round: ['$avgRegistrationRate', 2] },
        avgPerformanceScore: { $round: ['$avgPerformanceScore', 2] },
        totalViews: 1,
        approvalRate: {
          $cond: [
            { $gt: ['$totalEvents', 0] },
            { $round: [{ $multiply: [{ $divide: ['$publishedEvents', '$totalEvents'] }, 100] }, 2] },
            0
          ]
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalEvents: 0,
    draftEvents: 0,
    publishedEvents: 0,
    cancelledEvents: 0,
    avgRegistrationRate: 0,
    avgPerformanceScore: 0,
    totalViews: 0,
    approvalRate: 0
  };
};

// Indexes for analytics queries
EventSchema.index({ clubId: 1, createdAt: -1 });
EventSchema.index({ status: 1, createdAt: -1 });
EventSchema.index({ category: 1, createdAt: -1 });
EventSchema.index({ performanceScore: -1 });
EventSchema.index({ date: 1 });

module.exports = mongoose.model('Event', EventSchema);