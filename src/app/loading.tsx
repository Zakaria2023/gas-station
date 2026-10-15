/**
 * Shown the moment a link is tapped, while the page asks the database (far
 * away, so a second or so). The menus stay; only the page area waits.
 */
const Block = ({ className }: { className: string }) => (
  <div className={`animate-pulse rounded-card bg-surface shadow-card ${className}`} />
);

const Loading = () => (
  <div role="status" aria-label="جارٍ التحميل" className="flex flex-col gap-3 px-4 pt-4 lg:gap-5">
    <div className="flex flex-col gap-2 pb-2">
      <div className="h-8 w-40 animate-pulse rounded-full bg-hairline" />
      <div className="h-4 w-28 animate-pulse rounded-full bg-hairline-soft" />
    </div>
    <div className="grid grid-cols-2 gap-3 lg:max-w-md">
      <div className="h-12 animate-pulse rounded-control bg-hairline" />
      <div className="h-12 animate-pulse rounded-control bg-hairline-soft" />
    </div>
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-5">
      <Block className="h-44" />
      <Block className="h-44" />
    </div>
    <Block className="h-64" />
  </div>
);

export default Loading;
