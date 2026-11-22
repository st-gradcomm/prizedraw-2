type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

export function getFullscreenElement(): Element | null {
  return document.fullscreenElement ?? (document as FullscreenDocument).webkitFullscreenElement ?? null;
}

export async function enterFullscreen(element: HTMLElement = document.documentElement): Promise<void> {
  const target = element as FullscreenElement;
  if (target.requestFullscreen) return target.requestFullscreen();
  if (target.webkitRequestFullscreen) return target.webkitRequestFullscreen();
  throw new Error('이 브라우저는 전체화면을 지원하지 않습니다.');
}

export async function exitFullscreen(): Promise<void> {
  if (!getFullscreenElement()) return;
  const doc = document as FullscreenDocument;
  if (document.exitFullscreen) return document.exitFullscreen();
  if (doc.webkitExitFullscreen) return doc.webkitExitFullscreen();
}

export async function toggleFullscreen(): Promise<void> {
  return getFullscreenElement() ? exitFullscreen() : enterFullscreen();
}

export function onFullscreenChange(callback: (isFullscreen: boolean) => void): () => void {
  const handler = () => callback(Boolean(getFullscreenElement()));
  document.addEventListener('fullscreenchange', handler);
  document.addEventListener('webkitfullscreenchange', handler);
  return () => {
    document.removeEventListener('fullscreenchange', handler);
    document.removeEventListener('webkitfullscreenchange', handler);
  };
}
