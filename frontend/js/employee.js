document.addEventListener('DOMContentLoaded', () => {
  const departmentTable = document.querySelector('#employee-table'); // ตารางที่จะแสดงข้อมูล
  const saveDepartmentButton = document.querySelector('#saveDepartmentButton'); // ปุ่ม Save

  // ฟังก์ชันดึงข้อมูล Department
  function fetchDepartments() {
      fetch('http://127.0.0.1:5001/api/departments') // เรียก API สำหรับดึงข้อมูล
          .then(response => {
              if (!response.ok) {
                  throw new Error('Failed to fetch departments');
              }
              return response.json();
          })
          .then(data => {
              departmentTable.innerHTML = ''; // ล้างข้อมูลเก่าในตาราง

              data.forEach(user => {
                  const row = document.createElement('tr');
                  row.innerHTML = `
                      <td>${user.user_id}</td>
                      <td>${user.name}</td>
                      <td>
                          <input type="text" value="${user.department}" data-id="${user.user_id}" class="department-input">
                      </td>
                  `;
                  departmentTable.appendChild(row); // เพิ่มแถวใหม่ในตาราง
              });
          })
          .catch(error => console.error('Error fetching departments:', error));
  }

  // ฟังก์ชันบันทึกข้อมูล Department
  function saveDepartments() {
      const departmentInputs = document.querySelectorAll('.department-input'); // เลือก Input ทั้งหมด
      const updates = Array.from(departmentInputs).map(input => ({
          user_id: input.dataset.id, // ดึง user_id จาก data-id
          department: input.value   // ดึงค่าที่กรอกใน input
      }));

      fetch('http://127.0.0.1:5001/api/updateDepartment', { // เรียก API สำหรับบันทึกข้อมูล
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ departments: updates }) // ส่งข้อมูลไปในรูปแบบ JSON
      })
          .then(response => {
              if (!response.ok) {
                  throw new Error('Failed to save departments');
              }
              return response.json();
          })
          .then(data => {
              if (data.message) {
                  alert(data.message); // แสดงข้อความเมื่อบันทึกสำเร็จ
              } else {
                  alert('Failed to save departments.');
              }
          })
          .catch(error => console.error('Error saving departments:', error));
  }

  // Event Listener
  saveDepartmentButton.addEventListener('click', saveDepartments); // ผูก Event กับปุ่ม Save

  // ดึงข้อมูลเมื่อโหลดหน้า
  fetchDepartments();
});
