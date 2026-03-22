'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Star, Heart, Music, ArrowLeft, ChevronRight } from 'lucide-react';

const POSTS: Record<string, { title: string; subtitle: string; tag: string; tagColor: string; icon: React.ElementType; content: React.ReactNode }> = {
  'national-anthem': {
    title: 'The Star-Spangled Banner',
    subtitle: 'Our National Anthem — Words That Unite a Nation',
    tag: 'National Heritage',
    tagColor: 'bg-blue-700 text-white',
    icon: Music,
    content: (
      <div className="space-y-8">
        <p className="text-gray-700 leading-relaxed text-lg">
          Written by Francis Scott Key on September 14, 1814, during the Battle of Baltimore in the War of 1812. As the British Royal Navy bombarded Fort McHenry, Key watched from a ship in the harbor. When the dawn came and the American flag still flew over the fort, he was inspired to write the words that would become our national anthem.
        </p>

        <div className="bg-[hsl(213,62%,22%)] text-white rounded-sm p-8 space-y-8">
          {[
            { num: 'I', lines: "O say can you see, by the dawn's early light,\nWhat so proudly we hail'd at the twilight's last gleaming,\nWhose broad stripes and bright stars through the perilous fight\nO'er the ramparts we watch'd were so gallantly streaming?\nAnd the rocket's red glare, the bombs bursting in air,\nGave proof through the night that our flag was still there.\nO say does that star-spangled banner yet wave\nO'er the land of the free and the home of the brave?" },
            { num: 'II', lines: "On the shore dimly seen through the mists of the deep\nWhere the foe's haughty host in dread silence reposes,\nWhat is that which the breeze, o'er the towering steep,\nAs it fitfully blows, half conceals, half discloses?\nNow it catches the gleam of the morning's first beam,\nIn full glory reflected now shines in the stream:\n'Tis the star-spangled banner, O long may it wave\nO'er the land of the free and the home of the brave." },
            { num: 'III', lines: "And where is that band who so vauntingly swore,\nThat the havoc of war and the battle's confusion\nA home and a Country should leave us no more?\nTheir blood has wash'd out their foul footstep's pollution.\nNo refuge could save the hireling and slave\nFrom the terror of flight or the gloom of the grave:\nAnd the star-spangled banner in triumph doth wave\nO'er the land of the free and the home of the brave." },
            { num: 'IV', lines: "O thus be it ever when freemen shall stand\nBetween their lov'd home and the war's desolation!\nBlest with vict'ry and peace may the heav'n rescued land\nPraise the power that hath made and preserv'd us a nation!\nThen conquer we must, when our cause it is just,\nAnd this be our motto — \"In God is our trust\"\nAnd the star-spangled banner in triumph shall wave\nO'er the land of the free and the home of the brave." },
          ].map(v => (
            <div key={v.num}>
              <h3 className="text-blue-200 font-semibold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                <Music className="w-4 h-4" /> Verse {v.num}
              </h3>
              <p className="text-white/90 leading-loose text-lg whitespace-pre-line" style={{ fontFamily: 'Merriweather, Georgia, serif', fontStyle: 'italic' }}>
                {v.lines}
              </p>
            </div>
          ))}
        </div>

        <p className="text-gray-500 text-sm border-l-4 border-blue-700 pl-4">
          The Star-Spangled Banner was officially designated as the national anthem of the United States by a congressional resolution on March 3, 1931. The original manuscript written by Key is preserved at the Maryland Historical Society.
        </p>
      </div>
    ),
  },

  'why-we-love-america': {
    title: 'Why We Love America',
    subtitle: 'Land of the Free, Home of the Brave',
    tag: 'Editorial',
    tagColor: 'bg-red-700 text-white',
    icon: Heart,
    content: (
      <div className="space-y-8">
        <p className="text-gray-700 leading-relaxed text-lg">
          America is more than a country — it is an idea. The idea that all people are created equal, endowed with unalienable rights to life, liberty, and the pursuit of happiness. This idea, born in 1776, has inspired generations and continues to light the way for the world.
        </p>

        <div className="grid md:grid-cols-2 gap-5">
          {[
            { title: 'Freedom & Democracy', desc: 'The United States was founded on the revolutionary principle that government derives its power from the consent of the governed. Our Constitution, the oldest written national constitution still in use, enshrines freedoms of speech, religion, press, and assembly that billions around the world can only dream of.', color: 'border-l-blue-700' },
            { title: 'Innovation & Spirit', desc: "From the Wright brothers' first flight at Kitty Hawk to landing on the Moon, from the invention of the internet to leading the world in medical research — American ingenuity and entrepreneurial spirit have transformed every facet of human civilization.", color: 'border-l-red-700' },
            { title: 'Diversity & Unity', desc: 'E Pluribus Unum — "Out of many, one." America\'s greatest strength is its people. A tapestry woven from every nation, culture, and creed on Earth. Irish, Italian, African, Asian, Latino, and countless other communities have enriched the American story.', color: 'border-l-amber-600' },
            { title: 'Generosity & Service', desc: 'Americans are the most generous people on Earth. From the Marshall Plan that rebuilt Europe after WWII to the billions donated to disaster relief worldwide, the American spirit of giving knows no borders. Our military sacrifices everything to protect freedom around the globe.', color: 'border-l-emerald-700' },
          ].map(item => (
            <div key={item.title} className={`bg-white border border-gray-200 border-l-4 ${item.color} rounded-sm p-6`}>
              <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>{item.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <blockquote className="bg-white border border-gray-200 rounded-sm p-8 text-center">
          <p className="text-xl text-[hsl(213,62%,22%)] leading-relaxed" style={{ fontFamily: 'Merriweather, Georgia, serif', fontStyle: 'italic' }}>
            &ldquo;We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness.&rdquo;
          </p>
          <footer className="mt-4 text-sm text-gray-500 font-semibold uppercase tracking-wider">
            — The Declaration of Independence, July 4, 1776
          </footer>
        </blockquote>

        <p className="text-gray-700 leading-relaxed">
          America is not perfect, and we know it. But the beauty of this country is that we always strive to be better — to form a &ldquo;more perfect union.&rdquo; That restless pursuit of improvement, that refusal to accept the status quo, is what makes America not just great, but truly exceptional.
        </p>

        <p className="text-center text-2xl mt-4">🇺🇸 God Bless America 🇺🇸</p>
      </div>
    ),
  },

  'greatest-patriots': {
    title: 'The Greatest Patriots',
    subtitle: 'Heroes Who Built This Great Nation',
    tag: 'History',
    tagColor: 'bg-amber-700 text-white',
    icon: Star,
    content: (
      <div className="space-y-6">
        <p className="text-gray-700 leading-relaxed text-lg">
          Throughout our history, extraordinary men and women have stepped forward in moments of crisis, answered the call of duty, and shaped the destiny of this great nation.
        </p>

        {[
          { name: 'George Washington', years: '1732–1799', title: 'Father of the Nation', desc: 'Commander-in-Chief of the Continental Army during the American Revolution and the first President. Washington could have been king, but he chose to step down — establishing the tradition of peaceful transfer of power that defines American democracy.' },
          { name: 'Abraham Lincoln', years: '1809–1865', title: 'The Great Emancipator', desc: 'The 16th President preserved the Union during the Civil War and abolished slavery with the Emancipation Proclamation. His Gettysburg Address redefined the purpose of the nation: "government of the people, by the people, for the people."' },
          { name: 'Martin Luther King Jr.', years: '1929–1968', title: 'Champion of Justice', desc: 'Led the Civil Rights Movement with a message of nonviolent resistance and a dream that one day all Americans would be judged not by the color of their skin but by the content of their character.' },
          { name: 'The Service Members', years: '1775–Present', title: 'The Backbone of Freedom', desc: "From the minutemen at Lexington and Concord to today's soldiers, sailors, airmen, and Marines — they protect our freedom with their lives. They are the ultimate patriots, and we owe them everything." },
        ].map((person, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded bg-[hsl(213,62%,22%)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Star className="w-5 h-5 text-[hsl(213,62%,22%)]" />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>{person.name}</h3>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{person.years} · {person.title}</p>
                <p className="text-gray-600 leading-relaxed mt-2 text-sm">{person.desc}</p>
              </div>
            </div>
          </div>
        ))}

        <blockquote className="text-center pt-8 border-t border-gray-200">
          <p className="text-lg text-[hsl(213,62%,22%)]" style={{ fontFamily: 'Merriweather, Georgia, serif', fontStyle: 'italic' }}>
            &ldquo;The price of freedom is eternal vigilance.&rdquo;
          </p>
          <p className="text-sm text-gray-500 mt-2 font-semibold">— Thomas Jefferson</p>
        </blockquote>
      </div>
    ),
  },
};

export default function BlogPost() {
  const params = useParams();
  const slug = params.slug as string;
  const post = POSTS[slug];

  if (!post) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
          <Link href="/" className="text-blue-700 hover:underline font-semibold">← Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <article className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-900 transition-colors mb-6 font-semibold group">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Back to Articles
        </Link>

        {/* Header */}
        <header className="mb-8 border-b border-gray-200 pb-6">
          <span className={`text-xs px-2 py-0.5 rounded-sm font-semibold ${post.tagColor} inline-block mb-3`}>{post.tag}</span>
          <h1 className="text-3xl md:text-4xl font-black mb-2" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>{post.title}</h1>
          <p className="text-gray-500">{post.subtitle}</p>
        </header>

        {/* Content */}
        <div className="prose-invert">
          {post.content}
        </div>

        {/* Related */}
        <footer className="mt-12 pt-6 border-t-2 border-[hsl(213,62%,22%)]">
          <h4 className="text-xs font-bold text-[hsl(213,62%,22%)] uppercase tracking-widest mb-4">More Articles</h4>
          <div className="space-y-2">
            {Object.entries(POSTS)
              .filter(([key]) => key !== slug)
              .map(([key, p]) => (
                <Link href={`/blog/${key}`} key={key} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-sm hover:shadow-sm hover:border-blue-300 transition-all group">
                  <div className="flex items-center gap-3">
                    <p.icon className="w-4 h-4 text-[hsl(213,62%,22%)]" />
                    <span className="text-sm font-bold text-[hsl(213,62%,22%)]">{p.title}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[hsl(213,62%,22%)] transition-colors" />
                </Link>
              ))
            }
          </div>
        </footer>
      </article>
    </div>
  );
}
