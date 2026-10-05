// FINAL FIX for GitHub Pages
function login(e) {
  if(e) e.preventDefault();
  
  const regInput = document.getElementById('regNo') || document.querySelector('input[type="text"]');
  const passInput = document.getElementById('password') || document.querySelector('input[type="password"]');
  
  const reg = regInput ? regInput.value.trim() : '';
  const pass = passInput ? passInput.value.trim() : '';

  const users = [
    { id: 'BTECH/COMP/024', password: 'password123', role: 'Student' },
    { id: 'BTE/C/26/01', password: 'password123', role: 'Student' },
    { id: 'lecturer@btech.edu.gh', password: 'password123', role: 'Lecturer' }
  ];

  const found = users.find(u => u.id.toLowerCase() === reg.toLowerCase() && u.password === pass);

  if(found) {
    localStorage.setItem('user', JSON.stringify(found));
    alert('Welcome ' + found.role + ': ' + found.id);
    // If you have dashboard.html it will go there, if not it will stay
    if (document.location.href.includes('dashboard.html') === false) {
        window.location.href = 'dashboard.html';
    }
  } else {
    alert('Wrong credentials!\nUse:\nBTECH/COMP/024 / password123\nor lecturer@btech.edu.gh / password123');
  }
  return false;
}

// Make it work for both onclick and form submit
window.login = login;
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  if(form) form.addEventListener('submit', login);
});
