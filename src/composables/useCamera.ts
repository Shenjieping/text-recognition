import { ref, shallowRef } from 'vue'

export function useCamera() {
  const stream = shallowRef<MediaStream | null>(null)
  const active = ref(false)
  const error = ref('')

  async function start(videoEl: HTMLVideoElement) {
    error.value = ''
    if (!navigator.mediaDevices?.getUserMedia) {
      error.value = '当前设备不支持相机访问'
      return false
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      stream.value = s
      videoEl.srcObject = s
      await videoEl.play()
      active.value = true
      return true
    } catch (e) {
      error.value = e instanceof Error ? e.message : '无法访问相机，请检查权限'
      return false
    }
  }

  /** Capture current frame and return a File. */
  function captureToFile(videoEl: HTMLVideoElement): Promise<File | null> {
    if (!videoEl.videoWidth) return Promise.resolve(null)
    const canvas = document.createElement('canvas')
    canvas.width = videoEl.videoWidth
    canvas.height = videoEl.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height)
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(null)
          resolve(new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' }))
        },
        'image/jpeg',
        0.95,
      )
    })
  }

  function stop() {
    stream.value?.getTracks().forEach((t) => t.stop())
    stream.value = null
    active.value = false
  }

  return { stream, active, error, start, captureToFile, stop }
}
