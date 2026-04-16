export interface Transaction {
  id: string;
  albumTitle: string;
  artist: string;
  price: number;
  date: string;
  cover: string;
}

export interface Post {
  id: string;
  title: string;
  author: string;
  replies: number;
  cover?: string;
  time: string;
}

export interface Collector {
  id: string;
  name: string;
  avatar: string;
  followers: number;
}

export const transactions: Transaction[] = [
  {
    id: 't1',
    albumTitle: 'The Dark Side of the Moon',
    artist: 'Pink Floyd',
    price: 68,
    date: '2h ago',
    cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=400',
  },
  {
    id: 't2',
    albumTitle: 'Kind of Blue',
    artist: 'Miles Davis',
    price: 45,
    date: '5h ago',
    cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400',
  },
  {
    id: 't3',
    albumTitle: 'Revolver',
    artist: 'The Beatles',
    price: 62,
    date: '1d ago',
    cover: 'https://images.unsplash.com/photo-1458560871784-56d23406c091?q=80&w=400',
  },
  {
    id: 't4',
    albumTitle: 'Blue Train',
    artist: 'John Coltrane',
    price: 55,
    date: '2d ago',
    cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=400',
  },
];

export const posts: Post[] = [
  {
    id: 'p1',
    title: '1967年首版Pet Sounds的保存心得分享',
    author: 'VinylHunter',
    replies: 24,
    time: '3h ago',
    cover: 'https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?q=80&w=400',
  },
  {
    id: 'p2',
    title: '请教：这种划痕会影响播放吗？',
    author: 'NewCollector',
    replies: 18,
    time: '6h ago',
  },
  {
    id: 'p3',
    title: '1973年西德压片 vs 美国原版 音色对比',
    author: 'AnalogMaster',
    replies: 42,
    time: '1d ago',
    cover: 'https://images.unsplash.com/photo-1458560871784-56d23406c091?q=80&w=400',
  },
  {
    id: 'p4',
    title: 'Kind of Blue Monaco版本鉴别指南',
    author: 'JazzCat',
    replies: 31,
    time: '2d ago',
  },
];

export const collectors: Collector[] = [
  {
    id: 'c1',
    name: 'VinylHunter',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200',
    followers: 1234,
  },
  {
    id: 'c2',
    name: 'JazzCat',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200',
    followers: 892,
  },
  {
    id: 'c3',
    name: 'AnalogMaster',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200',
    followers: 2103,
  },
  {
    id: 'c4',
    name: 'RareGroove',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=200',
    followers: 567,
  },
  {
    id: 'c5',
    name: 'SoulSeeker',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200',
    followers: 445,
  },
];
