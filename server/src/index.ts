import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.route';
import labResultRoutes from "./routes/labResult.route";
import forumRoutes from "./routes/forum.route";

import {connectDB} from './lib/db';

const app = express();
app.use(cors());
app.use(express.json()); //use req.body

app.get('/api/health', (req, res) => {
    res.send({message:'RenalFlow server running'})
});

app.use('/api/auth', authRoutes);
app.use("/api/lab-results", labResultRoutes);
app.use("/api/forum", forumRoutes);

const PORT = process.env.PORT|| 4000;

const startServer = async () => {
    try {
      await connectDB();
  
      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  };
  
startServer();