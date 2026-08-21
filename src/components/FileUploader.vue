<script setup lang="ts">
import { ref } from 'vue'
import { UploadFilled, Camera, Picture, DocumentCopy } from '@element-plus/icons-vue'

defineProps<{ isMobile: boolean }>()
const emit = defineEmits<{
  (e: 'select', file: File): void
  (e: 'open-camera'): void
}>()

const dragOver = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

function pick() {
  inputRef.value?.click()
}

function onChange(e: Event) {
  const target = e.target as HTMLInputElement
  const f = target.files?.[0]
  if (f) emit('select', f)
  target.value = ''
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) emit('select', f)
}

function onDragOver() {
  dragOver.value = true
}
function onDragLeave() {
  dragOver.value = false
}
</script>

<template>
  <div class="uploader-wrap">
    <div
      class="dropzone"
      :class="{ active: dragOver }"
      @click="pick"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <input
        ref="inputRef"
        type="file"
        accept="image/*,application/pdf"
        class="hidden-input"
        @change="onChange"
      />
      <div class="dropzone-icon">
        <UploadFilled />
      </div>
      <h3>点击或拖拽文件到此处</h3>
      <p class="hint">支持 JPG / PNG / WEBP 图片 与 PDF 文档</p>
      <div class="format-tags">
        <span class="tag"><el-icon><Picture /></el-icon> 图片</span>
        <span class="tag"><el-icon><DocumentCopy /></el-icon> PDF</span>
      </div>
    </div>

    <button v-if="isMobile" class="camera-btn" @click="emit('open-camera')">
      <el-icon><Camera /></el-icon>
      <span>拍照识别</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.uploader-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dropzone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
  border: 2px dashed #c7d2fe;
  border-radius: var(--radius-card);
  background: var(--ocr-brand-soft);
  cursor: pointer;
  transition: all 0.25s ease;
  flex: 1;
  min-height: 320px;

  &:hover,
  &.active {
    border-color: var(--color-primary);
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.14), rgba(139, 92, 246, 0.14));
    transform: translateY(-2px);
    box-shadow: var(--shadow-hover);
  }
}

.hidden-input {
  display: none;
}

.dropzone-icon {
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: var(--ocr-brand-gradient);
  color: #fff;
  font-size: 36px;
  margin-bottom: 18px;
  box-shadow: 0 10px 24px rgba(99, 102, 241, 0.35);
}

h3 {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text);
}
.hint {
  margin-top: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.format-tags {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}
.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  font-size: 12px;
  color: var(--color-primary-dark);
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 999px;
}

.camera-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--ocr-brand-gradient);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:active {
    transform: scale(0.98);
  }
}
</style>
