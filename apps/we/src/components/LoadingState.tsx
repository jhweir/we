import '@we/elements/Spinner';

export default function LoadingState() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'fixed',
        backgroundColor: 'var(--we-color-ui-100)',
        zIndex: 999,
        transition: 'opacity 0.2s',
      }}
    >
      <we-spinner />
    </div>
  );
}
