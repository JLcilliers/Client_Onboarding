"use client";

import { type ReactNode, useState } from "react";

type Section = {
  key: string;
  title: string;
  description?: string;
  content: ReactNode;
};

export function SectionTabs({ sections }: { sections: Section[] }) {
  const [activeKey, setActiveKey] = useState(() => sections[0]?.key ?? "");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {sections.map((section) => {
          const isActive = section.key === activeKey;
          return (
            <button
              key={section.key}
              type="button"
              onClick={() => setActiveKey(section.key)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-foreground/80 hover:border-primary/40 hover:text-primary"
              }`}
            >
              {section.title}
            </button>
          );
        })}
      </div>
      {sections.map((section) =>
        section.key === activeKey ? (
          <section
            key={section.key}
            aria-label={section.title}
            className="space-y-3"
          >
            {section.description ? (
              <p className="text-sm text-muted-foreground">
                {section.description}
              </p>
            ) : null}
            <div className="space-y-3">{section.content}</div>
          </section>
        ) : null,
      )}
    </div>
  );
}
