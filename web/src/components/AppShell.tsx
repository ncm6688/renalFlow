import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "rounded-2xl px-3 py-2 text-sm font-semibold transition",
          isActive
            ? "bg-[#7FAF92] text-white shadow-sm"
            : "text-slate-700 hover:bg-slate-50",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

export function AppShell() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const nav = useNavigate();
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-slate-200/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-[#7FAF92]/25 to-[#CBE3D2]/40 ring-1 ring-slate-900/5" />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-900">RenalFlow</div>
              <div className="text-xs text-slate-500">Kidney health & community</div>
            </div>
          </div>

          <nav className="hidden items-center gap-2 sm:flex">
            {!isAdmin ? <NavItem to="/dashboard" label="Dashboard" /> : null}
            <NavItem to="/forum" label="Forum" />
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <div className="text-xs font-semibold text-slate-800">{user?.name || "User"}</div>
              <div className="text-xs text-slate-500">{user?.email || ""}</div>
            </div>
            <button
              onClick={() => {
                logout();
                nav("/login");
              }}
              className="rounded-2xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mx-auto flex max-w-5xl gap-2 px-4 pb-3 sm:hidden">
          {!isAdmin ? <NavItem to="/dashboard" label="Dashboard" /> : null}
          <NavItem to="/forum" label="Forum" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

