import { useState, useEffect, useCallback } from 'react'
import { getAllStickers, deleteSticker, deleteManyStickers, blobToUrl } from '../lib/db'
import { downloadBlob, downloadZip, convertToWebP, addStickerBorder, removeBackgroundHD } from '../lib/remover'
import StickerDetailModal from '../components/StickerDetailModal'

export default function LibraryPage({ showToast, onCountChange }) {
  const [stickers, setStickers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [filter, setFilter] = useState('全部')
  const [detail, setDetail] = useState(null)
  const [urls, setUrls] = useState({}) // id -> objectURL

  const load = useCallback(async () => {
    setLoading(true)
    const all = await getAllStickers()
    setStickers(all)
    // 生成 objectURLs
    const newUrls = {}
    for (const s of all) {
      if (s.stickerBlob) newUrls[s.id] = blobToUrl(s.stickerBlob)
    }
    setUrls(newUrls)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    return () => {
      // 释放所有 objectURLs
      Object.values(urls).forEach(u => URL.revokeObjectURL(u))
    }
  }, [])

  const categories = ['全部', ...new Set(stickers.map(s => s.category))]

  const filtered = filter === '全部'
    ? stickers
    : stickers.filter(s => s.category === filter)

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleDelete = async (id) => {
    await deleteSticker(id)
    if (urls[id]) URL.revokeObjectURL(urls[id])
    setUrls(u => { const n = { ...u }; delete n[id]; return n })
    setStickers(s => s.filter(x => x.id !== id))
    onCountChange?.()
    showToast('已删除 🗑️')
  }

  const handleDeleteSelected = async () => {
    const ids = [...selected]
    await deleteManyStickers(ids)
    ids.forEach(id => { if (urls[id]) URL.revokeObjectURL(urls[id]) })
    setUrls(u => {
      const n = { ...u }
      ids.forEach(id => delete n[id])
      return n
    })
    setStickers(s => s.filter(x => !selected.has(x.id)))
    setSelected(new Set())
    setSelectMode(false)
    onCountChange?.()
    showToast(`已删除 ${ids.length} 张 🗑️`)
  }

  const handleDownloadSelected = async () => {
    const items = stickers.filter(s => selected.has(s.id))
    if (items.length === 1) {
      downloadBlob(items[0].stickerBlob, `${items[0].name}.png`)
      showToast('下载成功 ✅')
    } else {
      await downloadZip(items)
      showToast(`打包下载 ${items.length} 张 📦`)
    }
    setSelectMode(false)
    setSelected(new Set())
  }

  // 旋转角度（固定每张贴纸的晃动角度，避免每次刷新变化）
  const getRotation = (id) => {
    let hash = 0
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff
    return ((hash % 7) - 3.5) * 0.9
  }

  const getDelay = (id) => {
    let hash = 0
    for (let i = 0; i < id.length; i++) hash = (hash * 17 + id.charCodeAt(i)) & 0xffffffff
    return (hash % 20) * 0.1
  }

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', animation: 'floatY 1s ease-in-out infinite' }}>🗂️</div>
          <div style={{ fontWeight: 800, color: '#666', marginTop: 8 }}>加载图库...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="page" style={{ paddingTop: 16 }}>
      <div className="container">

        {/* 标题 + 操作栏 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 16px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', color: 'var(--mario-red)', textShadow: '1px 1px 0 rgba(0,0,0,0.15)' }}>
              🗂️ 贴纸图库
            </div>
            <div style={{ fontWeight: 800, color: '#333', fontSize: '0.85rem', marginTop: 2 }}>
              共 {stickers.length} 张贴纸
            </div>
          </div>
          <button
            className={`btn btn-sm ${selectMode ? 'btn-red' : 'btn-blue'}`}
            onClick={() => { setSelectMode(!selectMode); setSelected(new Set()) }}
            id="select-mode-btn"
          >
            {selectMode ? '取消' : '📌 选择'}
          </button>
        </div>

        {/* 分类筛选标签 */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none', WebkitScrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: 20,
                border: `2.5px solid ${filter === cat ? 'var(--mario-red)' : '#ddd'}`,
                background: filter === cat ? 'var(--mario-red)' : 'white',
                color: filter === cat ? 'white' : '#666',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-main)',
                transition: 'all 0.15s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 贴纸网格 */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-emoji">🕳️</div>
            <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#333' }}>
              {stickers.length === 0 ? '图库空空的~' : '没有这个分类'}
            </div>
            <div style={{ color: '#888', fontWeight: 700, fontSize: '0.85rem' }}>
              {stickers.length === 0 ? '去上传照片，生成你的第一张贴纸吧！' : '换个分类看看？'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, paddingBottom: 24 }}>
            {filtered.map((sticker, idx) => {
              const rotation = getRotation(sticker.id)
              const delay = getDelay(sticker.id)
              const isSelected = selected.has(sticker.id)
              return (
                <div
                  key={sticker.id}
                  className={`sticker-card sticker-enter ${isSelected ? 'selected' : ''}`}
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    animationDelay: `${delay}s`,
                    aspectRatio: '1',
                    padding: 8,
                  }}
                  onClick={() => {
                    if (selectMode) toggleSelect(sticker.id)
                    else setDetail(sticker)
                  }}
                >
                  {/* 选中徽章 */}
                  {selectMode && isSelected && (
                    <div className="select-badge">✓</div>
                  )}

                  {/* 贴纸图片 */}
                  <img
                    src={urls[sticker.id]}
                    alt={sticker.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    loading="lazy"
                  />

                  {/* 分类角标 */}
                  <div style={{
                    position: 'absolute',
                    bottom: 4,
                    left: 4,
                    background: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    fontSize: '0.55rem',
                    padding: '2px 5px',
                    borderRadius: 6,
                    fontWeight: 800,
                  }}>
                    {sticker.category?.split(' ')[0]}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 批量操作栏 */}
        {selectMode && selected.size > 0 && (
          <div style={{
            position: 'fixed',
            bottom: 'calc(72px + env(safe-area-inset-bottom))',
            left: 0, right: 0,
            padding: '12px 16px',
            background: 'white',
            borderTop: '3px solid #eee',
            display: 'flex',
            gap: 10,
            justifyContent: 'center',
            zIndex: 90,
          }}>
            <button className="btn btn-blue btn-sm" onClick={handleDownloadSelected} id="batch-download-btn">
              💾 下载 ({selected.size})
            </button>
            <button className="btn btn-red btn-sm" onClick={handleDeleteSelected} id="batch-delete-btn">
              🗑️ 删除 ({selected.size})
            </button>
          </div>
        )}
      </div>

      {/* 贴纸详情弹窗 */}
      {detail && (
        <StickerDetailModal
          sticker={detail}
          stickerUrl={urls[detail.id]}
          onClose={() => setDetail(null)}
          onDelete={() => { handleDelete(detail.id); setDetail(null) }}
          showToast={showToast}
        />
      )}
    </div>
  )
}
