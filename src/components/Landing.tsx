import React, { useEffect, useState } from 'react';
import { Truck, User, BarChart3, Calendar, Bell, Code, ShoppingCart, CreditCard, Key, Banknote, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import {organizationService} from '../services/organization';

const Dashboard = () => {
  const [organizationData, setOrganizationData] = useState<any>({});
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload,setreload]=useState(false);

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        const data = await organizationService.getDriverSummary();
        console.log(data,'dahboard summary data')
        setOrganizationData(data.organization_summary);
        setDrivers(data.drivers);
        setError(null);
      } catch (error: any) {
        console.log('error ', error);
        setError('Failed to fetch organization data');
      } finally {
        setLoading(false);
      }
    };
    
    getData();
  }, [reload]);

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
            // onClick={setreload(prev=>!prev)} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
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
      'Fuel': '#FF6384',
      'Food': '#36A2EB',
      'Maintenance': '#FFCE56',
      'Insurance': '#4BC0C0',
      'Repairs': '#9966FF',
      'Toll': '#FF9F40',
      'Parking': '#FF6384'
    };
    return colors[category] || '#999999';
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
    (driver.recent_expenses || []).map((expense: any) => ({
      type: 'expense',
      icon: Bell,
      text: `$${expense.amount} - ${expense.description}`,
      date: new Date(expense.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      color: 'text-green-500'
    }))
  ).concat(
    drivers.flatMap(driver => 
      (driver.recent_trips || []).map((trip: any) => ({
        type: 'trip',
        icon: Code,
        text: `New trip #${trip.trip_id} - ${trip.source} to ${trip.destination}`,
        date: new Date(trip.trip_start).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        color: 'text-blue-500'
      }))
    )
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

  // Calculate average fuel consumption (assuming 12L per 100km)
  const avgFuelConsumption = organizationData.total_distance_all_drivers > 0 
    ? ((organizationData.total_distance_all_drivers / 100) * 12 / organizationData.total_trips_all_drivers).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {organizationData.organization_name || 'Fleet'} Dashboard
          </h1>
          <p className="text-gray-600">Monitor fleet performance, driver activities, and operational metrics.</p>
          {organizationData.organization_website && (
            <a 
              href={organizationData.organization_website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Visit Website →
            </a>
          )}
        </div>

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
                <p className="text-sm text-gray-600">Total Trips</p>
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
          {/* Expenses by Category */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h6 className="text-lg font-semibold mb-2">Total Expenses by Category</h6>
            <p className="text-sm text-gray-600 mb-4">Breakdown of current expenses</p>
            {expenseCategoryData.length > 0 ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseCategoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        dataKey="total_expense"
                      >
                        {expenseCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <div>
                      {expenseCategoryData.map((data, index) => (
                        <div key={index} className="mb-1 flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: data.color }}
                          ></div>
                          {data.category}: ${data.total_expense.toLocaleString()}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500">
                No expense data available
              </div>
            )}
          </div>

          {/* Fuel Consumption */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h6 className="text-lg font-semibold mb-2">Average Fuel Consumption</h6>
            <p className="text-sm text-gray-600 mb-4">Estimated fuel usage per trip</p>
            <div className="h-48 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {avgFuelConsumption}L
                </div>
                <div className="text-sm text-gray-600">Average per trip</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Estimated consumption rate</span>
              </div>
            </div>
          </div>

          {/* Budget vs Actual */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h6 className="text-lg font-semibold mb-2">Budget vs Actual Expenses</h6>
            <p className="text-sm text-gray-600 mb-4">Driver expense comparison</p>
            {budgetVsActual.length > 0 ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={budgetVsActual}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="driver_name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                      <Bar dataKey="budget" fill="#FF6384" name="Budget" />
                      <Bar dataKey="actual_expenses" fill="#36A2EB" name="Actual" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <div>
                      {budgetVsActual.map((data, index) => (
                        <div key={index} className="mb-1 text-xs">
                          {data.driver_name}: Budget = ${data.budget}, Actual = ${data.actual_expenses}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500">
                No driver data available
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