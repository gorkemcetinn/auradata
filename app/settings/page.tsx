"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../app/utils/supabase";
import { LogOut, ArrowLeft, Loader2, Save, User } from "lucide-react";
import ThemeToggle from "../../app/components/ThemeToggle";
import LanguageToggle from "../../app/components/LanguageToggle";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --cream:        #faf8f5;
    --cream-dark:   #f0ebe4;
    --ink:          #111110;
    --ink-soft:     #4a4845;
    --ink-muted:    #999490;
    --rose:         #c97b5a;
    --border:       rgba(17,17,16,0.08);
    --border-mid:   rgba(17,17,16,0.14);
    --border-strong:rgba(17,17,16,0.22);
    --white:        #ffffff;
    --green:        #4a7c6f;
  }

  body { background: var(--cream); font-family: 'DM Sans', sans-serif; color: var(--ink); }

  .settings-root { min-height: 100vh; display: flex; flex-direction: column; background: var(--cream); }

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
    font-family: 'Playfair Display', serif; font-size: 1.2rem; color: var(--cream); font-style: italic; cursor: pointer;
  }
  .topbar-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; color: var(--ink); letter-spacing: 0.02em; }
  
  .user-menu { position: relative; display: flex; align-items: center; gap: 1rem; }
  .user-avatar {
    width: 36px; height: 36px; border-radius: 50%; background: var(--cream-dark);
    border: 0.5px solid var(--border-mid); display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 0.85rem; font-weight: 500; color: var(--ink-soft); transition: border-color 0.18s; overflow: hidden;
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
    border: none; background: none; width: 100%; text-align: left; text-decoration: none;
  }
  .user-dropdown-item:hover { background: var(--cream); color: var(--ink); }
  .user-dropdown-item.danger:hover { background: #fef3f0; color: var(--rose); }

  /* ── MAIN CONTENT ── */
  .main-content { flex: 1; padding: 4rem 2rem; max-width: 800px; margin: 0 auto; width: 100%; }
  
  .settings-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 3rem; }
  .back-btn { background: transparent; border: none; cursor: pointer; color: var(--ink-soft); display: flex; padding: 0.5rem; border-radius: 4px; }
  .back-btn:hover { background: var(--cream-dark); color: var(--ink); }
  .settings-title { font-family: 'Playfair Display', serif; font-size: 2.2rem; font-weight: 400; line-height: 1.1; }
  
  .settings-card {
    background: var(--white); border: 0.5px solid var(--border-mid); border-radius: 6px;
    padding: 2.5rem; box-shadow: 0 4px 20px rgba(17,17,16,0.04);
  }

  .form-group { margin-bottom: 1.5rem; }
  .form-label { display: block; font-size: 0.8rem; color: var(--ink-soft); margin-bottom: 0.5rem; }
  .form-input {
    width: 100%; padding: 0.75rem 1rem; font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
    color: var(--ink); background: var(--cream); border: 0.5px solid var(--border-mid); border-radius: 4px;
    outline: none; transition: border-color 0.2s;
  }
  .form-input:focus { border-color: var(--ink); }
  .form-input:disabled { opacity: 0.6; cursor: not-allowed; }

  .btn-primary {
    background: var(--ink); color: var(--cream); border: none; padding: 0.85rem 1.5rem;
    font-family: 'DM Sans', sans-serif; font-size: 0.8rem; font-weight: 400; letter-spacing: 0.08em; text-transform: uppercase;
    cursor: pointer; border-radius: 2px; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem; margin-top: 2rem;
  }
  .btn-primary:hover { background: var(--rose); transform: translateY(-1px); }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

  /* Loading */
  .loading-container { display: flex; align-items: center; justify-content: center; min-height: 50vh; color: var(--rose); }

  /* ── TOAST ── */
  .toast {
    position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%);
    background: var(--ink); color: var(--cream);
    padding: 0.625rem 1.25rem; border-radius: 3px;
    font-size: 0.78rem; letter-spacing: 0.06em;
    z-index: 999; pointer-events: none;
    animation: toastIn 0.25s ease forwards;
  }
  .toast.error { background: var(--rose); }
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(8px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
`;

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "error" } | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const showToast = (msg: string, type: "ok" | "error" = "ok") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      if (!sessionUser) {
        router.replace("/login");
        return;
      }
      
      setUser({
        id: sessionUser.id,
        name: sessionUser.user_metadata?.full_name || sessionUser.email?.split("@")[0],
        email: sessionUser.email,
        avatar: sessionUser.user_metadata?.avatar_url
      });
      setName(sessionUser.user_metadata?.full_name || sessionUser.email?.split("@")[0] || "");
      setEmail(sessionUser.email || "");
      setLoading(false);
    };

    fetchUser();
  }, [router]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name }
    });

    if (error) {
      showToast("Güncellenirken hata oluştu: " + error.message, "error");
    } else {
      showToast("Profil güncellendi ✦");
      setUser((prev: any) => ({ ...prev, name }));
    }
    setSaving(false);
  };

  const AvatarEl = () => {
    if (user?.avatar) return <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}/>;
    const initials = String(user?.name || "?").substring(0, 2).toUpperCase();
    return <span>{initials}</span>;
  };

  return (
    <>
      <style>{styles}</style>
      <div className="settings-root">
        
        {/* TOPBAR */}
        <header className="topbar">
          <div className="topbar-brand">
            <div className="topbar-logo" onClick={() => router.push("/")} title="Ana Sayfaya Dön">A</div>
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
              <div className="settings-header">
                <button className="back-btn" onClick={() => router.push("/dashboard")} title="Geri Dön">
                  <ArrowLeft size={24} />
                </button>
                <h1 className="settings-title">Profil Ayarları</h1>
              </div>

              <div className="settings-card">
                <div className="form-group">
                  <label className="form-label">Ad Soyad</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Adınızı girin"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">E-posta Adresi</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={email} 
                    disabled 
                    title="E-posta adresi değiştirilemez"
                  />
                </div>

                <button className="btn-primary" onClick={handleSave} disabled={saving || !name.trim()}>
                  {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
                  Kaydet
                </button>
              </div>
            </>
          )}
        </main>
        
        {toast && <div className={`toast${toast.type === "error" ? " error" : ""}`}>{toast.msg}</div>}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
