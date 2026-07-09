"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../utils/supabase";
import {
  Plus, FileBarChart, Trash2, Clock, LogOut, Loader2, LayoutTemplate, Sparkles
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import LanguageToggle from "../components/LanguageToggle";

/* ─────────────────────────────────────────────
   AuraData Design Tokens — Tüm siteyle uyumlu
───────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }



  body { background: var(--cream); font-family: 'DM Sans', sans-serif; color: var(--ink); }

  .dash-root { min-height: 100vh; display: flex; flex-direction: column; background: var(--cream); }

  /* ── TOPBAR ── */
  .topbar {
    height: 64px; background: var(--white); border-bottom: 0.5px solid var(--border-mid);
    display: flex; align-items: center; justify-content: space-between; padding: 0 2rem;
    position: sticky; top: 0; z-index: 50;
  }
  .topbar-brand { display: flex; align-items: center; gap: 1rem; }
  .topbar-logo {
    width: 36px; height: 36px; background: var(--ink); border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Playfair Display', serif; font-size: 1.2rem; color: var(--cream); font-style: italic;
  }
  .topbar-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; color: var(--ink); letter-spacing: 0.02em; }
  
  /* User Menu */
  .user-menu { position: relative; display: flex; align-items: center; gap: 1rem; }
  .user-avatar {
    width: 36px; height: 36px; border-radius: 50%; background: var(--cream-dark);
    border: 0.5px solid var(--border-mid); display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 0.85rem; font-weight: 500; color: var(--ink-soft); transition: border-color 0.18s;
  }
  .user-avatar:hover { border-color: var(--rose); }
  .user-dropdown {
    position: absolute; top: calc(100% + 10px); right: 0; background: var(--white);
    border: 0.5px solid var(--border-mid); border-radius: 4px; min-width: 200px;
    box-shadow: 0 8px 24px rgba(17,17,16,0.08); z-index: 50; overflow: hidden;
  }
  .user-dropdown-header { padding: 1rem; border-bottom: 0.5px solid var(--border); }
  .user-dropdown-name { font-size: 0.85rem; font-weight: 500; color: var(--ink); }
  .user-dropdown-email { font-size: 0.75rem; color: var(--ink-muted); margin-top: 2px; }
  .user-dropdown-item {
    display: flex; align-items: center; gap: 0.625rem; padding: 0.75rem 1rem;
    font-size: 0.8rem; color: var(--ink-soft); cursor: pointer; transition: background 0.15s;
    border: none; background: none; width: 100%; text-align: left;
  }
  .user-dropdown-item:hover { background: var(--cream); color: var(--ink); }
  .user-dropdown-item.danger:hover { background: #fef3f0; color: var(--rose); }

  /* ── MAIN CONTENT ── */
  .main-content { flex: 1; padding: 4rem 2rem; max-width: 1200px; margin: 0 auto; width: 100%; }
  
  .dash-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 3rem; }
  .dash-title-wrap { display: flex; flex-direction: column; gap: 0.5rem; }
  .dash-eyebrow { font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--rose); display: flex; align-items: center; gap: 0.5rem; }
  .dash-eyebrow::before { content: ''; width: 24px; height: 1px; background: var(--rose); display: block; }
  .dash-title { font-family: 'Playfair Display', serif; font-size: 2.5rem; font-weight: 400; line-height: 1.1; }
  .dash-title em { font-style: italic; color: var(--rose); }
  
  .btn-primary {
    background: var(--ink); color: var(--cream); border: none; padding: 0.85rem 1.5rem;
    font-family: 'DM Sans', sans-serif; font-size: 0.8rem; font-weight: 400; letter-spacing: 0.08em; text-transform: uppercase;
    cursor: pointer; border-radius: 2px; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem;
  }
  .btn-primary:hover { background: var(--rose); transform: translateY(-1px); }

  /* ── GRID & CARDS ── */
  .reports-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 2rem; }
  
  .report-card {
    background: var(--white); border: 0.5px solid var(--border-mid); border-radius: 6px;
    overflow: hidden; transition: all 0.25s ease; cursor: pointer; position: relative;
    box-shadow: var(--shadow-card); display: flex; flex-direction: column;
  }
  .report-card:hover { border-color: var(--rose); transform: translateY(-4px); box-shadow: 0 12px 32px rgba(201,123,90,0.1); }
  
  .report-preview {
    height: 160px; background-color: var(--cream-dark);
    background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 20px 20px; display: flex; align-items: center; justify-content: center;
    border-bottom: 0.5px solid var(--border); color: var(--ink-muted); position: relative;
  }
  .report-card:hover .report-preview { color: var(--rose); }
  
  .report-info { padding: 1.25rem; flex: 1; display: flex; flex-direction: column; }
  .report-name { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 500; color: var(--ink); margin-bottom: 0.5rem; line-height: 1.3; }
  .report-date { font-size: 0.72rem; color: var(--ink-muted); display: flex; align-items: center; gap: 0.375rem; margin-bottom: 1rem; }
  
  .report-actions { display: flex; justify-content: flex-end; margin-top: auto; border-top: 0.5px solid var(--border); padding-top: 1rem; }
  .btn-delete {
    background: transparent; border: none; color: var(--ink-muted); cursor: pointer; padding: 0.4rem;
    border-radius: 4px; transition: all 0.15s; display: flex; align-items: center; justify-content: center;
  }
  .btn-delete:hover { background: #fef3f0; color: var(--rose); }

  /* ── EMPTY STATE ── */
  .empty-state { text-align: center; padding: 6rem 2rem; background: var(--white); border: 0.5px dashed var(--border-strong); border-radius: 8px; }
  .empty-state-icon { margin: 0 auto 1.5rem; color: var(--border-strong); }
  .empty-state-title { font-family: 'Playfair Display', serif; font-size: 1.5rem; color: var(--ink); margin-bottom: 0.75rem; }
  .empty-state-desc { font-size: 0.9rem; color: var(--ink-soft); max-width: 400px; margin: 0 auto 2rem; line-height: 1.6; }

  /* Loading */
  .loading-container { display: flex; align-items: center; justify-content: center; min-height: 50vh; color: var(--rose); }

  /* ── MOBILE RESPONSIVE ── */
  @media (max-width: 768px) {
    .dash-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1.5rem;
    }
    .main-content {
      padding: 2rem 1rem;
    }
    .reports-grid {
      grid-template-columns: 1fr;
    }
    .topbar {
      padding: 0 1rem;
    }
    .dash-title {
      font-size: 1.8rem;
    }
  }
