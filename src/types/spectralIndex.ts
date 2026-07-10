export interface SpectralIndexOutputRange {
  min?: number;
  max?: number;
}

export interface SpectralIndexDefinition {
  id: string;
  key: string;
  name: string;
  description: string;
  formula: string;
  required_bands: Record<string, string>;
  category: string;
  output_range: SpectralIndexOutputRange | null;
  interpretation: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
