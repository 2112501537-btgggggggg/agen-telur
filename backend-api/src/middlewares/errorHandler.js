function errorHandler(err, req, res, next) {
  // Error kustom AppError
  if (err.statusCode) {
    const response = { success: false, message: err.message };
    if (err.errors) {
      response.errors = err.errors;
    }
    return res.status(err.statusCode).json(response);
  }

  // Error validasi Zod
  if (err.name === 'ZodError') {
    const errors = err.issues.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({ success: false, message: 'Validasi gagal', errors });
  }

  // Error Prisma: unique constraint
  if (err.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'Data sudah ada (duplikat)' });
  }

  // Error Prisma: data tidak ditemukan
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
  }

  // Fallback — jangan bocorkan detail error internal ke client
  console.error(err);
  return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
}

module.exports = errorHandler;
