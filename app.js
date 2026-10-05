// Fix for GitHub Pages - No backend needed
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.querySelector('form') || document.getElementById('loginForm');
  const regInput = document.getElementById('regNo') || document.querySelector('input[type="text"]');
  const passInput = document.getElementById('password') || document.querySelector('input[type="password"]');
  const loginBtn = document.querySelector('button[type="submit"]') || document.querySelector('button');

  const users = [
    { id: 'BTECH/COMP/024', password: 'password123', role: 'Student' },
    { id: 'BTE/C/26/01', password: 'password123', role: 'Student' },
    { id: 'lecturer@btech.edu.gh', password: 'password123', role: 'Lecturer' },
    { id: 'BTECH/COMP/001', password: '123', role: 'Student' }
  ];

  function doLogin(e) {
    if(e) e.preventDefault();
    const reg = regInput.value.trim();
    const pass = passInput.value.trim();

    const found = users.find(u => u.id.toLowerCase() === reg.toLowerCase() && u.password === pass);

    if(found) {
      localStorage.setItem('user', JSON.stringify(found));
      alert(`Welcome ${found.role}: ${found.id}`);
      // Change this to your dashboard page name
      window.location.href = 'dashboard.html'; 
      // If you don't have dashboard.html, it will just show alert
      // You can create dashboard.html later
    } else {
      alert('Invalid Reg No or Password. Try:\nStudent: BTECH/COMP/024 / password123\nLecturer: lecturer@btech.edu.gh / password123');
    }
  }

  if(loginForm) {
    loginForm.addEventListener('submit', doLogin);
  }
  if(loginBtn) {
    loginBtn.addEventListener('click', doLogin);
  }
});
