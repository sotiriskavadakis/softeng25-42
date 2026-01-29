interface ChartPlaceholderProps {
  title: string;
  height?: number;
  type?: "bar" | "line" | "pie";
}

export function ChartPlaceholder({ title, height = 200, type = "bar" }: ChartPlaceholderProps) {
  return (
    <div
      className="bg-card rounded-xl border border-border/50 p-5 shadow-md"
      style={{ height: height + 60 }}
    >
      <h3 className="font-semibold text-foreground mb-4">{title}</h3>
      <div
        className="bg-secondary/30 rounded-lg flex items-end justify-center gap-2 px-4 overflow-hidden"
        style={{ height }}
      >
        {type === "bar" && (
          <>
            {[40, 65, 45, 80, 55, 70, 60].map((h, i) => (
              <div
                key={i}
                className="bg-primary/60 rounded-t-md w-8 transition-all duration-300 hover:bg-primary"
                style={{ height: `${h}%` }}
              />
            ))}
          </>
        )}
        {type === "line" && (
          <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
            <path
              d="M 0 80 Q 50 60, 100 50 T 200 40 T 300 30"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              className="opacity-60"
            />
            <path
              d="M 0 80 Q 50 60, 100 50 T 200 40 T 300 30 L 300 100 L 0 100 Z"
              fill="hsl(var(--primary))"
              className="opacity-10"
            />
          </svg>
        )}
        {type === "pie" && (
          <div className="flex items-center justify-center w-full h-full">
            <div className="w-24 h-24 rounded-full border-8 border-primary/60 relative">
              <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-warning/60 border-r-warning/60 rotate-45" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
