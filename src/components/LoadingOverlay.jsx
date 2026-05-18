// 马里奥顶金币 Loading 效果
export default function LoadingOverlay({ text, progress }) {
  return (
    <div className="loading-overlay">
      <div className="mario-loader">
        {/* 金币弹出效果 */}
        <div style={{ position: 'relative', height: 48, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <span className="coin-pop" style={{ fontSize: '1.8rem' }}>🪙</span>
        </div>

        {/* 问号砖块 */}
        <div className="coin-block">
          <span>?</span>
        </div>

        {/* 马里奥人物 */}
        <div className="mario-pixel">🍄</div>
      </div>

      {/* 进度条 */}
      <div className="progress-bar-wrap">
        <div
          className="progress-bar-fill"
          style={{ width: `${Math.max(5, progress)}%` }}
        />
      </div>

      {/* 文字 */}
      <div className="loading-text">
        {text}
        <br />
        {progress > 0 && `${progress}%`}
      </div>
    </div>
  )
}
