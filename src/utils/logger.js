const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
const ERROR_LOG = path.join(LOG_DIR, 'error.log');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logError = (err, req) => {
  const timestamp = new Date().toISOString();
  const method = req ? req.method : '-';
  const url = req ? req.originalUrl : '-';
  const entry = `[${timestamp}] ${method} ${url}\n${err.stack || err.message}\n${'─'.repeat(80)}\n`;

  fs.appendFile(ERROR_LOG, entry, (writeErr) => {
    if (writeErr) {
      // Fall back to stderr if the file cannot be written
      console.error('Failed to write to error log:', writeErr.message);
    }
  });
};

module.exports = { logError };
