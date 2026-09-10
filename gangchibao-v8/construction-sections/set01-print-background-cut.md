# SET01｜螢幕可見、列印層仍依賴背景輸出的施工斷面

這不是清理項目，也不是把 SET01 改成另一套圖檔。

目前 `original-figures.js` 將 SET01 攝影組保存在一張 master sprite 裡，閱讀器用 `background-image`、`background-size: 100% 1200%` 與 `background-position` 裁出十二張照片。這個做法在螢幕閱讀層可以成立，但進入 PDF／紙本列印時有一個出版層風險：瀏覽器若關閉 background graphics，照片可能不被輸出。

2026-09-11 的施工先不拆 sprite、不仿畫、不另存一套假原件，只在 `original-figure-layout.css` 的 print layer 補上 `print-color-adjust: exact`、`-webkit-print-color-adjust: exact` 與 `forced-color-adjust: none`，要求支援這些屬性的輸出器保留攝影背景。

這不是最終解決。

目前狀態：

- 螢幕閱讀：已接線。
- 列印：增加保背景鷹架，但仍受輸出器 background graphics 設定影響。
- 原圖：不拆、不重畫、不重編碼。
- 後續若需要完全不依賴背景列印設定，應另加「實體 `<img>` 裁切」閱讀／出版鷹架；不能因此刪掉現在的 sprite 管線，兩層應並存，保留施工史。

這個斷面保留的正是接口錯位：同一張照片在螢幕層已經是內容，在某些列印器裡卻仍可能被當成背景。