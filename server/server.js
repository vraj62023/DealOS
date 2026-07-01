require('dotenv').config();
const express = require('express');
const cors = require('cors');

const path = require('path');

const connectDB= require('./configs/db');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.send('welcome to dealOs backend');
});
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/company', require('./routes/companyRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/dataroom', require('./routes/dataroomRoutes'));
app.use('/api/matches', require('./routes/matchRoutes'));
app.use('/api/webhooks', require('./routes/webhookRoutes'));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
