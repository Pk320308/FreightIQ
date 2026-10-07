'use client';

import Link from 'next/link';
import { Ship, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="glass max-w-md w-full p-8 rounded-2xl border border-border/60 space-y-5">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Ship className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Page Not Found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The maritime route or intelligence page you requested does not exist or has been moved.
          </p>
        </div>
        <Link href="/dashboard" className="inline-block w-full">
          <Button className="w-full gap-2">
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
