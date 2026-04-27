import type { PropsWithChildren } from "react";
import { Link } from "react-router-dom";

export function Card({ children }: PropsWithChildren) {
  return (
    <div className="rounded-[18px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
      {children}
    </div>
  );
}

export function CardBody({ children }: PropsWithChildren) {
  return <div className="p-6 sm:p-7">{children}</div>;
}

export function Label({ children }: PropsWithChildren) {
  return <div className="text-sm font-medium text-slate-700">{children}</div>;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "mt-1 w-full rounded-2xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none",
        "focus:border-[#7FAF92] focus:ring-4 focus:ring-[#E6F2EA]",
        "placeholder:text-slate-400",
        props.className || "",
      ].join(" ")}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "mt-1 w-full rounded-2xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none",
        "focus:border-[#7FAF92] focus:ring-4 focus:ring-[#E6F2EA]",
        "placeholder:text-slate-400",
        props.className || "",
      ].join(" ")}
    />
  );
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }
) {
  const variant = props.variant || "primary";
  const cls =
    variant === "primary"
      ? "bg-[#7FAF92] text-white hover:bg-[#6E9E83] focus:ring-4 focus:ring-[#E0EFE6]"
      : "bg-transparent text-slate-700 hover:bg-slate-50 focus:ring-4 focus:ring-slate-200";
  return (
    <button
      {...props}
      className={[
        "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold shadow-sm outline-none transition",
        "disabled:cursor-not-allowed disabled:opacity-60",
        cls,
        props.className || "",
      ].join(" ")}
    />
  );
}

export function Pill({ children }: PropsWithChildren) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200/70 bg-white/70 px-2.5 py-1 text-xs font-medium text-slate-700 backdrop-blur">
      {children}
    </span>
  );
}

export function SubtleLink(props: PropsWithChildren<{ to: string }>) {
  return (
    <Link to={props.to} className="font-medium text-[#5E8F76] hover:text-[#4E7E67]">
      {props.children}
    </Link>
  );
}

export function IconButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "default" | "danger" }
) {
  const tone = props.tone || "default";
  const toneCls =
    tone === "danger"
      ? "text-rose-700 hover:bg-rose-50 focus:ring-rose-200"
      : "text-slate-700 hover:bg-slate-50 focus:ring-slate-200";

  return (
    <button
      {...props}
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-xl outline-none transition",
        "focus:ring-4",
        toneCls,
        props.className || "",
      ].join(" ")}
    />
  );
}

export function PencilIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={props.className || "h-5 w-5"}>
      <path
        d="M4 20h4l10.5-10.5a1.5 1.5 0 0 0 0-2.12L16.62 4.5a1.5 1.5 0 0 0-2.12 0L4 15v5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M13.5 5.5l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function TrashIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={props.className || "h-5 w-5"}>
      <path
        d="M6 7h12M10 7V5.8c0-.44.36-.8.8-.8h2.4c.44 0 .8.36.8.8V7m-8 0 1 14c.04.55.5 1 1.05 1h6.1c.55 0 1.01-.45 1.05-1L18 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 11v7M14 11v7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

