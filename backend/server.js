import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const SECRET = process.env.SECRET || 'btech-store-2026';
const db = new Database(path.join(__dirname,'btech.db'));
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname,'uploads')));
app.use(express.static(path.join(__dirname,'../frontend')));
if (!fs.existsSync(path.join(__dirname,'uploads'))) fs.mkdirSync(path.join(__dirname,'uploads'));

db.exec(`
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, full_name TEXT, reg_number TEXT UNIQUE, email TEXT UNIQUE, password TEXT, role TEXT, level TEXT);
CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY, title TEXT, course_code TEXT, file_path TEXT, file_name TEXT, uploaded_by INTEGER, upload_date TEXT);
CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY, student_id INTEGER, date TEXT, status TEXT, course_code TEXT);
CREATE TABLE IF NOT EXISTS attendance_chat (id INTEGER PRIMARY KEY, message TEXT, sender_name TEXT, sender_role TEXT, timestamp TEXT);
`);

if(db.prepare('SELECT COUNT(*) as c FROM users').get().c===0){
  const h=bcrypt.hashSync('password123',10);
  db.prepare("INSERT INTO users (full_name,email,password,role) VALUES (?,?,?,?)").run('Dr. Mensah','lecturer@btech.edu.gh',h,'lecturer');
  db.prepare("INSERT INTO users (full_name,reg_number,email,password,role,level) VALUES (?,?,?,?,?,?)").run('Nana (Rep)','BTECH/COMP/001','rep@btech.edu.gh',h,'rep','400');
  db.prepare("INSERT INTO users (full_name,reg_number,password,role,level) VALUES (?,?,?,?,?)").run('Angel Grace','BTECH/COMP/024',h,'student','400');
}

function auth(req,res,next){
  const t=req.headers.authorization?.split(' ')[1];
  if(!t) return res.status(401).json({error:'No token'});
  try{ req.user=jwt.verify(t,SECRET); next(); }catch{ res.status(401).json({error:'Invalid'}); }
}
const storage=multer.diskStorage({destination:path.join(__dirname,'uploads'),filename:(r,f,cb)=>cb(null,Date.now()+'-'+f.originalname)});
const upload=multer({storage});

app.post('/api/login',(req,res)=>{
  const {identifier,password,role_type}=req.body;
  let user = role_type==='student'? db.prepare('SELECT * FROM users WHERE reg_number=?').get(identifier) : db.prepare('SELECT * FROM users WHERE email=?').get(identifier);
  if(!user||!bcrypt.compareSync(password,user.password)) return res.status(401).json({error:'Invalid credentials'});
  const token=jwt.sign({id:user.id,role:user.role,full_name:user.full_name},SECRET,{expiresIn:'7d'});
  res.json({token,user});
});
app.get('/api/notes',(req,res)=>{ res.json(db.prepare('SELECT notes.*, users.full_name as uploader FROM notes JOIN users ON notes.uploaded_by=users.id ORDER BY id DESC').all()); });
app.post('/api/notes',auth,upload.single('file'),(req,res)=>{
  if(!['lecturer','rep'].includes(req.user.role)) return res.status(403).json({error:'Forbidden'});
  const r=db.prepare('INSERT INTO notes (title,course_code,file_path,file_name,uploaded_by,upload_date) VALUES (?,?,?,?,?,?)').run(req.body.title,req.body.course_code,'/uploads/'+req.file.filename,req.file.originalname,req.user.id,new Date().toLocaleString());
  const note=db.prepare('SELECT notes.*, users.full_name as uploader FROM notes JOIN users ON notes.uploaded_by=users.id WHERE notes.id=?').get(r.lastInsertRowid);
  io.emit('new_note', note); res.json(note);
});
app.get('/api/students',auth,(req,res)=>{ res.json(db.prepare('SELECT id,full_name,reg_number,level FROM users WHERE role IN ("student","rep") ORDER BY reg_number').all()); });
app.post('/api/attendance',auth,(req,res)=>{
  const {date,course_code,records}=req.body;
  db.prepare('DELETE FROM attendance WHERE date=? AND course_code=?').run(date,course_code);
  const stmt=db.prepare('INSERT INTO attendance (student_id,date,status,course_code) VALUES (?,?,?,?)');
  db.transaction((recs)=>{ for(const r of recs) stmt.run(r.student_id,date,r.status,course_code); })(records);
  io.emit('attendance_updated', {date,course_code}); res.json({ok:true});
});
app.get('/api/attendance',auth,(req,res)=>{ res.json(db.prepare('SELECT attendance.*, users.full_name, users.reg_number FROM attendance JOIN users ON attendance.student_id=users.id ORDER BY date DESC').all()); });
app.get('/api/chat',(req,res)=>{ res.json(db.prepare('SELECT * FROM attendance_chat ORDER BY id ASC LIMIT 100').all()); });

io.on('connection',(socket)=>{
  socket.on('send_chat',(d)=>{
    const time=new Date().toLocaleTimeString();
    db.prepare('INSERT INTO attendance_chat (message,sender_name,sender_role,timestamp) VALUES (?,?,?,?)').run(d.message,d.sender_name,d.sender_role,time);
    io.emit('new_chat', {message:d.message,sender_name:d.sender_name,sender_role:d.sender_role,timestamp:time});
  });
});

app.get('*',(req,res)=>{ res.sendFile(path.join(__dirname,'../frontend/index.html')); });
server.listen(PORT,()=>console.log(`✅ STORE EDITION LIVE ON ${PORT}`));

