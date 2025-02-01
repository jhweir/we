export interface ScrollHandlerOptions {
  onScroll?: (e: Event) => void;
  onScrollStop?: (e: Event) => void;
  removeListenerAfterStop?: boolean;
}

export function scrollHandler(
  scrollContainer: HTMLElement,
  { onScroll = () => {}, onScrollStop = () => {}, removeListenerAfterStop = false }: ScrollHandlerOptions,
): void {
  let _timer: number | null = null;

  function handleScroll(e: Event) {
    onScroll(e);
    if (_timer !== null) {
      clearTimeout(_timer);
    }
    _timer = window.setTimeout(() => {
      onScrollStop(e);
      if (removeListenerAfterStop) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    }, 150);
  }

  scrollContainer.addEventListener('scroll', handleScroll);
}

export function scrollTo(scrollContainer: HTMLElement, index: number, callback: (e: Event) => void): void {
  scrollHandler(scrollContainer, {
    onScrollStop: callback,
    removeListenerAfterStop: true,
  });

  scrollContainer.scrollTo({
    left: scrollContainer.clientWidth * index,
    behavior: 'smooth',
  });
}
