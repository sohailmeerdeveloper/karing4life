/** The same logo + loading bar as the boot screen in index.html (its `.boot` styles live there),
    shown while a page's code is still downloading, so slow connections never see a blank page.
    `inline` = inside the site layout (header and footer already showing). */
export default function Boot({ inline }) {
  return (
    <div className={'boot' + (inline ? ' boot-inline' : '')} role="status" aria-label="Loading">
      <img src="/logo-olive.webp" width="88" height="88" alt="" />
      <span />
    </div>
  );
}
