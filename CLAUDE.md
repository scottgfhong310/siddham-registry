# siddham-registry — Session context

**CBETA 造字**的書寫與組字，以 **Unicode Siddham** 相連（對照與反查），另有〈悉曇十八章〉。
⚠️ **造字是主體、Unicode Siddham 是連結**——不是對等的兩造（上游治理 §3.0）。**零後端**：9,066 個字形／
6,874 個音節是靜態產物（`public/apps/siddham-registry/data/*.js`），由 `db_siddham` 匯出。

本 app 屬於 **nodeapp WebApp 家族**；共同規範與流程在
<https://github.com/scottgfhong310/nodeapp-webapp-family>（`DESIGN_GUIDELINES.md` 規範、
`WORKFLOW.md` 流程）。**改動前請先讀那兩份，照其中 canon 做。**

**本 app 特有的設計決議**見 [`DESIGN.md`](./DESIGN.md)——尤其**字型授權**與**三種「沒有」**兩節，
動前端之前先讀。

## 結構

```
app.js                                   # Express：port 3000；static；/ → 302 /apps/siddham-registry/
scripts/verify.js                        # 15 條契約檢查（npm run verify；--selftest 18 個注入）
public/apps/siddham-registry/
├─ index.html · chapters.html            # 兩頁：字形對照／悉曇十八章
├─ siddham-registry.css                  # 主題 token ＋ 兩頁樣式
├─ siddham-registry.js · chapters.js     # 兩頁的控制器（碰 DOM）
├─ siddham-registry-lib.js               # 純核心：索引／反查／搜尋／組字／章格（**不碰 DOM**）
├─ glyph-detail.js                       # 明細卡（兩頁共用，§4.1 第三種模組）
├─ font-probe.js                         # 字型偵測（兩頁共用）
├─ data/siddham-*.js                     # 由 db_siddham 匯出，**生成物、不手改**
├─ fonts/NotoSansSiddham-Regular.woff2 + OFL.txt
└─ i18n.js · locales/{zh-Hant,en,ja}.js · side-tool.* · materialize-dark.css · filter-clear.*
```

## 執行 / 驗證

```bash
npm install && npm start        # → http://localhost:3000/apps/siddham-registry/
npm run verify                  # 15 條契約檢查
node scripts/verify.js --selftest   # 逐條改壞，確認每條真的抓得到
```

## 本 app 的 canon 重點 / 注意

- ⚠️ **CBETA 悉曇字型永遠不進本 repo**（它沒有再散布的授權，見 `DESIGN.md` §1）。
  前端以 `@font-face { src: local('Siddam') }` 讀使用者本機安裝的版本；偵測不到就顯示說明
  與 CBETA 下載連結。`scripts/verify.js` 第 ①②③ 條釘著這件事——**它壞掉時畫面完全正常**，
  字型就在那裡、顯示得好好的，只有授權出問題。
- ⚠️ **字型偵測不可以量寬度**：載體字元是 CJK 表意文字，在**任何**字型裡都恰好 1em，
  寬度永遠相同 ⇒ 必然回報「沒裝」。用 `font-probe.js` 的像素比對，且它**自帶對照組**。
- ⚠️ **三種「沒有」意思不同，不可混用**（見 `DESIGN.md` §2）：
  `glyph.syl === null`（本來就沒有音）／`composition[i] === null`（來源沒登錄組字）／
  `composition[i] === [i]`（**基本字**，拆到自己為止）。第四種是 `-1`（來源的 `〇` 空位）。
- **資料產物是生成物**：改資料要回 `db_siddham` 改，再跑
  `My Projects/Siddham/export/s4-export.js --write`，然後 `--check` 確認逐位元組相同。
  **改產物不回寫。**
- **欄序寫在產物裡**（`SID_*_COLS`），lib 依名字解包——不要在程式裡寫死欄位位置。
- **i18n**：`data-i18n` 屬性，預設 `zh-Hant`，三語齊備；共用文案逐字抄家族 §6 的〔正統〕表格
  （`verify.js` 第 ⑫ 條逐字比對）。語言切換用 `I18n.cycle()` ＋ `toast.lang` ＋ teal。
- **主題**：CSS 變數 light/dark，預設 dark；`<head>` 內防閃爍 script 同時設 `data-theme`
  **與** `dark-mode`/`light-mode` class（後者是 `materialize-dark.css` 吃的）。

## 複製件登記（共用件改版時靠這份找同步點）

| 檔 | 權威版 |
|---|---|
| `i18n.js` · `side-tool.css` · `side-tool.js` · `materialize-dark.css` | 家族 repo 根 |
| `filter-clear.css` · `filter-clear.js` | 家族共用件（§5.12） |
| `fonts/NotoSansSiddham-Regular.woff2` · `OFL.txt` | `bonji`（SIL OFL 1.1） |
| `data/siddham-*.js` | **`db_siddham`**（非複製件，是匯出產物） |

## 上游

- 資料庫與治理：`My Projects/Siddham/`（private repo `siddham-maintenance`）
- 匯出器：`My Projects/Siddham/export/s4-export.js`
- 轉換記法與 `bonji` 同一套（vendored mandel59/bonji-input）——`fd_notation` 接得上那支 app
