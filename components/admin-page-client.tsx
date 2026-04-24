'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download, Loader2, Shield, Upload } from 'lucide-react';
import { PageTitle, SectionLabel } from '@/components/page-copy';
import { HapticTap } from '@/components/haptic-tap';

type Summary = {
  accountEmail: string;
  username: string;
  importedReleases: number;
  publishedListings: number;
  importedPosts: number;
};

export function AdminPageClient() {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);

  async function handleImport() {
    if (!file) {
      setError('先选择一个 Excel 模板文件。');
      return;
    }

    setSubmitting(true);
    setError('');
    setSummary(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Import failed.');
      }

      setSummary(payload.summary as Summary);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Import failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar pt-safe">
      <PageTitle english="Admin Portal" chinese="管理后台" className="pt-12" />

      <div className="space-y-6 px-6 pb-40">
        <section className="paper-panel p-5">
          <div className="flex items-center gap-3">
            <div className="paper-inset flex h-12 w-12 items-center justify-center rounded-full">
              <Shield size={18} className="text-ink" />
            </div>
            <div>
              <p className="font-serif text-[18px] leading-none">Import Workbook</p>
              <p className="mt-1 text-[11px] opacity-60">
                下载模板，填好后重新上传；有价格的专辑会默认公开到 Browse。
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              href="/api/admin/import-template"
              className="chrome-button flex h-12 items-center justify-center gap-2 rounded-full text-[11px] font-bold uppercase tracking-[0.22em]"
            >
              <Download size={14} />
              下载模板
            </Link>
            <Link
              href="/api/admin/import-spec"
              className="chrome-button flex h-12 items-center justify-center gap-2 rounded-full text-[11px] font-bold uppercase tracking-[0.22em]"
            >
              <Download size={14} />
              下载说明
            </Link>
          </div>

          <label className="field-shell mt-4 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl px-5 py-5 text-center">
            <Upload size={22} className="text-ink/70" />
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.24em]">
              Upload Excel Workbook
            </p>
            <p className="mt-1 text-[12px] opacity-55">
              {file ? file.name : '选择已填写好的 .xlsx 模板文件'}
            </p>
            <input
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>

          <HapticTap
            onClick={handleImport}
            disabled={submitting}
            className="chrome-button-primary mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full text-[11px] font-bold uppercase tracking-[0.24em] text-paper disabled:opacity-50"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            批量导入
          </HapticTap>
        </section>

        <section>
          <SectionLabel english="Template Structure" chinese="模板结构" />
          <div className="paper-inset rounded-2xl px-4 py-4 text-[12px] leading-relaxed opacity-70">
            <p>1. `account`：目标账号、密码、积分、是否清空旧内容。</p>
            <p>2. `collection`：专辑目录、库存信息、价格与公开状态。</p>
            <p>3. `posts`：社区帖子。</p>
            <p className="mt-3">
              `asking_price` 有值时会默认生成公开上架；只有 `publish=NO` 才只导入收藏。
            </p>
            <p>
              `clear_existing=YES` 会先清空目标账号旧内容，再导入新表格。
            </p>
            <p>
              想让导入内容显示为 SYSTEM，请把目标用户名写成 `SYSTEM`。
            </p>
          </div>
        </section>

        {summary ? (
          <section>
            <SectionLabel english="Import Result" chinese="导入结果" />
            <div className="paper-panel space-y-3 p-5 text-[13px]">
              <p>账号邮箱：{summary.accountEmail}</p>
              <p>账号名称：{summary.username}</p>
              <p>导入专辑：{summary.importedReleases}</p>
              <p>已上架条目：{summary.publishedListings}</p>
              <p>导入帖子：{summary.importedPosts}</p>
            </div>
          </section>
        ) : null}

        {error ? <p className="text-center text-[12px] text-stamp">{error}</p> : null}
      </div>
    </div>
  );
}
