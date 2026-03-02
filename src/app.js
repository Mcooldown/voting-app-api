const express = require('express');
const { logError } = require('./utils/logger');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_, res) => {
  res.status(200).json({ success: true, message: 'Voting API is running' });
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/votes', require('./routes/vote.routes'));

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  logError(err, req);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

module.exports = app;
