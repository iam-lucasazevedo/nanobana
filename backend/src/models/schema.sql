-- User Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
  session_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  last_accessed_at TEXT NOT NULL
);

-- Generation Requests Table
CREATE TABLE IF NOT EXISTS generation_requests (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  size TEXT DEFAULT '1024x768',
  style TEXT DEFAULT 'default',
  aspect_ratio TEXT DEFAULT '16:9',
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES user_sessions(session_id)
);

-- Edit Requests Table
CREATE TABLE IF NOT EXISTS edit_requests (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  edit_prompt TEXT NOT NULL,
  style TEXT DEFAULT 'default',
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES user_sessions(session_id)
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  session_id TEXT PRIMARY KEY,
  preferred_size TEXT DEFAULT '1024x768',
  preferred_style TEXT DEFAULT 'default',
  preferred_aspect_ratio TEXT DEFAULT '16:9',
  last_active_mode TEXT DEFAULT 'generation',
  FOREIGN KEY (session_id) REFERENCES user_sessions(session_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_generation_requests_session_id ON generation_requests(session_id);
CREATE INDEX IF NOT EXISTS idx_generation_requests_created_at ON generation_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_edit_requests_session_id ON edit_requests(session_id);
CREATE INDEX IF NOT EXISTS idx_edit_requests_created_at ON edit_requests(created_at);
