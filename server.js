import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const SECRET = process.env.SECRET || 'btech-comp-eng-2026-secret-key';
const db = new Database('btech.db');
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(express.static('../frontend'));
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

db.exec(`
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, full_name TEXT, reg_number TEXT UNIQUE, email TEXT UNIQUE, password TEXT, role TEXT, level TEXT);
CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, course_code TEXT, file_path TEXT, file_name TEXT, uploaded_by INTEGER, upload_date TEXT);
CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, date TEXT, status TEXT, course_code TEXT);
CREATE TABLE IF NOT EXISTS attendance_chat (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT, sender_name TEXT, sender_role TEXT, timestamp TEXT);
`);

const c = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if(c===0){
  const hash=bcrypt.hashSync('password123',10);
  db.prepare("INSERT INTO users (full_name,email,password,role) VALUES (?,?,?,?)").run('Dr. Mensah','lecturer@btech.edu.gh',hash,'lecturer');
  db.prepare("INSERT INTO users (full_name,reg_number,email,password,role,level) VALUES (?,?,?,?,?,?)").run('Nana (Rep)','BTECH/COMP/001','rep@btech.edu.gh',hash,'rep','400');
  db.prepare("INSERT INTO users (full_name,reg_number,password,role,level) VALUES (?,?,?,?,?)").run('Angel Grace','BTECH/COMP/024',hash,'student','400');
}

function auth(req,res,next){
  const token=req.headers.authorization?.split(' ')[1];
  if(!token) return res.status(401).json({error:'No token'});
  try{ req.user=jwt.verify(token,SECRET); next(); }catch{ res.status(401).json({error:'Invalid'}); }
}
const storage=multer.diskStorage({destination:'uploads/',filename:(req,file,cb)=>cb(null,Date.now()+'-'+file.originalname)});
const upload=multer({storage});

app.post('/api/login',(req,res)=>{
  const {identifier,password,role_type}=req.body;
  let user = role_type==='student'? db.prepare('SELECT * FROM users WHERE reg_number=?').get(identifier) : db.prepare('SELECT * FROM users WHERE email=?').get(identifier);
  if(!user||!bcrypt.compareSync(password,user.password)) return res.status(401).json({error:'Invalid credentials'});
  const token=jwt.sign({id:user.id,role:user.role,full_name:user.full_name},SECRET,{expiresIn:'7d'});
  res.json({token,user:{id:user.id,full_name:user.full_name,role:user.role,reg_number:user.reg_number,email:user.email}});
});

app.get('/api/notes',(req,res)=>{
  res.json(db.prepare('SELECT notes.*, users.full_name as uploader FROM notes JOIN users ON notes.uploaded_by=users.id ORDER BY id DESC').all());
});
app.post('/api/notes',auth,upload.single('file'),(req,res)=>{
  if(!['lecturer','rep'].includes(req.user.role)) return res.status(403).json({error:'Forbidden'});
  const r=db.prepare('INSERT INTO notes (title,course_code,file_path,file_name,uploaded_by,upload_date) VALUES (?,?,?,?,?,?)').run(req.body.title,req.body.course_code,'/uploads/'+req.file.filename,req.file.originalname,req.user.id,new Date().toLocaleString());
  const note=db.prepare('SELECT notes.*, users.full_name as uploader FROM notes JOIN users ON notes.uploaded_by=users.id WHERE notes.id=?').get(r.lastInsertRowid);
  io.emit('new_note', note);
  res.json(note);
});
app.get('/api/students',auth,(req,res)=>{ res.json(db.prepare('SELECT id,full_name,reg_number,level FROM users WHERE role IN ("student","rep") ORDER BY reg_number').all()); });

app.post('/api/attendance',auth,(req,res)=>{
  const {date,course_code,records}=req.body;
  db.prepare('DELETE FROM attendance WHERE date=? AND course_code=?').run(date,course_code);
  const stmt=db.prepare('INSERT INTO attendance (student_id,date,status,course_code) VALUES (?,?,?,?)');
  db.transaction((recs)=>{ for(const r of recs) stmt.run(r.student_id,date,r.status,course_code); })(records);
  const fullList=db.prepare('SELECT attendance.*, users.full_name, users.reg_number FROM attendance JOIN users ON attendance.student_id=users.id WHERE date=? AND course_code=?').all(date,course_code);
  io.emit('attendance_updated', {date,course_code,list:fullList});
  res.json({ok:true});
});
app.get('/api/attendance',auth,(req,res)=>{
  if(req.user.role==='student') return res.json(db.prepare('SELECT * FROM attendance WHERE student_id=? ORDER BY date DESC').all(req.user.id));
  res.json(db.prepare('SELECT attendance.*, users.full_name, users.reg_number FROM attendance JOIN users ON attendance.student_id=users.id ORDER BY date DESC').all());
});

// Attendance Chat API + Socket
app.get('/api/chat',(req,res)=>{ res.json(db.prepare('SELECT * FROM attendance_chat ORDER BY id ASC LIMIT 100').all()); });

io.on('connection',(socket)=>{
  socket.on('send_chat',(data)=>{
    const time=new Date().toLocaleTimeString();
    db.prepare('INSERT INTO attendance_chat (message,sender_name,sender_role,timestamp) VALUES (?,?,?,?)').run(data.message,data.sender_name,data.sender_role,time);
    io.emit('new_chat', {message:data.message,sender_name:data.sender_name,sender_role:data.sender_role,timestamp:time});
  });
  socket.on('typing',(name)=>{ socket.broadcast.emit('typing', name); });
});

server.listen(PORT,()=>console.log(`✅ V2 running on port ${PORT}`));
