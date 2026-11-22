/** 구멍 뚫린 필름 띠 (장식). orientation=horizontal이면 가로 띠 */
export default function FilmStrip({
  orientation = 'vertical',
  className = '',
}: {
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}) {
  return <div className={`film-strip film-strip--${orientation} ${className}`} aria-hidden />;
}
