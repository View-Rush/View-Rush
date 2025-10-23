
import React, { useRef } from 'react';
import { useState } from 'react';
import { Loader2, ArrowLeft, UploadCloud } from 'lucide-react';
import { apiService } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';

type PredictionResponse = {
  heatmap: number[][];
  topThree: { dayIdx: number; hourIdx: number; score: number }[];
};
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
  // Days and hours for heatmap
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Color function for heatmap with min-max normalization
  const getColor = (score: number, min: number, max: number) => {
    // Normalize score between min and max
    let norm = 0;
    if (max > min) {
      norm = (score - min) / (max - min);
    }
    // Clamp between 0 and 1
    norm = Math.max(0, Math.min(1, norm));
    const red = 255;
    const green = Math.floor(204 - 204 * norm);
    const blue = Math.floor(204 - 204 * norm);
    return `rgb(${red}, ${green}, ${blue})`;
  };


// Utility function to check if URL is safe http(s) image link
function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:');
  } catch (e) {
    return false;
  }
}

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
      if (!apiKey) {
        console.error('YouTube API key not configured');
        setAutoDetails({ title: '', description: '', tags: '', thumbnail: '', channel: '', videoId: '' });
        setAutoLoading(false);
        return;
      }
      const videoRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`);
      const videoData = await videoRes.json();
      if (!videoData.items || videoData.items.length === 0) {
        console.error('Video not found or invalid video ID');
        setAutoDetails({ title: '', description: '', tags: '', thumbnail: '', channel: '', videoId: '' });
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
      console.error('Failed to fetch video details:', err);
      setAutoDetails({ title: '', description: '', tags: '', thumbnail: '', channel: '', videoId: '' });
    }
    setAutoLoading(false);
  };

  // Unified predict handler
  const handlePredict = async () => {
    setLoading(true);
    setStep(2); // Move to step 2 to show loading state
    let payload = mode === 'link' ? autoDetails : { ...manualDetails };
    // Remove thumbnailFile from payload in manual mode
    if (mode === 'manual' && 'thumbnailFile' in payload) {
      delete (payload as any).thumbnailFile;
    }
    // If manual mode and thumbnailFile is present, upload to Supabase and get URL
    if (mode === 'manual' && manualDetails.thumbnailFile) {
      try {
        const file = manualDetails.thumbnailFile;
        const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const { error } = await supabase.storage.from('thumbnails').upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });
        if (error) throw error;
        // Get public URL from 'thumbnails' bucket
        const { data: publicUrlData } = supabase.storage.from('thumbnails').getPublicUrl(fileName);
        payload = { ...payload, thumbnail: publicUrlData.publicUrl };
      } catch (err) {
        console.error('Thumbnail upload failed:', err);
        setLoading(false);
        setStep(1); // Go back to step 1 on error
        return;
      }
    }
    try {
      // Call FastAPI backend
      const response = await apiService.getPredictions(payload) as PredictionResponse;
      setHeatmap(response.heatmap);
      setTopThree(response.topThree);
    } catch (error) {
      // Handle error (show message, etc.)
      console.error('Prediction failed:', error);
      setStep(1); // Go back to step 1 on error
    }
    setLoading(false);
  };


  return (
    <div className="flex flex-col items-center justify-center px-4 py-8">
      <Card className="w-full max-w-6xl shadow-lg">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl">Optimal YouTube Publish Times</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {step === 1 && (
            <div className="space-y-6 max-w-3xl mx-auto">
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
                    placeholder="Paste YouTube video link here (e.g., https://www.youtube.com/watch?v=...)"
                    className="w-full p-3 rounded-lg border border-input bg-background"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && e.currentTarget.value.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/)) {
                        fetchYouTubeDetails(e.currentTarget.value);
                      }
                    }}
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
                      <img 
                        src={autoDetails.thumbnail} 
                        alt="Video thumbnail" 
                        className="w-full h-40 object-cover bg-muted"
                        onError={(e) => {
                          // Fallback if thumbnail fails to load
                          e.currentTarget.src = `https://img.youtube.com/vi/${autoDetails.videoId}/0.jpg`;
                        }}
                      />
                      <div className="p-4">
                        <p className="font-semibold text-sm mb-1">{autoDetails.title}</p>
                        <p className="text-xs text-zinc-400 mb-1 line-clamp-2">{autoDetails.description}</p>
                        <p className="text-xs text-zinc-400 mb-1">Tags: {autoDetails.tags || 'No tags'}</p>
                        <p className="text-xs text-zinc-400">Channel: <a href={autoDetails.channel} target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-300">{autoDetails.channel}</a></p>
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={handlePredict}
                    className="w-full"
                    disabled={!autoDetails.videoId || autoLoading}
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
                          src={
                            manualDetails.thumbnailFile
                              ? URL.createObjectURL(manualDetails.thumbnailFile)
                              : isSafeHttpUrl(manualDetails.thumbnail)
                                ? manualDetails.thumbnail
                                : undefined
                          }
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
              <div className="flex flex-col items-center justify-center gap-6 py-20">
                <Loader2 className="w-16 h-16 animate-spin text-primary" />
                <div className="text-center space-y-3">
                  <p className="text-xl font-semibold">Analyzing your video...</p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            ) : heatmap ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto w-full flex flex-col items-center"
              >
                <button onClick={() => { setStep(1); setHeatmap(null); setLoading(false); }} className="flex items-center text-red-400 mb-6 hover:text-red-500 self-start">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>
                <h2 className="text-2xl font-semibold mb-8 text-center text-red-400">Predicted Weekly Heatmap</h2>
                <div className="w-full overflow-x-auto flex justify-center px-4">
                  <div className="inline-block p-8 bg-muted/30 rounded-xl">
                  {(() => {
                    // Flatten heatmap to get min and max
                    const flat = heatmap.flat();
                    const min = Math.min(...flat);
                    const max = Math.max(...flat);
                    return (
                      <div className="grid grid-cols-[80px_repeat(24,1fr)] gap-2 text-sm">
                        <div></div>
                        {hours.map((hour) => (
                          <div key={hour} className="text-center text-black font-medium">{hour}</div>
                        ))}
                        {heatmap.map((row: number[], dayIdx: number) => (
                          <React.Fragment key={dayIdx}>
                            <div className="flex items-center justify-center text-black font-semibold pr-2">{days[dayIdx]}</div>
                            {row.map((score: number, hourIdx: number) => (
                              <div
                                key={hourIdx}
                                className="w-8 h-10 rounded-md cursor-pointer transition-transform hover:scale-110 shadow-sm"
                                style={{ backgroundColor: getColor(score, min, max) }}
                                title={`${days[dayIdx]}, ${hourIdx}:00 → ${(score * 100).toFixed(1)}% predicted engagement`}
                              ></div>
                            ))}
                          </React.Fragment>
                        ))}
                      </div>
                    );
                  })()}
                  </div>
                </div>
                <div className="mt-8 text-center text-black text-sm font-medium">
                  <p>Deeper red = higher predicted engagement</p>
                </div>
                {topThree.length > 0 && (
                  <div className="mt-8 mx-auto w-full max-w-lg bg-card rounded-xl p-8 text-center border border-border shadow-lg">
                    <h3 className="text-xl font-semibold text-primary mb-4">Top 3 Optimal Times</h3>
                    <div className="space-y-2">
                      {topThree.map((slot, idx) => (
                        <p key={idx} className="text-foreground text-base">
                          {idx + 1}. {days[slot.dayIdx]} at {slot.hourIdx}:00 → {(slot.score * 100).toFixed(1)}%
                        </p>
                      ))}
                    </div>
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
