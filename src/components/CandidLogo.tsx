import logo from '../assets/candid-logo.png';

export default function CandidLogo({ height = 40, className = '' }: { height?: number; className?: string }) {
  return <img className={className} src={logo} alt="Cand:ID" style={{ height }} draggable={false} />;
}
