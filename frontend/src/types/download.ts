export interface StitchScreen {
  id: string;
  name: string;
  title: string;
  description: string;
  category: 'customer' | 'admin' | 'kitchen' | 'waiter' | 'shared';
  roles: number[]; // Role IDs that can access
  deviceType: 'MOBILE' | 'DESKTOP' | 'TABLET';
  width: number;
  height: number;
  screenshotUrl: string;
  htmlUrl: string;
  codeUrl?: string;
  order: number;
  tags: string[];
  estimatedFileSize: {
    html: number; // KB
    screenshot: number; // KB
  };
}

export interface ScreenCategory {
  id: string;
  name: string;
  path: string;
  description: string;
  screenCount: number;
  icon: string;
}

export interface DownloadProgress {
  total: number;
  completed: number;
  failed: number;
  isDownloading: boolean;
}

export interface DownloadItem {
  id: string;
  name: string;
  type: 'html' | 'screenshot' | 'both';
  size: number;
  progress?: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  error?: string;
}
