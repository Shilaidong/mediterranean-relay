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
    coverUrl: 'https://coverartarchive.org/release-group/f5093c06-23e3-404f-aeaa-40f72885ee3a/front-500',
  },
  {
    title: 'Abbey Road',
    artist: 'The Beatles',
    coverUrl: 'https://coverartarchive.org/release-group/9162580e-5df4-32de-80cc-f45a8d8a9b1d/front-500',
  },
  {
    title: 'Homogenic',
    artist: 'Bjork',
    coverUrl: 'https://coverartarchive.org/release-group/810272e0-aef1-3d85-b2d3-e512e87fc38c/front-500',
  },
  {
    title: 'OK Computer',
    artist: 'Radiohead',
    coverUrl: 'https://coverartarchive.org/release-group/b1392450-e666-3926-a536-22c65f834433/front-500',
  },
  {
    title: 'Blue',
    artist: 'Joni Mitchell',
    coverUrl: 'https://coverartarchive.org/release-group/42d725fb-a8b7-388c-8866-3b02789af326/front-500',
  },
  {
    title: 'A Love Supreme',
    artist: 'John Coltrane',
    coverUrl: 'https://coverartarchive.org/release-group/77cf47ba-58cd-3f3d-a5f9-79bf89860421/front-500',
  },
  {
    title: 'Mingus Ah Um',
    artist: 'Charles Mingus',
    coverUrl: 'https://coverartarchive.org/release-group/48ec720b-2fc2-35dd-8130-5b186c4abcbc/front-500',
  },
  {
    title: 'Rumours',
    artist: 'Fleetwood Mac',
    coverUrl: 'https://coverartarchive.org/release-group/416bb5e5-c7d1-3977-8fd7-7c9daf6c2be6/front-500',
  },
  {
    title: 'Hounds of Love',
    artist: 'Kate Bush',
    coverUrl: 'https://coverartarchive.org/release-group/017f2a37-a78f-3578-9611-fa40408e5d90/front-500',
  },
  {
    title: 'Kind of Blue',
    artist: 'Miles Davis',
    coverUrl: 'https://coverartarchive.org/release-group/8e8a594f-2175-38c7-a871-abb68ec363e7/front-500',
  },
  {
    title: 'Buena Vista Social Club',
    artist: 'Buena Vista Social Club',
    coverUrl: 'https://coverartarchive.org/release-group/32bbab8e-02c0-30d2-9e23-a19739864b84/front-500',
  },
  {
    title: 'Astral Weeks',
    artist: 'Van Morrison',
    coverUrl: 'https://coverartarchive.org/release-group/7d568f14-d86e-3584-97d0-c1824599de04/front-500',
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
          className="h-full w-full object-cover opacity-85 mix-blend-multiply"
          loading={index < 6 ? 'eager' : 'lazy'}
          decoding="async"
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
          <div className="pointer-events-none absolute inset-0 mx-auto flex max-w-md justify-center gap-4 overflow-hidden px-3 opacity-90 [mask-image:linear-gradient(180deg,transparent_0%,black_12%,black_86%,transparent_100%)]">
            <Strip albums={columns[0]} delay={-1} />
            <Strip albums={columns[1]} reverse delay={-5} />
            <Strip albums={columns[2]} delay={-8} />
            <Strip albums={columns[3]} reverse delay={-3} />
          </div>

          <motion.div
            className="absolute inset-x-0 top-[34%] mx-auto flex max-w-md flex-col items-center px-8 text-center"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="paper-panel px-7 py-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.42em] text-ink/45">
                Archive Warming
              </p>
              <h1 className="mt-3 font-serif text-[38px] leading-none text-ink">
                Mediterranean Relay
              </h1>
              <p className="mt-3 text-[11px] font-bold tracking-[0.36em] text-ink/35">
                专辑切片正在归档
              </p>
            </div>
          </motion.div>

          <div className="absolute inset-x-0 bottom-12 mx-auto flex max-w-md justify-center px-8">
            <div className="h-1 w-36 overflow-hidden rounded-full bg-white/45 shadow-neumo-inset">
              <motion.div
                className="h-full rounded-full bg-ink"
                initial={{ x: '-100%' }}
                animate={{ x: '110%' }}
                transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
