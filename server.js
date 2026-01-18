const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const CryptoJS = require("crypto-js");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Folder
const uploadDir = "uploads";
const encryptedDir = "encrypted";

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(encryptedDir)) fs.mkdirSync(encryptedDir);

// Multer config
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Routes
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/encrypt", (req, res) => {
  res.render("encrypt");
});

app.get("/decrypt", (req, res) => {
  res.render("decrypt");
});

// ENCRYPT
app.post("/encrypt", upload.single("document"), (req, res) => {
    const { algorithm, password } = req.body;
    const file = req.file;
  
    const fileData = fs.readFileSync(file.path).toString("base64");
  
    // Simpan metadata file
    const payload = {
      filename: file.originalname,
      data: fileData
    };
  
    const jsonData = JSON.stringify(payload);
  
    let encrypted;
    if (algorithm === "AES") {
      encrypted = CryptoJS.AES.encrypt(jsonData, password).toString();
    } else {
      encrypted = CryptoJS.DES.encrypt(jsonData, password).toString();
    }
  
    const outputFile = `${encryptedDir}/encrypted-${file.originalname}.enc`;
    fs.writeFileSync(outputFile, encrypted);
  
    res.download(outputFile);
  });
  

// DECRYPT
// DECRYPT (FIX – KEMBALI KE FILE ASLI)
app.post("/decrypt", upload.single("encryptedFile"), (req, res) => {
    const { algorithm, password } = req.body;
    const encryptedText = fs.readFileSync(req.file.path, "utf8");
  
    try {
      let decrypted;
      if (algorithm === "AES") {
        decrypted = CryptoJS.AES.decrypt(encryptedText, password);
      } else {
        decrypted = CryptoJS.DES.decrypt(encryptedText, password);
      }
  
      const jsonData = decrypted.toString(CryptoJS.enc.Utf8);
      const payload = JSON.parse(jsonData);
  
      const buffer = Buffer.from(payload.data, "base64");
      const outputFile = `${encryptedDir}/${payload.filename}`;
  
      fs.writeFileSync(outputFile, buffer);
      res.download(outputFile);
  
    } catch (error) {
      res.send("❌ Password salah atau file tidak valid");
    }
  });
  

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
