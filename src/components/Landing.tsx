import React, { useEffect, useState, useRef } from 'react';
import { Truck, User, BarChart3, Calendar, Bell, Code, ShoppingCart, CreditCard, Key, Banknote, Loader2, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import {organizationService} from '../services/organization';

const Dashboard = () => {
  const [organizationData, setOrganizationData] = useState<any>({});
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(false);
  const mountedRef = useRef(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
const [isRefreshing, setIsRefreshing] = useState(false);

useEffect(() => {
  const getData = async (forceRefresh = false) => {
    try {
      // Check if we have cached data and it's less than 5 minutes old
      const cachedData = localStorage.getItem('dashboardData');
      const cachedTimestamp = localStorage.getItem('dashboardTimestamp');
      
      if (!forceRefresh && cachedData && cachedTimestamp) {
        const cacheTime = new Date(cachedTimestamp);
        const now = new Date();
        const timeDiff = now.getTime() - cacheTime.getTime();
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        if (timeDiff < fiveMinutes) {
          // Use cached data
          const parsed = JSON.parse(cachedData);
          setOrganizationData(parsed.organization_summary);
          setDrivers(parsed.drivers);
          setLastFetched(cacheTime);
          setError(null);
          setLoading(false);
          return;
        }
      }

      if (!mountedRef.current) return;
      setLoading(true);
      const data = await organizationService.getDriverSummary();
      console.log(data,'dashboard summary data')
      
      if (mountedRef.current) {
        setOrganizationData(data.organization_summary);
        setDrivers(data.drivers);
        setError(null);
        
        // Cache the data
        localStorage.setItem('dashboardData', JSON.stringify(data));
        localStorage.setItem('dashboardTimestamp', new Date().toISOString());
        setLastFetched(new Date());
      }
    } catch (error: any) {
      console.log('error ', error);
      if (mountedRef.current) {
        setError('Failed to fetch organization data');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  };
  
  getData();

  return () => {
    mountedRef.current = false;
  };
}, [reload]);


  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

const handleRetry = () => {
  setReload(prev => !prev);
};

const handleRefresh = async () => {
  setIsRefreshing(true);
  setError(null);
  
  try {
    const data = await organizationService.getDriverSummary();
    setOrganizationData(data.organization_summary);
    setDrivers(data.drivers);
    
    // Update cache
    localStorage.setItem('dashboardData', JSON.stringify(data));
    localStorage.setItem('dashboardTimestamp', new Date().toISOString());
    setLastFetched(new Date());
  } catch (error: any) {
    console.log('refresh error ', error);
    setError('Failed to refresh data');
  } finally {
    setIsRefreshing(false);
  }
};

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Dashboard</h2>
          <p className="text-gray-600">Fetching your fleet data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const distanceByDriverData = drivers.map(driver => ({
    driver_name: `${driver.driver_info?.first_name || 'Unknown'} ${driver.driver_info?.last_name || ''}`,
    total_distance: driver.statistics?.total_distance || 0,
    color: getColorForDriver(driver.driver_info?.first_name || 'Unknown')
  })).filter(item => item.total_distance > 0);

  const truckModelData = drivers.reduce((acc: any[], driver) => {
    const truckModel = driver.assigned_trucks?.[0]?.truck_model || 'Unknown';
    const existingModel = acc.find(item => item.model === truckModel);
    if (existingModel) {
      existingModel.count += 1;
      existingModel.total_distance += driver.statistics?.total_distance || 0;
    } else {
      acc.push({
        model: truckModel,
        count: 1,
        total_distance: driver.statistics?.total_distance || 0,
        color: getColorForTruckModel(truckModel)
      });
    }
    return acc;
  }, []);

  function getColorForDriver(driverName: string) {
    const colors = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    const hash = driverName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  }

  function getColorForTruckModel(model: string) {
    const colors: { [key: string]: string } = {
      'BMW': '#4F46E5',
      'Ferrari': '#06B6D4', 
      'Pajero': '#10B981',
      'Rover': '#F59E0B',
      'Hammer': '#EF4444'
    };
    return colors[model] || '#6B7280';
  }

  // Calculate expense categories from real data
  const expenseCategoryData = drivers.reduce((acc: any[], driver) => {
    driver.recent_expenses?.forEach((expense: any) => {
      const existingCategory = acc.find(item => item.category === expense.category);
      if (existingCategory) {
        existingCategory.total_expense += expense.amount;
      } else {
        acc.push({
          category: expense.category,
          total_expense: expense.amount,
          color: getColorForCategory(expense.category)
        });
      }
    });
    return acc;
  }, []).filter(item => item.total_expense > 0);

  function getColorForCategory(category: string) {
    const colors: { [key: string]: string } = {
      'Fuel': '#4F46E5',
      'Food': '#06B6D4',
      'Maintenance': '#10B981',
      'Insurance': '#F59E0B',
      'Repairs': '#EF4444',
      'Toll': '#8B5CF6',
      'Parking': '#EC4899'
    };
    return colors[category] || '#6B7280';
  }

  // Budget vs actual expenses for active trips
  const budgetVsActual = drivers.map((driver, index) => ({
    trip: index + 1,
    budget: 600, // You might want to get this from API too
    actual_expenses: driver.statistics?.total_expenses || 0,
    driver_name: `${driver.driver_info?.first_name || 'Unknown'} ${driver.driver_info?.last_name || ''}`
  }));

  // All trips from all drivers
  const allTrips = drivers.flatMap(driver => 
    (driver.recent_trips || []).map((trip: any) => ({
      trip_id: `TR2024${String(trip.trip_id).padStart(3, '0')}`,
      truck: { truck_number: trip.truck_reg_number },
      cargo_type: 'General Cargo',
      route: { source: trip.source, destination: trip.destination },
      trip_start: new Date(trip.trip_start).toLocaleString(),
      total_distance: trip.total_distance,
      completion_percentage: trip.status === 'active' ? 75 : trip.status === 'completed' ? 100 : 25,
      driver_name: `${driver.driver_info?.first_name || 'Unknown'} ${driver.driver_info?.last_name || ''}`
    }))
  );

  // Timeline events from real data
  const timelineEvents = drivers.flatMap(driver => 
    (driver.recent_trips || []).map((trip: any) => ({
      type: 'trip',
      icon: Code,
      text: `Trip #${trip.trip_id} started - ${trip.source} to ${trip.destination} (${trip.total_distance.toLocaleString()} km)`,
      date: new Date(trip.trip_start).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      color: 'text-blue-500'
    }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getProgressBarColor = (percentage: number) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-yellow-500';
  };

  // Calculate average trip duration (assuming 8 hours per 1000km)
  const avgTripDuration = organizationData.total_distance_all_drivers > 0 
    ? ((organizationData.total_distance_all_drivers / 1000) * 8 / organizationData.total_trips_all_drivers).toFixed(1)
    : '0';

  const fuelConsumptionData = drivers.reduce((acc: any[], driver) => {
    const fuelExpenses = driver.recent_expenses?.filter((expense: any) => 
      expense.category === 'Fuel'
    ) || [];
    
    if (fuelExpenses.length > 0) {
      const totalFuelCost = fuelExpenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);
      acc.push({
        driver_name: `${driver.driver_info?.first_name || 'Unknown'} ${driver.driver_info?.last_name || ''}`,
        fuel_cost: totalFuelCost,
        color: getColorForDriver(driver.driver_info?.first_name || 'Unknown')
      });
    }
    return acc;
  }, []);

  // Custom label component for pie charts
  const renderCustomLabel = (entry: any, total: number) => {
    const percent = ((entry.value / total) * 100).toFixed(1);
    return `${entry.value}\n${percent}%`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Value: {typeof data.value === 'number' ? data.value.toLocaleString() : data.value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen relative bg-gray-50 p-6">
      <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="flex items-center space-x-2 px-2 absolute -top-2 right-6 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
    </button>
      <div className="max-w-7xl mx-auto">
        

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Distance (All Time)</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {(organizationData.total_distance_all_drivers || 0).toLocaleString()} km
                </h3>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <span className="text-blue-600 font-semibold">Active Fleet</span>
              <span className="text-gray-600 text-sm ml-1">
                across {organizationData.active_drivers || 0} drivers
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total drivers <br/>trips</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {organizationData.total_trips_all_drivers || 0}
                </h3>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <span className="text-green-600 font-semibold">
                {organizationData.drivers_with_active_trips || 0}
              </span>
              <span className="text-gray-600 text-sm ml-1">drivers with active trips</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Trip Duration</p>
                <h3 className="text-2xl font-bold text-gray-900">{avgTripDuration} Hours</h3>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <span className="text-gray-600 font-semibold">Estimated</span>
              <span className="text-gray-600 text-sm ml-1">based on distance</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  ${(organizationData.total_expenses_all_drivers || 0).toLocaleString()}
                </h3>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <Banknote className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <span className="text-red-600 font-semibold">Current</span>
              <span className="text-gray-600 text-sm ml-1">operational costs</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Distance Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h6 className="text-lg font-semibold mb-2">Distance Distribution</h6>
            <p className="text-sm text-gray-600 mb-4">Total distance covered by each driver</p>
            {distanceByDriverData.length > 0 ? (
              <>
                <div className="h-64 flex items-center justify-center">
                  <div className="relative">
                    <ResponsiveContainer width={280} height={280}>
                      <PieChart>
                        <defs>
                          {distanceByDriverData.map((entry, index) => (
                            <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor={entry.color} stopOpacity={0.8} />
                              <stop offset="100%" stopColor={entry.color} stopOpacity={1} />
                            </linearGradient>
                          ))}
                        </defs>
                        <Pie
                          data={distanceByDriverData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => renderCustomLabel(entry, distanceByDriverData.reduce((sum, item) => sum + item.total_distance, 0))}
                          outerRadius={100}
                          innerRadius={40}
                          fill="#8884d8"
                          dataKey="total_distance"
                          stroke="none"
                        >
                          {distanceByDriverData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`url(#gradient-${index})`} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 font-medium">Total</div>
                        <div className="text-sm font-bold text-gray-900">
                          {distanceByDriverData.reduce((sum, item) => sum + item.total_distance, 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">km</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="mt-4 space-y-2">
                  {distanceByDriverData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-3" 
                          style={{ backgroundColor: data.color }}
                        ></div>
                        <span className="text-sm text-gray-700">{data.driver_name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {data.total_distance.toLocaleString()} km
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No distance data available
              </div>
            )}
          </div>

          {/* Fleet Composition */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h6 className="text-lg font-semibold mb-2">Fleet Composition</h6>
            <p className="text-sm text-gray-600 mb-4">Distribution of truck models in fleet</p>
            {truckModelData.length > 0 ? (
              <>
                <div className="h-64 flex items-center justify-center">
                  <div className="relative">
                    <ResponsiveContainer width={280} height={280}>
                      <PieChart>
                        <defs>
                          {truckModelData.map((entry, index) => (
                            <linearGradient key={`fleet-gradient-${index}`} id={`fleet-gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor={entry.color} stopOpacity={0.8} />
                              <stop offset="100%" stopColor={entry.color} stopOpacity={1} />
                            </linearGradient>
                          ))}
                        </defs>
                        <Pie
                          data={truckModelData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => renderCustomLabel(entry, truckModelData.reduce((sum, item) => sum + item.count, 0))}
                          outerRadius={100}
                          innerRadius={40}
                          fill="#8884d8"
                          dataKey="count"
                          stroke="none"
                        >
                          {truckModelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`url(#fleet-gradient-${index})`} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 font-medium">Total</div>
                        <div className="text-sm font-bold text-gray-900">
                          {truckModelData.reduce((sum, item) => sum + item.count, 0)}
                        </div>
                        <div className="text-xs text-gray-500">trucks</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-4 space-y-2">
                  {truckModelData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-3" 
                          style={{ backgroundColor: data.color }}
                        ></div>
                        <span className="text-sm text-gray-700">{data.model}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {data.count} truck{data.count > 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No fleet data available
              </div>
            )}
          </div>

          {/* Driver Performance */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h6 className="text-lg font-semibold mb-2">Driver Performance</h6>
            <p className="text-sm text-gray-600 mb-4">Distance covered by each driver</p>
            {distanceByDriverData.length > 0 ? (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distanceByDriverData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="driver_name" 
                        tick={{ fontSize: 10, fill: '#6B7280' }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        formatter={(value) => [`${Number(value).toLocaleString()} km`, 'Distance']}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="total_distance" 
                        fill="#4F46E5" 
                        name="Distance (km)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Total distance covered per driver</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No driver performance data available
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trips Table */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h6 className="text-lg font-semibold">Active Trips</h6>
                  <p className="text-sm text-gray-600">
                    <span className="text-blue-600">✓</span>
                    <span className="font-semibold ml-1">
                      {organizationData.total_trips_all_drivers || 0} trips
                    </span> currently managed
                  </p>
                </div>
                <div className="relative">
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              {allTrips.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trip Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Distance</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allTrips.map((trip, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Truck className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">Trip #{trip.trip_id}</div>
                              <div className="text-sm text-gray-500">{trip.truck.truck_number} - {trip.driver_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 capitalize">{trip.route.source} → {trip.route.destination}</div>
                          <div className="text-sm text-gray-500">Started: {trip.trip_start}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-sm font-medium text-gray-900">{trip.total_distance} km</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center">
                            <div className="w-24">
                              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                <span>{trip.completion_percentage}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${getProgressBarColor(trip.completion_percentage)}`}
                                  style={{ width: `${trip.completion_percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No trips available
                </div>
              )}
            </div>
          </div>

          {/* Driver Activity Timeline */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <h6 className="text-lg font-semibold">Recent Activity</h6>
              <p className="text-sm text-gray-600">
                <span className="text-green-600">↑</span>
                <span className="font-semibold">{organizationData.active_drivers || 0} active drivers</span>
              </p>
            </div>
            <div className="p-6">
              {timelineEvents.length > 0 ? (
                <div className="space-y-4">
                  {timelineEvents.slice(0, 6).map((event, index) => {
                    const IconComponent = event.icon;
                    return (
                      <div key={index} className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${event.color} bg-opacity-20`}>
                          <IconComponent className={`w-4 h-4 ${event.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{event.text}</p>
                          <p className="text-xs text-gray-500">{event.date}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  No recent activity
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;