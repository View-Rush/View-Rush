import React from 'react';
import { useDashboard } from '@/contexts/DashboardContext';
import { useState } from 'react';
import { Video, AlertTriangle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function YouTubeHeatmapApp() {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState('my');
  // Get private/unlisted videos from dashboard context
  const { analyticsData } = useDashboard();
  type VideoType = {
    id: string;
    title: string;
    privacyStatus?: string;
    thumbnails?: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
    thumbnail?: string;
  };
  const videos: VideoType[] = analyticsData?.private_unlisted_videos || [];
  const [selectedVideo, setSelectedVideo] = useState<VideoType | null>(null);
  const [manualURL, setManualURL] = useState<string>('');
  const [heatmap, setHeatmap] = useState<number[][] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [topThree, setTopThree] = useState<{ dayIdx: number; hourIdx: number; score: number }[]>([]);

  const handlePredict = (video: VideoType) => {
    if (!video) return;
    setSelectedVideo(video);
    setLoading(true);
    setTimeout(() => {
      const mockHeatmap: number[][] = Array.from({ length: 7 }, () =>
        Array.from({ length: 24 }, () => Math.random())
      );
      const sortedScores: { dayIdx: number; hourIdx: number; score: number }[] = [];
      mockHeatmap.forEach((row, dayIdx) => {
        row.forEach((score, hourIdx) => {
          sortedScores.push({ dayIdx, hourIdx, score });
        });
      });
      sortedScores.sort((a, b) => b.score - a.score);
      setTopThree(sortedScores.slice(0, 3));
      setHeatmap(mockHeatmap);
      setLoading(false);
      setStep(3);
    }, 1200);
  };

  const statusColor = (privacyStatus: string | undefined) => {
    if (privacyStatus === 'unlisted' || privacyStatus === 'private') return 'text-green-600';
    if (privacyStatus === 'public') return 'text-red-600';
    return 'text-gray-400';
  };

  const statusIcon = (privacyStatus: string | undefined) => {
    if (privacyStatus === 'unlisted' || privacyStatus === 'private') return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (privacyStatus === 'public') return <AlertTriangle className="w-5 h-5 text-red-600" />;
    return <Video className="w-5 h-5 text-gray-400" />;
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getColor = (score: number) => {
    const red = 255;
    const green = Math.floor(204 - 204 * score);
    const blue = Math.floor(204 - 204 * score);
    return `rgb(${red}, ${green}, ${blue})`;
  };

  return (
    <div className="flex flex-col items-center justify-center px-4 py-14">
      <Card className="w-full max-w-3xl"> {/* Make card wider */}
        <CardHeader>
          <CardTitle className="text-2xl">YouTube Publish Time Optimizer</CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Choose how to select a video</h3>
                <div className="flex gap-4 mb-6">
                  <Button
                    onClick={() => setMode('my')}
                    variant={mode === 'my' ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    My Unlisted/Private Videos
                  </Button>
                  <Button
                    onClick={() => setMode('manual')}
                    variant={mode === 'manual' ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    Enter URL Manually
                  </Button>
                </div>
                <Button onClick={() => setStep(2)} className="w-full">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 2 && mode === 'my' && (
            <div className="space-y-4">
              <Button onClick={() => setStep(1)} variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Selection
              </Button>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((v: VideoType) => (
                  <div
                    key={v.id}
                    onClick={() => handlePredict(v)}
                    className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all hover:shadow-lg ${
                      selectedVideo?.id === v.id ? 'border-primary' : 'border-border'
                    }`}
                  >
                    <img src={v.thumbnail || v.thumbnails?.high?.url || v.thumbnails?.medium?.url || v.thumbnails?.default?.url || ''} alt={v.title} className="w-full h-40 object-cover bg-muted" />
                    <div className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-sm mb-1">{v.title}</p>
                        <p className={`text-xs ${statusColor(v.privacyStatus)} capitalize`}>{v.privacyStatus}</p>
                      </div>
                      {statusIcon(v.privacyStatus)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && mode === 'manual' && (
            <div className="space-y-4">
              <Button onClick={() => setStep(1)} variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Selection
              </Button>
              <input
                type="text"
                value={manualURL}
                onChange={(e) => setManualURL(e.target.value)}
                placeholder="Enter YouTube URL"
                className="w-full p-3 rounded-lg border border-input bg-background"
              />
              {/* Video Preview */}
              {manualURL && manualURL.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/) && (
                (() => {
                  const match = manualURL.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
                  const videoId = match ? match[1] : null;
                  return videoId ? (
                    <div className="rounded-lg border-2 overflow-hidden transition-all shadow-lg">
                      <img src={`https://img.youtube.com/vi/${videoId}/0.jpg`} alt="Video thumbnail" className="w-full h-40 object-cover bg-muted" />
                      <div className="p-4 flex justify-between items-center">
                        <p className="font-semibold text-sm mb-1">Manual Video</p>
                        <span className="text-xs text-green-600 capitalize">unlisted</span>
                        <Video className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                  ) : null;
                })()
              )}
              <Button
                onClick={() => handlePredict({ id: manualURL, title: 'Manual Video', privacyStatus: 'unlisted', thumbnail: (() => {
                  const match = manualURL.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
                  return match ? `https://img.youtube.com/vi/${match[1]}/0.jpg` : undefined;
                })() })}
                className="w-full"
                disabled={!manualURL || !manualURL.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/)}
              >
                Predict Best Time
              </Button>
            </div>
          )}

          {step === 3 && (
            loading ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span>Predicting best time...</span>
              </div>
            ) : (
              heatmap && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-auto w-full max-w-5xl p-8 flex flex-col items-center"
                >
                  <button onClick={() => setStep(2)} className="flex items-center text-red-400 mb-4 hover:text-red-500">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Videos
                  </button>
                  <h2 className="text-xl font-semibold mb-6 text-center text-red-400">Predicted Weekly Heatmap</h2>
                  <div className="inline-block">
                    <div className="grid grid-cols-[80px_repeat(24,1fr)] gap-1 text-xs">
                      <div></div>
                      {hours.map((hour) => <div key={hour} className="text-center text-zinc-400">{hour}</div>)}
                      {heatmap && heatmap.map((row: number[], dayIdx: number) => (
                        <React.Fragment key={dayIdx}>
                          <div className="flex items-center justify-center text-zinc-300 font-medium">{days[dayIdx]}</div>
                          {row.map((score: number, hourIdx: number) => (
                            <div
                              key={hourIdx}
                              className="w-6 h-8 rounded-sm cursor-pointer transition-transform hover:scale-110"
                              style={{ backgroundColor: getColor(score) }}
                              title={`${days[dayIdx]}, ${hourIdx}:00 → ${(score * 100).toFixed(1)}% predicted engagement`}
                            ></div>
                          ))}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6 text-center text-zinc-400 text-sm">
                    <p>Deeper red = higher predicted engagement</p>
                  </div>
                  {topThree.length > 0 && (
                    <div className="mt-6 mx-auto w-full max-w-lg bg-card rounded-xl p-6 text-center border border-border shadow">
                      <h3 className="text-lg font-semibold text-primary mb-3">Top 3 Optimal Times</h3>
                      {topThree.map((slot, idx) => (
                        <p key={idx} className="text-foreground">
                          {idx + 1}. {days[slot.dayIdx]} at {slot.hourIdx}:00 → {(slot.score * 100).toFixed(1)}%
                        </p>
                      ))}
                    </div>
                  )}
                </motion.div>
              )
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}