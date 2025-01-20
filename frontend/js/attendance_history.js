// ฟังก์ชัน mapStatus สำหรับแปลง Status Code เป็นข้อความ
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



function fetchUsersAndAttendance() {
  const selectedMonth = parseInt(document.getElementById('monthSelector').value);
  const selectedYear = parseInt(document.getElementById('yearSelector').value);

  fetch('http://127.0.0.1:5001/api/attendance')
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch attendance logs');
      return response.json();
    })
    .then(attendanceLogs => {
      console.log("Fetched Attendance Logs:", attendanceLogs); // ตรวจสอบข้อมูลที่ดึงมา

      const attendanceTableBody = document.querySelector("#attendance-log-table");
      attendanceTableBody.innerHTML = ""; // ล้างข้อมูลเดิมในตาราง

      // กรองข้อมูลตามเดือนและปี
      const filteredLogs = attendanceLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate.getMonth() === selectedMonth && logDate.getFullYear() === selectedYear;
      });

      // แสดงข้อมูลในตาราง
      filteredLogs.forEach(log => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${log.user_id}</td>
          <td>${new Date(log.timestamp).toLocaleString()}</td>
          <td>${mapStatus(log.status)}</td>
        `;
        attendanceTableBody.appendChild(row);
      });

      // แจ้งเตือนเมื่อไม่มีข้อมูล
      if (filteredLogs.length === 0) {
        attendanceTableBody.innerHTML = `
          <tr>
            <td colspan="3" style="text-align: center;">No attendance data for the selected month and year.</td>
          </tr>
        `;
      }
    })
    .catch(error => {
      console.error('Error fetching attendance logs:', error);
      alert('Error fetching attendance data. Please try again later.');
    });
}

// โหลดข้อมูลใหม่เมื่อเลือกเดือนหรือปี
document.getElementById('monthSelector').addEventListener('change', fetchUsersAndAttendance);
document.getElementById('yearSelector').addEventListener('change', fetchUsersAndAttendance);

// โหลดข้อมูลทันทีเมื่อหน้าเว็บโหลด
document.addEventListener('DOMContentLoaded', fetchUsersAndAttendance);
