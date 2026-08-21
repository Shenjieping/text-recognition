<script setup lang="ts">
import { ref, shallowRef, onBeforeUnmount } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { ElMessage } from 'element-plus'
import AppHeader from '@/components/AppHeader.vue'
import FileUploader from '@/components/FileUploader.vue'
import FilePreview from '@/components/FilePreview.vue'
import RecognitionResult from '@/components/RecognitionResult.vue'
import CameraDialog from '@/components/CameraDialog.vue'
import { recognizeText } from '@/composables/useOCR'
import { loadPdf, extractPageText, renderPageToBlob, type PDFDocumentProxy } from '@/composables/usePDF'
import type { FileType, LanguageOption, PageResult, RecognitionData } from '@/types'

const isMobile = useMediaQuery('(max-width: 768px)')

const ocrLang = ref<LanguageOption>('chi_sim+eng')
const cameraVisible = ref(false)

const file = ref<File | null>(null)
const fileType = ref<FileType | null>(null)
const fileName = ref('')
const previewUrl = ref('')
const pdfDoc = shallowRef<PDFDocumentProxy | null>(null)
const pdfPage = ref(1)
const pdfTotal = ref(0)

const recognizing = ref(false)
const progress = ref(0)
const statusText = ref('')
const result = ref<RecognitionData | null>(null)

function revokePreview() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
}

function resetFileState() {
  revokePreview()
  pdfDoc.value = null
  file.value = null
  fileType.value = null
  fileName.value = ''
  pdfPage.value = 1
  pdfTotal.value = 0
}

async function handleSelect(f: File) {
  resetFileState()
  const isImage = f.type.startsWith('image/')
  const isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name)

  if (!isImage && !isPdf) {
    ElMessage.error('仅支持图片或 PDF 文件')
    return
  }

  file.value = f
  fileName.value = f.name

  try {
    if (isImage) {
      fileType.value = 'image'
      previewUrl.value = URL.createObjectURL(f)
    } else {
      const pdf = await loadPdf(f)
      pdfDoc.value = pdf
      pdfTotal.value = pdf.numPages
      pdfPage.value = 1
      // 设置 fileType 必须在 pdfTotal 之后，避免分页控件用 1 > 0 初始化
      fileType.value = 'pdf'
      ElMessage.success(`PDF 已加载，共 ${pdf.numPages} 页`)
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('文件加载失败：' + (e instanceof Error ? e.message : '未知错误'))
    resetFileState()
  }
}

function onCaptured(f: File) {
  handleSelect(f)
}

async function recognizePdfPage(pageNum: number, accum?: PageResult[]) {
  const pdf = pdfDoc.value!
  let text = await extractPageText(pdf, pageNum)
  let source: 'text' | 'ocr' = 'text'

  if (text.length < 20) {
    statusText.value = 'recognizing text'
    const blob = await renderPageToBlob(pdf, pageNum, 2)
    if (!blob) throw new Error('PDF 页面渲染失败')
    text = await recognizeText(blob, ocrLang.value, (p) => {
      statusText.value = p.status
      if (accum) {
        progress.value = Math.round(((pageNum - 1 + p.progress) / pdfTotal.value) * 100)
      } else {
        progress.value = Math.round(p.progress * 100)
      }
    })
    source = 'ocr'
  } else {
    progress.value = accum ? Math.round((pageNum / pdfTotal.value) * 100) : 100
  }

  const pr: PageResult = { page: pageNum, text, source }
  if (accum) {
    accum.push(pr)
  } else {
    result.value = { type: 'pdf', pages: [pr], totalPages: pdfTotal.value }
  }
}

async function recognize(mode: 'current' | 'all') {
  if (!fileType.value) return
  try {
    recognizing.value = true
    progress.value = 0
    result.value = null

    if (fileType.value === 'image') {
      statusText.value = 'recognizing text'
      const text = await recognizeText(file.value!, ocrLang.value, (p) => {
        statusText.value = p.status
        progress.value = Math.round(p.progress * 100)
      })
      result.value = { type: 'image', pages: [{ page: 1, text, source: 'ocr' }], totalPages: 1 }
    } else if (fileType.value === 'pdf') {
      if (mode === 'current') {
        await recognizePdfPage(pdfPage.value)
      } else {
        const pages: PageResult[] = []
        for (let i = 1; i <= pdfTotal.value; i++) {
          await recognizePdfPage(i, pages)
          result.value = { type: 'pdf', pages: [...pages], totalPages: pdfTotal.value }
        }
      }
    }
    progress.value = 100
  } catch (e) {
    console.error(e)
    ElMessage.error('识别失败：' + (e instanceof Error ? e.message : '未知错误'))
  } finally {
    recognizing.value = false
    statusText.value = ''
  }
}

function onRecognize(mode: 'current' | 'all') {
  recognize(mode)
}

function clearResult() {
  result.value = null
}

onBeforeUnmount(() => revokePreview())
</script>

<template>
  <AppHeader v-model:lang="ocrLang" />

  <main class="layout" :class="{ mobile: isMobile }">
    <!-- Left: upload / preview -->
    <section class="panel left-panel">
      <FileUploader
        v-if="!fileType"
        :is-mobile="isMobile"
        @select="handleSelect"
        @open-camera="cameraVisible = true"
      />
      <FilePreview
        v-else
        :file-type="fileType"
        :preview-url="previewUrl"
        :pdf-doc="pdfDoc"
        v-model:pdf-page="pdfPage"
        :pdf-total="pdfTotal"
        :file-name="fileName"
        :recognizing="recognizing"
        :progress="progress"
        :status-text="statusText"
        @reupload="resetFileState"
        @recognize="onRecognize"
      />
    </section>

    <!-- Right: recognition result -->
    <section class="panel right-panel">
      <RecognitionResult
        :recognizing="recognizing"
        :progress="progress"
        :status-text="statusText"
        :result="result"
        @clear="clearResult"
      />
    </section>
  </main>

  <CameraDialog v-model:visible="cameraVisible" @captured="onCaptured" />
</template>

<style scoped lang="scss">
.layout {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 18px;
  padding: 18px;
  overflow: hidden;
}

.panel {
  background: var(--color-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.left-panel {
  flex: 1.1;
  min-width: 0;
}
.right-panel {
  flex: 1;
  min-width: 0;
}

/* Desktop: fill height, internal scroll handled by children */
@media (min-width: 769px) {
  .layout {
    height: 0;
  }
  .panel {
    height: 100%;
  }
}

/* Mobile: stacked, page scrolls */
@media (max-width: 768px) {
  .layout.mobile {
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    height: 0;
  }
  .panel {
    min-height: 52vh;
    height: auto;
  }
  .left-panel {
    flex: none;
  }
  .right-panel {
    flex: none;
  }
}
</style>
