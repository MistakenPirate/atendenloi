import React, { useState, useEffect } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import axios from "axios";
import { CSVLink } from "react-csv";
import "./App.css";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function App() {
  const [attendance, setAttendance] = useState([]); // Initialize as an empty array
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    employee_id: "",
    start_date: "",
    end_date: "",
    status: "",
  });

  const [selectedStat, setSelectedStat] = useState("employee");
  const [showLeaveApplication, setShowLeaveApplication] = useState(false);
  const [leaveApplication, setLeaveApplication] = useState({
    employee_id: "",
    start_date: "",
    end_date: "",
    reason: "",
  });

  // Fetch employees and attendance data from the backend
  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, []);

  // Fetch employees from the backend
  const fetchEmployees = async () => {
    try {
      const response = await axios.get(
        "http://192.168.92.249/select_employee.php"
      );
      if (response.data && Array.isArray(response.data.data)) {
        setEmployees(response.data.data);
      } else {
        console.error("Invalid API response format:", response.data);
        setEmployees([]); // Set employees to an empty array if the response is invalid
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]); // Set employees to an empty array in case of error
    }
  };

  // Fetch attendance records from the backend
  const fetchAttendance = async () => {
    try {
      const response = await axios.get(
        "http://192.168.92.249/select_attendance.php"
      );
      console.log("API Response:", response.data); // Debugging: Log the response
      if (response.data && Array.isArray(response.data.data)) {
        // Calculate total hours and overtime hours for each record
        const attendanceWithCalculations = response.data.data.map((record) => {
          const totalHours = calculateTotalHours(
            record.time_in,
            record.time_out
          );
          const overtimeHours = calculateOvertimeHours(totalHours);
          return {
            ...record,
            total_hours: totalHours,
            overtime_hours: overtimeHours,
          };
        });
        setAttendance(attendanceWithCalculations);
      } else {
        console.error("Invalid API response format:", response.data);
        setAttendance([]); // Set attendance to an empty array if the response is invalid
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setAttendance([]); // Set attendance to an empty array in case of error
    }
  };

  // Calculate total hours worked based on time_in and time_out
  const calculateTotalHours = (timeIn, timeOut) => {
    if (timeOut === "00:00:00") {
      return "Pending"; // Return "Pending" if time_out is '00:00:00'
    }
    const timeInDate = new Date(`1970-01-01T${timeIn}`);
    const timeOutDate = new Date(`1970-01-01T${timeOut}`);
    const diffInMilliseconds = timeOutDate - timeInDate;
    const diffInHours = diffInMilliseconds / (1000 * 60 * 60); // Convert milliseconds to hours
    return parseFloat(diffInHours.toFixed(2)); // Round to 2 decimal places
  };

  // Calculate overtime hours (assuming standard working hours is 8 hours per day)
  const calculateOvertimeHours = (totalHours) => {
    if (totalHours === "Pending") {
      return "Pending"; // Return "Pending" if total_hours is "Pending"
    }
    const standardWorkingHours = 8;
    const overtime = totalHours - standardWorkingHours;
    return overtime > 0 ? parseFloat(overtime.toFixed(2)) : 0; // Return 0 if no overtime
  };

  // Filter attendance records
  const filteredAttendance = (attendance || []).filter((record) => {
    return (
      (filters.employee_id ? record.person_id === filters.employee_id : true) &&
      (filters.start_date ? record.date >= filters.start_date : true) &&
      (filters.end_date ? record.date <= filters.end_date : true) &&
      (filters.status ? record.status === filters.status : true)
    );
  });

  // Format the person's name
  const formatName = (firstName, lastName) => {
    return `${firstName} ${lastName}`;
  };

  // Handle leave application submission (POC with dummy data)
  const handleLeaveApplication = async (e) => {
    e.preventDefault();
    // Simulate API call with dummy data
    const dummyResponse = {
      status: "success",
      message: "Leave application submitted successfully!",
      data: {
        id: Math.random().toString(36).substring(7),
        ...leaveApplication,
      },
    };
    console.log("Leave Application Submitted:", dummyResponse);
    alert(dummyResponse.message);
    setLeaveApplication({
      employee_id: "",
      start_date: "",
      end_date: "",
      reason: "",
    });
    setShowLeaveApplication(false); // Hide the leave application screen after submission
  };

  // Handle input change for leave application
  const handleLeaveInputChange = (e) => {
    const { name, value } = e.target;
    setLeaveApplication({ ...leaveApplication, [name]: value });
  };

  // Download filtered data as CSV
  const csvData = filteredAttendance.map((record) => ({
    EmployeeID: record.person_id,
    Name: formatName(record.first_name, record.last_name),
    Date: record.date,
    TimeIn: record.time_in,
    TimeOut: record.time_out === "00:00:00" ? "Nil" : record.time_out, // Show "Nil" if time_out is '00:00:00'
    TotalHours: record.total_hours,
    OvertimeHours: record.overtime_hours,
    Status: record.status,
    Remarks: record.remarks,
  }));

  const csvHeaders = [
    { label: "Employee ID", key: "EmployeeID" },
    { label: "Name", key: "Name" },
    { label: "Date", key: "Date" },
    { label: "Time In", key: "TimeIn" },
    { label: "Time Out", key: "TimeOut" },
    { label: "Total Hours", key: "TotalHours" },
    { label: "Overtime Hours", key: "OvertimeHours" },
    { label: "Status", key: "Status" },
    { label: "Remarks", key: "Remarks" },
  ];

  // Calculate overall attendance summary
  const overallSummary = {
    present: attendance.filter((record) => record.status === "Present").length,
    absent: attendance.filter((record) => record.status === "Absent").length,
    leave: attendance.filter((record) => record.status === "Leave").length,
  };

  // Calculate employee-specific stats
  const employeeStats = employees.map((employee) => {
    const employeeAttendance = attendance.filter(
      (record) => record.person_id === employee.person_id
    );
    const totalDays = employeeAttendance.length;
    const presentDays = employeeAttendance.filter(
      (record) => record.status === "Present"
    ).length;
    const absentDays = employeeAttendance.filter(
      (record) => record.status === "Absent"
    ).length;
    const leaveDays = employeeAttendance.filter(
      (record) => record.status === "Leave"
    ).length;

    return {
      ...employee,
      presentDays,
      absentDays,
      leaveDays,
      attendancePercentage:
        totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0,
    };
  });

  // Sort employees by attendance percentage (top performers)
  const topPerformers = [...employeeStats].sort(
    (a, b) => b.attendancePercentage - a.attendancePercentage
  );

  // Data for bar chart
  const barChartData = {
    labels: employees.map((employee) =>
      formatName(employee.first_name, employee.last_name)
    ),
    datasets: [
      {
        label: "Present Days",
        data: employees.map((employee) => {
          return attendance.filter(
            (record) =>
              record.person_id === employee.person_id &&
              record.status === "Present"
          ).length;
        }),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
      {
        label: "Absent Days",
        data: employees.map((employee) => {
          return attendance.filter(
            (record) =>
              record.person_id === employee.person_id &&
              record.status === "Absent"
          ).length;
        }),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
      },
      {
        label: "Leave Days",
        data: employees.map((employee) => {
          return attendance.filter(
            (record) =>
              record.person_id === employee.person_id &&
              record.status === "Leave"
          ).length;
        }),
        backgroundColor: "rgba(153, 102, 255, 0.6)",
      },
    ],
  };

  // Data for pie chart (overall summary)
  const pieChartData = {
    labels: ["Present", "Absent", "Leave"],
    datasets: [
      {
        data: [
          overallSummary.present,
          overallSummary.absent,
          overallSummary.leave,
        ],
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)",
          "rgba(255, 99, 132, 0.6)",
          "rgba(153, 102, 255, 0.6)",
        ],
      },
    ],
  };

  return (
    <div className="App">
      <h1 className="dashboard-title">
        Oil India Limited - Attendance Dashboard
      </h1>

      <div className="filters">
        <div className="filter-group">
          <label>Employee</label>
          <select
            onChange={(e) =>
              setFilters({ ...filters, employee_id: e.target.value })
            }
          >
            <option value="">All Employees</option>
            {employees.map((employee) => (
              <option key={employee.person_id} value={employee.person_id}>
                {formatName(employee.first_name, employee.last_name)}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Start Date</label>
          <input
            type="date"
            onChange={(e) =>
              setFilters({ ...filters, start_date: e.target.value })
            }
          />
        </div>
        <div className="filter-group">
          <label>End Date</label>
          <input
            type="date"
            onChange={(e) =>
              setFilters({ ...filters, end_date: e.target.value })
            }
          />
        </div>
        <div className="filter-group">
          <label>Status</label>
          <select
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Leave">Leave</option>
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
          <button
            className="leave-button"
            onClick={() => setShowLeaveApplication(true)}
          >
            📝 Apply for Leave
          </button>
        </div>
      </div>

      {/* Leave Application Screen */}
      {showLeaveApplication && (
        <div className="leave-application-screen">
          <div className="leave-form-container">
            <h2>Submit Leave Application</h2>
            <form onSubmit={handleLeaveApplication} className="leave-form">
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
              <div className="form-actions">
                <button type="submit" className="submit-button">
                  Submit Leave Application
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowLeaveApplication(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
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
              <th>Time In</th>
              <th>Time Out</th>
              <th>Total Hours</th>
              <th>Overtime Hours</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendance.map((record) => (
              <tr key={record.attendance_id}>
                <td>{record.person_id}</td>
                <td>{formatName(record.first_name, record.last_name)}</td>
                <td>{record.date}</td>
                <td>{record.time_in}</td>
                <td>
                  {record.time_out === "00:00:00" ? "Nil" : record.time_out}
                </td>{" "}
                {/* Show "Nil" if time_out is '00:00:00' */}
                <td>{record.total_hours}</td>{" "}
                {/* Already calculated as "Pending" if time_out is '00:00:00' */}
                <td>{record.overtime_hours}</td>{" "}
                {/* Already calculated as "Pending" if time_out is '00:00:00' */}
                <td>{record.status}</td>
                <td>{record.remarks}</td>
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
      {selectedStat === "overall" && (
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

      {selectedStat === "employee" && (
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
              {employeeStats.map((employee) => (
                <tr key={employee.person_id}>
                  <td>{employee.person_id}</td>
                  <td>{formatName(employee.first_name, employee.last_name)}</td>
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

      {selectedStat === "top" && (
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
              {topPerformers.map((employee) => (
                <tr key={employee.person_id}>
                  <td>{employee.person_id}</td>
                  <td>{formatName(employee.first_name, employee.last_name)}</td>
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
