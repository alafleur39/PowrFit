"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type SegmentedTab = {
  id: string;
  label: string;
  content: ReactNode;
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Swipeable top tabs (P6-11, D40), like X's For you / Following. Every panel
// stays mounted side by side in a horizontal scroll-snap row, so switching
// is just scrolling: nothing reloads (P6-09), and on a phone the content
// follows your finger with the browser's own momentum. The underline tracks
// the scroll position, and each tab keeps its own vertical scroll.
export function SegmentedTabs({
  tabs,
  ariaLabel,
  defaultTabId,
  urlParam,
}: {
  tabs: SegmentedTab[];
  ariaLabel: string;
  /** Tab to open first; defaults to the first tab. */
  defaultTabId?: string;
  /** Keep the open tab in this search param (?tab=history) without a reload. */
  urlParam?: string;
}) {
  const baseId = useId();
  const initialIndex = Math.max(0, tabs.findIndex((tab) => tab.id === defaultTabId));
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [panelHeight, setPanelHeight] = useState<number | undefined>();

  const scroller = useRef<HTMLDivElement>(null);
  const underline = useRef<HTMLSpanElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const activeRef = useRef(initialIndex);
  /** Window scroll position each tab was left at. */
  const savedScroll = useRef(new Map<number, number>());

  /** Places the underline at a fractional tab position (1.5 = halfway). */
  const placeUnderline = useCallback((position: number) => {
    const line = underline.current;
    const from = buttons.current[Math.floor(position)];
    const to = buttons.current[Math.ceil(position)] ?? from;
    if (!line || !from || !to) return;
    const t = position - Math.floor(position);
    const left = from.offsetLeft + (to.offsetLeft - from.offsetLeft) * t;
    const width = from.offsetWidth + (to.offsetWidth - from.offsetWidth) * t;
    line.style.transform = `translateX(${left + 12}px)`;
    line.style.width = `${Math.max(0, width - 24)}px`;
  }, []);

  const settle = useCallback(
    (index: number) => {
      if (index === activeRef.current) return;
      // Leave the old tab where it was; come back to the new tab where you left it.
      savedScroll.current.set(activeRef.current, window.scrollY);
      activeRef.current = index;
      setActiveIndex(index);
      const tabsTop = scroller.current?.getBoundingClientRect().top ?? 0;
      const fallback = Math.min(window.scrollY, window.scrollY + tabsTop - 120);
      window.scrollTo({ top: savedScroll.current.get(index) ?? Math.max(0, fallback) });
      if (urlParam) {
        const params = new URLSearchParams(window.location.search);
        params.set(urlParam, tabs.at(index)?.id ?? "");
        window.history.replaceState(null, "", `?${params.toString()}`);
      }
    },
    [tabs, urlParam]
  );

  // Open on the default tab without animating, and place the underline.
  useLayoutEffect(() => {
    const row = scroller.current;
    if (row) row.scrollLeft = initialIndex * row.clientWidth;
    placeUnderline(initialIndex);
    // Only on mount: later changes come from scrolling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow the scroll: underline every frame, active tab once it settles.
  useEffect(() => {
    const row = scroller.current;
    if (!row) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const position = row.scrollLeft / Math.max(1, row.clientWidth);
        placeUnderline(position);
        const nearest = Math.round(position);
        if (Math.abs(position - nearest) < 0.02) settle(nearest);
      });
    };
    const onResize = () => {
      row.scrollLeft = activeRef.current * row.clientWidth;
      placeUnderline(activeRef.current);
    };
    row.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      row.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [placeUnderline, settle]);

  // The row is as tall as the open panel, so a short tab has no blank page under it.
  useEffect(() => {
    const panel = panels.current[activeIndex];
    if (!panel) return;
    const observer = new ResizeObserver(() => setPanelHeight(panel.offsetHeight));
    observer.observe(panel);
    return () => observer.disconnect();
  }, [activeIndex]);

  const open = (index: number) => {
    const row = scroller.current;
    if (!row) return;
    row.scrollTo({
      left: index * row.clientWidth,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  return (
    <div>
      <div role="tablist" aria-label={ariaLabel} className="relative flex border-b border-border">
        {tabs.map((tab, index) => {
          const selected = index === activeIndex;
          return (
            <button
              key={tab.id}
              ref={(element) => {
                buttons.current[index] = element;
              }}
              id={`${baseId}-tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              onClick={() => open(index)}
              className={cn(
                "relative flex-1 px-4 py-3.5 text-sm font-semibold transition-colors sm:flex-none sm:px-6",
                selected ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          );
        })}
        <span
          ref={underline}
          aria-hidden
          className="absolute -bottom-px left-0 h-0.5 rounded-full bg-accent will-change-transform"
        />
      </div>

      {/* relative: absolutely placed content (screen-reader tables) stays
          inside the row instead of widening the page from off-screen panels. */}
      <div
        ref={scroller}
        style={{ height: panelHeight }}
        className="relative flex snap-x snap-mandatory items-start overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab, index) => {
          const selected = index === activeIndex;
          return (
            <div
              key={tab.id}
              ref={(element) => {
                panels.current[index] = element;
              }}
              id={`${baseId}-panel-${tab.id}`}
              role="tabpanel"
              aria-labelledby={`${baseId}-tab-${tab.id}`}
              aria-hidden={!selected}
              inert={!selected}
              className="w-full min-w-0 shrink-0 snap-start snap-always"
            >
              {tab.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
