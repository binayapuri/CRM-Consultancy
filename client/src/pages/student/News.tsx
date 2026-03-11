import { useState, useEffect } from 'react';
import { Newspaper, Calendar, Eye, ArrowRight, Tag } from 'lucide-react';

interface Article {
  _id: string;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  coverImage?: string;
  category: string;
  tags: string[];
  publishedAt: string;
  views: number;
}

export default function News() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/news')
      .then(res => res.json())
      .then(data => {
        setArticles(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const formatCategory = (cat: string) => cat.replace('_', ' ');

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <div className="mb-10">
        <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Visa News & Updates</h1>
        <p className="text-slate-500 mt-1">Stay informed with the latest immigration changes and guides from verified sources.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
             <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-ori-500 border-t-transparent animate-spin" /></div>
          ) : articles.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
               <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                 <Newspaper className="w-8 h-8 text-slate-300" />
               </div>
               <h3 className="text-lg font-bold text-slate-900 mb-1">No news published yet</h3>
               <p className="text-slate-500 font-medium">We'll update this space soon.</p>
            </div>
          ) : (
            <div className="space-y-4">
            {articles.map((article) => (
              <div key={article._id} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col sm:flex-row">
                {article.coverImage ? (
                  <div className="sm:w-2/5 h-48 sm:h-auto overflow-hidden relative">
                    <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-[10px] font-bold uppercase tracking-wider">
                      {formatCategory(article.category)}
                    </div>
                  </div>
                ) : (
                  <div className="sm:w-2/5 h-48 sm:h-auto bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center border-r border-slate-100 relative overflow-hidden">
                    <Newspaper className="w-12 h-12 text-slate-300 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-4 left-4 px-3 py-1 bg-white/80 backdrop-blur-md rounded-full text-slate-800 text-[10px] font-bold uppercase tracking-wider border border-slate-200 shadow-sm">
                      {formatCategory(article.category)}
                    </div>
                  </div>
                )}
                
                <div className="p-6 sm:w-3/5 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-display font-bold text-slate-900 leading-tight mb-3 group-hover:text-ori-600 transition-colors">
                      {article.title}
                    </h2>
                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-4">
                      {article.summary || article.content}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-4 mt-auto">
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md uppercase">
                          <Tag className="w-3 h-3" /> {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(article.publishedAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> {article.views} reads</span>
                      </div>
                      <button className="flex items-center gap-1 text-sm font-bold text-ori-600 group-hover:translate-x-1 transition-transform">
                        Read <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-8 text-white relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
            <h3 className="text-xl font-display font-bold mb-2 relative z-10">Subscribe to Alerts</h3>
            <p className="text-slate-400 text-sm mb-6 relative z-10">Get instant updates on skilled migration changes and visa allocations.</p>
            <form className="relative z-10 space-y-3">
              <input type="email" placeholder="Your email address" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:border-ori-500 transition" />
              <button type="button" className="w-full py-3 rounded-xl bg-white text-slate-900 font-bold hover:bg-ori-400 hover:text-white transition-colors">Notify Me</button>
            </form>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">Trending Topics</h3>
            </div>
            <div className="p-2">
              {['189 Visa Invites', 'State Sponsorship 190', '485 Extension Removed', 'Student Visa English Requirements'].map((topic, i) => (
                <div key={i} className="px-4 py-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-ori-100 text-ori-600 flex items-center justify-center text-xs font-bold shrink-0">{i+1}</div>
                  <span className="text-sm font-medium text-slate-700">{topic}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
