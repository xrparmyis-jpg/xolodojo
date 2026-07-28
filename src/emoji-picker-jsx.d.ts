import type { DetailedHTMLProps, HTMLAttributes } from 'react';

/** `emoji-picker-element` web component (see PinNoteEditor). */
declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      'emoji-picker': DetailedHTMLProps<
        HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}
