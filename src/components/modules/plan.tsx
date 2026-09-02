'use client';
import { Target } from 'lucide-react';
import { GoalManager } from '@/components/psychology/goal-manager';

export function Plan() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Trading Goals</h2>
          <p className="text-sm text-muted-foreground">Define your rules, follow your plan</p>
        </div>
      </div>
      <GoalManager />
    </div>
  );
}
