import { useState } from 'react';
import { LogForm } from '@/components/logs/LogForm';
import { LogList } from '@/components/logs/LogList';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/formatting';
import type { DailyLog as DailyLogType } from '@/lib/api/types';

export function DailyLog() {
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [editingLog, setEditingLog] = useState<DailyLogType | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleEdit = (log: DailyLogType) => {
    setEditingLog(log);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingLog(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Daily Log</h1>
        <div className="flex items-center gap-4">
          <DatePicker
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setShowForm(false);
              setEditingLog(null);
            }}
          />
          <Button
            onClick={() => {
              setShowForm(true);
              setEditingLog(null);
            }}
          >
            New Log
          </Button>
        </div>
      </div>

      {showForm && (
        <LogForm
          log={editingLog || undefined}
          date={selectedDate}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingLog(null);
          }}
        />
      )}

      <LogList date={selectedDate} onEdit={handleEdit} />
    </div>
  );
}

