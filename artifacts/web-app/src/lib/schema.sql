-- Assessment results (may already exist — skip if so)
CREATE TABLE IF NOT EXISTS assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id TEXT UNIQUE NOT NULL,
  score INTEGER NOT NULL,
  category_scores JSONB NOT NULL,
  answers JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User personalization profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id TEXT NOT NULL REFERENCES assessment_results(share_id),
  main_goal TEXT NOT NULL,
  time_per_week TEXT NOT NULL,
  learning_style TEXT NOT NULL,
  current_status TEXT NOT NULL,
  current_level INTEGER NOT NULL DEFAULT 1,
  current_phase INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Resource completion tracking
CREATE TABLE IF NOT EXISTS user_resource_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(share_id, resource_id)
);

-- Resource ratings
CREATE TABLE IF NOT EXISTS resource_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  rated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(share_id, resource_id)
);

-- Build challenge submissions
CREATE TABLE IF NOT EXISTS user_build_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id TEXT NOT NULL,
  level INTEGER NOT NULL,
  phase INTEGER NOT NULL,
  use_case TEXT,
  custom_description TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(share_id, level, phase)
);
