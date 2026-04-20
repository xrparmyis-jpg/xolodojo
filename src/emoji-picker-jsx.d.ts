import 'react';

/** `emoji-picker-element` web component (see PinNoteEditor). */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'emoji-picker': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

export {};
