import { Shield } from 'lucide-react';

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

const Logo = ({ variant = 'dark', size = 'md' }: LogoProps) => {
  const sizes = {
    sm: { icon: 20, text: 'text-lg' },
    md: { icon: 28, text: 'text-xl' },
    lg: { icon: 36, text: 'text-2xl' },
  };

  const colors = {
    light: 'text-primary-foreground',
    dark: 'text-primary',
  };

  return (
    <div className={`flex items-center gap-2 ${colors[variant]}`}>
      <div className="relative">
        <Shield size={sizes[size].icon} className="fill-accent/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
        </div>
      </div>
      <span className={`font-display font-bold ${sizes[size].text}`}>
        SafeTravel
      </span>
    </div>
  );
};

export default Logo;
