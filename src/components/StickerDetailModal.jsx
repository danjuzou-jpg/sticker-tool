import { useState } from 'react'
import { downloadBlob, convertToWebP } from '../lib/remover'

export default function StickerDetailModal({ sticker, stickerUrl, onClose, onDelete, showToast }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDownloadPNG = () => {
    downloadBlob(sticker.stickerBlob, `${sticker.name}.png`)
    showToast('PNG 下载成功 ✅')
  }

  const handleDownloadWebP = async () => {
    try {
      const webp = await convertToWebP(sticker.stickerBlob, 512)
      downloadBlob(webp, `${sticker.name}_512.webp`)
      showToast('WebP 下载成功（512×512）✅')
    } catch {
      showToast('转换失败，请重试')
    }
  }

  const handleShare = async () => {
    if (!navigator.share) {
      showToast('当前浏览器不支持分享')
      return
    }
    try {
      const file = new File([sticker.stickerBlob], `${sticker.name}.png`, { type: 'image/png' })
      await navigator.share({ files: [file], title: '贴贴 CutCut 贴纸' })
    } catch (e) {
      if (e.name !== 'AbortError') showToast('分享失败')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        {/* 贴纸预览 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 20,
          background: 'repeating-conic-gradient(#f0f0f0 0% 25%, white 0% 50%) 0 0 / 20px 20px',
          borderRadius: 20,
          padding: 20,
          border: '2px solid #eee',
        }}>
          <img
            src={stickerUrl}
            alt={sticker.name}
            style={{ maxHeight: 180, maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' }}
          />
        </div>

        {/* 贴纸信息 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 900, fontSize: '1rem', color: '#333', marginBottom: 4 }}>{sticker.name}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="tag tag-red">{sticker.category}</span>
            <span style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: 700 }}>
              {new Date(sticker.createdAt).toLocaleDateString('zh-CN')}
            </span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <button className="btn btn-blue" onClick={handleDownloadPNG} id="download-png-btn">
            <span>⬇️</span> PNG
          </button>
          <button className="btn btn-yellow" onClick={handleDownloadWebP} id="download-webp-btn">
            <span>💬</span> WebP
          </button>
        </div>

        <button className="btn btn-green" onClick={handleShare} style={{ width: '100%', marginBottom: 12 }} id="share-btn">
          <span>📤</span> 分享贴纸
        </button>

        {/* 删除 */}
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{ width: '100%', padding: '12px', border: '2px solid #ffcccc', borderRadius: 16, background: '#fff5f5', color: 'var(--mario-red)', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'var(--font-main)' }}
            id="delete-sticker-btn"
          >
            🗑️ 删除这张贴纸
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-red" onClick={onDelete} style={{ flex: 1 }}>确认删除</button>
            <button className="btn btn-sm" onClick={() => setShowDeleteConfirm(false)}
              style={{ flex: 1, background: '#f5f5f5', border: '2px solid #ddd', color: '#666' }}>
              取消
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
