import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Heart, X, Sparkles, Users, Home, MapPin, RotateCcw, ArrowRight, MessageCircle, ChevronLeft } from 'lucide-react';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}
function App() {
  const [tab, setTab] = useState('discover');
  const [feed, setFeed] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matchPopup, setMatchPopup] = useState(null);
  const [moving, setMoving] = useState('');
  const [swipeCount, setSwipeCount] = useState(0);
  const touchStart = useRef(null);

  const refresh = async () => {
    setLoading(true); setError('');
    try { const [f, m] = await Promise.all([api('/feed'), api('/matches')]); setFeed(f); setMatches(m); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const swipe = async (action) => {
    if (!feed.length || moving) return;
    const profile = feed[0];
    setMoving(action === 'like' ? 'right' : 'left');
    try {
      const result = await api('/swipe', { method: 'POST', body: JSON.stringify({ profileId: profile.id, action }) });
      setTimeout(() => {
        setFeed(current => current.filter(p => p.id !== profile.id));
        setMoving(''); setSwipeCount(c => c + 1);
        if (result.matched && result.match) { setMatches(current => [result.match, ...current.filter(m => m.id !== result.match.id)]); setMatchPopup(result.match); }
      }, 220);
    } catch (e) { setMoving(''); setError(e.message); }
  };
  const onTouchStart = (e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy)) swipe(dx > 0 ? 'like' : 'pass');
  };
  const resetDemo = async () => { if (!confirm('Reset all demo swipes and matches?')) return; try { await api('/demo/reset', { method: 'POST' }); setSwipeCount(0); setMatchPopup(null); await refresh(); } catch(e) { setError(e.message); } };

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark"><Heart size={19} fill="currentColor"/></span><span>coy</span><span className="brand-dot">.</span></div><div className="top-label"><Sparkles size={15}/> Find your spark</div><button className="reset-button" title="Reset demo" onClick={resetDemo}><RotateCcw size={16}/><span>Reset</span></button></header>
    <main className="main-content">
      {error && <div className="error-banner">{error}<button onClick={() => setError('')}>Dismiss</button></div>}
      {tab === 'home' && <section className="home-view"><div className="home-icon"><Heart fill="currentColor"/></div><h1>Welcome to Coy</h1><p>Your space for meaningful connections. Explore profiles and discover your spark.</p><button className="primary-button" onClick={() => setTab('discover')}>Start discovering <ArrowRight size={17}/></button></section>}
      {tab === 'discover' && <section className="discover-view"><div className="section-heading"><div><p className="eyebrow">YOUR NEXT CONNECTION</p><h1>Discover <span className="heading-heart">♥</span></h1></div><div className="profile-counter"><Sparkles size={14}/>{feed.length} left</div></div><p className="section-subtitle">A little curiosity can go a long way.</p>
        {loading ? <div className="loading-card"><div className="spinner"/><p>Finding people for you…</p></div> : feed.length ? <div className="card-stage"><div className="profile-card" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ transform: moving === 'right' ? 'translateX(120%) rotate(18deg)' : moving === 'left' ? 'translateX(-120%) rotate(-18deg)' : undefined, opacity: moving ? 0.3 : 1 }}><div className="photo-wrap"><img src={feed[0].photo} alt={`${feed[0].name}'s profile`} onError={(e)=>{e.currentTarget.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85'}}/><div className="photo-gradient"/><div className="card-top-tag"><Sparkles size={14}/> Discover</div><div className="profile-info"><h2>{feed[0].name}, <span>{feed[0].age}</span></h2><div className="location-line"><MapPin size={15}/>{feed[0].city}</div><p className="bio">{feed[0].bio}</p><div className="interest-list">{feed[0].interests.map(i=><span className="interest" key={i}>{i}</span>)}</div></div>{moving==='right'&&<div className="stamp like-stamp">LIKE</div>}{moving==='left'&&<div className="stamp pass-stamp">PASS</div>}</div></div><div className="action-buttons"><button className="action pass" onClick={()=>swipe('pass')} disabled={!!moving} aria-label="Pass"><X size={25}/></button><button className="action like" onClick={()=>swipe('like')} disabled={!!moving} aria-label="Like"><Heart size={27} fill="currentColor"/></button></div><p className="swipe-hint"><span>←</span> Pass <span className="hint-divider">·</span> Like <span>→</span></p></div> : <div className="empty-state"><div className="empty-heart"><Heart size={30}/></div><h2>You've seen everyone!</h2><p>You've reached the end of today's discovery list. Come back soon for new people.</p><button className="primary-button" onClick={resetDemo}><RotateCcw size={16}/> Restart demo</button></div>}
      </section>}
      {tab === 'matches' && <section className="matches-view"><div className="section-heading"><div><p className="eyebrow">THE GOOD PART</p><h1>Your matches <span className="heading-heart">♥</span></h1></div><div className="profile-counter"><Heart size={14}/>{matches.length}</div></div><p className="section-subtitle">Only mutual likes appear here.</p>{loading ? <div className="loading-card"><div className="spinner"/></div> : matches.length ? <div className="match-grid">{matches.map(m=><div className="match-card" key={m.id}><img src={m.photo} alt={m.name}/><div className="match-info"><h3>{m.name}, {m.age}</h3><p><MapPin size={13}/>{m.city}</p><div className="match-badge"><Heart size={12} fill="currentColor"/> Mutual match</div></div></div>)}</div> : <div className="empty-state matches-empty"><div className="empty-heart"><Users size={30}/></div><h2>No matches yet</h2><p>When someone you've liked likes you back, you'll find them here.</p><button className="primary-button" onClick={()=>setTab('discover')}>Explore profiles <ArrowRight size={16}/></button></div>}</section>}
    </main>
    <nav className="bottom-nav"><button className={tab==='home'?'nav-item active':'nav-item'} onClick={()=>setTab('home')}><Home size={21}/><span>Home</span></button><button className={tab==='discover'?'nav-item active':'nav-item'} onClick={()=>setTab('discover')}><Sparkles size={21}/><span>Discover</span></button><button className={tab==='matches'?'nav-item active':'nav-item'} onClick={()=>setTab('matches')}><Heart size={21}/><span>Matches</span>{matches.length>0&&<span className="nav-count">{matches.length}</span>}</button></nav>
    {matchPopup && <div className="modal-backdrop" onClick={()=>setMatchPopup(null)}><div className="match-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setMatchPopup(null)}><X size={18}/></button><div className="celebration"><span>♥</span><span>✦</span><span>♥</span></div><p className="eyebrow">IT'S MUTUAL</p><h2>It's a match!</h2><div className="match-photo"><img src={matchPopup.photo} alt={matchPopup.name}/></div><p className="match-copy">You and <strong>{matchPopup.name}</strong> liked each other. That's a lovely start.</p><button className="primary-button" onClick={()=>{setMatchPopup(null);setTab('matches')}}>See your matches <ArrowRight size={17}/></button><button className="text-button" onClick={()=>setMatchPopup(null)}>Keep discovering</button></div></div>}
    <footer className="footer"><span>Made for meaningful connections</span><span>{swipeCount} swipe{swipeCount===1?'':'s'} this session</span></footer>
  </div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
