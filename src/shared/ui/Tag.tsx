export function Tag({
  kind,
  title,
  children,
  style,
}: {
  kind: string;
  title?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span className={`tag ${kind}`} title={title} style={style}>
      {children}
    </span>
  );
}
