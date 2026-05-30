import { Link } from 'react-router-dom'
import './NotFound.css'

export default function NotFound() {
  return (
    <div className="notfound">
      <div className="notfound__inner">
        <div className="notfound__bg-num">404</div>
        <div className="notfound__content">
          <h1 className="notfound__title">Page not found</h1>
          <p className="notfound__sub">This page doesn't compile.</p>
          <pre className="notfound__code">
            <code>\error&#123;Page not found: undefined reference&#125;</code>
          </pre>
          <Link to="/editor" className="notfound__btn">← Back to Editor</Link>
        </div>
      </div>
    </div>
  )
}
