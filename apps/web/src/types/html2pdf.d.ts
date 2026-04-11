/**
 * Module augmentation for html2pdf.js — adds missing `pagebreak` option.
 *
 * The `export {}` turns this file into an ES module so TypeScript treats
 * the `declare module` block as an *augmentation* of the package's own
 * bundled types (type.d.ts) rather than a full replacement.
 */
export {};

declare module "html2pdf.js" {
  interface Html2PdfOptions {
    /** Controls page-break behaviour — "css" | "legacy" | "avoid-all" | "whiteline" */
    pagebreak?: {
      mode?: string | string[];
      before?: string | string[];
      after?: string | string[];
      avoid?: string | string[];
    };
  }
}
