interface FrameworkBadgeProps {
  shortCode: string;
  colour: string;
  className?: string;
}

export function FrameworkBadge({ shortCode, colour, className = "" }: FrameworkBadgeProps) {
  return (
    <span
      className={`inline-flex items-center text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${className}`}
      style={{
        borderColor: `${colour}66`,
        color: colour,
        backgroundColor: `${colour}18`,
      }}
    >
      {shortCode}
    </span>
  );
}
