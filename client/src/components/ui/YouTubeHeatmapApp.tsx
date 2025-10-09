
import React, { useRef } from 'react';
import { useState } from 'react';
import { Video, Loader2, ArrowLeft, UploadCloud } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { youtubeApiClient } from '@/services/youtube/apiClient';
  // Days and hours for heatmap
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Color function for heatmap
  const getColor = (score: number) => {
    const red = 255;
    const green = Math.floor(204 - 204 * score);
    const blue = Math.floor(204 - 204 * score);
    return `rgb(${red}, ${green}, ${blue})`;
  };


export default function YouTubeHeatmapApp() {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'link' | 'manual'>('link');
  const [youtubeURL, setYoutubeURL] = useState('');
  const [manualDetails, setManualDetails] = useState({
    title: '',
    description: '',
    tags: '',
    thumbnail: '',
    channel: '',
    thumbnailFile: null as File | null,
  });
  const [autoDetails, setAutoDetails] = useState({
    title: '',
    description: '',
    tags: '',
    thumbnail: '',
    channel: '',
    videoId: '',
  });
  const [autoLoading, setAutoLoading] = useState(false);
  const [heatmap, setHeatmap] = useState<number[][] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [topThree, setTopThree] = useState<{ dayIdx: number; hourIdx: number; score: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Fetch video details from YouTube API
  const fetchYouTubeDetails = async (url: string) => {
    setAutoLoading(true);
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
    const videoId = match ? match[1] : '';
    if (!videoId) {
      setAutoLoading(false);
      return;
    }
    try {
      // Use public API key for demo (replace with your own key)
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      const videoRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`);
      const videoData = await videoRes.json();
      if (!videoData.items || videoData.items.length === 0) {
        setAutoLoading(false);
        return;
      }
      const snippet = videoData.items[0].snippet;
      setAutoDetails({
        title: snippet.title,
        description: snippet.description,
        tags: (snippet.tags || []).join(','),
        thumbnail: snippet.thumbnails?.high?.url || `https://img.youtube.com/vi/${videoId}/0.jpg`,
        channel: `https://youtube.com/channel/${snippet.channelId}`,
        videoId,
      });
    } catch (err) {
      setAutoDetails({ title: '', description: '', tags: '', thumbnail: '', channel: '', videoId: '' });
    }
    setAutoLoading(false);
  };

  // Unified predict handler
  const handlePredict = async () => {
    setLoading(true);
    let payload;
    if (mode === 'link') {
      payload = autoDetails;
    } else {
      payload = manualDetails;
    }
    // Print payload to console for backend mock
    console.log('Sending to backend:', payload);
    // Simulate backend API call
    await new Promise(res => setTimeout(res, 1200));
    // Mocked heatmap response
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
    setStep(2);
  };


  return (
    <div className="flex flex-col items-center justify-center px-4 py-14">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl">YouTube Publish Time Optimizer</CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex gap-4 mb-6">
                <Button
                  onClick={() => setMode('link')}
                  variant={mode === 'link' ? 'default' : 'outline'}
                  className="flex-1"
                >
                  Enter YouTube Link
                </Button>
                <Button
                  onClick={() => setMode('manual')}
                  variant={mode === 'manual' ? 'default' : 'outline'}
                  className="flex-1"
                >
                  Enter Details Manually
                </Button>
              </div>
              {mode === 'link' && (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={youtubeURL}
                    onChange={e => {
                      setYoutubeURL(e.target.value);
                      setAutoDetails({ title: '', description: '', tags: '', thumbnail: '', channel: '', videoId: '' });
                    }}
                    placeholder="Paste YouTube video link here"
                    className="w-full p-3 rounded-lg border border-input bg-background"
                    onBlur={e => {
                      if (e.target.value.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/)) {
                        fetchYouTubeDetails(e.target.value);
                      }
                    }}
                  />
                  {/* Video Preview and details */}
                  {autoLoading && (
                    <div className="flex items-center gap-2 text-primary"><Loader2 className="w-4 h-4 animate-spin" /> Fetching video details...</div>
                  )}
                  {autoDetails.videoId && !autoLoading && (
                    <div className="rounded-lg border-2 overflow-hidden transition-all shadow-lg">
                      <img src={autoDetails.thumbnail} alt="Video thumbnail" className="w-full h-40 object-cover bg-muted" />
                      <div className="p-4">
                        <p className="font-semibold text-sm mb-1">{autoDetails.title}</p>
                        <p className="text-xs text-zinc-400 mb-1">{autoDetails.description}</p>
                        <p className="text-xs text-zinc-400 mb-1">Tags: {autoDetails.tags}</p>
                        <p className="text-xs text-zinc-400">Channel: <a href={autoDetails.channel} target="_blank" rel="noopener noreferrer" className="underline">{autoDetails.channel}</a></p>
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={handlePredict}
                    className="w-full"
                    disabled={!autoDetails.videoId}
                  >
                    Predict Best Time
                  </Button>
                </div>
              )}
              {mode === 'manual' && (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={manualDetails.title}
                    onChange={e => setManualDetails({ ...manualDetails, title: e.target.value })}
                    placeholder="Title"
                    className="w-full p-3 rounded-lg border border-input bg-background"
                  />
                  <textarea
                    value={manualDetails.description}
                    onChange={e => setManualDetails({ ...manualDetails, description: e.target.value })}
                    placeholder="Description"
                    className="w-full p-3 rounded-lg border border-input bg-background"
                  />
                  <input
                    type="text"
                    value={manualDetails.tags}
                    onChange={e => setManualDetails({ ...manualDetails, tags: e.target.value })}
                    placeholder="Tags (comma separated)"
                    className="w-full p-3 rounded-lg border border-input bg-background"
                  />
                  <input
                    type="text"
                    value={manualDetails.channel}
                    onChange={e => setManualDetails({ ...manualDetails, channel: e.target.value })}
                    placeholder="Channel Link"
                    className="w-full p-3 rounded-lg border border-input bg-background"
                  />
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={manualDetails.thumbnail}
                      onChange={e => setManualDetails({ ...manualDetails, thumbnail: e.target.value })}
                      placeholder="Thumbnail Link (optional)"
                      className="w-full p-3 rounded-lg border border-input bg-background"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0] || null;
                          setManualDetails({ ...manualDetails, thumbnailFile: file });
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2"
                      >
                        <UploadCloud className="w-4 h-4" /> Upload Thumbnail
                      </Button>
                      {manualDetails.thumbnailFile && (
                        <span className="text-xs text-green-600">{manualDetails.thumbnailFile.name}</span>
                      )}
                    </div>
                    {/* Preview thumbnail */}
                    {(manualDetails.thumbnail || manualDetails.thumbnailFile) && (
                      <div className="mt-2">
                        <img
                          src={manualDetails.thumbnailFile ? URL.createObjectURL(manualDetails.thumbnailFile) : manualDetails.thumbnail}
                          alt="Thumbnail Preview"
                          className="w-full h-40 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handlePredict}
                    className="w-full"
                    disabled={!(manualDetails.title && manualDetails.description && manualDetails.channel)}
                  >
                    Predict Best Time
                  </Button>
                </div>
              )}
            </div>
          )}
          {step === 2 && (
            loading ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span>Predicting best time...</span>
              </div>
            ) : heatmap ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto w-full max-w-5xl p-8 flex flex-col items-center"
              >
                <button onClick={() => { setStep(1); setHeatmap(null); }} className="flex items-center text-red-400 mb-4 hover:text-red-500">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>
                <h2 className="text-xl font-semibold mb-6 text-center text-red-400">Predicted Weekly Heatmap</h2>
                <div className="inline-block">
                  <div className="grid grid-cols-[80px_repeat(24,1fr)] gap-1 text-xs">
                    <div></div>
                    {hours.map((hour) => (
                      <div key={hour} className="text-center text-zinc-400">{hour}</div>
                    ))}
                    {heatmap.map((row: number[], dayIdx: number) => (
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
            ) : null
          )}
        </CardContent>
      </Card>
    </div>
  );
}
