function login(e) {
  if(e) e.preventDefault();
  
  // Get ALL inputs on page, find the ones that are visible and have values
  const allInputs = document.querySelectorAll('input');
  let reg = '';
  let pass = '';
  
  allInputs.forEach(inp => {
    if(inp.offsetParent !== null && inp.value.trim() !== '') { // visible
      if(inp.type === 'password') pass = inp.value.trim();
      else reg = inp.value.trim();
    }
  });
  
  // Fallback if above fails
  if(!reg) {
    const t = document.querySelector('input[type="text"]');
    if(t) reg = t.value.trim();
  }
  if(!pass) {
    const p = document.querySelector('input[type="password"]');
    if(p) pass = p.value.trim();
  }

  console.log('Trying:', reg, pass); // check in console

  const users = [
    { id: 'BTECH/COMP/024', password: 'password123', role: 'Student' },
    { id: 'BTE/C/26/01', password: 'password123', role: 'Student' },
    { id: 'BTECH/COMP/001', password: 'password123', role: 'Student' },
    { id: 'lecturer@btech.edu.gh', password: 'password123', role: 'Lecturer' },
    { id: 'rep@btech.edu.gh', password: 'password123', role: 'Rep' }
  ];

  const found = users.find(u => u.id.toLowerCase() === reg.toLowerCase() && u.password === pass);

  if(found) {
    alert('Welcome ' + found.role + '! Login success ✅');
    localStorage.setItem('user', JSON.stringify(found));
    window.location.href = 'dashboard.html';
  } else {
    alert('I read: "' + reg + '" / "' + pass + '"\nNot found. Use BTECH/COMP/024 / password123');
  }
  return false;
}
window.login = login;
