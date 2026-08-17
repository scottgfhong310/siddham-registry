// siddham-registry — 建置資訊與字型登錄（由 db_siddham 匯出，勿手改）
// 產生器：My Projects/Siddham/export/s4-export.js

// 來源與造字編碼體系
window.SID_META = {"source":"Cbeta/CbetaSiddham.xlsx","sourceSha256":"f6e38e9ee75b3ab277cec96923a73cf771cc3ba84a3db3e5e9fb3aa8bfd746e8","sourceRows":9066,"encodings":[{"code":"cbeta","name":"CBETA 悉曇","charset":"big5","origin":"嘉豐出版社造字 → CBETA 轉為 Unicode 並擴充"}]};

// 字型登錄。⚠️ redistributable === false 的字型**不隨本 repo 散布**（治理 §9.2）——
// 前端以 @font-face src: local(<family>) 讀使用者本機安裝的版本，
// 偵測不到就顯示說明與取得連結，不要留白。
window.SID_FONTS = [{"code":"noto-sans-siddham","family":"Noto Sans Siddham","version":"Version 2.004","license":"SIL OFL 1.1","redistributable":true,"encoding":null},{"code":"siddam-ttf","family":"Siddam","version":"Version 2.00","license":null,"redistributable":false,"encoding":"cbeta"}];
