export type Genre = 'Jazz' | 'Rock' | 'Folk' | 'Soul' | 'Classical';

export interface Album {
  id: string;
  title: string;
  artist: string;
  year: number;
  rarity: number; // 0-100
  price: number; // Credits
  cover: string;
  genre: Genre;
  owned?: boolean;
  wear: {
    grade: 'Mint' | 'Near Mint' | 'Very Good+' | 'Very Good' | 'Good';
    notes: { x: number; y: number; label: string }[];
  };
  tracks: { name: string; duration: string }[];
}

export const albums: Album[] = [
  {
    id: 'kob',
    title: 'Kind of Blue',
    artist: 'Miles Davis',
    year: 1959,
    rarity: 72,
    price: 45,
    cover:
      'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=800',
    genre: 'Jazz',
    wear: {
      grade: 'Near Mint',
      notes: [
        { x: 30, y: 40, label: '封套左上轻微折痕' },
        { x: 70, y: 65, label: 'B 面第 3 轨细微划痕' },
      ],
    },
    tracks: [
      { name: 'So What', duration: '9:22' },
      { name: 'Freddie Freeloader', duration: '9:46' },
      { name: 'Blue in Green', duration: '5:37' },
    ],
  },
  {
    id: 'aja',
    title: 'Aja',
    artist: 'Steely Dan',
    year: 1977,
    rarity: 58,
    price: 32,
    cover:
      'https://images.unsplash.com/photo-1605672611471-782163515431?q=80&w=800',
    genre: 'Rock',
    owned: true,
    wear: {
      grade: 'Very Good+',
      notes: [{ x: 50, y: 50, label: '中央标签轻微氧化' }],
    },
    tracks: [
      { name: 'Black Cow', duration: '5:10' },
      { name: 'Aja', duration: '7:56' },
      { name: 'Deacon Blues', duration: '7:33' },
    ],
  },
  {
    id: 'rumours',
    title: 'Rumours',
    artist: 'Fleetwood Mac',
    year: 1977,
    rarity: 42,
    price: 28,
    cover:
      'https://images.unsplash.com/photo-1619983081563-430f63602796?q=80&w=800',
    genre: 'Rock',
    wear: {
      grade: 'Very Good',
      notes: [
        { x: 25, y: 30, label: '封套边缘磨损' },
        { x: 65, y: 55, label: '内页轻微泛黄' },
      ],
    },
    tracks: [
      { name: 'Dreams', duration: '4:17' },
      { name: 'Go Your Own Way', duration: '3:38' },
      { name: 'The Chain', duration: '4:28' },
    ],
  },
  {
    id: 'bluetrain',
    title: 'Blue Train',
    artist: 'John Coltrane',
    year: 1957,
    rarity: 84,
    price: 55,
    cover:
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=800',
    genre: 'Jazz',
    owned: true,
    wear: {
      grade: 'Mint',
      notes: [],
    },
    tracks: [
      { name: 'Blue Train', duration: '10:42' },
      { name: "Moment's Notice", duration: '9:10' },
      { name: 'Locomotion', duration: '7:14' },
    ],
  },
  {
    id: 'pet-sounds',
    title: 'Pet Sounds',
    artist: 'The Beach Boys',
    year: 1966,
    rarity: 66,
    price: 38,
    cover:
      'https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?q=80&w=800',
    genre: 'Soul',
    wear: {
      grade: 'Near Mint',
      notes: [{ x: 40, y: 60, label: '轻微使用痕迹' }],
    },
    tracks: [
      { name: "Wouldn't It Be Nice", duration: '2:25' },
      { name: 'God Only Knows', duration: '2:51' },
    ],
  },
  {
    id: 'revolver',
    title: 'Revolver',
    artist: 'The Beatles',
    year: 1966,
    rarity: 78,
    price: 62,
    cover:
      'https://images.unsplash.com/photo-1458560871784-56d23406c091?q=80&w=800',
    genre: 'Rock',
    wear: {
      grade: 'Very Good+',
      notes: [{ x: 55, y: 45, label: '封面右下角小折痕' }],
    },
    tracks: [
      { name: 'Eleanor Rigby', duration: '2:07' },
      { name: 'Yellow Submarine', duration: '2:40' },
    ],
  },
  {
    id: 'horses',
    title: 'Horses',
    artist: 'Patti Smith',
    year: 1975,
    rarity: 49,
    price: 30,
    cover:
      'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=800',
    genre: 'Folk',
    wear: {
      grade: 'Very Good',
      notes: [{ x: 20, y: 70, label: '脊背轻微磨白' }],
    },
    tracks: [
      { name: 'Gloria', duration: '5:57' },
      { name: 'Land', duration: '9:25' },
    ],
  },
  {
    id: 'marquee',
    title: 'The Dark Side of the Moon',
    artist: 'Pink Floyd',
    year: 1973,
    rarity: 81,
    price: 68,
    cover:
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800',
    genre: 'Classical',
    owned: true,
    wear: {
      grade: 'Mint',
      notes: [],
    },
    tracks: [
      { name: 'Time', duration: '7:04' },
      { name: 'Money', duration: '6:23' },
      { name: 'Us and Them', duration: '7:49' },
    ],
  },
];

export const findAlbum = (id: string) => albums.find((a) => a.id === id);
