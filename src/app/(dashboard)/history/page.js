'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHistoryStore } from '@/store/historyStore';
import { Clock, Trash2 } from 'lucide-react';

export default function HistoryPage() {
  const { items, removeItem, clearHistory } = useHistoryStore();

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">History</h1>
        {items.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-sm text-muted-foreground hover:text-destructive"
          >
            Clear All
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No processing history yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{item.platform}</CardTitle>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground truncate">{item.videoUrl}</p>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
