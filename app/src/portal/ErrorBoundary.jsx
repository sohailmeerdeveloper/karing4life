import { Component } from 'react';

/** If a page crashes, show a friendly card instead of a blank screen. */
export default class ErrorBoundary extends Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error('Portal page crashed:', err, info?.componentStack); }
  componentDidUpdate(prev) { if (prev.resetKey !== this.props.resetKey && this.state.err) this.setState({ err: null }); }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="card" data-crash="1" style={{ maxWidth: 520, margin: '40px auto', textAlign: 'center' }}>
        <h2>Something went wrong on this page</h2>
        <p className="muted" style={{ margin: '8px 0 16px' }}>Please refresh. If it keeps happening, email info@karing4life.com.</p>
        <button className="pb pb-primary" onClick={() => window.location.reload()}>Refresh page</button>
      </div>
    );
  }
}
