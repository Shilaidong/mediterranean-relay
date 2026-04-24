import * as XLSX from 'xlsx';
import type { Genre } from '@/lib/types';

const collectionHeaders = [
  'slug',
  'title',
  'artist',
  'year',
  'genre',
  'cover_url',
  'rarity',
  'suggested_price_min',
  'suggested_price_max',
  'matrix_codes',
  'tracklist',
  'condition_grade',
  'condition_notes',
  'photo_urls',
  'headline',
  'description',
  'asking_price',
  'publish',
] as const;

const postHeaders = ['title', 'body', 'cover_image_url', 'release_slug'] as const;

export type ImportAccountSheet = {
  target_email: string;
  target_username: string;
  target_password?: string;
  avatar_url?: string;
  bio?: string;
  credits?: number;
  clear_existing?: boolean;
};

export type ImportCollectionRow = {
  slug: string;
  title: string;
  artist: string;
  year: number;
  genre: Genre;
  coverUrl: string | null;
  rarity: number;
  suggestedPriceMin: number | null;
  suggestedPriceMax: number | null;
  matrixCodes: string[];
  tracklist: Array<{ name: string; duration: string }>;
  conditionGrade: string;
  conditionNotes: Array<{ label: string }>;
  photoUrls: string[];
  headline: string | null;
  description: string | null;
  askingPrice: number | null;
  publish: boolean;
};

export type ImportPostRow = {
  title: string;
  body: string | null;
  coverImageUrl: string | null;
  releaseSlug: string | null;
};

export type ParsedImportWorkbook = {
  account: ImportAccountSheet;
  collectionRows: ImportCollectionRow[];
  postRows: ImportPostRow[];
};

function truthy(value: unknown) {
  return ['true', 'yes', 'y', '1', '是'].includes(String(value ?? '').trim().toLowerCase());
}

function falsey(value: unknown) {
  return ['false', 'no', 'n', '0', '否'].includes(String(value ?? '').trim().toLowerCase());
}

function shouldPublish(value: unknown, hasPrice: boolean) {
  const normalized = String(value ?? '').trim();
  if (!normalized) {
    return hasPrice;
  }
  if (falsey(normalized)) {
    return false;
  }
  return truthy(normalized);
}

