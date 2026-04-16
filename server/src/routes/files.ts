import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { upload } from '../middleware/upload.js';

export const filesRouter = Router();

// Upload one or more files to a project
// Note: projectFolder must come BEFORE files in the FormData so multer can use it for destination
filesRouter.post('/upload', upload.array('files', 20), async (req, res) => {
  const { projectId } = req.body;

  if (!projectId) {
    res.status(400).json({ error: 'projectId is required' });
    return;
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No files uploaded' });
    return;
  }

  const records = await Promise.all(
    files.map((f) =>
      prisma.sourceFile.create({
        data: {
          projectId,
          originalName: f.originalname,
          mimeType: f.mimetype,
          storagePath: f.path,
          sizeBytes: f.size,
        },
      })
    )
  );

  res.json({ files: records });
});

// Download / serve a file
filesRouter.get('/:fileId/download', async (req, res) => {
  const file = await prisma.sourceFile.findUnique({ where: { id: req.params.fileId } });
  if (!file) { res.status(404).json({ error: 'File not found' }); return; }
  const fs = await import('fs');
  if (!fs.existsSync(file.storagePath)) { res.status(404).json({ error: 'File missing from disk' }); return; }
  res.download(file.storagePath, file.originalName);
});

// List files for a project
filesRouter.get('/project/:projectId', async (req, res) => {
  const files = await prisma.sourceFile.findMany({
    where: { projectId: req.params.projectId },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ files });
});
