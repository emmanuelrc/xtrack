// components/ui/PageHeader.tsx
// adds titleClassName/descriptionClassName so pages can style headings per-screen

import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export default function PageHeader({
  title,
  description,
  actions,
  className,
  titleClassName,
  descriptionClassName,
}: Props) {
  return (
    <div className={cn("mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        <h1 className={cn("text-3xl sm:text-4xl font-semibold tracking-tight", titleClassName)}>
          {title}
        </h1>
        {description ? (
          <p className={cn("text-muted-foreground leading-relaxed", descriptionClassName)}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
