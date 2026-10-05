// Complete fix: Login + Tab Switching
function switchTab(tab) {
  // Hide all tab contents
  const studentForm = document.getElementById('studentForm') || document.querySelector('.student-form');
  const lecturerForm = document.getElementById('lecturerForm') || document.querySelector('.lecturer-form');
  const allForms = document.querySelectorAll('[id*="Form"], .form-section');
  
  // Simple method: find buttons
  const buttons = document.querySelectorAll('button');
  
  // Try to find forms by their container
  if (tab === 'student' || tab === 'Student') {
    if (document.getElementById('studentForm')) document.getElementById('studentForm').style.display = 'block';
    if (document.getElementById('lecturerForm')) document.getElementById('lecturerForm').style.display = 'none';
    // Also try class based
    document.querySelectorAll('.tab-content').forEach(el => {
      if (el.id.toLowerCase().includes('student')) el.style.display = 'block';
      else el.style.display = 'none';
    });
  } else {
    if (document.getElementById('studentForm')) document.getElementById('studentForm').style.display = 'none';
    if (document.getElementById('lecturerForm')) document.getElementById('lecturerForm').style.display = 'block';
    document.querySelectorAll('.tab-content').forEach(el => {
      if (el.id.toLowerCase().includes('lecturer') || el.id.toLowerCase().includes('rep')) el.style.display = 'block';
      else el.style.display = 'none';
    });
  }
  
  // Update active button style
  document.querySelectorAll('.tab-btn, button').forEach(b => {
    if (b.textContent.toLowerCase().includes(tab.toLowerCase())) {
      b.classList.add('active');
    } else if (b.textContent.toLowerCase().includes('student') || b.textContent.toLowerCase().includes('lecturer')) {
      b.classList.remove('active');
    }
  });
}

function login(e) {
  if(e) e.preventDefault();
  const allInputs = document.querySelectorAll('input');
  let reg = '';
  let pass = '';
  allInputs.forEach(inp => {
    if(inp.offsetParent !== null && inp.value.trim() !== '') {
      if(inp.type === 'password') pass = inp.value.trim();
      else reg = inp.value.trim();
    }
  });
  if(!reg) {
    const t = document.querySelector('input[type="text"]');
    if(t) reg = t.value.trim();
  }
  if(!pass) {
    const p = document.querySelector('input[type="password"]');
    if(p) pass = p.value.trim();
  }

  const users = [
    { id: 'BTECH/COMP/024', password: 'password123', role: 'Student' },
    { id: 'BTE/C/26/01', password: 'password123', role: 'Student' },
    { id: 'lecturer@btech.edu.gh', password: 'password123', role: 'Lecturer' },
    { id: 'rep@btech.edu.gh', password: 'password123', role: 'Rep' }
  ];

  const found = users.find(u => u.id.toLowerCase() === reg.toLowerCase() && u.password === pass);
  if(found) {
    localStorage.setItem('user', JSON.stringify(found));
    alert('Welcome ' + found.role + '!');
    window.location.href = 'dashboard.html';
  } else {
    alert('Wrong! Use BTECH/COMP/024 / password123');
  }
  return false;
}

window.switchTab = switchTab;
window.login = login;
