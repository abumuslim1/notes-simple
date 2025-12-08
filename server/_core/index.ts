import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import multer from "multer";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { storagePut } from "../storage";
import * as db from "../db";
import { nanoid } from "nanoid";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Multer configuration for file uploads
  const upload = multer({ storage: multer.memoryStorage() });
  
  // File upload endpoint for comment files
  app.post('/api/upload-comment-file', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }
      
      const commentId = parseInt(req.body.commentId);
      if (!commentId) {
        return res.status(400).json({ error: 'Comment ID required' });
      }
      
      // Upload to S3
      const fileKey = `comments/${commentId}/${nanoid()}-${req.file.originalname}`;
      const { url } = await storagePut(fileKey, req.file.buffer, req.file.mimetype);
      
      // Save to database
      const fileId = await db.addCommentFile({
        commentId,
        fileName: req.file.originalname,
        fileKey,
        fileUrl: url,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });
      
      res.json({ success: true, fileId, url });
    } catch (error) {
      console.error('Error uploading comment file:', error);
      res.status(500).json({ error: 'File upload failed' });
    }
  });
  
  // File upload endpoint for task files
  app.post('/api/upload-task-file', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }
      
      const taskId = parseInt(req.body.taskId);
      if (!taskId) {
        return res.status(400).json({ error: 'Task ID required' });
      }
      
      // Upload to S3
      const fileKey = `tasks/${taskId}/${nanoid()}-${req.file.originalname}`;
      const { url } = await storagePut(fileKey, req.file.buffer, req.file.mimetype);
      
      // Save to database
      const fileId = await db.addTaskFile({
        taskId,
        fileName: req.file.originalname,
        fileKey,
        fileUrl: url,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });
      
      res.json({ success: true, fileId, url });
    } catch (error) {
      console.error('Error uploading task file:', error);
      res.status(500).json({ error: 'File upload failed' });
    }
  });
  
  // Auth routes
  registerAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
