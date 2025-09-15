-- Create channel_connections table for storing connected social media accounts
CREATE TABLE public.channel_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'tiktok', 'instagram')),
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  channel_handle TEXT,
  channel_avatar_url TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  scope_granted TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one active connection per platform per user
  UNIQUE(user_id, platform, channel_id)
);

-- Create index for efficient queries
CREATE INDEX idx_channel_connections_user_id ON public.channel_connections(user_id);
CREATE INDEX idx_channel_connections_platform ON public.channel_connections(platform);
CREATE INDEX idx_channel_connections_active ON public.channel_connections(user_id, is_active);

-- Enable RLS
ALTER TABLE public.channel_connections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own channel connections" 
ON public.channel_connections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own channel connections" 
ON public.channel_connections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own channel connections" 
ON public.channel_connections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own channel connections" 
ON public.channel_connections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_channel_connections_updated_at
BEFORE UPDATE ON public.channel_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create analytics_data table for storing channel analytics
CREATE TABLE public.analytics_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.channel_connections(id) ON DELETE CASCADE,
  date_collected DATE NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one record per connection per date
  UNIQUE(connection_id, date_collected)
);

-- Create index for efficient analytics queries
CREATE INDEX idx_analytics_data_connection_id ON public.analytics_data(connection_id);
CREATE INDEX idx_analytics_data_date ON public.analytics_data(date_collected);
CREATE INDEX idx_analytics_data_connection_date ON public.analytics_data(connection_id, date_collected);

-- Enable RLS
ALTER TABLE public.analytics_data ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics data
CREATE POLICY "Users can view analytics for their own channels" 
ON public.analytics_data 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.channel_connections cc 
    WHERE cc.id = connection_id AND cc.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert analytics for their own channels" 
ON public.analytics_data 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.channel_connections cc 
    WHERE cc.id = connection_id AND cc.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update analytics for their own channels" 
ON public.analytics_data 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.channel_connections cc 
    WHERE cc.id = connection_id AND cc.user_id = auth.uid()
  )
);

-- Create function to clean up old analytics data (older than 1 year)
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics()
RETURNS void AS $$
BEGIN
  DELETE FROM public.analytics_data 
  WHERE date_collected < CURRENT_DATE - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get channel summary
CREATE OR REPLACE FUNCTION public.get_channel_summary(user_uuid UUID)
RETURNS TABLE (
  platform TEXT,
  channel_count BIGINT,
  total_subscribers BIGINT,
  total_views BIGINT,
  is_connected BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cc.platform,
    COUNT(*)::BIGINT as channel_count,
    COALESCE(SUM((ad.metrics->>'subscriber_count')::BIGINT), 0) as total_subscribers,
    COALESCE(SUM((ad.metrics->>'view_count')::BIGINT), 0) as total_views,
    bool_and(cc.is_active) as is_connected
  FROM public.channel_connections cc
  LEFT JOIN public.analytics_data ad ON cc.id = ad.connection_id 
    AND ad.date_collected = (
      SELECT MAX(date_collected) 
      FROM public.analytics_data ad2 
      WHERE ad2.connection_id = cc.id
    )
  WHERE cc.user_id = user_uuid
  GROUP BY cc.platform;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
