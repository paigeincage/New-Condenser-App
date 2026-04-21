import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { upload } from '../middleware/upload.js';
import { ownsProject, getOwnedSourceFile } from '../lib/ownership.js';

export const filesRouter = Router();

// Upload one or more files to a project (ownership-checked)
filesRouter.post('/upload', upload.array('files', 20), async (req, res) => {
  const { projectId } = req.body;

  if (!projectId) {
    res.status(400).json({ error: 'projectId is required' });
    return;
  }

  const owned = await ownsProject(req.userId!, projectId);
  if (!owned) {
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

// Download / serve a file (ownership-checked)
filesRouter.get('/:fileId/download', async (req, res) => {
  const file = await getOwnedSourceFile(req.userId!, req.params.fileId);
  if (!file) { res.status(404).json({ error: 'File not found' }); return; }
  const fs = await import('fs');
  if (!fs.existsSync(file.storagePath)) { res.status(404).json({ error: 'File missing from disk' }); return; }
  res.download(file.storagePath, file.originalName);
});

// List files for a project (ownership-checked)
filesRouter.get('/project/:projectId', async (req, res) => {
  const owned = await ownsProject(req.userId!, req.params.projectId);
  if (!owned) { res.status(404).json({ error: 'Project not found' }); return; }
  const files = await prisma.sourceFile.findMany({
    where: { projectId: req.params.projectId },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ files });
});
