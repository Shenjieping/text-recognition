<script setup lang="ts">
import { Document } from '@element-plus/icons-vue'
import { LANGUAGE_LABELS, type LanguageOption } from '@/types'

const lang = defineModel<LanguageOption>('lang', { required: true })
const options = (Object.keys(LANGUAGE_LABELS) as LanguageOption[]).map((k) => ({
  value: k,
  label: LANGUAGE_LABELS[k],
}))
</script>

<template>
  <header class="app-header">
    <div class="brand">
      <div class="brand-icon">
        <Document />
      </div>
      <div class="brand-text">
        <h1>智能文字识别</h1>
        <p>纯前端 OCR · 图片 / PDF 文字提取</p>
      </div>
    </div>
    <div class="header-actions">
      <span class="lang-label">识别语言</span>
      <el-select v-model="lang" size="small" class="lang-select">
        <el-option
          v-for="opt in options"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </div>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  background: var(--ocr-brand-gradient);
  color: #fff;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.25);
  z-index: 10;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(6px);
  font-size: 24px;
}

.brand-text h1 {
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.brand-text p {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 2px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.lang-label {
  font-size: 13px;
  opacity: 0.9;
}
.lang-select {
  width: 140px;
}

@media (max-width: 768px) {
  .app-header {
    padding: 12px 16px;
  }
  .brand-text p {
    display: none;
  }
  .brand-text h1 {
    font-size: 17px;
  }
  .lang-label {
    display: none;
  }
  .lang-select {
    width: 116px;
  }
  .brand-icon {
    width: 40px;
    height: 40px;
    font-size: 21px;
  }
}
</style>
