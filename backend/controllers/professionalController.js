const SearchLog = require('../models/SearchLog');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get demand insights heatmap data
// @route   GET /api/professionals/demand-insights
// @access  Private (professionals only)
const getDemandInsights = asyncHandler(async (req, res) => {
  const { city, specialty, searchType, days = 30 } = req.query;

  // Build aggregation pipeline
  const pipeline = [];

  // Match stage - filter by time range
  const dateFilter = new Date();
  dateFilter.setDate(dateFilter.getDate() - parseInt(days));
  pipeline.push({
    $match: {
      timestamp: { $gte: dateFilter }
    }
  });

  // Optional filters
  if (city) {
    pipeline.push({
      $match: { city: { $regex: city, $options: 'i' } }
    });
  }

  if (specialty) {
    pipeline.push({
      $match: { specialty: { $regex: specialty, $options: 'i' } }
    });
  }

  if (searchType) {
    pipeline.push({
      $match: { searchType }
    });
  }

  // Group by area and count searches
  pipeline.push({
    $group: {
      _id: {
        city: '$city',
        area: '$area',
        specialty: '$specialty',
        searchType: '$searchType'
      },
      count: { $sum: 1 },
      avgLat: { $avg: '$latitude' },
      avgLng: { $avg: '$longitude' },
      latestTimestamp: { $max: '$timestamp' }
    }
  });

  // Sort by count descending
  pipeline.push({
    $sort: { count: -1 }
  });

  const searchData = await SearchLog.aggregate(pipeline);

  // Transform data for heatmap
  const heatmapData = searchData.map(item => ({
    city: item._id.city,
    area: item._id.area,
    specialty: item._id.specialty,
    searchType: item._id.searchType,
    count: item.count,
    latitude: item.avgLat || null,
    longitude: item.avgLng || null,
    intensity: Math.min(item.count / 10, 1), // Normalize intensity (0-1)
    lastSearch: item.latestTimestamp
  }));

  res.json({
    success: true,
    data: heatmapData,
    totalSearches: heatmapData.reduce((sum, item) => sum + item.count, 0),
    uniqueAreas: new Set(heatmapData.map(item => item.area)).size,
    dateRange: {
      from: dateFilter,
      to: new Date(),
      days: parseInt(days)
    }
  });
});

// @desc    Get demand insights summary
// @route   GET /api/professionals/demand-insights/summary
// @access  Private (professionals only)
const getDemandInsightsSummary = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  const dateFilter = new Date();
  dateFilter.setDate(dateFilter.getDate() - parseInt(days));

  // Get total searches
  const totalSearches = await SearchLog.countDocuments({
    timestamp: { $gte: dateFilter }
  });

  // Get searches by specialty
  const specialtyStats = await SearchLog.aggregate([
    { $match: { timestamp: { $gte: dateFilter } } },
    {
      $group: {
        _id: '$specialty',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Get searches by city
  const cityStats = await SearchLog.aggregate([
    { $match: { timestamp: { $gte: dateFilter } } },
    {
      $group: {
        _id: '$city',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Get searches by type
  const typeStats = await SearchLog.aggregate([
    { $match: { timestamp: { $gte: dateFilter } } },
    {
      $group: {
        _id: '$searchType',
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    summary: {
      totalSearches,
      period: `${days} days`,
      topSpecialties: specialtyStats.slice(0, 5),
      topCities: cityStats.slice(0, 5),
      searchTypes: typeStats
    }
  });
});

module.exports = {
  getDemandInsights,
  getDemandInsightsSummary
};