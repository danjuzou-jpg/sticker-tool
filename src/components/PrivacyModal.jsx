export default function PrivacyModal({ onAccept, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>☁️</div>
          <div style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: 8 }}>高清精修说明</div>
          <div style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.7 }}>
            高清模式使用 <strong>Remove.bg</strong> 云端 AI 处理，效果更好，尤其适合发丝、复杂边缘。
          </div>
        </div>

        <div style={{ background: '#f8f9fa', borderRadius: 16, padding: 16, marginBottom: 20, border: '2px solid #eee' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
            <span>✅</span>
            <span style={{ fontSize: '0.85rem', color: '#333', fontWeight: 700 }}>处理完成后 Remove.bg 不保留图片</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
            <span>✅</span>
            <span style={{ fontSize: '0.85rem', color: '#333', fontWeight: 700 }}>图片传输全程加密（HTTPS）</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span>⚡</span>
            <span style={{ fontSize: '0.85rem', color: '#333', fontWeight: 700 }}>消耗 1 次免费额度（每月50次）</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-green" onClick={onAccept} style={{ flex: 2 }} id="privacy-accept-btn">
            同意并高清精修
          </button>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: '14px', border: '2px solid #ddd', borderRadius: 16, background: '#f5f5f5', color: '#666', fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-main)', fontSize: '0.9rem' }}
            id="privacy-cancel-btn"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}
