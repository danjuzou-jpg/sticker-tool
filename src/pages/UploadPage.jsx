import { useState, useRef, useCallback, useEffect } from 'react'
import { removeBackgroundLocal, addStickerBorder } from '../lib/remover'
import { saveSticker } from '../lib/db'
import PrivacyModal from '../components/PrivacyModal'

const CATEGORIES = ['🐶 宠物', '🍜 美食', '👤 人物', '🌸 花草', '🏠 物品', '🎨 其他']

export default function UploadPage({ showLoading, updateProgress, hideLoading, showToast, onStickerSaved }) {
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [dragging, setDragging] = useState(false)
  const [category, setCategory] = useState('🎨 其他')
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [pendingHD, setPendingHD] = useState(null)
  const inputRef = useRef()

  const addFiles = useCallback((newFiles) => {
    const imageFiles = Array.from(newFiles).filter(f => f.type.startsWith('image/'))
    if (!imageFiles.length) return
    setFiles(prev => [...prev, ...imageFiles])
    imageFiles.forEach(f => {
      const url = URL.createObjectURL(f)
      setPreviews(prev => [...prev, { url, name: f.name }])
    })
  }, [])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const handlePaste = useCallback((e) => {
    const items = Array.from(e.clipboardData?.items || [])
    const imageItems = items.filter(i => i.type.startsWith('image/'))
    const blobs = imageItems.map(i => i.getAsFile()).filter(Boolean)
    addFiles(blobs)
  }, [addFiles])

  // 粘贴监听
  useEffect(() => {
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [handlePaste])

  const removeFile = (idx) => {
    URL.revokeObjectURL(previews[idx].url)
    setFiles(f => f.filter((_, i) => i !== idx))
    setPreviews(p => p.filter((_, i) => i !== idx))
  }

  const processAll = async () => {
    if (!files.length) {
      showToast('请先添加图片 📸')
      return
    }

    showLoading('准备中...', 0)
    let successCount = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const baseProgress = Math.round((i / files.length) * 100)

      try {
        showLoading(`处理第 ${i + 1}/${files.length} 张...`, baseProgress)

        // 本地 WASM 抠图
        const transparentBlob = await removeBackgroundLocal(file, (pct, key) => {
          const sub = Math.round(baseProgress + (pct / files.length))
          updateProgress(Math.min(sub, 95), `正在抠图... ${pct}%`)
        })

        // 添加贴纸描边
        updateProgress(Math.min(baseProgress + 5, 98), '添加贴纸效果...')
        const stickerBlob = await addStickerBorder(transparentBlob, { borderSize: 14 })

        // 存入图库
        const id = `sticker_${Date.now()}_${Math.random().toString(36).slice(2)}`
        await saveSticker({
          id,
          originalBlob: file,
          stickerBlob,
          name: file.name.replace(/\.[^/.]+$/, ''),
          category,
        })
        successCount++
      } catch (err) {
        console.error('处理失败', err)
        showToast(`第 ${i + 1} 张处理失败，已跳过`)
      }
    }

    hideLoading()
    onStickerSaved?.()

    if (successCount > 0) {
      showToast(`🎉 成功生成 ${successCount} 张贴纸！`)
      setFiles([])
      setPreviews(p => {
        p.forEach(p => URL.revokeObjectURL(p.url))
        return []
      })
    }
  }

  return (
    <div className="page" style={{ paddingTop: 16 }}>
      <div className="container">

        {/* 标题区 */}
        <div style={{ textAlign: 'center', padding: '20px 0 16px', position: 'relative' }}>
          <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-pixel)', color: 'var(--mario-red)', textShadow: '2px 2px 0 rgba(0,0,0,0.15)', lineHeight: 2 }}>
            ✂️ 自动抠图工具
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#333', marginTop: 4 }}>
            上传照片，一键变贴纸！
          </div>

          {/* 装饰问号块 */}
          <div style={{ position: 'absolute', right: 0, top: 16 }}>
            <div className="question-block" style={{ width: 40, height: 40, fontSize: '0.8rem' }}>?</div>
          </div>
        </div>

        {/* 上传区 */}
        <div
          className={`upload-zone ${dragging ? 'dragging' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{ marginBottom: 16 }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={e => addFiles(e.target.files)}
            id="file-input"
          />

          <div style={{ fontSize: '3.5rem', marginBottom: 12, animation: 'floatY 2s ease-in-out infinite' }}>
            {dragging ? '⚡' : '📸'}
          </div>
          <div style={{ fontWeight: 900, fontSize: '1rem', color: '#333', marginBottom: 6 }}>
            {dragging ? '松手即可添加！' : '点击或拖拽图片到这里'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#888', fontWeight: 700 }}>
            支持 JPG、PNG、WEBP · 可多选
          </div>
          <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: 4 }}>
            💡 也可以直接 Ctrl+V 粘贴图片
          </div>
        </div>

        {/* 预览区 */}
        {previews.length > 0 && (
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 900, fontSize: '0.9rem', marginBottom: 12, color: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📋 已选 {files.length} 张</span>
              <button
                onClick={() => {
                  previews.forEach(p => URL.revokeObjectURL(p.url))
                  setFiles([]); setPreviews([])
                }}
                style={{ background: 'none', border: 'none', color: 'var(--mario-red)', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                清除全部
              </button>
            </div>
            <div className="preview-grid">
              {previews.map((p, i) => (
                <div key={i} className="preview-item">
                  <img src={p.url} alt={p.name} />
                  <div className="preview-remove" onClick={() => removeFile(i)}>✕</div>
                </div>
              ))}
              {/* 添加更多按钮 */}
              <div
                className="preview-item"
                style={{ background: 'rgba(91,200,245,0.15)', border: '3px dashed var(--mario-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '2rem' }}
                onClick={() => inputRef.current?.click()}
              >
                ➕
              </div>
            </div>
          </div>
        )}

        {/* 分类选择 */}
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 900, fontSize: '0.9rem', marginBottom: 12, color: '#333' }}>
            🏷️ 贴纸分类
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 20,
                  border: `2.5px solid ${category === cat ? 'var(--mario-red)' : '#ddd'}`,
                  background: category === cat ? '#FFF0F0' : 'white',
                  color: category === cat ? 'var(--mario-red)' : '#666',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: 'var(--font-main)',
                  transform: category === cat ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 高清说明 */}
        <div className="privacy-banner" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.4rem' }}>🤖</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: '0.9rem', marginBottom: 2 }}>本地 AI 自动抠图</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                图片在你的设备上处理，不会上传到任何服务器 🔒
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>效果不满意？可在结果页选择高清精修</span>
            <span style={{ fontSize: '1rem' }}>☁️</span>
          </div>
        </div>

        {/* 开始按钮 */}
        <button
          className="btn btn-red btn-lg"
          onClick={processAll}
          style={{ width: '100%', fontSize: '1.1rem', marginBottom: 12 }}
          id="start-cutout-btn"
        >
          <span>✂️</span>
          <span>开始抠图！</span>
          {files.length > 0 && <span style={{ fontSize: '0.8em', opacity: 0.9 }}>({files.length}张)</span>}
        </button>

        {/* 提示文字 */}
        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'rgba(0,0,0,0.45)', fontWeight: 700, marginBottom: 8 }}>
          首次使用需要加载 AI 模型（约 30MB），请稍等 ⏳
        </p>

        {/* 地面装饰 */}
        <div style={{ margin: '24px -16px 0', height: 12, background: 'repeating-linear-gradient(90deg, var(--mario-green) 0px, var(--mario-green) 24px, var(--mario-green-dark) 24px, var(--mario-green-dark) 48px)', borderTop: '3px solid rgba(0,0,0,0.15)' }} />
      </div>

      {/* 隐私弹窗 */}
      {showPrivacy && (
        <PrivacyModal
          onAccept={() => { setShowPrivacy(false); /* TODO: 高清精修 */ }}
          onCancel={() => setShowPrivacy(false)}
        />
      )}
    </div>
  )
}