`;

interface Report {
  id: string;
  title: string;
  updated_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Verileri çekme
  useEffect(() => {
    const fetchDashboard = async () => {
      // 1. Kullanıcıyı al
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      setUser({
        name: user.user_metadata?.full_name || user.email?.split("@")[0],
        email: user.email,
        avatar: user.user_metadata?.avatar_url
      });

      // 2. Raporları al (En son güncellenene göre sıralı)
      const { data: reportsData, error } = await supabase
        .from("reports")
        .select("id, title, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (!error && reportsData) {
        setReports(reportsData);
      }
      setLoading(false);
    };

    fetchDashboard();
  }, [router]);

  // Dropdown dışı tıklama
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Silme işlemi
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Kartın tıklama olayını (canvas'a gitmeyi) engeller
    const confirmDelete = window.confirm("Bu raporu silmek istediğinize emin misiniz?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("reports").delete().eq("id", id);
    if (!error) {
      setReports((prev) => prev.filter((r) => r.id !== id));
    } else {
      alert("Silinirken bir hata oluştu.");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  // Avatar Component
  const AvatarEl = () => {
    if (user?.avatar) return <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />;
    const initials = String(user?.name || "?").substring(0, 2).toUpperCase();
    return <span>{initials}</span>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <>
      <style>{styles}</style>
      <div className="dash-root">

        {/* TOPBAR */}
        <header className="topbar">
          <div className="topbar-brand">
            <div className="topbar-logo" onClick={() => router.push("/")} style={{ cursor: "pointer" }} title="Ana Sayfaya Dön">A</div>
            <span className="topbar-title">AuraData</span>
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <ThemeToggle />
            <LanguageToggle />
            <div className="user-menu" ref={userMenuRef}>
              <div className="user-avatar" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <AvatarEl />
              </div>

              {userMenuOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-name">{user?.name}</div>
                    <div className="user-dropdown-email">{user?.email}</div>
                  </div>
                  <button className="user-dropdown-item" onClick={() => router.push("/dashboard")}>
                    Dashboard
                  </button>
                  <button className="user-dropdown-item" onClick={() => router.push("/settings")}>
                    Ayarlar
                  </button>
                  <button className="user-dropdown-item danger" onClick={handleSignOut}>
                    <LogOut size={14} /> Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="main-content">
          {loading ? (
            <div className="loading-container">
              <Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : (
            <>
              <div className="dash-header">
                <div className="dash-title-wrap">
                  <span className="dash-eyebrow"><Sparkles size={12} /> Çalışma Alanı</span>
                  <h1 className="dash-title">Raporlarınız</h1>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    className="btn-primary !bg-[#faf8f5] !text-[#111110] !border !border-[rgba(17,17,16,0.22)] hover:!bg-[#f0ebe4] hover:!border-[#111110]"
                    onClick={() => router.push("/analyzer")}
                  >
                    <Sparkles size={16} className="text-[#c97b5a]" /> Hızlı Analiz
                  </button>
                  <button className="btn-primary" onClick={() => router.push("/canvas")}>
                    <Plus size={16} /> Yeni Rapor
                  </button>
                </div>
              </div>

              {reports.length > 0 ? (
                <div className="reports-grid">
                  {reports.map((report) => (
                    <div key={report.id} className="report-card" onClick={() => router.push(`/canvas?id=${report.id}`)}>
                      <div className="report-preview">
                        <FileBarChart size={48} strokeWidth={1} />
                      </div>
                      <div className="report-info">
                        <h3 className="report-name">{report.title}</h3>
                        <div className="report-date">
                          <Clock size={12} />
                          {formatDate(report.updated_at)}
                        </div>
                        <div className="report-actions">
                          <button
                            className="btn-delete"
                            onClick={(e) => handleDelete(e, report.id)}
                            title="Raporu Sil"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <LayoutTemplate size={64} strokeWidth={0.5} className="empty-state-icon" />
                  <h2 className="empty-state-title">Tuvaliniz bomboş.</h2>
                  <p className="empty-state-desc">
                    Henüz hiçbir rapor oluşturmadınız. Karmaşık verilerinizi saniyeler içinde şık grafiklere dönüştürmek için hemen başlayın.
                  </p>
                  <button className="btn-primary" style={{ margin: "0 auto" }} onClick={() => router.push("/canvas")}>
                    <Plus size={16} /> İlk Raporunu Oluştur
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}