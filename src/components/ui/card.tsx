import { memo, type FC, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card: FC<CardProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

const CardHeader: FC<CardHeaderProps> = ({ children, className }) => {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)}>
      {children}
    </div>
  );
};

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

const CardTitle: FC<CardTitleProps> = ({ children, className }) => {
  return (
    <h3
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight text-gray-900",
        className
      )}
    >
      {children}
    </h3>
  );
};

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

const CardContent: FC<CardContentProps> = ({ children, className }) => {
  return <div className={cn("p-6 pt-0", className)}>{children}</div>;
};

export default memo(Card);
export const MemoizedCardHeader = memo(CardHeader);
export const MemoizedCardTitle = memo(CardTitle);
export const MemoizedCardContent = memo(CardContent);
