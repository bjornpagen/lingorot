-- Custom SQL migration file, put your code below! --
SELECT create_hypertable('lingorot_video_playback_event', 'event_time', if_not_exists => TRUE);
