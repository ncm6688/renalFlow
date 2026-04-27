import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Card, CardBody, IconButton, Label, Pill, Textarea, TrashIcon } from "../components/ui";
import { apiFetch } from "../lib/http";
import { useAuth } from "../store/auth";

type Post = {
  _id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  author?: { name?: string; email?: string };
};

type Comment = {
  _id: string;
  body: string;
  createdAt: string;
  author?: { name?: string; email?: string };
};

export function PostPage() {
  const { id } = useParams();
  const token = useAuth((s) => s.accessToken) || "";
  const me = useAuth((s) => s.user);
  const isAdmin = me?.role === "admin";
  const navToForum = "/forum";

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [body, setBody] = useState("");

  async function load() {
    if (!id) return;
    setLoading(true);
    setErr(null);
    try {
      const p = await apiFetch<{ post: Post }>(`/api/forum/${id}`, { method: "GET" });
      const c = await apiFetch<{ comments: Comment[] }>(`/api/forum/${id}/comments?limit=200`, { method: "GET" });
      setPost(p.post);
      setComments(c.comments || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load post");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const canReply = useMemo(() => body.trim().length >= 2, [body]);

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="mb-3">
          <Link to="/forum" className="text-sm font-semibold text-[#5E8F76] hover:text-[#4E7E67]">
            ← Back to forum
          </Link>
        </div>

        <Card>
          <CardBody>
            {err ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{err}</div>
            ) : null}

            {!post ? (
              <div className="text-sm text-slate-600">{loading ? "Loading..." : "Post not found."}</div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xl font-semibold tracking-tight text-slate-900">{post.title}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      {post.author?.name ? `by ${post.author.name} · ` : ""}
                      {new Date(post.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-start justify-end gap-2">
                    {(post.tags || []).slice(0, 8).map((t) => (
                      <Pill key={t}>{t}</Pill>
                    ))}
                    {isAdmin ? (
                      <IconButton
                        aria-label="Delete post"
                        tone="danger"
                        onClick={async () => {
                          if (!id) return;
                          if (!confirm("Delete this post?")) return;
                          setLoading(true);
                          setErr(null);
                          try {
                            await apiFetch(`/api/forum/${id}`, { method: "DELETE", token });
                            window.location.href = navToForum;
                          } catch (e2) {
                            setErr(e2 instanceof Error ? e2.message : "Delete failed");
                          } finally {
                            setLoading(false);
                          }
                        }}
                      >
                        <TrashIcon />
                      </IconButton>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
                  {post.body}
                </div>
              </>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-slate-900">Replies</div>
              <Button variant="ghost" onClick={load} disabled={loading}>
                Refresh
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {comments.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">
                  No replies yet.
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c._id} className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900">{c.author?.name || "User"}</div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleString()}</div>
                        {isAdmin ? (
                          <button
                            className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                            onClick={async () => {
                              if (!id) return;
                              setLoading(true);
                              setErr(null);
                              try {
                                await apiFetch(`/api/forum/${id}/comments/${c._id}`, { method: "DELETE", token });
                                await load();
                              } catch (e) {
                                setErr(e instanceof Error ? e.message : "Delete failed");
                              } finally {
                                setLoading(false);
                              }
                            }}
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{c.body}</div>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardBody>
            <div className="text-sm font-semibold text-slate-900">Write a reply</div>
            <div className="mt-1 text-sm text-slate-600">Avoid sharing personal identifiers.</div>

            <form
              className="mt-4 space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!id || !canReply) return;
                setLoading(true);
                setErr(null);
                try {
                  await apiFetch(`/api/forum/${id}/comments`, {
                    method: "POST",
                    token,
                    body: JSON.stringify({ body }),
                  });
                  setBody("");
                  await load();
                } catch (e2) {
                  setErr(e2 instanceof Error ? e2.message : "Reply failed");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <div>
                <Label>Reply</Label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={7} placeholder="Write something helpful..." />
              </div>
              {err ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{err}</div>
              ) : null}
              <Button type="submit" disabled={!canReply || loading} className="w-full">
                {loading ? "Posting..." : "Post reply"}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

