<script setup lang="ts">
import { ref, watch, onBeforeUnmount, nextTick } from 'vue'
import { Close, Camera } from '@element-plus/icons-vue'
import { useCamera } from '@/composables/useCamera'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'captured', file: File): void
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const { start, stop, captureToFile, error } = useCamera()

watch(
  () => props.visible,
  async (v) => {
    if (v) {
      await nextTick()
      if (videoRef.value) await start(videoRef.value)
    } else {
      stop()
    }
  },
)

async function onCapture() {
  if (!videoRef.value) return
  const file = await captureToFile(videoRef.value)
  if (file) {
    emit('captured', file)
    close()
  }
}

function close() {
  stop()
  emit('update:visible', false)
}

onBeforeUnmount(() => stop())
</script>

<template>
  <el-dialog
    :model-value="visible"
    :show-close="false"
    width="92%"
    align-center
    append-to-body
    class="camera-dialog"
    @update:model-value="close"
  >
    <template #header>
      <div class="dialog-title">
        <span>拍照识别</span>
        <el-icon class="close-btn" @click="close"><Close /></el-icon>
      </div>
    </template>
    <div class="camera-body">
      <div v-if="error" class="camera-error">{{ error }}</div>
      <video ref="videoRef" class="camera-video" playsinline muted></video>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" :icon="Camera" @click="onCapture">拍摄</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.dialog-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
  font-weight: 600;
}
.close-btn {
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: 18px;
}
.camera-body {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.camera-video {
  width: 100%;
  max-height: 60vh;
  border-radius: var(--radius-md);
  background: #0f172a;
  object-fit: contain;
}
.camera-error {
  width: 100%;
  padding: 12px 14px;
  margin-bottom: 12px;
  border-radius: 10px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 13px;
  text-align: center;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
