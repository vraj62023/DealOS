const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB= require('./configs/db');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('welcome to dealOs backend');
});
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/company', require('./routes/companyRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/dataroom', require('./routes/dataroomRoutes'));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
