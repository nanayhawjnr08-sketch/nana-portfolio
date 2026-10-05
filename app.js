let token=null, user=null, currentRoleTab='student';
const API = '';

function switchTab(role){
  currentRoleTab=role;
  document.getElementById('tab-student').classList.toggle('active', role==='student');
  document.getElementById('tab-lecturer').classList.toggle('active', role==='lecturer');
  document.getElementById('identifier').placeholder = role==='student'? 'Reg No: BTECH/COMP/001' : 'Email: lecturer@btech.edu.gh';
}
async function login(){
  const identifier=document.getElementById('identifier').value;
  const password=document.getElementById('password').value;
  const res=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier,password,role_type:currentRoleTab})});
  const data=await res.json();
  if(!res.ok){document.getElementById('login-error').innerText=data.error; return;}
  token=data.token; user=data.user; localStorage.setItem('btech_token',token); localStorage.setItem('btech_user',JSON.stringify(user));
  initApp();
}
function initApp(){
  if(!token) token=localStorage.getItem('btech_token');
  if(!user) user=JSON.parse(localStorage.getItem('btech_user')||'null');
  if(!token) return;
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('welcome').innerText=`Hi, ${user.full_name} (${user.role})`;
  if(['lecturer','rep'].includes(user.role)){document.getElementById('upload-tab').classList.remove('hidden');document.getElementById('students-tab').classList.remove('hidden');document.getElementById('lecturer-attendance-tools').classList.remove('hidden');}
  showView('notes'); loadNotes(); loadStudents();
}
function showView(name){document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));document.getElementById('view-'+name).classList.remove('hidden'); if(name==='attendance') loadAttendance();}
function logout(){localStorage.clear(); location.reload();}
async function loadNotes(){
  const res=await fetch('/api/notes'); const notes=await res.json();
  document.getElementById('notes-list').innerHTML=notes.map(n=>`<div class="item"><div><b>${n.course_code}</b> - ${n.title}<br><small>By ${n.uploader} on ${n.upload_date}</small></div><a href="${n.file_path}" target="_blank" download>Download</a></div>`).join('')||'No notes yet';
}
async function uploadNote(){
  const fd=new FormData(); fd.append('title',document.getElementById('note-title').value); fd.append('course_code',document.getElementById('note-course').value); fd.append('file',document.getElementById('note-file').files[0]);
  const res=await fetch('/api/notes',{method:'POST',headers:{Authorization:'Bearer '+token},body:fd}); if(res.ok){alert('Uploaded!'); loadNotes();}
}
async function loadStudents(){
  const res=await fetch('/api/students',{headers:{Authorization:'Bearer '+token}}); const students=await res.json();
  document.getElementById('students-list').innerHTML=students.map(s=>`<div class="item"><span><b>${s.reg_number}</b></span><span>${s.full_name}</span><span>${s.level}</span></div>`).join('');
  window.allStudents=students;
}
let attendanceRecords=[];
async function loadStudentsForAttendance(){
  if(!window.allStudents) await loadStudents();
  const sheet=document.getElementById('attendance-sheet'); sheet.innerHTML='';
  attendanceRecords=window.allStudents.map(s=>({student_id:s.id, status:'present', full_name:s.full_name, reg_number:s.reg_number}));
  attendanceRecords.forEach((r,i)=>{
    sheet.innerHTML+=`<div class="row"><span><b>${r.reg_number}</b> - ${r.full_name}</span><select onchange="attendanceRecords[${i}].status=this.value"><option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option></select></div>`;
  });
}
async function saveAttendance(){
  const date=document.getElementById('att-date').value; const course_code=document.getElementById('att-course').value;
  if(!date||!course_code) return alert('Select date & course code');
  const res=await fetch('/api/attendance',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({date,course_code,records:attendanceRecords})});
  if(res.ok) alert('Attendance saved!');
}
async function loadAttendance(){
  const res=await fetch('/api/attendance',{headers:{Authorization:'Bearer '+token}}); const rows=await res.json();
  if(['student','rep'].includes(user.role) && user.role==='student'){
    document.getElementById('student-attendance-list').innerHTML=rows.map(r=>`<div class="item"><span>${r.date} - ${r.course_code}</span><span>${r.status}</span></div>`).join('')||'No attendance yet';
  } else {
    document.getElementById('student-attendance-list').innerHTML=rows.map(r=>`<div class="item"><span>${r.date} - ${r.reg_number} - ${r.full_name}</span><span>${r.status} (${r.course_code})</span></div>`).join('');
  }
}
if(localStorage.getItem('btech_token')){token=localStorage.getItem('btech_token'); initApp();}