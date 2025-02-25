import React, { useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
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
  const [selectedStat, setSelectedStat] = useState('overall'); // Default to overall summary

  // Mock data for employees
  const mockEmployees = [
    { id: 1, name: 'John Doe', employee_id: 'OIL001', department: 'Drilling', position: 'Engineer' },
    { id: 2, name: 'Jane Smith', employee_id: 'OIL002', department: 'Logistics', position: 'Manager' },
    { id: 3, name: 'Alice Johnson', employee_id: 'OIL003', department: 'HR', position: 'Recruiter' }
  ];

  // Mock data for attendance
  const mockAttendance = [
    { id: 1, employee_id: 'OIL001', date: '2023-10-01', status: 'present' },
    { id: 2, employee_id: 'OIL001', date: '2023-10-02', status: 'absent' },
    { id: 3, employee_id: 'OIL002', date: '2023-10-01', status: 'present' },
    { id: 4, employee_id: 'OIL002', date: '2023-10-02', status: 'leave' },
    { id: 5, employee_id: 'OIL003', date: '2023-10-01', status: 'present' },
    { id: 6, employee_id: 'OIL003', date: '2023-10-02', status: 'present' }
  ];

  useEffect(() => {
    // Simulate fetching data
    setEmployees(mockEmployees);
    setAttendance(mockAttendance);
  }, []);

  // Filter attendance records
  const filteredAttendance = attendance.filter(record => {
    return (
      (filters.employee_id ? record.employee_id === filters.employee_id : true) &&
      (filters.start_date ? record.date >= filters.start_date : true) &&
      (filters.end_date ? record.date <= filters.end_date : true) &&
      (filters.status ? record.status === filters.status : true)
    );
  });

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

  return (
    <div className="App">
      <h1>Oil India Limited - Attendance Dashboard</h1>

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
      </div>

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
                <td>{record.date}</td>
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
          <option value="overall">Overall Summary</option>
          <option value="employee">Employee Stats</option>
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