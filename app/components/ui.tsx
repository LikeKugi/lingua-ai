"use client";

import {
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from "react";

export function parseInline(text: string): ReactNode[] {
  const result: ReactNode[] = [];
  const pattern = /(\*\*.+?\*\*|__.+?__|\*[^*]+\*|_[^_]+_|`[^`]+`)/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) result.push(text.slice(last, index));
    const token = match[0];
    if (token.startsWith("**") || token.startsWith("__"))
      result.push(
        <strong key={ `${ index }-b` }>{ token.slice(2, -2) }</strong>,
      );
    else if (token.startsWith("`"))
      result.push(<code key={ `${ index }-c` }>{ token.slice(1, -1) }</code>);
    else result.push(<em key={ `${ index }-i` }>{ token.slice(1, -1) }</em>);
    last = index + token.length;
  }
  if (last < text.length) result.push(text.slice(last));
  return result;
}

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let ordered = false;
  const flushParagraph = () => {
    if (paragraph.length)
      blocks.push(
        <p key={ `p-${ blocks.length }` }>
          { paragraph.map(parseInline).map((line, i) =>
            <span key={ i }>{ i > 0 && <br /> }{ line }</span>) }
        </p>,
      );
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    const Tag = ordered ? "ol" : "ul";
    blocks.push(
      <Tag key={ `list-${ blocks.length }` }>
        { list.map((item, i) => <li key={ i }>{ parseInline(item) }</li>) }
      </Tag>,
    );
    list = [];
  };
  lines.forEach((line) => {
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    const item = /^\s*([-*+] |\d+\. )(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push(<h3 key={ `h-${ blocks.length }` }>{ parseInline(heading[2]) }</h3>);
    } else if (item) {
      flushParagraph();
      const nextOrdered = /^\s*\d/.test(line);
      if (list.length && nextOrdered !== ordered) flushList();
      ordered = nextOrdered;
      list.push(item[2]);
    } else if (!line.trim()) {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(line);
    }
  });
  flushParagraph();
  flushList();
  return <div className="markdown">{ blocks }</div>;
}

export function Field({
  label,
  children,
  hint,
  className = "",
  controlId,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
  controlId?: string;
}) {
  const generatedId = `field-${ useId().replace(/:/g, "") }`;
  const id = controlId ?? generatedId;
  const isNativeControl =
    isValidElement(children) &&
    typeof children.type === "string" &&
    ["input", "select", "textarea"].includes(children.type);
  const control = isNativeControl
    ? cloneElement(children as ReactElement<{ id?: string }>, { id })
    : children;
  return (
    <div className={ `field ${ className }` }>
      <label
        className="field-label"
        htmlFor={ isNativeControl || controlId ? id : undefined }
        id={ `${ id }-label` }
      >{ label }</label>{ isNativeControl ? control :
        <div className="field-control" role="group" aria-labelledby={ `${ id }-label` }>
          { children }
        </div> }{ hint &&
        <div className="field-hint">{ hint }</div> }
    </div>
  );
}
