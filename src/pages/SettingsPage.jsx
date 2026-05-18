import { useState, useEffect } from 'react'
import { getAllStickers, getStickerCount } from '../lib/db'
import { downloadZip } from '../lib/remover'

const API_KEY_STORAGE = 'cutcut_removebg_apikey'
const HD_CONSENT_STORAGE = 'cutcut_hd_consent'

export default function SettingsPage({ showToast }) {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [hdConsent, setHdConsent] = useState(false)
  const [stickerCount, setStickerCount] = useState(0)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    setApiKey(localStorage.getItem(API_KEY_STORAGE) || '')
    setHdConsent(localStorage.getItem(HD_CONSENT_STORAGE) === 'true')
    getStickerCount().then(setStickerCount)
  }, [])

  const saveApiKey = () => {
    localStorage.setItem(API_KEY_STORAGE, apiKey.trim())
    showToast('API Key 已保存 ✅')
  }

  const toggleHdConsent = (val) => {
    setHdConsent(val)
    localStorage.setItem(HD_CONSENT_STORAGE, String(val))
  }

  const handleExportAll = async () => {
    setExporting(true)
    try {
      const all = await getAllStickers()
      if (!all.length) { showToast('图库是空的~'); return }
      await downloadZip(all)
      showToast(`📦 已打包 ${all.length} 张贴纸！`)
    } catch {
      showToast('导出失败，请重试')
    } finally {
      setExporting(false)
    }
  }

  const Section = ({ title, children }) => (
    <div className="card" style={{ marginBottom: 16, overflow: 'visible' }}>
      <div style={{ background: 'var(--mario-red)', padding: '10px 20px', margin: '-1px -1px 0', borderRadius: '20px 20px 0 0', borderBottom: '3px solid rgba(0,0,0,0.15)' }}>
        <span style={{ fontWeight: 900, color: 'white', fontSize: '0.85rem' }}>{title}</span>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  )

  return (
    <div className="page" style={{ paddingTop: 16 }}>
      <div className="container">

        <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', color: 'var(--mario-red)', textShadow: '1px 1px 0 rgba(0,0,0,0.15)' }}>
            ⚙️ 设置
          </div>
        </div>

        {/* 图库统计 */}
        <div style={{
          background: 'linear-gradient(135deg, var(--mario-red), var(--mario-orange))',
          borderRadius: 24,
          padding: 20,
          marginBottom: 16,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          border: '3px solid rgba(0,0,0,0.1)',
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{ fontSize: '3rem', animation: 'floatY 2s ease-in-out infinite' }}>🏆</div>
          <div>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.55rem', opacity: 0.85, lineHeight: 2 }}>我的贴纸图库</div>
            <div style={{ fontWeight: 900, fontSize: '2rem', lineHeight: 1 }}>{stickerCount}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.85, fontWeight: 700 }}>张贴纸</div>
          </div>
        </div>

        {/* 数据备份 */}
        <Section title="💾 数据管理">
          <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 700, marginBottom: 12, lineHeight: 1.6 }}>
            贴纸保存在你的浏览器里。导出备份后，即使清除浏览器缓存也不会丢失。
          </div>
          <button
            className="btn btn-blue"
            onClick={handleExportAll}
            disabled={exporting}
            style={{ width: '100%' }}
            id="export-all-btn"
          >
            {exporting ? '⏳ 打包中...' : `📦 导出全部贴纸 ZIP (${stickerCount} 张)`}
          </button>
        </Section>

        {/* 高清精修设置 */}
        <Section title="✨ 高清精修（Remove.bg）">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: '0.9rem', marginBottom: 2 }}>启用高清模式</div>
              <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: 700 }}>图片会上传到 Remove.bg 处理</div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={hdConsent} onChange={e => toggleHdConsent(e.target.checked)} />
              <span className="switch-slider" />
            </label>
          </div>

          {hdConsent && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: 8, color: '#333' }}>
                Remove.bg API Key
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="粘贴你的 API Key..."
                  id="api-key-input"
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: '2.5px solid #ddd',
                    fontFamily: 'var(--font-main)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  style={{ padding: '12px', borderRadius: 14, border: '2px solid #ddd', background: '#f5f5f5', cursor: 'pointer', fontSize: '1.1rem' }}
                >
                  {showKey ? '🙈' : '👁️'}
                </button>
              </div>
              <button className="btn btn-green btn-sm" onClick={saveApiKey} style={{ marginBottom: 12 }} id="save-api-key-btn">
                💾 保存 Key
              </button>
              <div style={{ background: '#f8f9fa', borderRadius: 12, padding: 12, fontSize: '0.78rem', color: '#666', fontWeight: 700, lineHeight: 1.7, border: '2px solid #eee' }}>
                <div>📋 如何获取 Key：</div>
                <div>1. 访问 <strong>remove.bg</strong> 注册免费账号</div>
                <div>2. 进入账号设置 → API Keys</div>
                <div>3. 点击 + New API Key，复制粘贴到这里</div>
                <div>🎁 免费每月 50 次</div>
              </div>
            </div>
          )}
        </Section>

        {/* 关于 */}
        <Section title="ℹ️ 关于贴贴">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: '🏷️ 应用名称', value: '贴贴 CutCut' },
              { label: '🎯 核心功能', value: '自动抠图 → 生成贴纸' },
              { label: '🔒 数据存储', value: '本地浏览器，不上传云端' },
              { label: '🌐 部署地址', value: 'sticker.green2h.com' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#444' }}>{label}</span>
                <span style={{ fontSize: '0.85rem', color: '#888', fontWeight: 700 }}>{value}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* 马里奥装饰 */}
        <div style={{ textAlign: 'center', padding: '16px 0 32px', fontSize: '1.5rem', letterSpacing: 8, animation: 'floatY 2s ease-in-out infinite' }}>
          🍄 ⭐ 🪙 ❤️
        </div>
      </div>
    </div>
  )
}
