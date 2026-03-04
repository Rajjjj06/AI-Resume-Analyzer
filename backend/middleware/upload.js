import multer from "multer";
import multerS3 from "multer-s3";
import { s3Client, BUCKET_NAME } from "../config/s3.js";
import { v4 as uuidv4 } from "uuid";

const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const userId = req.user._id.toString();
      const uniqueKey = `resumes/${userId}/${uuidv4()}-${file.originalname}`;
      cb(null, uniqueKey);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default upload;
