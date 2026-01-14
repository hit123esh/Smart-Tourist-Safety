import { Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from './StatusBadge';

interface TouristIdCardProps {
  touristId: string;
  name: string;
  status: 'safe' | 'observation' | 'alert';
}

const TouristIdCard = ({ touristId, name, status }: TouristIdCardProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(touristId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="overflow-hidden shadow-lg">
      <div className="hero-gradient p-6 text-primary-foreground">
        <p className="text-sm opacity-80 mb-1">Your Tourist ID</p>
        <div className="flex items-center gap-3">
          <code className="text-lg font-mono font-semibold tracking-wide">
            {touristId}
          </code>
          <Button
            variant="ghost"
            size="icon"
            onClick={copyToClipboard}
            className="h-8 w-8 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
          </Button>
        </div>
      </div>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Registered as</p>
            <p className="font-semibold text-foreground text-lg">{name}</p>
          </div>
          <StatusBadge status={status} size="lg" />
        </div>
      </CardContent>
    </Card>
  );
};

export default TouristIdCard;
