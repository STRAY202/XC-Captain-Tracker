import { useRef, useEffect } from 'react';
import { Users } from 'lucide-react';
import CaptainWeekCard from './CaptainWeekCard';

export default function CaptainHub({ weeks, currentWeekIndex }) {
  return (
    <div className="pt-4 pb-4">
      {/* Header */}
      <div className="px-4 mb-4">
        <h2 className="text-base font-extrabold text-white">Captain Hub</h2>
        <p className="text-xs text-gray-500 mt-0.5">Your availability — affects which days athletes see</p>
      </div>
      {/* All weeks */}
      <div className="px-4 space-y-3">
        {weeks.map(week => (
          <CaptainWeekCard
            key={week.id}
            week={week}
            isCurrentWeek={week.index === currentWeekIndex}
            weekIndex={week.index}
          />
        ))}
      </div>
    </div>
  );
}