function splitPipeList(value: unknown) {
  return String(value ?? '')
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseTracklist(value: unknown) {
  return splitPipeList(value).map((row) => {
    const [name, duration] = row.split('::').map((part) => part.trim());
    return {
      name: name || row,
      duration: duration || '',
    };
  });
}

function toNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toOptionalNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getFirstRow<T>(sheet: XLSX.WorkSheet | undefined) {
  if (!sheet) {
    return null;
  }
  const rows = XLSX.utils.sheet_to_json<T>(sheet, {
    defval: '',
  });
  return rows[0] ?? null;
}

export function parseImportWorkbook(buffer: Buffer): ParsedImportWorkbook {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const rawAccount = getFirstRow<Record<string, unknown>>(workbook.Sheets.account);

  if (
    !String(rawAccount?.target_email ?? '').trim() ||
    !String(rawAccount?.target_username ?? '').trim()
  ) {
    throw new Error('`account` 工作表至少要填写 target_email 和 target_username。');
  }

  const account: ImportAccountSheet = {
    target_email: String(rawAccount?.target_email ?? '').trim(),
    target_username: String(rawAccount?.target_username ?? '').trim(),
    target_password: String(rawAccount?.target_password ?? '').trim() || undefined,
    avatar_url: String(rawAccount?.avatar_url ?? '').trim() || undefined,
    bio: String(rawAccount?.bio ?? '').trim() || undefined,
    credits: toOptionalNumber(rawAccount?.credits) ?? undefined,
    clear_existing: truthy(rawAccount?.clear_existing),
  };

  const collectionRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets.collection,
    { defval: '' },
  );
  const postsRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets.posts, {
    defval: '',
  });

  const collectionRows = collectionRaw
    .filter((row) => String(row.title ?? '').trim())
    .map<ImportCollectionRow>((row) => {
      const askingPrice = toOptionalNumber(row.asking_price);
      const suggestedPriceMin = toOptionalNumber(row.suggested_price_min);
      const suggestedPriceMax = toOptionalNumber(row.suggested_price_max);
      const hasPrice = (askingPrice ?? suggestedPriceMax ?? suggestedPriceMin ?? 0) > 0;

      return {
        slug: String(row.slug ?? '').trim() || slugify(`${row.artist}-${row.title}-${row.year}`),
        title: String(row.title ?? '').trim(),
        artist: String(row.artist ?? '').trim(),
        year: toNumber(row.year, new Date().getFullYear()),
        genre: normalizeGenre(String(row.genre ?? 'Rock')),
        coverUrl: String(row.cover_url ?? '').trim() || null,
        rarity: Math.max(0, Math.min(100, toNumber(row.rarity, 50))),
        suggestedPriceMin,
        suggestedPriceMax,
        matrixCodes: splitPipeList(row.matrix_codes),
        tracklist: parseTracklist(row.tracklist),
        conditionGrade: String(row.condition_grade ?? '').trim() || 'Very Good',
        conditionNotes: splitPipeList(row.condition_notes).map((label) => ({ label })),
        photoUrls: splitPipeList(row.photo_urls),
        headline: String(row.headline ?? '').trim() || null,
        description: String(row.description ?? '').trim() || null,
        askingPrice,
        publish: shouldPublish(row.publish, hasPrice),
      };
    });

  const postRows = postsRaw
    .filter((row) => String(row.title ?? '').trim())
    .map<ImportPostRow>((row) => ({
      title: String(row.title ?? '').trim(),
      body: String(row.body ?? '').trim() || null,
      coverImageUrl: String(row.cover_image_url ?? '').trim() || null,
      releaseSlug: String(row.release_slug ?? '').trim() || null,
    }));

  return {
    account,
    collectionRows,
    postRows,
  };
}

