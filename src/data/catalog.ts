import type { SavedKind } from "../state/types";
export interface CatalogItem {
  id: string;
  kind: SavedKind;
  title: string;
  subtitle: string;
  image?: string;
  imagePosition?: string;
  tags: string[];
  why?: string;
  dateLabel: string;
  date: string;
  amount?: string;
  issuer?: string;
}
