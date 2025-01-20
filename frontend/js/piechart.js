function fetchData(url) {
  return fetch(url)
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      alert('There was an issue fetching data, please try again later.');
    });
}

function mapStatus(statusCode) {
  const statusMap = {
    0: "Check-In",
    1: "Check-Out",
    2: "Break Out",
    3: "Break In",
    4: "OT In",
    5: "OT Out"
  };
  return statusMap[statusCode] || "Unknown";
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
}

function getTimeFromTimestamp(dateStr) {
  const date = new Date(dateStr);
  return date.getHours() * 60 + date.getMinutes();
}

// Fetch Users
fetchData('http://127.0.0.1:5001/api/users')
.then(userData => {
if (!userData || userData.length === 0) {
  console.error('No users found');
  return;
}

const userMap = {};
userData.forEach(user => {
  userMap[user.user_id] = user.name || "No Name";
});

const totalEmployees = userData.length;

// Fetch Attendance
fetchData('http://127.0.0.1:5001/api/attendance')
  .then(attendanceData => {
    if (!attendanceData || attendanceData.length === 0) {
      console.error('No attendance data found');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const todaysLogs = attendanceData.filter(log => formatDate(log.timestamp) === today);

    const checkedInUsers = new Set();
    const checkedOutUsers = new Set();
    let onTimeCount = 0;
    let lateCount = 0;
    let absentCount = totalEmployees;

    // Process logs
     todaysLogs.forEach(log => {
              const checkInTime = getTimeFromTimestamp(log.timestamp);
          
              if (log.status === 0) { // Check-In
                  // เพิ่มเฉพาะ Check-In ครั้งแรก
                  if (!checkedInUsers.has(log.user_id)) {
                      checkedInUsers.add(log.user_id); // บันทึกว่า User นี้ Check-In
                      absentCount--; // ลดจำนวน Absent
                      onTimeCount++;
                      if (checkInTime <= 9 * 60) { // เช็คอินก่อน 9:00 AM
                          onTimeCount++; // เพิ่มค่า On Time
                      } else {
                          lateCount++; // ถ้ามาสาย
                      }
                  }
              }
          
              if (log.status === 1) { // Check-Out
                  // ลด On Time เพียงครั้งเดียว ถ้า User มี Check-In และ On Time ถูกนับไว้แล้ว
                  if (!checkedOutUsers.has(log.user_id) && checkedInUsers.has(log.user_id)) {
                      checkedOutUsers.add(log.user_id); // บันทึกว่า User นี้ Check-Out แล้ว
                    
                      if (onTimeCount > 0) {
                          onTimeCount--; // ลดค่า On Time
                      }
                  }
              }
          

      // Add to table
      const userName = userMap[log.user_id] || "No Name";
      const tableBody = document.getElementById("attendance-log-table");
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${log.user_id}</td>
        <td>${userName}</td>
        <td>${log.timestamp}</td>
        <td>${mapStatus(log.status)}</td>
      `;
      tableBody.appendChild(row);
    });

    // Update summary cards
    document.getElementById("total-employees").textContent = `${totalEmployees} Total Employees`;
    document.getElementById("on-time").textContent = `${onTimeCount} On Time`;
    document.getElementById("late").textContent = `${lateCount} Late`;
    document.getElementById("absent").textContent = `${absentCount} Absent`;

    // Update Pie Chart
    const ctx = document.getElementById('attendance-pie-chart').getContext('2d');
    if (window.attendancePieChart) {
      // Update existing chart
      window.attendancePieChart.data.datasets[0].data = [onTimeCount, lateCount, absentCount];
      window.attendancePieChart.update();
    } else {
      // Create new chart
      window.attendancePieChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['On Time', 'Late', 'Absent'],
          datasets: [{
            data: [onTimeCount, lateCount, absentCount],
            backgroundColor: ['#4CAF50', '#FF5722', '#FFC107'],
            borderColor: ['#4CAF50', '#FF5722', '#FFC107'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            tooltip: {
              callbacks: {
                label: function(tooltipItem) {
                  return tooltipItem.label + ': ' + tooltipItem.raw;
                }
              }
            }
          }
        }
      });
    }
  })
  .catch(error => console.error('Error fetching attendance logs:', error));
})
.catch(error => console.error('Error fetching users:', error));







////////////////////////////////////////////////////////


// ฟังก์ชันดึงข้อมูลย้อนหลัง 7 วัน
function fetchAttendanceLogs(days = 7) {
  return fetchData('http://127.0.0.1:5001/api/attendance')
    .then(attendanceData => {
      if (!attendanceData || attendanceData.length === 0) {
        console.error('No attendance data found');
        return;
      }

      // Calculate past 7 days
      const today = new Date();
      const pastDays = Array.from({ length: days }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const trendData = {
        labels: pastDays,
        onTime: Array(days).fill(0),
        late: Array(days).fill(0),
        // absent: Array(days).fill(0),
      };

      const totalEmployees = parseInt(document.getElementById("total-employees").textContent.split(" ")[0], 10) || 0;

      // Process logs for each day
      pastDays.forEach((day, index) => {
        const logsForDay = attendanceData.filter(log => formatDate(log.timestamp) === day);

        const checkedInUsers = new Set();
        const checkedOutUsers = new Set();
        let onTimeCount = 0;
        let lateCount = 0;
        let absentCount = totalEmployees;

        logsForDay.forEach(log => {
          const checkInTime = getTimeFromTimestamp(log.timestamp);

          if (log.status === 0) { // Check-In
            if (!checkedInUsers.has(log.user_id)) {
              checkedInUsers.add(log.user_id);
              absentCount--;
              onTimeCount++;
              if (checkInTime <= 9 * 60) {
                onTimeCount++;
              } else {
                lateCount++;
              }
            }
          }

          if (log.status === 1) { // Check-Out
            if (!checkedOutUsers.has(log.user_id) && checkedInUsers.has(log.user_id)) {
              checkedOutUsers.add(log.user_id);
            }
          }
        });

        // Update trendData
        trendData.onTime[index] = onTimeCount;
        trendData.late[index] = lateCount;
        // trendData.absent[index] = absentCount;
      });

      return trendData;
    })
    .catch(error => console.error('Error fetching attendance logs:', error));
}


fetchAttendanceLogs(7).then(trendData => {
  const ctxLine = document.getElementById('attendance-line-chart').getContext('2d');

  if (window.attendanceLineChart) {
    // Update existing chart
    window.attendanceLineChart.data.labels = trendData.labels;
    window.attendanceLineChart.data.datasets[0].data = trendData.onTime;
    window.attendanceLineChart.data.datasets[1].data = trendData.late;
    // window.attendanceLineChart.data.datasets[2].data = trendData.absent;
    window.attendanceLineChart.update();
  } else {
    // Create new Line Chart
    window.attendanceLineChart = new Chart(ctxLine, {
      type: 'line',
      data: {
        labels: trendData.labels,
        datasets: [
          {
            label: 'On Time',
            data: trendData.onTime,
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            fill: true,
          },
          {
            label: 'Late',
            data: trendData.late,
            borderColor: '#FF5722',
            backgroundColor: 'rgba(255, 87, 34, 0.2)',
            fill: true,
          },
          // {
          //   label: 'Absent',
          //   data: trendData.absent,
          //   borderColor: '#FFC107',
          //   backgroundColor: 'rgba(255, 193, 7, 0.2)',
          //   fill: true,
          // },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Count',
            },
            beginAtZero: true,
          },
        },
      },
    });
  }
});



