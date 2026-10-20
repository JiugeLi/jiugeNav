export interface Group {
  id: number;
  name: string;
  icon: string;
  sort_order: number;
  created_at?: string;
}

export interface Website {
  id: number;
  group_id: number;
  name: string;
  url: string;
  logo_url?: string | null;
  logo_type?: string | null;
  description?: string | null;
  sort_order: number;
  click_count?: number;
  last_clicked_at?: string | null;
  created_at?: string | null;
}

export interface Stats {
  totalLinks: number;
  totalClicks: number;
  weeklyClicks: number;
  newLinksThisWeek: number;
}
