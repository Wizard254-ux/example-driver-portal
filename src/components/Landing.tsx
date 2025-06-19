import React from 'react';
import { Truck, User, BarChart3, Calendar, Bell, Code, ShoppingCart, CreditCard, Key, Banknote } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const Expenses = () => {
  // Dummy data
  const dashboardData = {
    total_distance_2024: 125000,
    total_trips_2024: 342,
    avg_trip_duration_2024: 8.5,
    total_sales_2024: 1250000,
    avg_fuel_consumption: 12.3
  };

  const expenseCategoryData = [
    { category: 'Fuel', total_expense: 45000, color: '#FF6384' },
    { category: 'Maintenance', total_expense: 12000, color: '#36A2EB' },
    { category: 'Insurance', total_expense: 8000, color: '#FFCE56' },
    { category: 'Tolls', total_expense: 5000, color: '#4BC0C0' },
    { category: 'Other', total_expense: 3000, color: '#9966FF' }
  ];

  const budgetVsActual = [
    { trip: 1, budget: 2500, actual_expenses: 2300 },
    { trip: 2, budget: 3000, actual_expenses: 3200 },
    { trip: 3, budget: 2800, actual_expenses: 2600 },
    { trip: 4, budget: 3500, actual_expenses: 3800 },
    { trip: 5, budget: 2200, actual_expenses: 2100 }
  ];

  const recentTrips = [
    {
      trip_id: 'TR2024001',
      truck: { truck_number: 'TRK-001' },
      cargo_type: 'Electronics',
      route: { source: 'Nairobi', destination: 'Mombasa' },
      trip_start: '2024-06-10 08:30',
      total_distance: 485,
      completion_percentage: 100
    },
    {
      trip_id: 'TR2024002',
      truck: { truck_number: 'TRK-002' },
      cargo_type: 'Textiles',
      route: { source: 'Kampala', destination: 'Nairobi' },
      trip_start: '2024-06-11 14:15',
      total_distance: 320,
      completion_percentage: 75
    },
    {
      trip_id: 'TR2024003',
      truck: { truck_number: 'TRK-003' },
      cargo_type: 'Food Supplies',
      route: { source: 'Nairobi', destination: 'Kisumu' },
      trip_start: '2024-06-12 06:00',
      total_distance: 240,
      completion_percentage: 45
    },
    {
      trip_id: 'TR2024004',
      truck: { truck_number: 'TRK-004' },
      cargo_type: 'Construction Materials',
      route: { source: 'Mombasa', destination: 'Nairobi' },
      trip_start: '2024-06-12 10:20',
      total_distance: 485,
      completion_percentage: 30
    }
  ];

  const timelineEvents = [
    { type: 'expense', icon: Bell, text: '$2400, Fuel expense', date: '22 DEC 7:20 PM', color: 'text-green-500' },
    { type: 'trip', icon: Code, text: 'New trip #1832412', date: '21 DEC 11 PM', color: 'text-red-500' },
    { type: 'completion', icon: ShoppingCart, text: 'Completed trip for route #3921', date: '21 DEC 9:34 PM', color: 'text-blue-500' },
    { type: 'card', icon: CreditCard, text: 'New card added for expense #4395133', date: '20 DEC 2:20 AM', color: 'text-yellow-500' },
    { type: 'unlock', icon: Key, text: 'Unlock package for delivery', date: '18 DEC 4:54 AM', color: 'text-purple-500' },
    { type: 'payment', icon: Banknote, text: 'New trip #9583120', date: '17 DEC', color: 'text-gray-600' }
  ];

  const getProgressBarColor = (percentage) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-yellow-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-gray-600">Check the sales, value and bounce rate by country.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Distance in 2024</p>
                <h3 className="text-2xl font-bold text-gray-900">{dashboardData.total_distance_2024.toLocaleString()} Miles</h3>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <span className="text-green-600 font-semibold">+55%</span>
              <span className="text-gray-600 text-sm ml-1">than the previous year</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Trips in 2024</p>
                <h3 className="text-2xl font-bold text-gray-900">{dashboardData.total_trips_2024}</h3>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <span className="text-green-600 font-semibold">+3%</span>
              <span className="text-gray-600 text-sm ml-1">than the previous year</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Trip Duration in 2024</p>
                <h3 className="text-2xl font-bold text-gray-900">{dashboardData.avg_trip_duration_2024} Hours</h3>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <span className="text-red-600 font-semibold">-2%</span>
              <span className="text-gray-600 text-sm ml-1">than the previous year</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sales in 2024</p>
                <h3 className="text-2xl font-bold text-gray-900">${dashboardData.total_sales_2024.toLocaleString()}</h3>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <span className="text-green-600 font-semibold">+5%</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Expenses by Category */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h6 className="text-lg font-semibold mb-2">Total Expenses by Category</h6>
            <p className="text-sm text-gray-600 mb-4">Breakdown of expenses for 2024</p>
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
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <div>
                  {expenseCategoryData.map((data, index) => (
                    <div key={index}>
                      {data.category}: ${data.total_expense.toLocaleString()}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Fuel Consumption */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h6 className="text-lg font-semibold mb-2">Average Fuel Consumption</h6>
            <p className="text-sm text-gray-600 mb-4">Fuel usage per trip</p>
            <div className="h-48 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {dashboardData.avg_fuel_consumption}L
                </div>
                <div className="text-sm text-gray-600">Average per trip</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{dashboardData.avg_fuel_consumption} Liters/Gallons</span>
              </div>
            </div>
          </div>

          {/* Budget vs Actual */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h6 className="text-lg font-semibold mb-2">Budget vs Actual Expenses</h6>
            <p className="text-sm text-gray-600 mb-4">Comparison of allocated budget vs actual expenses</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetVsActual}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="trip" tickFormatter={(value) => `Trip ${value}`} />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Bar dataKey="budget" fill="#FF6384" name="Budget" />
                  <Bar dataKey="actual_expenses" fill="#36A2EB" name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <div>
                  {budgetVsActual.slice(0, 3).map((data, index) => (
                    <div key={index} className="mb-1">
                      Trip {data.trip}: Budget = ${data.budget.toLocaleString()}, Actual = ${data.actual_expenses.toLocaleString()}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trips Table */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h6 className="text-lg font-semibold">Trips</h6>
                  <p className="text-sm text-gray-600">
                    <span className="text-blue-600">✓</span>
                    <span className="font-semibold ml-1">{dashboardData.total_trips_2024} trips done</span> in 2024
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
                  {recentTrips.map((trip, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Truck className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">Trip #{trip.trip_id}</div>
                            <div className="text-sm text-gray-500">{trip.truck.truck_number} - {trip.cargo_type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{trip.route.source} → {trip.route.destination}</div>
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
            </div>
          </div>

          {/* Driver Overview Timeline */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <h6 className="text-lg font-semibold">Driver Overview</h6>
              <p className="text-sm text-gray-600">
                <span className="text-green-600">↑</span>
                <span className="font-semibold">24%</span> this month
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {timelineEvents.map((event, index) => {
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Expenses;