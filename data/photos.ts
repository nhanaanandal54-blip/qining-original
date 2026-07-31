export interface Photo {
  id: string;
  url: string;
  caption: string;
  orientation: "landscape" | "portrait" | "square";
}

export interface PhotoDay {
  date: string;
  label: string;
  photos: Photo[];
}

export const photoDays: PhotoDay[] = [];
