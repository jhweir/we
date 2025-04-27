declare global {
  namespace JSX {
    interface IntrinsicElements {
      'we-row': {
        alignX?: AlignPositionAndSpacing;
        alignY?: AlignPosition;
        gap?: NumberedSize;
        wrap?: boolean;
        reverse?: boolean;
        radius?: NamedSize;
        p?: NumberedSize;
        pl?: NumberedSize;
        pr?: NumberedSize;
        pt?: NumberedSize;
        pb?: NumberedSize;
        px?: NumberedSize;
        py?: NumberedSize;
        m?: NumberedSize;
        ml?: NumberedSize;
        mr?: NumberedSize;
        mt?: NumberedSize;
        mb?: NumberedSize;
        mx?: NumberedSize;
        my?: NumberedSize;
        bg?: string;
        color?: string;
        class?: string;
        style?: any;
        children?: any;
      };
    }
  }
}

export {};
