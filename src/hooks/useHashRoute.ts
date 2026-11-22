import { useEffect, useState } from 'react';

/**
 * GitHub Pages는 서브경로 새로고침 시 404가 나므로 해시 라우팅 사용.
 *  - #/          → 추첨 진행 화면
 *  - #/winners   → 당첨자 공개 페이지
 */
export type Route = 'stage' | 'winners';

function readRoute(): Route {
  return window.location.hash.replace(/^#\/?/, '').startsWith('winners') ? 'winners' : 'stage';
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const handler = () => setRoute(readRoute());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return route;
}
