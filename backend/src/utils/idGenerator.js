const crypto = require('crypto');

/**
 * 生成任务 ID
 * 格式: req_YYYYMMDD_HHMMSS_rand4
 * 例: req_20260803_143052_a1b2
 */
function generateTaskId() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const rand = crypto.randomBytes(2).toString('hex'); // 4 hex chars
  return `req_${dateStr}_${timeStr}_${rand}`;
}

module.exports = { generateTaskId };
