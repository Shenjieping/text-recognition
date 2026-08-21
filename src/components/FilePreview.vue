<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import {
  ArrowLeft,
  ArrowRight,
  RefreshLeft,
  MagicStick,
  Files,
  Document as DocumentIcon,
} from '@element-plus/icons-vue'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { FileType } from '@/types'
import { renderPageToCanvas } from '@/composables/usePDF'

const props = defineProps<{
  fileType: FileType | null
  previewUrl: string
  pdfDoc: PDFDocumentProxy | null
  pdfPage: number
  pdfTotal: number
  fileName: string
  recognizing: boolean
  progress: number
  statusText: string
}>()

const emit = defineEmits<{
  (e: 'reupload'): void
  (e: 'recognize', mode: 'current' | 'all'): void
  (e: 'update:pdfPage', v: number): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const rendering = ref(false)
const containerWidth = ref(800)

async function renderPdfPage() {
  if (!props.pdfDoc || !canvasRef.value) return
  rendering.value = true
  try {
    await renderPageToCanvas(
      props.pdfDoc,
      props.pdfPage,
      canvasRef.value,
      Math.min(containerWidth.value, 1400),
    )
  } catch (e) {
    console.error('render page failed', e)
  } finally {
    rendering.value = false
  }
}

watch(
  () => [props.pdfDoc, props.pdfPage],
  async () => {
    await nextTick()
    renderPdfPage()
  },
  { immediate: true },
)

useResizeObserver(containerRef, (entries) => {
  const w = entries[0]?.contentRect.width
  if (w && Math.abs(w - containerWidth.value) > 4) {
    containerWidth.value = w
    if (props.fileType === 'pdf') renderPdfPage()
  }
})

function prevPage() {
  if (props.pdfPage > 1) emit('update:pdfPage', props.pdfPage - 1)
}
function nextPage() {
  if (props.pdfPage < props.pdfTotal) emit('update:pdfPage', props.pdfPage + 1)
}
function onPageInput(v: number | undefined) {
  if (!v) return
  const page = Math.max(1, Math.min(props.pdfTotal, v))
  emit('update:pdfPage', page)
}

const statusTextZh: Record<string, string> = {
  'loading tesseract core': '加载识别引擎…',
  'initializing tesseract': '初始化引擎…',
  'loading language traineddata': '下载语言模型…',
  'initializing api': '准备就绪…',
  'recognizing text': '识别文字中…',
}
</script>

<template>
  <div class="preview-panel">
    <div class="panel-toolbar">
      <div class="file-meta">
        <el-icon class="file-icon"><DocumentIcon /></el-icon>
        <span class="file-name" :title="fileName">{{ fileName }}</span>
      </div>
      <div class="toolbar-actions">
        <el-button text :icon="RefreshLeft" @click="emit('reupload')">重新上传</el-button>
      </div>
    </div>

    <div ref="containerRef" class="preview-area">
      <!-- Image -->
      <div v-if="fileType === 'image'" class="image-wrap">
        <img :src="previewUrl" alt="预览图" class="preview-img" />
      </div>

      <!-- PDF -->
      <div v-else-if="fileType === 'pdf'" class="pdf-wrap">
        <div v-loading="rendering" class="canvas-stage">
          <canvas ref="canvasRef" class="pdf-canvas"></canvas>
        </div>
        <div v-if="pdfTotal >= 1" class="pdf-pager">
          <el-button
            circle
            :icon="ArrowLeft"
            :disabled="pdfPage <= 1"
            @click="prevPage"
          />
          <div class="page-input">
            <el-input-number
              :model-value="pdfPage"
              :min="1"
              :max="pdfTotal"
              size="small"
              controls-position="right"
              @update:model-value="onPageInput"
            />
            <span class="page-total">/ {{ pdfTotal }} 页</span>
          </div>
          <el-button
            circle
            :icon="ArrowRight"
            :disabled="pdfPage >= pdfTotal"
            @click="nextPage"
          />
        </div>
      </div>
    </div>

    <!-- Action bar -->
    <div class="action-bar">
      <template v-if="recognizing">
        <div class="recognizing">
          <el-progress :percentage="progress" :stroke-width="8" status="success" />
          <span class="rec-status">
            {{ statusTextZh[statusText] || statusText || '处理中…' }}
          </span>
        </div>
      </template>
      <template v-else>
        <el-button
          type="primary"
          :icon="MagicStick"
          size="large"
          round
          @click="emit('recognize', 'current')"
        >
          {{ fileType === 'pdf' ? '识别当前页' : '识别文字' }}
        </el-button>
        <el-button
          v-if="fileType === 'pdf' && pdfTotal > 1"
          :icon="Files"
          size="large"
          round
          @click="emit('recognize', 'all')"
        >
          识别全部页
        </el-button>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.preview-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.panel-toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}
.file-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.file-icon {
  color: var(--color-primary);
  font-size: 18px;
  flex-shrink: 0;
}
.file-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-area {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    repeating-linear-gradient(45deg, #f8fafc 0 10px, #fff 10px 20px);
}

.image-wrap {
  max-width: 100%;
  display: flex;
  justify-content: center;
}
.preview-img {
  max-width: 100%;
  max-height: 100%;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  object-fit: contain;
}

.pdf-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  width: 100%;
}
.canvas-stage {
  display: flex;
  justify-content: center;
  width: 100%;
}
.pdf-canvas {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  background: #fff;
}

.pdf-pager {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.page-input {
  display: flex;
  align-items: center;
  gap: 8px;
}
.page-total {
  font-size: 13px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.action-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px 16px;
  border-top: 1px solid var(--color-border);
  background: #fbfcfe;
}

.recognizing {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}
.rec-status {
  font-size: 13px;
  color: var(--color-text-secondary);
}
</style>
