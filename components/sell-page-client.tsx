'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Camera,
  ImagePlus,
  Loader2,
  RotateCcw,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { HapticTap } from '@/components/haptic-tap';
import type { AssistCandidate, AssistDiagnostics } from '@/lib/types';

const conditionOptions = ['Near Mint', 'Very Good+', 'Very Good', 'Good'];
const maxListingPhotos = 4;
const assistImageStorageKey = 'relay-assist-image';

type Step = 0 | 1 | 2;
type DraftPhoto = { file: File; preview: string };
type ManualGenre = 'Jazz' | 'Rock' | 'Folk' | 'Soul' | 'Classical';
const manualGenres: ManualGenre[] = ['Jazz', 'Rock', 'Folk', 'Soul', 'Classical'];

function notesFromText(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((label) => ({ label }));
}

function defaultHeadline(candidate: AssistCandidate | null) {
  if (!candidate) {
    return '';
  }
  return `${candidate.artist} archive copy`;
}

function defaultDescription(candidate: AssistCandidate | null) {
  if (!candidate) {
    return '';
  }
  return `Relay graded ${candidate.title} copy with documented sleeve condition and updated field photos.`;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Failed to convert image to data URL.'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

export function SellPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assistCameraInputRef = useRef<HTMLInputElement>(null);
  const assistUploadInputRef = useRef<HTMLInputElement>(null);
  const listingPhotosInputRef = useRef<HTMLInputElement>(null);
  const assistPreviewRef = useRef<string | null>(null);
  const listingPhotosRef = useRef<DraftPhoto[]>([]);
  const hydratedAssistImageRef = useRef(false);
  const [step, setStep] = useState<Step>(0);
  const [matrixCode, setMatrixCode] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [assistPreview, setAssistPreview] = useState<string | null>(null);
  const [assistFile, setAssistFile] = useState<File | null>(null);
  const [assistDataUrl, setAssistDataUrl] = useState<string | null>(null);
  const [showAssistSourcePicker, setShowAssistSourcePicker] = useState(false);
  const [candidates, setCandidates] = useState<AssistCandidate[]>([]);
  const [diagnostics, setDiagnostics] = useState<AssistDiagnostics | null>(null);
  const [selectedReleaseId, setSelectedReleaseId] = useState('');
  const [conditionGrade, setConditionGrade] = useState('Near Mint');
  const [conditionNotesText, setConditionNotesText] = useState('');
  const [askingPrice, setAskingPrice] = useState<number>(45);
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [manualYear, setManualYear] = useState(new Date().getFullYear());
  const [manualGenre, setManualGenre] = useState<ManualGenre>('Rock');
  const [listingPhotos, setListingPhotos] = useState<DraftPhoto[]>([]);
  const [runningAssist, setRunningAssist] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.releaseId === selectedReleaseId) ?? null,
    [candidates, selectedReleaseId],
  );
  const hasReliableMatch = candidates.length > 0 && Boolean(selectedReleaseId);
  const requiresMetadataReview =
    !hasReliableMatch || selectedCandidate?.catalogSource === 'musicbrainz';

  useEffect(() => {
    assistPreviewRef.current = assistPreview;
    listingPhotosRef.current = listingPhotos;
  }, [assistPreview, listingPhotos]);

  useEffect(() => {
    return () => {
      if (assistPreviewRef.current?.startsWith('blob:')) {
        URL.revokeObjectURL(assistPreviewRef.current);
      }
      for (const photo of listingPhotosRef.current) {
        if (photo.preview.startsWith('blob:')) {
          URL.revokeObjectURL(photo.preview);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (hydratedAssistImageRef.current) {
      return;
    }
    hydratedAssistImageRef.current = true;

    const pendingImage = sessionStorage.getItem(assistImageStorageKey);
    if (!pendingImage) {
      if (searchParams.get('source')) {
        setShowAssistSourcePicker(true);
      }
      return;
    }

    try {
      const parsed = JSON.parse(pendingImage) as {
        dataUrl?: string;
        source?: 'camera' | 'upload';
      };

      if (typeof parsed.dataUrl === 'string' && parsed.dataUrl) {
        if (assistPreview?.startsWith('blob:')) {
          URL.revokeObjectURL(assistPreview);
        }
        setAssistFile(null);
        setAssistDataUrl(parsed.dataUrl);
        setAssistPreview(parsed.dataUrl);
        setShowAssistSourcePicker(false);
      }
    } catch {
      setShowAssistSourcePicker(Boolean(searchParams.get('source')));
    } finally {
      sessionStorage.removeItem(assistImageStorageKey);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!selectedCandidate) {
      return;
    }

    const suggested =
      selectedCandidate.suggestedPriceMin && selectedCandidate.suggestedPriceMax
        ? Math.round(
            (selectedCandidate.suggestedPriceMin + selectedCandidate.suggestedPriceMax) / 2,
          )
        : 45;

    setAskingPrice(suggested);
    setHeadline((current) => current || defaultHeadline(selectedCandidate));
    setDescription((current) => current || defaultDescription(selectedCandidate));
    if (selectedCandidate.catalogSource === 'musicbrainz') {
      setTitle(selectedCandidate.title);
      setArtist(selectedCandidate.artist);
      setManualYear(selectedCandidate.year);
    }
  }, [selectedCandidate]);

  async function handleAssist(forceCatalog = false) {
    if (!title.trim()) {
      setError(forceCatalog ? '至少先填写专辑标题，再浏览目录候选。' : '先填写专辑标题。');
      return;
    }

    if (!forceCatalog && !assistPreview) {
      setError('还需要上传一张参考图，或直接拍照后再识别。');
      return;
    }

    setRunningAssist(true);
    setError('');

    try {
      const imageDataUrl =
        !forceCatalog
          ? assistFile
            ? await fileToDataUrl(assistFile).catch(() => null)
            : assistDataUrl
          : null;
      const response = await fetch('/api/listings/assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          forceCatalog
            ? {}
            : {
                matrixCode,
                title,
                artist,
                imageDataUrl,
              },
        ),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Assist failed');
      }

      const nextCandidates = payload.candidates as AssistCandidate[];
      const nextDiagnostics = (payload.diagnostics as AssistDiagnostics) ?? null;
      const matched = nextDiagnostics?.matched ?? nextCandidates.length > 0;
      if (!nextCandidates.length && matched) {
        throw new Error('No catalog matches were returned.');
      }

      setCandidates(nextCandidates);
      setDiagnostics(nextDiagnostics);
      setSelectedReleaseId(nextCandidates[0]?.releaseId ?? '');
      setArtist((current) => current || nextDiagnostics?.vision?.artist || current);
      setTitle((current) => current || nextDiagnostics?.vision?.albumTitle || current);
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assist failed');
    } finally {
      setRunningAssist(false);
    }
  }

  async function uploadPhotos() {
    if (!listingPhotos.length) {
      return [];
    }
    const formData = new FormData();
    for (const { file } of listingPhotos) {
      formData.append('files', file);
    }

    const response = await fetch('/api/uploads/listing-media', {
      method: 'POST',
      body: formData,
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? 'Photo upload failed.');
    }

    return (payload.photoUrls as string[]) ?? [];
  }

  async function handlePublish() {
    if (!selectedReleaseId && hasReliableMatch) {
      setError('先确认一个版本候选。');
      return;
    }

    if (!selectedReleaseId && (!title.trim() || !artist.trim())) {
      setError('未匹配到目录时，至少补全专辑标题和艺人再发布。');
      return;
    }

    if (!listingPhotos.length) {
      setError('至少上传一张实物照片后再发布。');
      return;
    }

    if (!askingPrice || askingPrice <= 0) {
      setError('挂牌价格必须大于 0。');
      return;
    }

    setPublishing(true);
    setError('');

    try {
      const photoUrls = await uploadPhotos();
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          releaseId:
            selectedReleaseId && selectedCandidate?.catalogSource !== 'musicbrainz'
              ? selectedReleaseId
              : undefined,
          manualRelease:
            !selectedReleaseId || selectedCandidate?.catalogSource === 'musicbrainz'
              ? {
                  title: title.trim() || selectedCandidate?.title || '',
                  artist: artist.trim() || selectedCandidate?.artist || '',
                  year: manualYear,
                  genre: manualGenre,
                  matrixCode: matrixCode.trim() || undefined,
                  coverUrl: selectedCandidate?.coverUrl ?? null,
                }
              : undefined,
          conditionGrade,
          conditionNotes: notesFromText(conditionNotesText),
          photoUrls,
          askingPrice,
          headline: headline.trim() || defaultHeadline(selectedCandidate),
          description: description.trim() || defaultDescription(selectedCandidate),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Listing creation failed');
      }

      router.push(`/listing/${payload.listing.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Listing creation failed');
    } finally {
      setPublishing(false);
    }
  }

  function resetSearch() {
    setStep(0);
    setCandidates([]);
    setDiagnostics(null);
    setSelectedReleaseId('');
    setError('');
  }

  function handleAssistImageChange(file: File | null) {
    if (assistPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(assistPreview);
    }
    setAssistFile(file);
    setAssistDataUrl(null);
    setAssistPreview(file ? URL.createObjectURL(file) : null);
    setShowAssistSourcePicker(false);
  }

  function handleListingPhotosChange(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    const remaining = Math.max(0, maxListingPhotos - listingPhotos.length);
    const nextFiles = Array.from(files).slice(0, remaining);
    const nextDrafts = nextFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setListingPhotos((current) => [...current, ...nextDrafts]);
  }

  function removeListingPhoto(index: number) {
    setListingPhotos((current) => {
      const target = current[index];
      if (target?.preview.startsWith('blob:')) {
        URL.revokeObjectURL(target.preview);
      }
      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar pt-safe">
      <div className="flex items-center justify-between px-6 pt-6">
        <HapticTap
          onClick={() => router.back()}
          className="paper-inset flex h-11 w-11 items-center justify-center rounded-full"
        >
          <ArrowLeft size={20} className="text-ink" />
        </HapticTap>
        <span className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">
          Linking Relay
        </span>
        <div className="h-11 w-11" />
      </div>

      <div className="mt-6 flex justify-center gap-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={`h-2.5 w-2.5 rounded-full transition-all ${
              index === step ? 'bg-ink shadow-neumo-sm' : 'bg-paper shadow-neumo-inset-sm'
            }`}
          />
        ))}
      </div>

      <div className="mt-8 px-6 pb-40">
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div
              key="scan"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <h2 className="font-serif text-[26px] leading-tight">
                录入版本线索
                <br />
                识别待上架唱片
              </h2>
              <p className="mt-2 text-[11px] tracking-wide opacity-50">
                现在主流程改为：先填写专辑标题，再上传提前拍好的图片，或直接现场拍照扫描。
              </p>

              <div className="paper-inset relative mt-8 aspect-square overflow-hidden rounded-[26px]">
                {assistPreview ? (
                  <Image
                    src={assistPreview}
                    alt="Reference preview"
                    fill
                    sizes="100vw"
                    className="object-cover opacity-85 mix-blend-multiply"
                  />
                ) : null}
                <div className="absolute inset-[18px] rounded-[20px] border border-white/35 bg-white/5" />
                {!assistPreview ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-45">
                    <Camera size={34} strokeWidth={1.5} className="text-ink" />
                    <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.32em]">
                      Upload Or Scan
                    </p>
                  </div>
                ) : (
                  <div className="frost-tag absolute bottom-4 left-4 right-4 rounded-[18px] px-3 py-2 text-center text-[11px] font-serif italic shadow-neumo-sm">
                    已附参考图，识别会结合你输入的文本线索返回候选版本。
                  </div>
                )}
              </div>

              <input
                ref={assistCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) => handleAssistImageChange(event.target.files?.[0] ?? null)}
              />
              <input
                ref={assistUploadInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleAssistImageChange(event.target.files?.[0] ?? null)}
              />

              <div className="mt-6 space-y-3">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="专辑标题（必填）"
                  className="field-shell h-12 w-full rounded-full px-5 text-[14px] outline-none"
                />
                <input
                  value={artist}
                  onChange={(event) => setArtist(event.target.value)}
                  placeholder="艺人名称（可选）"
                  className="field-shell h-12 w-full rounded-full px-5 text-[14px] outline-none"
                />
                <input
                  value={matrixCode}
                  onChange={(event) => setMatrixCode(event.target.value)}
                  placeholder="矩阵码（可选，找得到再填）"
                  className="field-shell h-12 w-full rounded-full px-5 text-[14px] outline-none"
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <HapticTap
                  onClick={() => setShowAssistSourcePicker((current) => !current)}
                  className="chrome-button flex h-12 items-center justify-center gap-2 rounded-full text-[11px] font-bold uppercase tracking-[0.24em]"
                >
                  <ImagePlus size={14} />
                  上传 / 拍照
                </HapticTap>
                <HapticTap
                  onClick={() => void handleAssist(false)}
                  disabled={runningAssist}
                  className="chrome-button-primary flex h-12 items-center justify-center gap-2 rounded-full text-[11px] font-bold uppercase tracking-[0.24em] text-paper disabled:opacity-50"
                >
                  {runningAssist ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  标题 + 图片识别
                </HapticTap>
              </div>

              <HapticTap
                onClick={() => void handleAssist(true)}
                disabled={runningAssist}
                className="chrome-button mt-3 h-12 w-full rounded-full text-[11px] font-bold uppercase tracking-[0.24em] disabled:opacity-50"
                >
                  浏览目录候选
                </HapticTap>

              <AnimatePresence>
                {showAssistSourcePicker ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="paper-panel mt-4 p-4"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] opacity-45">
                      Reference Source
                    </p>
                    <p className="mt-2 text-[12px] leading-relaxed opacity-65">
                      可以直接拍一张新照片，也可以上传你提前拍好的参考图。
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <HapticTap
                        onClick={() => assistCameraInputRef.current?.click()}
                        className="chrome-button-primary flex h-12 items-center justify-center gap-2 rounded-full text-[11px] font-bold uppercase tracking-[0.24em] text-paper"
                      >
                        <Camera size={14} />
                        拍照扫描
                      </HapticTap>
                      <HapticTap
                        onClick={() => assistUploadInputRef.current?.click()}
                        className="chrome-button flex h-12 items-center justify-center gap-2 rounded-full text-[11px] font-bold uppercase tracking-[0.24em]"
                      >
                        <Upload size={14} />
                        上传图片
                      </HapticTap>
                    </div>
                    <HapticTap
                      onClick={() => setShowAssistSourcePicker(false)}
                      className="chrome-button mt-3 h-11 w-full rounded-full text-[10px] font-bold uppercase tracking-[0.24em] opacity-55"
                    >
                      取消
                    </HapticTap>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          ) : null}

          {step === 1 ? (
            <motion.div
              key="match"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <h2 className="font-serif text-[26px] leading-tight">
                {hasReliableMatch ? '匹配成功' : '未找到可靠匹配'}
              </h2>
              <p className="mt-2 text-[11px] tracking-wide opacity-50">
                {hasReliableMatch
                  ? `AI 在档案库中返回了 ${candidates.length} 个候选版本，你可以先挑准版本再发布。`
                  : '目录库里没有找到可靠匹配，你可以直接手动创建这个专辑条目后继续发布。'}
              </p>

              <div className="paper-panel mt-6 p-5">
                {diagnostics ? (
                  <div className="paper-inset mb-5 rounded-2xl px-4 py-3">
                    <p className="text-[9px] font-bold uppercase tracking-[0.32em] opacity-45">
                      Assist Mode · {diagnostics.mode}
                    </p>
                    {diagnostics.summary ? (
                      <p className="mt-2 text-[12px] leading-relaxed opacity-70">
                        {diagnostics.summary}
                      </p>
                    ) : null}
                    {diagnostics.vision ? (
                      <div className="mt-3 space-y-2 text-[11px] opacity-65">
                        {diagnostics.vision.albumTitle ? (
                          <p>视觉标题：{diagnostics.vision.albumTitle}</p>
                        ) : null}
                        {diagnostics.vision.artist ? (
                          <p>视觉艺人：{diagnostics.vision.artist}</p>
                        ) : null}
                        {diagnostics.vision.matrixCodes.length ? (
                          <div className="flex flex-wrap gap-2">
                            {diagnostics.vision.matrixCodes.map((code) => (
                              <span key={code} className="frost-tag rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] shadow-neumo-sm">
                                {code}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex items-center gap-4">
                  <div className="paper-inset relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                    {hasReliableMatch && selectedCandidate?.coverUrl ? (
                      <Image
                        src={selectedCandidate.coverUrl}
                        alt={selectedCandidate.title}
                        fill
                        sizes="80px"
                        className="object-cover opacity-80 mix-blend-multiply"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    {hasReliableMatch ? (
                      <>
                        <p className="text-[10px] uppercase tracking-widest opacity-50">
                          {selectedCandidate?.artist} · {selectedCandidate?.year}
                          {selectedCandidate?.catalogSource === 'musicbrainz' ? ' · MusicBrainz' : ''}
                        </p>
                        <p className="mt-0.5 font-serif text-[20px] leading-tight">
                          {selectedCandidate?.title}
                        </p>
                        <p className="mt-0.5 text-[11px] opacity-60">{askingPrice} Cr.</p>
                      </>
                    ) : (
                      <>
                        <p className="text-[10px] uppercase tracking-widest opacity-50">Manual Catalog Draft</p>
                        <p className="mt-0.5 font-serif text-[20px] leading-tight">{title || '未命名专辑'}</p>
                        <p className="mt-0.5 text-[11px] opacity-60">{artist || '等待补全艺人信息'}</p>
                      </>
                    )}
                  </div>
                </div>

                {hasReliableMatch ? (
                  <>
                    <div className="mt-5 h-px bg-ink/15" />

                    <div className="mt-4 space-y-2">
                      {candidates.map((candidate) => {
                        const active = candidate.releaseId === selectedReleaseId;
                        return (
                          <button
                            key={candidate.releaseId}
                            type="button"
                            onClick={() => setSelectedReleaseId(candidate.releaseId)}
                            className={`w-full rounded-2xl px-4 py-3 text-left transition-all ${
                              active
                                ? 'bg-paper shadow-neumo'
                                : 'bg-paper shadow-neumo-inset opacity-70'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate font-serif text-[15px] leading-none">
                                  {candidate.title}
                                </p>
                                <p className="mt-1 truncate text-[10px] uppercase tracking-[0.24em] opacity-45">
                                  {candidate.artist} · {candidate.year}
                                  {candidate.catalogSource === 'musicbrainz' ? ' · MusicBrainz' : ''}
                                </p>
                              </div>
                              <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-stamp">
                                {Math.round(candidate.confidence * 100)}%
                              </span>
                            </div>
                            <p className="mt-2 text-[11px] opacity-55">{candidate.reasoning}</p>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4">
                      <p className="text-[9px] uppercase tracking-[0.3em] opacity-50">
                        Historical Price Range
                      </p>
                      <div className="relative mt-3 flex h-10 items-center rounded-full bg-paper px-4 shadow-neumo-inset">
                        <span className="text-[10px] opacity-50">
                          {selectedCandidate?.suggestedPriceMin ?? 18} Cr.
                        </span>
                        <div className="relative mx-3 h-[2px] flex-1 bg-ink/30">
                          <div className="absolute inset-y-0 left-[15%] right-[25%] rounded-full bg-ink" />
                          <div className="absolute -top-1.5 left-[50%] h-3 w-3 -translate-x-1/2 rounded-full border-[1.5px] border-ink bg-paper" />
                        </div>
                        <span className="text-[10px] opacity-50">
                          {selectedCandidate?.suggestedPriceMax ?? 68} Cr.
                        </span>
                      </div>
                      <p className="mt-2 text-center font-serif text-[14px]">
                        建议挂牌 ≈ <span className="font-bold">{askingPrice} Cr.</span>
                      </p>
                      {selectedCandidate?.matrixCodes.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedCandidate.matrixCodes.map((code) => (
                            <span
                              key={code}
                              className="rounded-full bg-paper px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] opacity-55 shadow-neumo-inset"
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div className="mt-5 rounded-2xl bg-paper px-4 py-4 shadow-neumo-inset">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] opacity-45">
                      No Reliable Match
                    </p>
                    <p className="mt-2 text-[12px] leading-relaxed opacity-65">
                      这张专辑目前不在演示目录里。你可以直接继续，系统会用你填写的标题、艺人、年份和流派创建一个新的目录条目。
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <HapticTap
                  onClick={resetSearch}
                  className="chrome-button flex h-14 items-center justify-center gap-2 rounded-full text-[12px] font-bold uppercase tracking-[0.24em]"
                >
                  <RotateCcw size={14} />
                  重新识别
                </HapticTap>
                <HapticTap
                  onClick={() => {
                    if (selectedReleaseId || !hasReliableMatch) {
                      setStep(2);
                    }
                  }}
                  className="chrome-button-primary h-14 rounded-full text-[12px] font-bold uppercase tracking-[0.3em] text-paper"
                >
                  {hasReliableMatch ? '确认版本' : '手动创建'}
                </HapticTap>
              </div>
            </motion.div>
          ) : null}

          {step === 2 ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <h2 className="font-serif text-[26px] leading-tight">发布实物条目</h2>
              <p className="mt-2 text-[11px] tracking-wide opacity-50">
                上传实物照片、填写品相和文案，发布后会立即进入市场列表。
              </p>

              <div className="paper-panel mt-6 p-4">
                <div className="flex items-center gap-4">
                  <div className="paper-inset relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                    {hasReliableMatch && selectedCandidate?.coverUrl ? (
                      <Image
                        src={selectedCandidate.coverUrl}
                        alt={selectedCandidate.title}
                        fill
                        sizes="80px"
                        className="object-cover opacity-80 mix-blend-multiply"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-serif text-[18px] leading-none">
                      {hasReliableMatch ? selectedCandidate?.title : title || '手动创建专辑'}
                    </p>
                    <p className="mt-2 truncate text-[10px] uppercase tracking-[0.3em] opacity-45">
                      {hasReliableMatch
                        ? `${selectedCandidate?.artist} · ${selectedCandidate?.year}`
                        : `${artist || '待补全艺人'} · ${manualYear}`}
                    </p>
                  </div>
                </div>
              </div>

              {requiresMetadataReview ? (
                <div className="paper-panel mt-6 p-4">
                  <p className="text-[9px] uppercase tracking-[0.3em] opacity-50">Manual Catalog Metadata</p>
                  <div className="mt-4 space-y-3">
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="专辑标题（必填）"
                      className="field-shell h-12 w-full rounded-full px-5 text-[14px] outline-none"
                    />
                    <input
                      value={artist}
                      onChange={(event) => setArtist(event.target.value)}
                      placeholder="艺人名称（必填）"
                      className="field-shell h-12 w-full rounded-full px-5 text-[14px] outline-none"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        value={manualYear}
                        onChange={(event) => setManualYear(Number(event.target.value) || new Date().getFullYear())}
                        placeholder="年份"
                        className="field-shell h-12 w-full rounded-full px-5 text-[14px] outline-none"
                      />
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                        {manualGenres.map((genre) => (
                          <button
                            key={genre}
                            type="button"
                            onClick={() => setManualGenre(genre)}
                            className={`rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] ${
                              manualGenre === genre ? 'chrome-button-primary text-paper' : 'chrome-button opacity-65'
                            }`}
                          >
                            {genre}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <input
                ref={listingPhotosInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={(event) => handleListingPhotosChange(event.target.files)}
              />

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-50">
                    Listing Photos
                  </span>
                  <span className="text-[10px] opacity-35">
                    {listingPhotos.length}/{maxListingPhotos}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {listingPhotos.map((photo, index) => (
                    <div
                      key={`${photo.preview}-${index}`}
                      className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-paper shadow-neumo-inset"
                    >
                      <Image
                        src={photo.preview}
                        alt={`Listing photo ${index + 1}`}
                        fill
                        sizes="50vw"
                        className="object-cover opacity-90"
                      />
                      <button
                        type="button"
                        onClick={() => removeListingPhoto(index)}
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-paper/90 shadow-neumo-sm backdrop-blur"
                      >
                        <X size={14} className="text-ink" />
                      </button>
                    </div>
                  ))}

                  {listingPhotos.length < maxListingPhotos ? (
                    <button
                      type="button"
                      onClick={() => listingPhotosInputRef.current?.click()}
                      className="paper-inset flex aspect-[4/5] flex-col items-center justify-center rounded-2xl"
                    >
                      <Camera size={28} strokeWidth={1.5} className="text-ink/70" />
                      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.28em] opacity-50">
                        Add Photo
                      </p>
                    </button>
                  ) : null}
                </div>
              </div>

              <select
                value={conditionGrade}
                onChange={(event) => setConditionGrade(event.target.value)}
                className="field-shell mt-6 h-12 w-full rounded-full px-5 text-[14px] outline-none"
              >
                {conditionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <textarea
                value={conditionNotesText}
                onChange={(event) => setConditionNotesText(event.target.value)}
                rows={3}
                placeholder="每行一条品相备注，例如：封套右上角轻微压痕"
                className="field-shell mt-3 w-full resize-none rounded-2xl px-5 py-4 text-[14px] outline-none"
              />

              <input
                type="number"
                min={1}
                value={askingPrice}
                onChange={(event) => setAskingPrice(Number(event.target.value))}
                className="field-shell mt-3 h-12 w-full rounded-full px-5 text-[14px] outline-none"
                placeholder="Asking price"
              />

              <input
                value={headline}
                onChange={(event) => setHeadline(event.target.value)}
                placeholder="标题，例如：Monaco archive copy"
                className="field-shell mt-3 h-12 w-full rounded-full px-5 text-[14px] outline-none"
              />

              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                placeholder="描述来源、品相、保存状态和任何你想告诉买家的信息。"
                className="field-shell mt-3 w-full resize-none rounded-2xl px-5 py-4 text-[14px] outline-none"
              />

              <div className="mt-8 grid grid-cols-2 gap-3">
                <HapticTap
                  onClick={() => setStep(1)}
                  className="chrome-button flex h-14 items-center justify-center gap-2 rounded-full text-[12px] font-bold uppercase tracking-[0.24em]"
                >
                  <RotateCcw size={14} />
                  返回版本
                </HapticTap>
                <HapticTap
                  disabled={publishing || !listingPhotos.length}
                  onClick={handlePublish}
                  className={`flex h-14 items-center justify-center gap-2 rounded-full text-[12px] font-bold uppercase tracking-[0.3em] ${
                    publishing || !listingPhotos.length
                      ? 'chrome-button opacity-40'
                      : 'chrome-button-primary text-paper'
                  }`}
                >
                  {publishing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      发布中…
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      发布至中继站
                    </>
                  )}
                </HapticTap>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {error ? <p className="mt-4 text-center text-[12px] text-stamp">{error}</p> : null}
      </div>
    </div>
  );
}
