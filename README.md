# 智能文字识别 · OCR

一个纯前端的图片/PDF文字识别应用，基于 Tesseract.js + PDF.js，无需后端服务，所有识别在浏览器本地完成。

## 功能特性

- **图片 OCR 识别**：上传 JPG / PNG / WEBP 图片，提取文字内容
- **PDF 文字提取**：上传 PDF 文档，支持翻页预览，逐页或全文识别
- **智能识别策略**：PDF 优先提取内嵌文字（快速精确），若为扫描件自动回退至 OCR
- **移动端拍照**：移动端支持调用后置摄像头拍照识别
- **响应式布局**：桌面端左右双栏，移动端自动切换为上下堆叠
- **多语言支持**：中文+英文 / 纯中文 / 纯英文，可随时切换
- **结果操作**：识别结果可编辑、一键复制、下载为 TXT 文件
- **实时进度**：显示识别引擎加载、语言模型下载、识别进度

## 技术栈

| 技术 | 说明 |
| --- | --- |
| Vue 3 | 渐进式前端框架（Composition API） |
| Vite | 下一代前端构建工具 |
| TypeScript | 类型安全 |
| Element Plus | UI 组件库 |
| Sass | CSS 预处理器 |
| Tesseract.js | 纯前端 OCR 识别引擎 |
| PDF.js | PDF 解析与渲染 |
| VueUse | 组合式工具函数库 |

## 项目结构

```
text-recognition/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Pages 自动部署工作流
├── src/
│   ├── components/
│   │   ├── AppHeader.vue          # 顶部导航栏（语言选择）
│   │   ├── CameraDialog.vue        # 移动端拍照弹窗
│   │   ├── FilePreview.vue        # 文件预览（图片 + PDF 翻页）
│   │   ├── FileUploader.vue        # 上传/拖拽区域 + 拍照入口
│   │   └── RecognitionResult.vue   # 识别结果展示与操作
│   ├── composables/
│   │   ├── useCamera.ts            # 相机流封装（getUserMedia）
│   │   ├── useOCR.ts               # Tesseract.js 封装（worker 缓存 + 进度）
│   │   └── usePDF.ts               # PDF.js 封装（加载/渲染/文本提取）
│   ├── styles/
│   │   └── index.scss              # 全局样式与 CSS 变量
│   ├── types/
│   │   └── index.ts                # TypeScript 类型定义
│   ├── App.vue                     # 根组件（响应式布局 + 识别编排）
│   └── main.ts                     # 应用入口
├── env.d.ts                        # Vite 环境类型声明
├── index.html                     # HTML 模板
├── vite.config.ts                  # Vite 配置（含 base 路径）
├── tsconfig.json                   # TypeScript 配置
└── package.json                    # 项目依赖与脚本
```

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装与启动

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev
```

### 构建与预览

```bash
# 构建生产版本到 dist/
npm run build

# 本地预览构建产物
npm run preview
```

## 部署

项目已配置 GitHub Pages 自动部署。

1. 推送代码到 `main` 分支
2. GitHub Actions 自动执行构建并部署
3. 访问地址：`https://<用户名>.github.io/text-recognition/`

> 首次使用需在仓库 Settings → Pages 中将 Source 设置为 **GitHub Actions**。

## 识别原理

### 图片识别

图片通过 Tesseract.js 进行 OCR 识别，支持中英文混合识别。首次使用会从 CDN 下载语言模型（中+英约 20MB），之后浏览器缓存。

### PDF 识别

采用两层策略：

1. **文本提取优先**：使用 PDF.js 的 `getTextContent()` 提取 PDF 内嵌的文字层（速度快、精度高）
2. **OCR 回退**：当某页文字量不足（< 20 字符，通常为扫描件）时，将该页渲染为高清图片后用 Tesseract.js 进行 OCR 识别

支持「识别当前页」和「识别全部页」两种模式。
