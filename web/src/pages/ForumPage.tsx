import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, CardBody, IconButton, Input, Label, Pill, Textarea, TrashIcon } from "../components/ui";
import { apiFetch } from "../lib/http";
import { useAuth } from "../store/auth";

type Post = {
  _id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  author?: { name?: string };
};

export function ForumPage() {
  const token = useAuth((s) => s.accessToken) || "";
  const me = useAuth((s) => s.user);
  const isAdmin = me?.role === "admin";

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const limit = 10;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");

  async function loadLatest(nextPage = 1) {
    setLoadingList(true);
    setErr(null);
    try {
      const res = await apiFetch<{ posts: Post[]; hasMore: boolean; page: number }>(
        `/api/forum?limit=${limit}&page=${nextPage}`,
        { method: "GET" }
      );
      setPosts(res.posts || []);
      setHasMore(Boolean(res.hasMore));
      setPage(res.page || nextPage);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load forum");
    } finally {
      setLoadingList(false);
    }
  }

  async function search() {
    const query = q.trim();
    if (!query) return loadLatest(1);
    setLoadingList(true);
    setErr(null);
    try {
      const res = await apiFetch<{ provider: string; posts: Post[]; hasMore: boolean; page: number }>(
        `/api/forum/search?q=${encodeURIComponent(query)}&limit=${limit}&page=1`,
        { method: "GET" }
      );
      setPosts(res.posts || []);
      setHasMore(Boolean(res.hasMore));
      setPage(res.page || 1);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoadingList(false);
    }
  }

  async function loadPage(nextPage: number) {
    const query = q.trim();
    if (!query) return loadLatest(nextPage);
    setLoadingList(true);
    setErr(null);
    try {
      const res = await apiFetch<{ provider: string; posts: Post[]; hasMore: boolean; page: number }>(
        `/api/forum/search?q=${encodeURIComponent(query)}&limit=${limit}&page=${nextPage}`,
        { method: "GET" }
      );
      setPosts(res.posts || []);
      setHasMore(Boolean(res.hasMore));
      setPage(res.page || nextPage);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load page");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    void loadLatest(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const titleTrim = title.trim();
  const bodyTrim = body.trim();
  const canPost = useMemo(() => titleTrim.length > 0 && bodyTrim.length > 0, [titleTrim, bodyTrim]);

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold tracking-tight text-slate-900">Community</div>
                <div className="mt-1 text-sm text-slate-600">
                  Share experiences, ask questions, and support each other.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => loadLatest(1)} disabled={loadingList}>
                  Refresh
                </Button>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label>Search</Label>
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try: protein, eGFR, diet..." />
              </div>
              <Button onClick={search} disabled={loadingList}>
                Search
              </Button>
            </div>

            {err ? (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{err}</div>
            ) : null}

            <div className="mt-5 space-y-3">
              {posts.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">
                  No posts yet.
                </div>
              ) : (
                posts.map((p) => (
                  <div
                    key={p._id}
                    className="rounded-2xl border border-slate-200 bg-white/90 p-4 transition hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Link to={`/forum/${p._id}`} className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-900">{p.title}</div>
                        <div className="mt-1 line-clamp-2 text-sm text-slate-600">{p.body}</div>
                      </Link>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</div>
                        {isAdmin ? (
                          <IconButton
                            aria-label="Delete post"
                            tone="danger"
                            onClick={async (e) => {
                              e.preventDefault();
                              if (!confirm("Delete this post?")) return;
                              setLoadingList(true);
                              setErr(null);
                              try {
                                await apiFetch(`/api/forum/${p._id}`, { method: "DELETE", token });
                                await loadLatest(1);
                              } catch (e2) {
                                setErr(e2 instanceof Error ? e2.message : "Delete failed");
                              } finally {
                                setLoadingList(false);
                              }
                            }}
                          >
                            <TrashIcon />
                          </IconButton>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(p.tags || []).slice(0, 6).map((t) => (
                        <Pill key={t}>{t}</Pill>
                      ))}
                      {p.author?.name ? <Pill>by {p.author.name}</Pill> : null}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <Button variant="ghost" disabled={loadingList || page <= 1} onClick={() => loadPage(page - 1)}>
                Prev
              </Button>
              <div className="text-xs text-slate-500">Page {page}</div>
              <Button variant="ghost" disabled={loadingList || !hasMore} onClick={() => loadPage(page + 1)}>
                Next
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardBody>
            <div className="text-sm font-semibold text-slate-900">Create a post</div>
            <div className="mt-1 text-sm text-slate-600">Keep it respectful and privacy-safe.</div>

            <form
              className="mt-4 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!canPost) return;
                setPosting(true);
                setErr(null);
                try {
                  await apiFetch("/api/forum", {
                    method: "POST",
                    token,
                    body: JSON.stringify({
                      title,
                      body,
                      tags: tags
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean)
                        .slice(0, 8),
                    }),
                  });
                  setTitle("");
                  setBody("");
                  setTags("");
                  await loadLatest(1);
                } catch (e2) {
                  setErr(e2 instanceof Error ? e2.message : "Post failed");
                } finally {
                  setPosting(false);
                }
              }}
            >
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short and clear" />
              </div>
              <div>
                <Label>Body</Label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Share your experience or ask a question..." />
              </div>
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. diet, protein, egfr" />
              </div>
              {!canPost ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  Please fill in <span className="font-semibold">Title</span> and <span className="font-semibold">Body</span>.
                </div>
              ) : null}
              <Button type="submit" disabled={!canPost || posting} className="w-full">
                {posting ? "Posting..." : "Post"}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

