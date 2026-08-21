<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CopyDocument, Download, Delete, Document, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { RecognitionData } from '@/types'

const props = defineProps<{
  recognizing: boolean
  progress: number
  statusText: string
  result: RecognitionData | null
}>()

const emit = defineEmits<{ (e: 'clear'): void }>()

const editableText = ref('')

const statusTextZh: Record<string, string> = {
  'loading tesseract core': '加载识别引擎…',
  'initializing tesseract': '初始化引擎…',
  'loading language traineddata': '下载语言模型…',
  'initializing api': '准备就绪…',
  'recognizing text': '识别文字中…',
}

function buildText(r: RecognitionData): string {
  if (r.pages.length === 0) return ''
  if (r.pages.length === 1) return r.pages[0].text
  return r.pages
    .map((p) => `———— 第 ${p.page} 页 / 共 ${r.totalPages} 页 ————\n${p.text}`)
    .join('\n\n')
}

watch(
  () => props.result,
  (r) => {
    editableText.value = r ? buildText(r) : ''
  },
)

const charCount = computed(() => editableText.value.replace(/\s/g, '').length)

async function copy() {
  if (!editableText.value) {
    ElMessage.warning('暂无可复制内容')
    return
  }
  try {
    await navigator.clipboard.writeText(editableText.value)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动选择文本复制')
  }
}

function download() {
  if (!editableText.value) {
    ElMessage.warning('暂无可下载内容')
    return
  }
  const blob = new Blob([editableText.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `识别结果-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('已下载')
}

function clear() {
  editableText.value = ''
  emit('clear')
}
</script>

<template>
  <div class="result-panel">
    <div class="result-header">
      <div class="result-title">
        <el-icon><Document /></el-icon>
        <span>识别结果</span>
      </div>
      <div v-if="editableText && !recognizing" class="result-actions">
        <span class="count">{{ charCount }} 字</span>
        <el-button text size="small" :icon="CopyDocument" @click="copy">复制</el-button>
        <el-button text size="small" :icon="Download" @click="download">下载</el-button>
        <el-button text size="small" :icon="Delete" @click="clear">清空</el-button>
      </div>
    </div>

    <div class="result-body">
      <!-- Recognizing -->
      <div v-if="recognizing" class="state recognizing">
        <div class="state-icon spin">
          <el-icon><Loading /></el-icon>
        </div>
        <div class="state-text">
          <div class="state-title">{{ statusTextZh[statusText] || statusText || '处理中…' }}</div>
          <el-progress :percentage="progress" :stroke-width="6" status="success" />
        </div>
      </div>

      <!-- Result text -->
      <textarea
        v-else-if="editableText"
        v-model="editableText"
        class="result-textarea"
        spellcheck="false"
        placeholder="识别结果…"
      ></textarea>

      <!-- Empty -->
      <div v-else class="state empty">
        <div class="empty-illustration">
          <div class="ill-line"></div>
          <div class="ill-line short"></div>
          <div class="ill-line"></div>
          <div class="ill-line short"></div>
        </div>
        <div class="empty-title">等待识别</div>
        <p class="empty-desc">上传图片或 PDF 后，点击「识别」按钮即可在此查看提取的文字</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.result-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.result-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}
.result-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}
.result-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
.count {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-right: 8px;
  padding: 2px 8px;
  background: var(--ocr-brand-soft);
  border-radius: 999px;
}

.result-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.result-textarea {
  flex: 1;
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  resize: none;
  padding: 18px 20px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.8;
  color: var(--color-text);
  background: transparent;
}
.result-textarea::placeholder {
  color: #cbd5e1;
}

.state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
}

.recognizing {
  gap: 20px;
  .state-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 30px;
    color: var(--color-primary);
    background: var(--ocr-brand-soft);
  }
  .spin {
    animation: spin 1s linear infinite;
  }
  .state-text {
    width: 100%;
    max-width: 320px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .state-title {
    font-size: 14px;
    color: var(--color-text-secondary);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty {
  gap: 14px;
}
.empty-illustration {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 120px;
  margin-bottom: 6px;
}
.ill-line {
  height: 10px;
  border-radius: 6px;
  background: linear-gradient(90deg, #e2e8f0, #f1f5f9);
}
.ill-line.short {
  width: 60%;
}
.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}
.empty-desc {
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  max-width: 280px;
}

@media (max-width: 768px) {
  .result-header {
    padding: 10px 14px;
  }
  .count {
    display: none;
  }
}
</style>
