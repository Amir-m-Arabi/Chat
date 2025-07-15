import multer from "multer";
import path from "path";
import fs from "fs";

const imageFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"));
  }
};

const videoFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  if (file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Only video files are allowed!"));
  }
};

const audioFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  if (file.mimetype.startsWith("audio/")) {
    cb(null, true);
  } else {
    cb(new Error("Only audio files are allowed!"));
  }
};

const generalFileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  const allowedMimes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    "application/zip",
    "application/x-rar-compressed",

    "text/plain",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type!"));
  }
};

function makeStorage(
  folder: string,
  fileFilter?: multer.Options["fileFilter"]
) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, "..", "uploads", folder);
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uniqueName = `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${ext}`;
      cb(null, uniqueName);
    },
  });

  return multer({ storage, fileFilter });
}

export const profileUpload = makeStorage("profile", imageFilter);
export const videoUpload = makeStorage("video", videoFilter);
export const musicUpload = makeStorage("music", audioFilter);
export const fileUpload = makeStorage("file", generalFileFilter);
