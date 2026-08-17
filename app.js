/**
 * siddham-registry — 獨立執行的 Express 伺服器
 *
 * 唯讀參考工具：CBETA 造字的書寫與組字，以 Unicode Siddham 相連；含悉曇十八章。
 * 9,066 個字形／6,898 個音節是靜態產物（public/apps/siddham-registry/data/*.js，
 * 由 db_siddham 匯出），不需上傳/編輯，故**後端無 API**——
 * 只負責靜態檔、根路徑轉址、JSON 404。
 *
 * ⚠️ CBETA 悉曇字型**沒有隨本 repo 散布**（它沒有再散布的授權）。
 *    前端以 @font-face src: local('Siddam') 讀使用者本機安裝的版本，
 *    偵測不到就顯示說明與取得連結。詳見 DESIGN.md。
 *
 * 啟動： npm install && npm start
 *        預設 http://localhost:3000/apps/siddham-registry/
 */

const express = require('express');
const path = require('path');
const logger = require('morgan');

const app = express();

app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// 根路徑導向應用頁
app.get('/', (req, res) => res.redirect('/apps/siddham-registry/'));

// 404（API 回 JSON，其餘回純文字）
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ ok: false, error: 'Not found' });
  res.status(404).type('text/plain').send('Not found');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`siddham-registry →  http://localhost:${PORT}/apps/siddham-registry/`);
});
