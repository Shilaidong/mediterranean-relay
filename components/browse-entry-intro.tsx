'use client';

import { AnimatePresence, motion } from 'framer-motion';

type IntroAlbum = {
  title: string;
  artist: string;
  coverUrl: string;
};

const introAlbums: IntroAlbum[] = [
  {
    title: 'The Dark Side of the Moon',
    artist: 'Pink Floyd',
    coverUrl: '/intro-albums/dark-side-of-the-moon.jpg',
  },
  {
    title: 'Abbey Road',
    artist: 'The Beatles',
    coverUrl: '/intro-albums/abbey-road.jpg',
  },
  {
    title: 'Homogenic',
    artist: 'Bjork',
    coverUrl: '/intro-albums/homogenic.jpg',
  },
  {
    title: 'OK Computer',
    artist: 'Radiohead',
    coverUrl: '/intro-albums/ok-computer.jpg',
  },
  {
    title: 'Blue',
    artist: 'Joni Mitchell',
    coverUrl: '/intro-albums/blue.jpg',
  },
  {
    title: 'A Love Supreme',
    artist: 'John Coltrane',
    coverUrl: '/intro-albums/a-love-supreme.jpg',
  },
  {
    title: 'Mingus Ah Um',
    artist: 'Charles Mingus',
    coverUrl: '/intro-albums/mingus-ah-um.jpg',
  },
  {
    title: 'Rumours',
    artist: 'Fleetwood Mac',
    coverUrl: '/intro-albums/rumours.jpg',
  },
  {
    title: 'Hounds of Love',
    artist: 'Kate Bush',
    coverUrl: '/intro-albums/hounds-of-love.jpg',
  },
  {
    title: 'Kind of Blue',
    artist: 'Miles Davis',
    coverUrl: '/intro-albums/kind-of-blue.jpg',
  },
  {
    title: 'Buena Vista Social Club',
    artist: 'Buena Vista Social Club',
    coverUrl: '/intro-albums/buena-vista-social-club.jpg',
  },
  {
    title: 'Astral Weeks',
    artist: 'Van Morrison',
    coverUrl: '/intro-albums/astral-weeks.jpg',
  },
];

function IntroSlice({ album, index }: { album: IntroAlbum; index: number }) {
  return (
    <div
      className="browse-intro-slice"
      style={{
        transform: `rotate(${index % 2 === 0 ? -2.5 : 2.5}deg)`,
      }}
    >
      <div className="relative aspect-square overflow-hidden rounded-[22px] bg-[#d1ccc0]">
        <img
          src={album.coverUrl}
          alt={`${album.title} cover`}
          className="h-full w-full object-cover opacity-90"
          loading="eager"
          decoding="async"
          fetchPriority={index < 4 ? 'high' : 'auto'}
        />
      </div>
      <p className="mt-2 truncate font-serif text-[12px] leading-none text-ink">
        {album.title}
      </p>
      <p className="mt-1 truncate text-[7px] font-bold uppercase tracking-[0.2em] text-ink/35">
        {album.artist}
      </p>
    </div>
  );
}

function Strip({ albums, reverse, delay }: { albums: IntroAlbum[]; reverse?: boolean; delay: number }) {
  const doubled = [...albums, ...albums];

  return (
    <div className="h-[150vh] w-24 shrink-0 overflow-hidden sm:w-28">
      <div
        className={reverse ? 'browse-intro-strip-down' : 'browse-intro-strip-up'}
        style={{ animationDelay: `${delay}s` }}
      >
        {doubled.map((album, index) => (
          <IntroSlice key={`${album.title}-${index}`} album={album} index={index} />
        ))}
      </div>
    </div>
  );
}

export function BrowseEntryIntro({ visible }: { visible: boolean }) {
  const columns = [
    introAlbums.slice(0, 6),
    introAlbums.slice(3, 9),
    introAlbums.slice(6, 12),
    introAlbums.slice(1, 7),
  ];

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[80] overflow-hidden bg-paper"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.015, filter: 'blur(10px)' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.72),transparent_34%),radial-gradient(circle_at_80%_24%,rgba(26,75,158,0.12),transparent_32%),linear-gradient(180deg,#f0ece2_0%,#e8e4d9_64%,#dfd7ca_100%)]" />
          <motion.div
            className="pointer-events-none absolute inset-0 mx-auto flex max-w-md justify-center gap-4 overflow-hidden px-3 [mask-image:linear-gradient(180deg,transparent_0%,black_12%,black_86%,transparent_100%)]"
            initial={{ opacity: 0, y: 16, scale: 1.03 }}
            animate={{ opacity: 0.9, y: 0, scale: 1 }}
            transition={{ delay: 1.15, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <Strip albums={columns[0]} delay={-1} />
            <Strip albums={columns[1]} reverse delay={-5} />
            <Strip albums={columns[2]} delay={-8} />
            <Strip albums={columns[3]} reverse delay={-3} />
          </motion.div>

          <motion.div
            className="pointer-events-none absolute inset-0 mx-auto flex max-w-md items-center justify-center px-10 text-center"
            initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
            animate={{
              opacity: [0, 1, 0.7, 0],
              y: [10, 0, -4, -12],
              filter: ['blur(10px)', 'blur(0px)', 'blur(0px)', 'blur(8px)'],
            }}
            transition={{ duration: 1.85, times: [0, 0.32, 0.72, 1], ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="font-serif text-[48px] leading-[0.92] tracking-[-0.05em] text-ink drop-shadow-[0_18px_40px_rgba(26,75,158,0.16)]">
              Mediterranean
              <br />
              Relay
            </h1>
          </motion.div>

          <div className="absolute inset-x-0 bottom-12 mx-auto flex max-w-md justify-center px-8">
            <div className="h-1 w-36 overflow-hidden rounded-full bg-white/45 shadow-neumo-inset">
              <motion.div
                className="h-full rounded-full bg-ink"
                initial={{ x: '-100%' }}
                animate={{ x: '110%' }}
                transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
