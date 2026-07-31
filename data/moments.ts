export interface Moment {
  id: string;
  content: string;
  images?: string[];
  mood?: string;
  likes: number;
  created_at: string;
}

export const momentsData: Moment[] = [];
