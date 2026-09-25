import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cva, type VariantProps } from "class-variance-authority";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- Button ---------- */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-slate-100 text-slate-900 hover:bg-slate-300",
        outline: "border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-slate-50",
        ghost: "text-slate-300 hover:bg-slate-800 hover:text-slate-50",
        accent: "bg-amber-500/90 text-slate-950 hover:bg-amber-400 font-semibold",
      },
      size: {
        default: "h-9 px-3 py-2",
        sm: "h-7 rounded px-2 text-xs",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  )
);
Button.displayName = "Button";

/* ---------- Badge ---------- */
export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "outline" | "danger" | "ok";
}) {
  const styles = {
    default: "bg-slate-800 text-slate-300 border-slate-700",
    outline: "text-slate-400 border-slate-700",
    danger: "bg-red-950/60 text-red-300 border-red-900",
    ok: "bg-emerald-950/60 text-emerald-300 border-emerald-900",
  }[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono font-medium tracking-wide",
        styles,
        className
      )}
      {...props}
    />
  );
}

/* ---------- Slider ---------- */
export const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & { trackColor?: string }
>(({ className, trackColor, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-slate-800">
      <SliderPrimitive.Range
        className="absolute h-full"
        style={{ background: trackColor ?? "#94a3b8" }}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-slate-600 bg-slate-200 shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-grab active:cursor-grabbing" />
  </SliderPrimitive.Root>
));
Slider.displayName = "Slider";

/* ---------- Switch ---------- */
export const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-slate-700",
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb className="pointer-events-none block h-4 w-4 rounded-full bg-slate-100 shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0" />
  </SwitchPrimitive.Root>
));
Switch.displayName = "Switch";

/* ---------- Checkbox ---------- */
export const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-slate-600 bg-slate-900 shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 data-[state=checked]:text-slate-950 cursor-pointer",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center">
      <Check className="h-3 w-3" strokeWidth={3.5} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = "Checkbox";

/* ---------- Tabs ---------- */
export const Tabs = TabsPrimitive.Root;
export const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 p-1 gap-1",
      className
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";
export const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium text-slate-400 transition-all focus-visible:outline-none data-[state=active]:bg-slate-800 data-[state=active]:text-slate-50 data-[state=active]:shadow cursor-pointer",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";
export const TabsContent = TabsPrimitive.Content;

/* ---------- Tooltip ---------- */
export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;
export const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 shadow-md max-w-xs",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = "TooltipContent";

/* ---------- Collapsible ---------- */
export const Collapsible = CollapsiblePrimitive.Root;
export const CollapsibleTrigger = CollapsiblePrimitive.Trigger;
export const CollapsibleContent = CollapsiblePrimitive.Content;

/* ---------- Card ---------- */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-slate-800 bg-slate-900/60 shadow", className)}
      {...props}
    />
  );
}
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-between px-4 pt-3 pb-1", className)} {...props} />;
}
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-xs font-semibold uppercase tracking-widest text-slate-400", className)} {...props} />;
}
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 pb-4 pt-1", className)} {...props} />;
}
