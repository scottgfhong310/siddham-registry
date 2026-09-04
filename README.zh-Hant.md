# siddham-registry

**CBETA 造字**的**書寫與組字**，以 **Unicode Siddham** 相連（對照與反查），另有**〈悉曇十八章〉**。唯讀、零後端。

> ⚠️ **造字是主體、Unicode Siddham 是連結**，不是對等的兩造。
> 造字這一組字本身帶著悉曇文字的演進史（貝葉、空海、蘭札、瓦德體…），組字讓字義直覺化；Unicode Siddham 的價值是讓同一個音在不同體系之間指得到彼此。

在 Unicode 收錄悉曇之前，悉曇梵字一律靠**自行造字**：台灣最早是嘉豐出版社以 Big5 編碼順序整理，
後由 [CBETA](https://www.cbeta.org/) 承接、轉成 Unicode 字型並擴充；日本則有今昔文字鏡以
Shift-JIS 順序整理。**同一個悉曇字，在不同體系裡是不同的碼位、不同的字元、不同的字型。**
這支 app 回答的是：**文獻裡這個用造字寫成的字，對應到哪一個 Unicode Siddham？**

## 做什麼

- **音節牆** — 6,874 個音節。點開一個就看到它的所有寫法：`ā` 有 **21 種**，
  橫跨空海、釋智廣、《法隆寺貝葉》、蘭札、瓦德體…；一個 unicode 串最多對到 **37** 個字形。
- **反查** — 貼上用造字寫成的文字，逐字對回 Unicode Siddham。對不到的會標出來，
  而且**「不在登錄裡」與「這個字形本來就沒有音」分開講**。
- **悉曇十八章** — 一章 12 欄，每格恆顯示組字拆解。
- 搜尋同時吃記法／羅馬／悉曇／造字／Big5 碼。
- 三語（zh-Hant / en / ja）、light 與 dark。

## 資料

9,066 字形 · 6,874 音節 · 26,532 個組字關聯 · 6,442 個章格 · 43 個 face · 18 章
——由 `db_siddham` 匯出成靜態 JS。**產物是生成物，不手改。**

羅馬轉寫是 **ISO 15919**。記法與 [bonji](https://github.com/scottgfhong310/bonji) 同一套
（vendored [mandel59/bonji-input](https://github.com/mandel59/bonji-input)）。

## ⚠️ 字型

**本 app 不附 CBETA 悉曇字型**——它沒有再散布的授權（字型內沒有任何版權／商標／授權欄位，
CBETA 下載頁對該檔也沒有任何授權條款）。請自
[CBETA 下載頁](https://archive2.cbeta.org/download/cbreader.php)取得並安裝到系統字型；
app 會以 `@font-face { src: local('Siddam') }` 讀你安裝的那一份，找不到就明白告訴你。

Unicode Siddham 的顯示不受影響——**Noto Sans Siddham**（SIL OFL 1.1）隨附，
且涵蓋資料裡用到的全部 75 個悉曇碼位。

完整理由見 [DESIGN.md](./DESIGN.md) §1。

## 執行

```bash
npm install && npm start        # http://localhost:3000/apps/siddham-registry/
npm run verify                  # 15 條契約檢查
```

本 app 屬於 **nodeapp WebApp 家族**——
[共同規範](https://github.com/scottgfhong310/nodeapp-webapp-family)。
本 app 特有的設計決議見 [DESIGN.md](./DESIGN.md)。

[English](./README.md) ｜ [日本語](./README.ja.md)

## 授權

MIT © 2026 [Scott G.F. Hong](https://github.com/scottgfhong310)。
隨附 **Noto Sans Siddham**（SIL OFL 1.1），見
[fonts/OFL.txt](./public/apps/siddham-registry/fonts/OFL.txt)。
字形資料衍生自 CBETA 的悉曇整理。
