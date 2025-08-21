import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  Calendar, 
  Truck, 
  MapPin,
  TrendingUp,
  DollarSign,
  Clock,
  Route,
  Package,
  Activity,
  Loader2,
  Award,
  Gauge,
  Receipt,
  Download,
  FileText,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {organizationService} from '../services/organization'

interface DriverDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverId?: number;
  driver?:any
}

const ViewDriver: React.FC<DriverDataModalProps> = ({ 
  isOpen, 
  onClose, 
  driver
}) => {
  const [driverData, setDriverData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && driver) {
      fetchDriverData();
    }
  }, [isOpen, driver]);

  const fetchDriverData = async () => {
    setLoading(true);
    setError(null);
    console.log('fetchign driver ',driver)
    try {
      console.log('fetchig data fro driver ',driver)
      const response = await organizationService.getDriverInfo(driver.user.id);
      setDriverData(response.driver);
    } catch (err) {
      setError('Failed to fetch driver data');
      console.error('Error fetching driver data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getCategoryBadgeColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'fuel':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      case 'food':
        return 'bg-green-100 text-green-800';
      case 'toll':
        return 'bg-purple-100 text-purple-800';
      case 'parking':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToPDF = (data) => {
    const { driver_info, statistics, trips, expenses, assigned_trucks, expenses_by_category, popular_routes } = data;
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(`Driver Profile: ${driver_info.first_name || 'N/A'} ${driver_info.last_name || 'N/A'}`, 20, 20);
    
    // Personal Information
    doc.setFontSize(16);
    doc.setTextColor(60, 60, 60);
    doc.text('Personal Information', 20, 40);
    
    const personalData = [
      ['Field', 'Value'],
      ['Full Name', `${driver_info.first_name || 'N/A'} ${driver_info.last_name || 'N/A'}`],
      ['Email', driver_info.email || 'N/A'],
      ['Phone Number', driver_info.phone_number || 'N/A'],
      ['Driver ID', driver_info.driver_id?.toString() || 'N/A'],
      ['Organization', driver_info.organization || 'N/A'],
      ['Account Status', driver_info.is_active ? 'Active' : 'Inactive'],
      ['Driver Status', driver_info.driver_is_active ? 'Active' : 'Inactive'],
      ['Date Joined', driver_info.date_joined ? formatDate(driver_info.date_joined) : 'N/A'],
      ['Last Login', driver_info.last_login ? formatDate(driver_info.last_login) : 'Never'],
      ['Gender', driver_info.gender || 'Not Specified'],
      ['Avatar', driver_info.avatar || 'Not Set'],
      ['Bio', driver_info.bio || 'Not Provided']
    ];
    
    autoTable(doc, {
      startY: 50,
      head: [personalData[0]],
      body: personalData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 10 }
    });

    // Professional Information
    let yPos = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(16);
    doc.setTextColor(60, 60, 60);
    doc.text('Professional Information', 20, yPos);
    
    const professionalData = [
      ['Field', 'Value'],
      ['License Number', driver_info.license_number || 'N/A'],
      ['License Expiry', driver_info.license_expiry ? formatDate(driver_info.license_expiry) : 'N/A'],
      ['Years of Experience', driver_info.years_of_experience?.toString() || 'N/A'],
      ['Vehicle Type', driver_info.vehicle_type || 'N/A'],
      ['Assigned Truck Models', driver_info.assigned_truck_models?.length ? driver_info.assigned_truck_models.join(', ') : 'None']
    ];
    
    autoTable(doc, {
      startY: yPos + 5,
      head: [professionalData[0]],
      body: professionalData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 10 }
    });
    
    // Performance Statistics
    yPos = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(16);
    doc.setTextColor(60, 60, 60);
    doc.text('Performance Statistics', 20, yPos);
    
    const statsData = [
      ['Metric', 'Value'],
      ['Total Trips', statistics?.total_trips?.toString() || '0'],
      ['Completed Trips', statistics?.completed_trips?.toString() || '0'],
      ['Active Trips', statistics?.active_trips?.toString() || '0'],
      ['Cancelled Trips', statistics?.cancelled_trips?.toString() || '0'],
      ['Completion Rate', `${statistics?.completion_rate?.toFixed(1) || '0'}%`],
      ['Total Distance', statistics?.total_distance?.toLocaleString() || '0'],
      ['Total Expenses', statistics?.total_expenses ? formatCurrency(statistics.total_expenses) : '$0.00'],
      ['Assigned Trucks Count', statistics?.assigned_trucks_count?.toString() || '0'],
      ['Avg Trip Duration (Hours)', statistics?.avg_trip_duration_hours?.toString() || '0'],
      ['Recent Trips (30 Days)', statistics?.recent_trips_30_days?.toString() || '0']
    ];
    
    autoTable(doc, {
      startY: yPos + 5,
      head: [statsData[0]],
      body: statsData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 10 }
    });
    
    // Expenses
    if (expenses && expenses.length > 0) {
      yPos = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(16);
      doc.setTextColor(60, 60, 60);
      doc.text('Expense Records', 20, yPos);
      
      const expenseData = expenses.map(expense => [
        expense.date ? formatDate(expense.date) : 'N/A',
        expense.category || 'N/A',
        expense.amount ? formatCurrency(expense.amount) : '$0.00',
        expense.description ? (expense.description.length > 25 ? expense.description.substring(0, 25) + '...' : expense.description) : 'N/A',
        expense.trip_source && expense.trip_destination ? `${expense.trip_source} → ${expense.trip_destination}` : 'N/A'
      ]);
      
      autoTable(doc, {
        startY: yPos + 5,
        head: [['Date', 'Category', 'Amount', 'Description', 'Route']],
        body: expenseData,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] },
        styles: { fontSize: 9 }
      });
    } else {
      yPos = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text('No expense records found.', 20, yPos);
    }
    
    // Add new page if needed for additional data
    if (trips && trips.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(60, 60, 60);
      doc.text('Trip Records', 20, 20);
      
      const tripData = trips.map(trip => [
        trip.trip_id?.toString() || 'N/A',
        trip.source && trip.destination ? `${trip.source} → ${trip.destination}` : 'N/A',
        trip.status || 'N/A',
        trip.total_distance?.toLocaleString() || 'N/A',
        trip.truck_license_plate || 'N/A',
        trip.trip_start ? formatDate(trip.trip_start) : 'N/A'
      ]);
      
      autoTable(doc, {
        startY: 30,
        head: [['Trip ID', 'Route', 'Status', 'Distance (km)', 'Truck', 'Start Date']],
        body: tripData,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] },
        styles: { fontSize: 9 }
      });
    }
    
    // Save the PDF
    doc.save(`driver_profile_${driver_info.first_name || 'unknown'}_${driver_info.last_name || 'driver'}.pdf`);
  };

  const exportToCSV = (data) => {
    const { driver_info, statistics, trips, expenses, assigned_trucks, expenses_by_category, popular_routes } = data;
    
    // Create CSV content as an array of rows
    const csvRows = [];
    
    // Driver Profile Information - Header row and single data row
    csvRows.push(['DRIVER PROFILE INFORMATION']);
    csvRows.push([
      'Full Name', 'Email', 'Phone Number', 'Driver ID', 'Organization', 'Account Status', 
      'Driver Status', 'Date Joined', 'Last Login', 'Gender', 'License Number', 'License Expiry', 
      'Years of Experience', 'Vehicle Type', 'Assigned Truck Models', 'Avatar', 'Bio'
    ]);
    csvRows.push([
      `${(driver_info.first_name || 'N/A')} ${(driver_info.last_name || 'N/A')}`,
      driver_info.email || 'N/A',
      driver_info.phone_number || 'N/A',
      driver_info.driver_id || 'N/A',
      driver_info.organization || 'N/A',
      driver_info.is_active ? 'Active' : 'Inactive',
      driver_info.driver_is_active ? 'Active' : 'Inactive',
      driver_info.date_joined ? formatDate(driver_info.date_joined) : 'N/A',
      driver_info.last_login ? formatDate(driver_info.last_login) : 'Never',
      driver_info.gender || 'N/A',
      driver_info.license_number || 'N/A',
      driver_info.license_expiry ? formatDate(driver_info.license_expiry) : 'N/A',
      driver_info.years_of_experience || 'N/A',
      driver_info.vehicle_type || 'N/A',
      driver_info.assigned_truck_models?.length ? driver_info.assigned_truck_models.join('; ') : 'None',
      driver_info.avatar || 'Not Set',
      driver_info.bio || 'Not Provided'
    ]);
    csvRows.push([]); // Empty row
    
    // Performance Statistics - Header row and single data row
    csvRows.push(['PERFORMANCE STATISTICS']);
    csvRows.push([
      'Total Trips', 'Completed Trips', 'Active Trips', 'Cancelled Trips', 'Completion Rate',
      'Total Distance', 'Total Expenses', 'Assigned Trucks Count', 'Average Trip Duration (Hours)', 'Recent Trips (30 Days)'
    ]);
    csvRows.push([
      statistics?.total_trips || '0',
      statistics?.completed_trips || '0',
      statistics?.active_trips || '0',
      statistics?.cancelled_trips || '0',
      `${statistics?.completion_rate?.toFixed(1) || '0'}%`,
      statistics?.total_distance || '0',
      statistics?.total_expenses || '0',
      statistics?.assigned_trucks_count || '0',
      statistics?.avg_trip_duration_hours || '0',
      statistics?.recent_trips_30_days || '0'
    ]);
    csvRows.push([]); // Empty row
    
    // Assigned Trucks
    if (assigned_trucks && assigned_trucks.length > 0) {
      csvRows.push(['ASSIGNED TRUCKS']);
      csvRows.push(['Truck ID', 'License Plate', 'Model', 'Fuel Volume', 'Load Weight', 'Maintenance Type', 'Trips Count']);
      assigned_trucks.forEach(truck => {
        csvRows.push([
          truck.truck_id || 'N/A',
          truck.license_plate || 'N/A',
          truck.truck_model || 'N/A',
          truck.fuel_volume || 'N/A',
          truck.load_weight || 'N/A',
          truck.maintenance_type || 'N/A',
          truck.trips_count || '0'
        ]);
      });
      csvRows.push([]); // Empty row
    }
    
    // Expenses by Category
    if (expenses_by_category && expenses_by_category.length > 0) {
      csvRows.push(['EXPENSES BY CATEGORY']);
      csvRows.push(['Category', 'Total Amount', 'Number of Expenses']);
      expenses_by_category.forEach(category => {
        csvRows.push([
          category.category || 'N/A',
          category.total_amount || '0',
          category.expense_count || '0'
        ]);
      });
      csvRows.push([]); // Empty row
    }
    
    // Popular Routes
    if (popular_routes && popular_routes.length > 0) {
      csvRows.push(['POPULAR ROUTES']);
      csvRows.push(['Source', 'Destination', 'Trip Count', 'Total Distance']);
      popular_routes.forEach(route => {
        csvRows.push([
          route.source || 'N/A',
          route.destination || 'N/A',
          route.trip_count || '0',
          route.total_distance || '0'
        ]);
      });
      csvRows.push([]); // Empty row
    }
    
    // Trip Records
    if (trips && trips.length > 0) {
      csvRows.push(['TRIP RECORDS']);
      csvRows.push(['Trip ID', 'Source', 'Destination', 'Status', 'Distance', 'Truck License Plate', 'Truck Model', 'Trip Start', 'Trip End']);
      trips.forEach(trip => {
        csvRows.push([
          trip.trip_id || 'N/A',
          trip.source || 'N/A',
          trip.destination || 'N/A',
          trip.status || 'N/A',
          trip.total_distance || 'N/A',
          trip.truck_license_plate || 'N/A',
          trip.truck_model || 'N/A',
          trip.trip_start ? formatDate(trip.trip_start) : 'N/A',
          trip.trip_end ? formatDate(trip.trip_end) : 'N/A'
        ]);
      });
      csvRows.push([]); // Empty row
    }
    
    // Expense Records
    if (expenses && expenses.length > 0) {
      csvRows.push(['EXPENSE RECORDS']);
      csvRows.push(['Expense ID', 'Date', 'Category', 'Amount', 'Description', 'Trip Source', 'Trip Destination']);
      expenses.forEach(expense => {
        csvRows.push([
          expense.expense_id || 'N/A',
          expense.date ? formatDate(expense.date) : 'N/A',
          expense.category || 'N/A',
          expense.amount || '0',
          expense.description || 'N/A',
          expense.trip_source || 'N/A',
          expense.trip_destination || 'N/A'
        ]);
      });
    }
    
    // Convert array to CSV string
    const csvContent = csvRows.map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    // Create and download file using Blob
    const BOM = '\uFEFF'; // UTF-8 BOM
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `driver_profile_${driver_info.first_name || 'unknown'}_${driver_info.last_name || 'driver'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading driver data...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-red-600 font-medium">{error}</p>
              <button 
                onClick={fetchDriverData}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!driverData) return null;

  const { driver_info, statistics, trips, expenses, assigned_trucks, expenses_by_category, popular_routes } = driverData;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center">
                <User className="h-6 w-6 mr-2" />
                Driver Profile: {driver_info.first_name} {driver_info.last_name}
              </DialogTitle>
              <DialogDescription>
                Complete driver information and performance data
              </DialogDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportToPDF(driverData)} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToCSV(driverData)} className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <p className="text-lg font-semibold">{driver_info.first_name} {driver_info.last_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </p>
                <p className="break-all">{driver_info.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  Phone
                </p>
                <p>{driver_info.phone_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Account Status</p>
                <div className="flex space-x-2">
                  <Badge variant={driver_info.is_active ? "default" : "secondary"}>
                    {driver_info.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant={driver_info.driver_is_active ? "default" : "secondary"}>
                    {driver_info.driver_is_active ? "Driver Active" : "Driver Inactive"}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Date Joined
                </p>
                <p>{formatDate(driver_info.date_joined)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Last Login</p>
                <p>{driver_info.last_login ? formatDate(driver_info.last_login) : 'Never'}</p>
              </div>
              {driver_info.gender && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Gender</p>
                  <p className="capitalize">{driver_info.gender}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Professional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">License Number</p>
                <p className="font-mono text-lg">{driver_info.license_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  License Expiry
                </p>
                <p>{formatDate(driver_info.license_expiry)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 flex items-center">
                  <Award className="h-4 w-4 mr-1" />
                  Experience
                </p>
                <p className="text-lg font-semibold">{driver_info.years_of_experience} years</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 flex items-center">
                  <Truck className="h-4 w-4 mr-1" />
                  Vehicle Type
                </p>
                <Badge variant="outline" className="text-sm">{driver_info.vehicle_type}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Organization</p>
                <p className="font-medium">{driver_info.organization}</p>
              </div>
              {driver_info.truck_model && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Truck Model</p>
                  <p>{driver_info.truck_model}</p>
                </div>
              )}
            </CardContent>
            {driver_info.bio && (
              <CardContent className="pt-0">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Bio</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{driver_info.bio}</p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Performance Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Route className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold text-blue-600">{statistics.total_trips}</p>
                <p className="text-xs text-gray-600">Total Trips</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <Package className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-green-600">{statistics.completed_trips}</p>
                <p className="text-xs text-gray-600">Completed</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <Activity className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <p className="text-2xl font-bold text-orange-600">{statistics.active_trips}</p>
                <p className="text-xs text-gray-600">Active</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 text-red-600" />
                <p className="text-2xl font-bold text-red-600">{statistics.cancelled_trips}</p>
                <p className="text-xs text-gray-600">Cancelled</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <Gauge className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold text-purple-600">{statistics.completion_rate.toFixed(1)}%</p>
                <p className="text-xs text-gray-600">Success Rate</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <MapPin className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                <p className="text-2xl font-bold text-gray-600">{statistics.total_distance.toLocaleString()}</p>
                <p className="text-xs text-gray-600">Total Distance</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <DollarSign className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(statistics.total_expenses)}</p>
                <p className="text-xs text-gray-600">Total Expenses</p>
              </div>
              <div className="text-center p-3 bg-indigo-50 rounded-lg">
                <Truck className="h-6 w-6 mx-auto mb-2 text-indigo-600" />
                <p className="text-2xl font-bold text-indigo-600">{statistics.assigned_trucks_count}</p>
                <p className="text-xs text-gray-600">Assigned Trucks</p>
              </div>
              <div className="text-center p-3 bg-teal-50 rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 text-teal-600" />
                <p className="text-2xl font-bold text-teal-600">{statistics.avg_trip_duration_hours}</p>
                <p className="text-xs text-gray-600">Avg Hours</p>
              </div>
              <div className="text-center p-3 bg-pink-50 rounded-lg">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-pink-600" />
                <p className="text-2xl font-bold text-pink-600">{statistics.recent_trips_30_days}</p>
                <p className="text-xs text-gray-600">Recent Trips</p>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Table */}
          {expenses && expenses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Receipt className="h-5 w-5 mr-2" />
                  Expense Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Description</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Trip Route</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((expense) => (
                        <tr key={expense.expense_id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {formatDate(expense.date)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeColor(expense.category)}`}>
                              {expense.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-gray-900">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                            {expense.description}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <span>{expense.trip_source}</span>
                              <span>→</span>
                              <span>{expense.trip_destination}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Total Summary */}
                <div className="mt-4 pt-4 border-t bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">
                      Total Expenses ({expenses.length} records)
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(expenses.reduce((sum, expense) => sum + expense.amount, 0))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Trips */}
          {trips && trips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Route className="h-5 w-5 mr-2" />
                  Recent Trips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trips.map((trip) => (
                    <div key={trip.trip_id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{trip.source} → {trip.destination}</span>
                        </div>
                        <Badge variant={getStatusBadgeVariant(trip.status)}>{trip.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Distance:</span> {trip.total_distance?.toLocaleString()} km
                        </div>
                        <div>
                          <span className="font-medium">Truck:</span> {trip.truck_license_plate}
                        </div>
                        <div>
                          <span className="font-medium">Model:</span> {trip.truck_model}
                        </div>
                        <div>
                          <span className="font-medium">Started:</span> {formatDate(trip.trip_start)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assigned Trucks */}
          {assigned_trucks && assigned_trucks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Assigned Trucks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assigned_trucks.map((truck) => (
                    <div key={truck.truck_id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold">{truck.license_plate}</h4>
                        <Badge variant="outline">{truck.maintenance_type}</Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Model:</span>
                          <span>{truck.truck_model}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fuel Volume:</span>
                          <span>{truck.fuel_volume?.toLocaleString()} L</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Load Weight:</span>
                          <span>{truck.load_weight?.toLocaleString()} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Trip Count:</span>
                          <span>{truck.trips_count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expenses Summary */}
          {expenses_by_category && expenses_by_category.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Expenses by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expenses_by_category.map((category, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{category.category}</p>
                        <p className="text-sm text-gray-600">{category.expense_count} expenses</p>
                      </div>
                      <p className="text-lg font-semibold">{formatCurrency(category.total_amount)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Popular Routes */}
          {popular_routes && popular_routes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Route className="h-5 w-5 mr-2" />
                  Popular Routes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {popular_routes.map((route, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{route.source} → {route.destination}</span>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium">{route.trip_count} trips</p>
                        <p className="text-gray-600">{route.total_distance?.toLocaleString()} km</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewDriver;