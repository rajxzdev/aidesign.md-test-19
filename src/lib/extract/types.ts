export interface ExtractedColor {
  hex: string;
  rgb?: string;
  count: number;
  role?: 'primary' | 'secondary' | 'neutral' | 'accent' | 'danger' | 'warning' | 'success' | 'info' | 'background' | 'text';
  name?: string;
}

export interface ExtractedFontFamily {
  name: string;
  stack: string;
  count: number;
}

export interface ExtractedFontSize {
  value: string;
  px: number;
  tag?: string;
}

export interface TypographyScale {
  fontFamilies: ExtractedFontFamily[];
  sizes: ExtractedFontSize[];
  weights: number[];
  lineHeights: string[];
}

export interface SpacingValue {
  value: string;
  px: number;
  context?: string;
}

export interface ExtractedDesign {
  url: string;
  domain: string;
  colors: ExtractedColor[];
  typography: TypographyScale;
  spacing: SpacingValue[];
  borderRadius: SpacingValue[];
  shadows: string[];
  breakpoints: string[];
  components: ComponentPattern[];
  cssVariables: Record<string, string>;
  meta: {
    title: string;
    description?: string;
    cssSizeKB: number;
    htmlSizeKB: number;
    note?: string;
  };
}

export interface ComponentPattern {
  name: string;
  tag: string;
  classes: string[];
  styles: Record<string, string>;
  count: number;
  description?: string;
}

export interface AnalyzeResponse {
  ok: boolean;
  markdown?: string;
  domain?: string;
  model?: string;
  cached?: boolean;
  error?: string;
}

export interface AnalyzeRequest {
  url: string;
}
