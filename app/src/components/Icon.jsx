export function Icon({ name, className = '', style }) {
  return (
    <svg className={'i' + (className ? ' ' + className : '')} aria-hidden="true" style={style}>
      <use href={'#i-' + name} />
    </svg>
  );
}