export function buildImportTemplateWorkbook() {
  const workbook = XLSX.utils.book_new();

  const readmeSheet = XLSX.utils.aoa_to_sheet([
    ['Mediterranean Relay Import Template'],
    ['1. 在 account 表填写目标账号。若账号不存在，导入时会自动创建。'],
    ['2. 在 collection 表一行代表一张要导入的专辑/库存；有价格时默认公开上架，publish=NO 时仅导入收藏。'],
    ['3. asking_price 留空时会尝试使用 suggested_price_max 或 suggested_price_min 生成上架价格。'],
    ['4. publish 留空且有价格时默认公开；写 NO / FALSE / 0 / 否 时只导入收藏，不出现在 Browse。'],
    ['5. clear_existing=YES 会先清空目标账号旧帖子、库存和在售条目，请谨慎使用。'],
    ['6. matrix_codes、condition_notes、photo_urls 用竖线 | 分隔。'],
    ['7. tracklist 用 `歌曲名::时长 | 歌曲名::时长`。'],
    ['8. 如果想导入成系统展示内容，请把 target_username 填成 SYSTEM。'],
    ['9. 在管理员页面可先下载本模板，再填好后重新上传。'],
  ]);

  const accountSheet = XLSX.utils.json_to_sheet([
    {
      target_email: 'system.showcase@medrelay.dev',
      target_username: 'SYSTEM',
      target_password: 'ChangeThis123!',
      avatar_url: '',
      bio: 'Showcase account for imported relay demos.',
      credits: 9999,
      clear_existing: 'YES',
    },
  ]);

  const collectionSheet = XLSX.utils.json_to_sheet([
    {
      slug: 'beatles-love-2006',
      title: 'Love',
      artist: 'The Beatles',
      year: 2006,
      genre: 'Rock',
      cover_url: 'https://example.com/love-cover.jpg',
      rarity: 74,
      suggested_price_min: 48,
      suggested_price_max: 72,
      matrix_codes: 'LOVE-A1 | LOVE-B1',
      tracklist: 'Because::2:45 | Get Back::2:05 | Hey Jude::4:12',
      condition_grade: 'Near Mint',
      condition_notes: '封套完整 | 碟面干净',
      photo_urls: 'https://example.com/love-front.jpg | https://example.com/love-back.jpg',
      headline: 'Beatles archive copy',
      description: 'Imported from admin template.',
      asking_price: 58,
      publish: 'YES',
    },
  ], {
    header: [...collectionHeaders],
  });

  const postsSheet = XLSX.utils.json_to_sheet([
    {
      title: 'Beatles showcase drop',
      body: 'Freshly imported archive copy.',
      cover_image_url: 'https://example.com/post-cover.jpg',
      release_slug: 'beatles-love-2006',
    },
  ], {
    header: [...postHeaders],
  });

  XLSX.utils.book_append_sheet(workbook, readmeSheet, 'README');
  XLSX.utils.book_append_sheet(workbook, accountSheet, 'account');
  XLSX.utils.book_append_sheet(workbook, collectionSheet, 'collection');
  XLSX.utils.book_append_sheet(workbook, postsSheet, 'posts');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

export function buildImportSpecMarkdown() {
  return `# Mediterranean Relay 批量导入说明

## 文件结构
- \`account\`：目标账号信息
- \`collection\`：专辑、库存、价格与公开状态
- \`posts\`：社区帖子

## account 字段
- \`target_email\`：目标账号邮箱，必填
- \`target_username\`：目标账号用户名，必填
- \`target_password\`：账号不存在时用于自动创建
- \`avatar_url\`：头像链接，可选
- \`bio\`：简介，可选
- \`credits\`：导入后积分余额，可选
- \`clear_existing\`：YES 表示导入前清空该账号当前的帖子、库存和在售条目；不想清空请留空或填 NO

## collection 字段
- \`slug\`：版本唯一标识，建议唯一
- \`title\` / \`artist\` / \`year\` / \`genre\`：专辑基础信息
- \`cover_url\`：目录封面
- \`rarity\`：0-100
- \`suggested_price_min\` / \`suggested_price_max\`：建议价格；如果 \`asking_price\` 留空，会尝试用 \`suggested_price_max\`，再尝试 \`suggested_price_min\` 生成上架价格
- \`matrix_codes\`：多个用 \`|\` 分隔
- \`tracklist\`：格式 \`歌曲名::时长 | 歌曲名::时长\`
- \`condition_grade\`：品相等级
- \`condition_notes\`：多个用 \`|\` 分隔
- \`photo_urls\`：实物图链接，多个用 \`|\` 分隔
- \`headline\` / \`description\`：上架文案
- \`asking_price\`：正式售价；有值时默认公开到 Browse
- \`publish\`：公开控制；留空且有价格时默认自动上架，填 YES 可显式上架，填 NO / FALSE / 0 / 否 时仅导入收藏不展示

## posts 字段
- \`title\`：帖子标题
- \`body\`：帖子正文
- \`cover_image_url\`：帖子图片
- \`release_slug\`：可选，关联 collection 里的 slug

## 备注
- 游客和未登录用户只能看到 \`market_listings.status=active\` 的条目；管理员导入会在公开上架时自动创建 active listing。
- 如果导入后 Browse 没出现，优先检查该行是否有价格、\`publish\` 是否写了 NO，以及是否导入到了当前 Supabase 项目。
- 如果想让导入内容在前台显示为 SYSTEM，请把 \`target_username\` 填成 \`SYSTEM\`。
- 导入会自动创建缺失的目录条目，并把库存归到目标账号下。`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function normalizeGenre(value: string): Genre {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'jazz') return 'Jazz';
  if (normalized === 'folk') return 'Folk';
  if (normalized === 'soul') return 'Soul';
  if (normalized === 'classical') return 'Classical';
  return 'Rock';
}
