import './MobileTabSwitcher.css'

export default function MobileTabSwitcher({ activeTab, onSwitch }) {
  return (
    <div className="tab-switcher">
      <button
        className={`tab-btn ${activeTab === 'code' ? 'tab-btn--active' : ''}`}
        onClick={() => onSwitch('code')}
      >
        Code
      </button>
      <button
        className={`tab-btn ${activeTab === 'preview' ? 'tab-btn--active' : ''}`}
        onClick={() => onSwitch('preview')}
      >
        Preview
      </button>
    </div>
  )
}
