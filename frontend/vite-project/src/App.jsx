import React, { useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import axios from 'axios';
import { CSVLink } from 'react-csv'; // For CSV export
import './App.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

function App() {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    employee_id: '',
    start_date: '',
    end_date: '',
    status: ''
  });

  const [selectedStat, setSelectedStat] = useState('employee');
  const [showLeaveApplication, setShowLeaveApplication] = useState(false);
  const [leaveApplication, setLeaveApplication] = useState({
    employee_id: '',
    start_date: '',
    end_date: '',
    reason: ''
  });

  // Fetch employees and attendance data from the backend
  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, []);

  // Fetch employees from the backend
  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://37.27.182.109:3000/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Fetch attendance records from the backend
  const fetchAttendance = async () => {
    try {
      const response = await axios.get('http://37.27.182.109:3000/allattendance');
      setAttendance(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  // Filter attendance records
  const filteredAttendance = attendance.filter(record => {
    return (
      (filters.employee_id ? record.employee_id === filters.employee_id : true) &&
      (filters.start_date ? record.date >= filters.start_date : true) &&
      (filters.end_date ? record.date <= filters.end_date : true) &&
      (filters.status ? record.status === filters.status : true)
    );
  });

  // Handle leave application submission
  const handleLeaveApplication = async (e) => {
    e.preventDefault();
    alert('Leave application submitted successfully!');
    setLeaveApplication({ employee_id: '', start_date: '', end_date: '', reason: '' });
    setShowLeaveApplication(false); // Hide the leave application screen after submission
  };

  // Handle input change for leave application
  const handleLeaveInputChange = (e) => {
    const { name, value } = e.target;
    setLeaveApplication({ ...leaveApplication, [name]: value });
  };

  // Download filtered data as CSV
  const csvData = filteredAttendance.map(record => ({
    EmployeeID: record.employee_id,
    Name: employees.find(emp => emp.employee_id === record.employee_id)?.name || 'Unknown',
    Date: record.date,
    Status: record.status
  }));

  const csvHeaders = [
    { label: 'Employee ID', key: 'EmployeeID' },
    { label: 'Name', key: 'Name' },
    { label: 'Date', key: 'Date' },
    { label: 'Status', key: 'Status' }
  ];

  // Calculate overall attendance summary
  const overallSummary = {
    present: attendance.filter(record => record.status === 'present').length,
    absent: attendance.filter(record => record.status === 'absent').length,
    leave: attendance.filter(record => record.status === 'leave').length
  };

  // Calculate employee-specific stats
  const employeeStats = employees.map(employee => {
    const employeeAttendance = attendance.filter(record => record.employee_id === employee.employee_id);
    const totalDays = employeeAttendance.length;
    const presentDays = employeeAttendance.filter(record => record.status === 'present').length;
    const absentDays = employeeAttendance.filter(record => record.status === 'absent').length;
    const leaveDays = employeeAttendance.filter(record => record.status === 'leave').length;

    return {
      ...employee,
      presentDays,
      absentDays,
      leaveDays,
      attendancePercentage: totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0
    };
  });

  // Sort employees by attendance percentage (top performers)
  const topPerformers = [...employeeStats].sort((a, b) => b.attendancePercentage - a.attendancePercentage);

  // Data for bar chart
  const barChartData = {
    labels: employees.map(employee => employee.name),
    datasets: [
      {
        label: 'Present Days',
        data: employees.map(employee => {
          return attendance.filter(record => record.employee_id === employee.employee_id && record.status === 'present').length;
        }),
        backgroundColor: 'rgba(75, 192, 192, 0.6)'
      },
      {
        label: 'Absent Days',
        data: employees.map(employee => {
          return attendance.filter(record => record.employee_id === employee.employee_id && record.status === 'absent').length;
        }),
        backgroundColor: 'rgba(255, 99, 132, 0.6)'
      },
      {
        label: 'Leave Days',
        data: employees.map(employee => {
          return attendance.filter(record => record.employee_id === employee.employee_id && record.status === 'leave').length;
        }),
        backgroundColor: 'rgba(153, 102, 255, 0.6)'
      }
    ]
  };

  // Data for pie chart (overall summary)
  const pieChartData = {
    labels: ['Present', 'Absent', 'Leave'],
    datasets: [
      {
        data: [overallSummary.present, overallSummary.absent, overallSummary.leave],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ]
      }
    ]
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { // Use 'en-GB' for DD/MM/YYYY format
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="App">
      <h1 className="dashboard-title">Oil India Limited - Attendance Dashboard</h1>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>Employee</label>
          <select onChange={(e) => setFilters({ ...filters, employee_id: e.target.value })}>
            <option value="">All Employees</option>
            {employees.map(employee => (
              <option key={employee.employee_id} value={employee.employee_id}>{employee.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Start Date</label>
          <input
            type="date"
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
          />
        </div>
        <div className="filter-group">
          <label>End Date</label>
          <input
            type="date"
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
          />
        </div>
        <div className="filter-group">
          <label>Status</label>
          <select onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All Statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="leave">Leave</option>
          </select>
        </div>
        <div className="filter-group">
          <CSVLink
            data={csvData}
            headers={csvHeaders}
            filename="filtered_attendance.csv"
            className="download-button"
          >
            📄 Download CSV
          </CSVLink>
        </div>
        <div className="filter-group">
          <button className="leave-button" onClick={() => setShowLeaveApplication(true)}>
            📝 Apply for Leave
          </button>
        </div>
      </div>

      {/* Leave Application Screen */}
      {showLeaveApplication && (
        <div className="leave-application-screen">
          <h2>Submit Leave Application</h2>
          <form onSubmit={handleLeaveApplication}>
            <div className="form-group">
              <label>Employee ID</label>
              <input
                type="text"
                name="employee_id"
                value={leaveApplication.employee_id}
                onChange={handleLeaveInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                name="start_date"
                value={leaveApplication.start_date}
                onChange={handleLeaveInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                name="end_date"
                value={leaveApplication.end_date}
                onChange={handleLeaveInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Reason</label>
              <textarea
                name="reason"
                value={leaveApplication.reason}
                onChange={handleLeaveInputChange}
                required
              />
            </div>
            <button type="submit" className="submit-button">Submit Leave Application</button>
            <button type="button" className="cancel-button" onClick={() => setShowLeaveApplication(false)}>Cancel</button>
          </form>
        </div>
      )}

      {/* Attendance Table (Top) */}
      <div className="card">
        <h2>Attendance Records</h2>
        <table>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendance.map(record => (
              <tr key={record.id}>
                <td>{record.employee_id}</td>
                <td>{employees.find(emp => emp.employee_id === record.employee_id)?.name}</td>
                <td>{formatDate(record.date)}</td>
                <td>{record.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bar Graph (Middle) */}
      <div className="card">
        <h2>Attendance Analysis</h2>
        <Bar data={barChartData} />
      </div>

      {/* Stats Selector and Stats (Bottom) */}
      <div className="card">
        <h2>View Stats</h2>
        <select onChange={(e) => setSelectedStat(e.target.value)}>
          <option value="employee">Employee Stats</option>
          <option value="overall">Overall Summary</option>
          <option value="top">Top Performers</option>
        </select>
      </div>

      {/* Selected Stats */}
      {selectedStat === 'overall' && (
        <div className="card">
          <h2>Overall Attendance Summary</h2>
          <div className="summary">
            <p>Present: {overallSummary.present} days</p>
            <p>Absent: {overallSummary.absent} days</p>
            <p>Leave: {overallSummary.leave} days</p>
          </div>
          <div className="chart">
            <Pie data={pieChartData} />
          </div>
        </div>
      )}

      {selectedStat === 'employee' && (
        <div className="card">
          <h2>Employee Attendance Stats</h2>
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Present Days</th>
                <th>Absent Days</th>
                <th>Leave Days</th>
                <th>Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {employeeStats.map(employee => (
                <tr key={employee.employee_id}>
                  <td>{employee.employee_id}</td>
                  <td>{employee.name}</td>
                  <td>{employee.presentDays}</td>
                  <td>{employee.absentDays}</td>
                  <td>{employee.leaveDays}</td>
                  <td>{employee.attendancePercentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedStat === 'top' && (
        <div className="card">
          <h2>Top Performers</h2>
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {topPerformers.map(employee => (
                <tr key={employee.employee_id}>
                  <td>{employee.employee_id}</td>
                  <td>{employee.name}</td>
                  <td>{employee.attendancePercentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;