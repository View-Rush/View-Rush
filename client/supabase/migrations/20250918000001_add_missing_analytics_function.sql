-- Add missing update_channel_analytics function to fix YouTube connection issues
-- This function is called by youtubeService.ts but was missing from the database

CREATE OR REPLACE FUNCTION public.update_channel_analytics(
  connection_uuid UUID,
  analytics_data JSONB
)
RETURNS void AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
BEGIN
  -- Verify user owns this connection (security check)
  IF NOT EXISTS (
    SELECT 1 FROM public.channel_connections 
    WHERE id = connection_uuid AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Connection not found or not owned by user';
  END IF;

  -- Insert or update analytics data for today
  INSERT INTO public.analytics_data (
    connection_id,
    date_collected,
    metrics,
    raw_data
  ) VALUES (
    connection_uuid,
    today_date,
    analytics_data,
    analytics_data
  )
  ON CONFLICT (connection_id, date_collected)
  DO UPDATE SET
    metrics = EXCLUDED.metrics,
    raw_data = EXCLUDED.raw_data,
    created_at = now();

  -- Update connection sync status
  UPDATE public.channel_connections 
  SET 
    sync_status = 'completed',
    last_sync_at = now(),
    error_message = NULL
  WHERE id = connection_uuid;

  -- Log successful sync
  RAISE NOTICE 'Analytics updated successfully for connection: %', connection_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_channel_analytics(UUID, JSONB) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION public.update_channel_analytics IS 'Updates analytics data for a channel connection. Called by youtubeService.syncSingleChannelAnalytics()';