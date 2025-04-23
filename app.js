const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;


process.on('uncaughtException', function (err) {
  console.error('Uncaught Exception:', err);
});

// Middleware
app.use(express.json());


const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const id = uuidv4();
    const ext = path.extname(file.originalname);
    const filename = `${id}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG/PNG files are allowed.'));
    }
  }
});


app.get('/', (req, res) => {
  res.send(' Server is up and running!');
});


app.put('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const fileId = path.parse(file.filename).name;
  res.json({
    id: fileId,
    originalName: file.originalname,
    filename: file.filename,
    path: file.path,
    size: file.size
  });
});


app.delete('/delete-file/:id', (req, res) => {
  const id = req.params.id;
  const file = fs.readdirSync(UPLOADS_DIR).find(f => f.startsWith(id));
  if (!file) return res.status(404).json({ error: 'File not found' });

  fs.unlinkSync(path.join(UPLOADS_DIR, file));
  res.json({ message: `File ${file} deleted successfully.` });
});


app.post('/rename-file', (req, res) => {
  const { id, newName } = req.body;
  if (!id || !newName) return res.status(400).json({ error: 'ID and newName required' });

  const oldFile = fs.readdirSync(UPLOADS_DIR).find(f => f.startsWith(id));
  if (!oldFile) return res.status(404).json({ error: 'File not found' });

  const ext = path.extname(oldFile);
  const newFile = `${id}_${newName}${ext}`;
  fs.renameSync(
    path.join(UPLOADS_DIR, oldFile),
    path.join(UPLOADS_DIR, newFile)
  );

  res.json({ message: 'File renamed successfully', newFilename: newFile });
});


console.log('Starting app...');
app.listen(PORT, () => {
  console.log(' Server running on http://localhost:3000');
});
