import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import messageRoute from './public/src/routes/message.route.js';

const app = express();

app.use(cors({
    origin: '*',
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/fbwa", messageRoute);

// Health check endpoint
app.get('/health', (req, res) => {
console.log("health called")
	return res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

export default app;