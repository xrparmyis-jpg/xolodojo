import { createApiApp } from './server/createApiApp.js';

const PORT = process.env.API_PORT ? parseInt(process.env.API_PORT, 10) : 3000;

createApiApp()
  .then((app) => {
    const server = app.listen(PORT, () => {
      console.log(`API server running on http://localhost:${PORT}`);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use.`);
        console.error(
          `Stop the process using port ${PORT} or set API_PORT (e.g. API_PORT=3001 npm run dev:api).`
        );
        process.exit(1);
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });
  })
  .catch((error) => {
    console.error('Failed to create API app:', error);
    process.exit(1);
  });
