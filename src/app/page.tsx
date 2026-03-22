'use client';
import { useState } from 'react';
import { Star, Heart, BookOpen, Music, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const BLOG_POSTS = [
  {
    id: 'national-anthem',
    title: 'The Star-Spangled Banner',
    subtitle: 'Our National Anthem — Words That Unite a Nation',
    icon: Music,
    tag: 'National Heritage',
    tagColor: 'bg-blue-700 text-white',
    excerpt: 'O say can you see, by the dawn\'s early light, what so proudly we hailed at the twilight\'s last gleaming...',
  },
  {
    id: 'why-we-love-america',
    title: 'Why We Love America',
    subtitle: 'Land of the Free, Home of the Brave',
    icon: Heart,
    tag: 'Editorial',
    tagColor: 'bg-red-700 text-white',
    excerpt: 'From sea to shining sea, America stands as a beacon of freedom, opportunity, and the enduring spirit of democracy...',
  },
  {
    id: 'greatest-patriots',
    title: 'The Greatest Patriots',
    subtitle: 'Heroes Who Built This Great Nation',
    icon: Star,
    tag: 'History',
    tagColor: 'bg-amber-700 text-white',
    excerpt: 'From the founding fathers to today\'s service members, the patriots who shaped this nation inspire us every day...',
  },
];

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
    setEmail('');
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-[hsl(213,62%,22%)] text-white -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 px-8 py-16 mb-10">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-blue-200/70 text-sm font-semibold uppercase tracking-[0.3em] mb-3">
            United States of America
          </p>
          <h1 className="text-4xl md:text-5xl font-black mb-5 text-white" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
            Land of the Free,<br />Home of the Brave
          </h1>
          <p className="text-blue-100/80 text-lg leading-relaxed max-w-2xl mx-auto">
            A celebration of the greatest nation on earth — its values, its heroes, and the enduring spirit that makes America the beacon of liberty for the world.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-blue-200/50 text-sm">
            <Star className="w-4 h-4" />
            <span>Life, Liberty, and the Pursuit of Happiness</span>
            <Star className="w-4 h-4" />
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="mb-16">
        <div className="flex items-center gap-2 mb-6 border-b-2 border-[hsl(213,62%,22%)] pb-2">
          <BookOpen className="w-5 h-5 text-[hsl(213,62%,22%)]" />
          <h2 className="text-lg font-bold uppercase tracking-wider" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
            Latest Articles
          </h2>
        </div>

        <div className="space-y-0 border border-gray-200 rounded-sm overflow-hidden bg-white">
          {BLOG_POSTS.map((post, i) => (
            <Link href={`/blog/${post.id}`} key={post.id}>
              <article className={`group flex items-start gap-5 p-6 hover:bg-blue-50/50 transition-colors cursor-pointer ${i > 0 ? 'border-t border-gray-200' : ''}`}>
                <div className="flex-shrink-0 w-12 h-12 rounded bg-[hsl(213,62%,22%)]/10 flex items-center justify-center mt-1">
                  <post.icon className="w-6 h-6 text-[hsl(213,62%,22%)]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-sm font-semibold ${post.tagColor}`}>{post.tag}</span>
                  </div>
                  <h3 className="text-xl font-bold text-[hsl(213,62%,22%)] group-hover:text-[hsl(213,72%,35%)] transition-colors mb-0.5" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">{post.subtitle}</p>
                  <p className="text-gray-600 leading-relaxed text-sm">{post.excerpt}</p>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[hsl(213,62%,22%)] transition-colors flex-shrink-0 mt-4" />
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* Pledge */}
      <section className="bg-white border border-gray-200 rounded-sm p-8 mb-16">
        <blockquote className="text-center">
          <p className="text-xl md:text-2xl text-[hsl(213,62%,22%)] leading-relaxed" style={{ fontFamily: 'Merriweather, Georgia, serif', fontStyle: 'italic' }}>
            &ldquo;I pledge allegiance to the Flag of the United States of America, and to the Republic for which it stands, one Nation under God, indivisible, with liberty and justice for all.&rdquo;
          </p>
          <footer className="mt-4 text-sm text-gray-500 font-semibold uppercase tracking-widest">
            — The Pledge of Allegiance
          </footer>
        </blockquote>
      </section>

      {/* Newsletter */}
      <section className="bg-[hsl(213,62%,22%)] text-white -mx-4 sm:-mx-6 lg:-mx-8 px-8 py-12 text-center">
        <h3 className="text-lg font-bold mb-2 text-white" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>Stay Connected, Patriot</h3>
        <p className="text-blue-100/70 text-sm mb-6">Join our newsletter for stories that celebrate the American spirit.</p>

        {subscribed ? (
          <div className="flex items-center justify-center gap-2 text-emerald-300 text-sm font-semibold">
            <Heart className="w-4 h-4" /> Thank you for subscribing! God bless America! 🇺🇸
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              className="flex-1 px-4 py-2.5 bg-white text-gray-800 rounded-sm text-sm border-0 focus:ring-2 focus:ring-blue-300"
            />
            <button type="submit" className="px-6 py-2.5 bg-red-700 text-white font-semibold rounded-sm hover:bg-red-600 transition-colors text-sm">
              Subscribe
            </button>
          </form>
        )}
      </section>

      {/* Footer */}
      <footer className="py-8 text-center -mx-4 sm:-mx-6 lg:-mx-8 px-4 border-t border-gray-200 bg-white mt-0">
        <p className="text-xs text-gray-400">
          🇺🇸 God Bless America · E Pluribus Unum · In God We Trust 🇺🇸
        </p>
      </footer>
    </div>
  );
}
