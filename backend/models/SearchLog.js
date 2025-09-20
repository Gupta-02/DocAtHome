const mongoose = require('mongoose');

const SearchLogSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
    },
    area: {
      type: String,
      required: true,
    },
    specialty: {
      type: String,
      required: true,
    },
    searchType: {
      type: String,
      enum: ['doctor', 'nurse'],
      required: true,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient aggregation queries
SearchLogSchema.index({ city: 1, area: 1, specialty: 1, searchType: 1 });
SearchLogSchema.index({ timestamp: 1 });

module.exports = mongoose.model('SearchLog', SearchLogSchema);