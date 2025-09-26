import dotenv from 'dotenv';
import app from './app.js';

dotenv.config({
    path: '.env'
});

app.listen(process.env.PORT, () => {
    console.log(`Server on ${process.env.PORT}`);
    fetch(`http://localhost:${process.env.PORT}/health`)
      .then(r => r.json())
      .then(d => console.log('Health OK:', d))
      .catch(err => console.error('Health check failed:', err));
  });