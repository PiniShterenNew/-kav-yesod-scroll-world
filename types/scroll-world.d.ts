export type ScrollWorldSection = {
  id: string;
  label: string;
  still: string;
  stillMobile?: string;
  clip?: string | null;
  clipMobile?: string | null;
  accent: string;
  scroll?: number;
  linger?: number;
  eyebrow: string;
  title: string;
  body: string;
  tags?: string[];
  cta?: {
    primary?: { label: string; href: string };
    secondary?: { label: string; href: string };
  };
};

export type ScrollWorldConfig = {
  brand?: { name: string; href?: string };
  /** Optional hero state rendered before the numbered sections — contributes
      media + copy but no route dot, nav entry or NN/NN number. */
  opening?: ScrollWorldSection;
  diveScroll: number;
  connScroll: number;
  crossfade: number;
  hint: string;
  nav?: boolean;
  atmosphere?: boolean;
  cta?: { label: string; href: string };
  sections: ScrollWorldSection[];
  connectors: Array<string | null>;
  connectorsMobile?: Array<string | null>;
};

export type MountScrollWorld = (container: HTMLElement, config: ScrollWorldConfig) => void | (() => void);

declare module "@/lib/scroll-world.js" {
  export const mountScrollWorld: MountScrollWorld;
}
