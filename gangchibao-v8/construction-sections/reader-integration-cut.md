# Reader 共用層接線斷面

狀態：未接線，保留為施工斷面。

目前 `reader.html` 仍把閱讀層 CSS 與公式 renderer 直接內嵌在單檔中；repo 同時已存在：

- `reading-layers.css`
- `retro-renderer.css`
- `retro-renderer.js`

這三份共用資產目前尚未由 `reader.html` 正式載入。也就是說，共用層已經蓋好一段鷹架，但主 reader 還在走舊的內嵌管線。

本斷面只記錄接線狀態，不把 reader 重寫乾淨，也不刪除原本內嵌 CSS／公式 renderer。後續可靠施工應採最小接線：先讀最新 `reader.html`，再只加入共用 stylesheet／script 掛載；舊內嵌層暫時保留，確認新層不破壞既有 22 單元與 `sutraEntrances` 後，再決定哪些重複規格是否要留下作施工痕跡。

注意：不要用整份舊 `reader.html` 覆蓋最新檔；這個檔案含大量單元經文入口與既有 renderer，任何接線都必須以當下 SHA 為準。
