# ProductMorph AI 📸

ProductMorph AI 是一款專為電商與廣告行銷設計的 AI 工具，利用 Google Gemini API 自動為您的產品照片進行「去背」並「合成」至專業的商業場景中。

## ✨ 特色功能
- **自動去背**：精準辨識產品主體並移除背景。
- **多樣化場景**：內建質感工作室、大理石奢華、大自然、都市潮流、清新夏日等多種預設風格。
- **自定義描述**：支援透過文字描述生成專屬的品牌氛圍。
- **專業修飾詞**：一鍵加入「電影級光影」、「背景虛化」等細節強化指令。

## 🚀 快速開始

### 1. 環境需求
- [Node.js](https://nodejs.org/) (建議 v18 以上)
- [NPM](https://www.npmjs.com/) 或 [Yarn](https://yarnpkg.com/)

### 2. 安裝步驟
```bash
# 複製專案
git clone <your-repo-url>
cd Product-Image

# 安裝套件
npm install
```

### 3. 設定環境變數
在專案根目錄建立 `.env` 檔案，並填入您的 Gemini API Key：
```env
GEMINI_API_KEY=你的_GEMINI_API_KEY
```

### 4. 啟動開發伺服器
```bash
npm run dev
```
啟動後請訪問 `http://localhost:3000`。

## 📦 部署

專案已設定好 GitHub Actions，當您推送至 `main` 分支時，會自動部署至 GitHub Pages。

您也可以手動部署：
```bash
npm run deploy
```

## 🛠️ 技術棧
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Animation**: Motion
- **AI Engine**: Google Gemini API (@google/genai)
- **Icons**: Lucide React
