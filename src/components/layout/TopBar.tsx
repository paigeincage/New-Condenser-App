import { useNavigate } from 'react-router-dom';

interface TopBarProps {
  title: string;
  back?: boolean;
  right?: React.ReactNode;
}

export function TopBar({ title, back, right }: TopBarProps) {
  const nav = useNavigate();

  return (
    <header className="flex items-center justify-between py-4 mb-5">
      <div className="flex items-center gap-3">
        {back && (
          <button onClick={() => nav(-1)} className="text-g400 hover:text-mar -ml-1 p-1 transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 4L7 10L13 16" />
            </svg>
          </button>
        )}
        <h1 className="text-xl font-bold font-display tracking-tight text-cblack uppercase">{title}</h1>
      </div>
      {right && <div>{right}</div>}
    </header>
  );
}
