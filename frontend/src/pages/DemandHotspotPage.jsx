import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { getDemandInsights, getDemandInsightsSummary } from '../api';
import toast from 'react-hot-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const DemandHotspotPage = () => {
  const { user } = useAuth();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const heatLayerRef = useRef(null);

  const [demandData, setDemandData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: '',
    specialty: '',
    days: 30
  });

  // Redirect if not Pro user
  if (!user || user.subscriptionTier !== 'pro') {
    return <Navigate to="/upgrade-pro" />;
  }

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Default center on India
    const defaultCenter = [20.5937, 78.9629];
    const defaultZoom = 5;

    mapInstanceRef.current = L.map(mapRef.current).setView(defaultCenter, defaultZoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(mapInstanceRef.current);

    // Initialize empty heat layer
    heatLayerRef.current = L.heatLayer([], {
      radius: 25,
      blur: 15,
      maxZoom: 10,
      max: 1.0,
      gradient: {
        0.2: 'blue',
        0.4: 'lime',
        0.6: 'yellow',
        0.8: 'orange',
        1.0: 'red'
      }
    }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Fetch demand data
  const fetchDemandData = async () => {
    try {
      setLoading(true);
      const [insightsResponse, summaryResponse] = await Promise.all([
        getDemandInsights(filters),
        getDemandInsightsSummary(filters)
      ]);

      const data = insightsResponse.data.data;
      setDemandData(data);
      setSummaryData(summaryResponse.data.summary);

      // Update heatmap
      updateHeatmap(data);
    } catch (error) {
      console.error('Error fetching demand data:', error);
      toast.error('Failed to load demand insights');
    } finally {
      setLoading(false);
    }
  };

  // Update heatmap with new data
  const updateHeatmap = (data) => {
    if (!heatLayerRef.current) return;

    // Convert data to heatmap format [lat, lng, intensity]
    const heatData = data
      .filter(item => item.latitude && item.longitude)
      .map(item => [
        item.latitude,
        item.longitude,
        item.intensity || Math.min(item.count / 10, 1)
      ]);

    heatLayerRef.current.setLatLngs(heatData);

    // Fit map to data bounds if we have data
    if (heatData.length > 0) {
      const bounds = L.latLngBounds(heatData.map(point => [point[0], point[1]]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchDemandData();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getDemandColor = (intensity) => {
    if (intensity >= 0.8) return 'text-red-500 bg-red-100 dark:bg-red-900';
    if (intensity >= 0.6) return 'text-orange-500 bg-orange-100 dark:bg-orange-900';
    if (intensity >= 0.4) return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900';
    if (intensity >= 0.2) return 'text-lime-500 bg-lime-100 dark:bg-lime-900';
    return 'text-blue-500 bg-blue-100 dark:bg-blue-900';
  };

  return (
    <div className="min-h-screen bg-accent-cream dark:bg-primary-dark py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              📊 Demand Insights
            </h1>
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-3 py-1 rounded-full text-sm font-bold">
              PRO FEATURE
            </span>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Analyze patient search patterns and identify high-demand areas for your services.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-secondary-dark p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                City
              </label>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                placeholder="e.g., Mumbai"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Specialty
              </label>
              <input
                type="text"
                value={filters.specialty}
                onChange={(e) => handleFilterChange('specialty', e.target.value)}
                placeholder="e.g., Cardiology"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time Period
              </label>
              <select
                value={filters.days}
                onChange={(e) => handleFilterChange('days', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchDemandData}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                {loading ? 'Loading...' : 'Apply Filters'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {summaryData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-secondary-dark p-6 rounded-lg shadow-lg text-center">
              <div className="text-3xl font-bold text-blue-600">{summaryData.totalSearches}</div>
              <div className="text-gray-600 dark:text-gray-300">Total Searches</div>
            </div>
            <div className="bg-white dark:bg-secondary-dark p-6 rounded-lg shadow-lg text-center">
              <div className="text-3xl font-bold text-red-600">{summaryData.topCities?.[0]?.count || 0}</div>
              <div className="text-gray-600 dark:text-gray-300">Searches in Top City</div>
            </div>
            <div className="bg-white dark:bg-secondary-dark p-6 rounded-lg shadow-lg text-center">
              <div className="text-3xl font-bold text-green-600">{summaryData.topSpecialties?.[0]?.count || 0}</div>
              <div className="text-gray-600 dark:text-gray-300">Searches for Top Specialty</div>
            </div>
            <div className="bg-white dark:bg-secondary-dark p-6 rounded-lg shadow-lg text-center">
              <div className="text-3xl font-bold text-purple-600">{demandData.length}</div>
              <div className="text-gray-600 dark:text-gray-300">Active Areas</div>
            </div>
          </div>
        )}

        {/* Map */}
        <div className="bg-white dark:bg-secondary-dark rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Demand Heatmap</h2>
          <div className="relative">
            <div
              ref={mapRef}
              className="w-full h-96 rounded-lg"
              style={{ minHeight: '400px' }}
            />
            {loading && (
              <div className="absolute inset-0 bg-white dark:bg-secondary-dark bg-opacity-75 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-300">Loading demand data...</p>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-4 text-sm">
            <span className="text-blue-600">Low</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <div className="w-4 h-4 bg-lime-500 rounded"></div>
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <div className="w-4 h-4 bg-red-500 rounded"></div>
            </div>
            <span className="text-red-600">High</span>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-secondary-dark rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Demand Areas</h2>
            <p className="text-gray-600 dark:text-gray-300">Areas with patient search activity</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Specialty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Searches
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Demand Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Last Search
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {demandData.slice(0, 20).map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.area}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {item.city}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {item.specialty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {item.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDemandColor(item.intensity)}`}>
                        {item.intensity >= 0.8 ? 'Very High' :
                         item.intensity >= 0.6 ? 'High' :
                         item.intensity >= 0.4 ? 'Medium' :
                         item.intensity >= 0.2 ? 'Low' : 'Very Low'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {new Date(item.lastSearch).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemandHotspotPage;
