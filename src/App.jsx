import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import UploadPage from './pages/UploadPage'
import LibraryPage from './pages/LibraryPage'
import SettingsPage from './pages/SettingsPage'
import LoadingOverlay from './components/LoadingOverlay'
import Toast from './components/Toast'
import { getStickerCount } from './lib/db'

// 全局状态简单管理（不引入 Redux，保持轻量）
export let globalToast = null

function App() {
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('处理中...')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [toast, setToast] = useState(null)
  const [stickerCount, setStickerCount] = useState(0)
  const location = useLocation()

  // 全局 toast 方法
  const showToast = (msg, duration = 2500) => {
    setToast(msg)
    setTimeout(() => setToast(null), duration)
  }

  const showLoading = (text = '抠图中...', progress = 0) => {
    setLoadingText(text)
    setLoadingProgress(progress)
    setLoading(true)
  }

  const updateProgress = (pct, text) => {
    setLoadingProgress(pct)
    if (text) setLoadingText(text)
  }

  const hideLoading = () => {
    setLoading(false)
    setLoadingProgress(0)
  }

  const refreshCount = async () => {
    const count = await getStickerCount()
    setStickerCount(count)
  }

  useEffect(() => {
    refreshCount()
  }, [location])

  // 浮动云朵
  const clouds = ['☁️', '⛅', '🌤️']

  return (
    <div style={{ position: 'relative', minHeight: '100dvh' }}>
      {/* 动态背景 */}
      <div className="page-bg" />

      {/* 浮动云朵装饰 */}
      {[0, 1, 2].map(i => (
        <span key={i} className="cloud" style={{
          top: `${10 + i * 15}%`,
          animationDuration: `${18 + i * 8}s`,
          animationDelay: `${-i * 6}s`,
          fontSize: `${2 + i * 0.5}rem`,
          opacity: 0.7,
        }}>
          {clouds[i]}
        </span>
      ))}

      {/* 顶部导航 */}
      <nav className="navbar">
        <NavLink to="/" className="navbar-logo">
          <span style={{ fontSize: '1.6rem' }}>🏷️</span>
          <div>
            <div className="navbar-logo-text">贴贴</div>
            <div className="navbar-logo-sub">CutCut · AUTO STICKER</div>
          </div>
        </NavLink>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 20,
            padding: '4px 12px',
            fontSize: '0.8rem',
            fontWeight: 800,
            color: 'white',
            fontFamily: 'var(--font-main)',
          }}>
            🎯 {stickerCount} 张
          </span>
        </div>
      </nav>

      {/* 页面内容 */}
      <Routes>
        <Route path="/" element={
          <UploadPage
            showLoading={showLoading}
            updateProgress={updateProgress}
            hideLoading={hideLoading}
            showToast={showToast}
            onStickerSaved={refreshCount}
          />
        } />
        <Route path="/library" element={
          <LibraryPage showToast={showToast} onCountChange={refreshCount} />
        } />
        <Route path="/settings" element={<SettingsPage showToast={showToast} />} />
      </Routes>

      {/* 底部导航 */}
      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">✂️</span>
          <span>抠图</span>
        </NavLink>
        <NavLink to="/library" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">🗂️</span>
          <span>图库</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">⚙️</span>
          <span>设置</span>
        </NavLink>
      </nav>

      {/* Loading 遮罩 */}
      {loading && (
        <LoadingOverlay text={loadingText} progress={loadingProgress} />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} />}
    </div>
  )
}

export default App
