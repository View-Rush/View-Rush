import React from 'react';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

interface YouTubeHeatmapProps {
  heatmapData: number[][] | null;
}

export function YouTubeHeatmap({ heatmapData }: YouTubeHeatmapProps) {
  if (!heatmapData) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No heatmap data available.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        <div className="grid grid-cols-25 gap-1">
          <div className="col-span-1"></div>
          {Array.from({length:24}).map((_,h)=> (
            <div key={h} className="text-[10px] text-center text-muted-foreground px-1">{h}</div>
          ))}
          {heatmapData.map((row, d)=> (
            <React.Fragment key={d}>
              <div className="text-[12px] font-medium text-muted-foreground px-1 py-2">{DAYS[d]}</div>
              {row.map((score,h)=>{
                const intensity = Math.round(score*100);
                const alpha = 0.15 + 0.7*score;
                const bg = `rgba(79,70,229,${alpha.toFixed(2)})`; // indigo
                return (
                  <div key={h} className="px-1 py-1">
                    <div title={`${DAYS[d]} ${h}:00 — ${intensity}%`} style={{background:bg}} className="w-10 h-8 rounded-md flex items-center justify-center text-xs text-white font-semibold">
                      {intensity}%
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}