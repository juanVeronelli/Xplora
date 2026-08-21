import multer from 'multer';

const MAX_BYTES = 12 * 1024 * 1024;
const MAX_CSV_BYTES = 4 * 1024 * 1024;
const MAX_SHEET_BYTES = 12 * 1024 * 1024;
const MAX_CV_BYTES = 8 * 1024 * 1024;

export const uploadSingleImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    const ok = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    if (ok.has(file.mimetype)) return cb(null, true);
    cb(new Error('Formato de imagen inválido. Usá JPG, PNG, WebP o GIF.'));
  },
}).single('file');

/** CSV Luma (campo multipart `csv`). */
export const uploadSingleCsv = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_CSV_BYTES },
}).single('csv');

/** CSV/XLSX genérico (campo multipart `csv`). */
export const uploadSingleSpreadsheet = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SHEET_BYTES },
}).single('csv');

/** CV (campo multipart `cv`). Acepta PDF/DOC/DOCX. */
export const uploadSingleCv = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_CV_BYTES },
  fileFilter: (_req, file, cb) => {
    const okTypes = new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]);
    if (okTypes.has(file.mimetype)) return cb(null, true);
    cb(new Error('Formato de CV inválido. Subí PDF o Word (DOC/DOCX).'));
  },
}).single('cv');
