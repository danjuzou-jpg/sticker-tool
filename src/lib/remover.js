// 抠图核心引擎
import { removeBackground } from '@imgly/background-removal'

// 本地 WASM 抠图（模型从 @imgly CDN 自动加载，无需服务器）
export async function removeBackgroundLocal(imageBlob, onProgress) {
  const config = {
    progress: (key, current, total) => {
      if (onProgress) {
        const pct = total > 0 ? Math.round((current / total) * 100) : 0
        onProgress(pct, key)
      }
    },
    // 不设置 publicPath，使用 @imgly 官方 CDN 加载模型（默认行为）
    // 首次加载约 30MB 模型文件，之后浏览器缓存，秒速响应
  }
  const result = await removeBackground(imageBlob, config)
  return result
}

// Remove.bg 高清抠图（用户主动选择）
export async function removeBackgroundHD(imageBlob, apiKey) {
  const formData = new FormData()
  formData.append('image_file', imageBlob)
  formData.append('size', 'auto')

  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey },
    body: formData,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.errors?.[0]?.title || `Remove.bg 错误 ${response.status}`)
  }
  return await response.blob()
}

// 给透明背景图片添加白色描边，生成贴纸效果
export async function addStickerBorder(transparentBlob, options = {}) {
  const {
    borderSize = 12,
    borderColor = '#FFFFFF',
    shadowBlur = 8,
    shadowColor = 'rgba(0,0,0,0.25)',
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(transparentBlob)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const pad = borderSize + 16
      canvas.width = img.width + pad * 2
      canvas.height = img.height + pad * 2
      const ctx = canvas.getContext('2d')

      // 描边技巧：多次偏移绘制原图形成描边
      const offsets = []
      const steps = 16
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * Math.PI * 2
        offsets.push([
          Math.round(Math.cos(angle) * borderSize),
          Math.round(Math.sin(angle) * borderSize),
        ])
      }

      // 绘制阴影
      ctx.shadowBlur = shadowBlur
      ctx.shadowColor = shadowColor
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 4

      // 绘制白色描边层
      ctx.globalCompositeOperation = 'source-over'
      for (const [ox, oy] of offsets) {
        ctx.drawImage(img, pad + ox, pad + oy)
      }

      // 用白色覆盖描边层
      ctx.globalCompositeOperation = 'source-in'
      ctx.fillStyle = borderColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 重置并绘制原图
      ctx.globalCompositeOperation = 'source-over'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0
      ctx.drawImage(img, pad, pad)

      URL.revokeObjectURL(url)
      canvas.toBlob(blob => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas导出失败'))
      }, 'image/png')
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片加载失败'))
    }
    img.src = url
  })
}

// 生成 WebP 格式（适合微信/WhatsApp 贴纸，512x512）
export async function convertToWebP(blob, size = 512) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      // 居中等比缩放
      const scale = Math.min(size / img.width, size / img.height)
      const w = img.width * scale
      const h = img.height * scale
      const x = (size - w) / 2
      const y = (size - h) / 2
      ctx.drawImage(img, x, y, w, h)
      URL.revokeObjectURL(url)
      canvas.toBlob(b => {
        if (b) resolve(b)
        else reject(new Error('WebP转换失败'))
      }, 'image/webp', 0.92)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('加载失败')) }
    img.src = url
  })
}

// 下载 Blob 文件
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// 批量打包 ZIP 下载
export async function downloadZip(stickers) {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  for (const s of stickers) {
    const name = `${s.name || 'sticker'}_${s.id}.png`
    zip.file(name, s.stickerBlob)
  }
  const content = await zip.generateAsync({ type: 'blob' })
  downloadBlob(content, `CutCut_贴纸包_${Date.now()}.zip`)
}
