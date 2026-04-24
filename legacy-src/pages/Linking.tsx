import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, Loader2 } from 'lucide-react';
import { HapticTap } from '../components/HapticTap';
import { useListAlbum } from '../hooks/useAlbums';
import { supabase } from '../lib/supabase';
import { Genre } from '../data/albums';

type Step = 0 | 1 | 2;

export function Linking() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(0);
  const [photo, setPhoto] = useState<string | null>(null);
  const [calibrating, setCalibrating] = useState(false);
  const [listing, setListing] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const listAlbumMutation = useListAlbum();

  // Mock album data for demo (in production, this would come from AI recognition)
  const mockAlbum = {
    title: 'Kind of Blue',
    artist: 'Miles Davis',
    year: 1959,
    rarity: 72,
    price: 45,
    genre: 'Jazz' as Genre,
    wear_grade: 'Near Mint',
  };

  // 第 0 步自动完成扫描
  useEffect(() => {
    if (step === 0) {
      const t = setTimeout(() => setStep(1), 2400);
      return () => clearTimeout(t);
    }
  }, [step]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result as string);
      setCalibrating(true);
      setTimeout(() => setCalibrating(false), 1600);
    };
    reader.readAsDataURL(f);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!photo) return null;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    const fileExt = photo.split(';')[0].split('/')[1];
    const fileName = `${userData.user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('album-covers')
      .upload(fileName, photo, {
        contentType: `image/${fileExt}`,
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('album-covers')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const handlePublish = async () => {
    if (!photo || listing) return;

    setListing(true);
    try {
      const coverUrl = await uploadImage();

      await listAlbumMutation.mutateAsync({
        title: mockAlbum.title,
        artist: mockAlbum.artist,
        year: mockAlbum.year,
        rarity: mockAlbum.rarity,
        price: mockAlbum.price,
        cover: coverUrl || photo, // fallback to base64
        genre: mockAlbum.genre,
        wear_grade: mockAlbum.wear_grade,
        wear_notes: [],
        tracks: [],
      });

      navigate('/browse');
    } catch (error) {
      console.error('Listing error:', error);
    } finally {
      setListing(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar pt-safe">
      <div className="flex items-center justify-between px-6 pt-6">
        <HapticTap
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-full bg-paper shadow-neumo-inset flex items-center justify-center"
        >
          <ArrowLeft size={20} className="text-ink" />
        </HapticTap>
        <span className="text-[10px] tracking-[0.4em] font-bold opacity-40 uppercase">
          Linking Relay
        </span>
        <div className="w-11 h-11" />
      </div>

      {/* 步骤指示 */}
      <div className="flex justify-center gap-3 mt-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === step
                ? 'bg-ink shadow-neumo-sm'
                : 'bg-paper shadow-neumo-inset-sm'
            }`}
          />
        ))}
      </div>

      <div className="px-6 mt-8 pb-40">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <h2 className="font-serif text-[26px] leading-tight">
                对准唱片内圈<br />矩阵码
              </h2>
              <p className="text-[11px] opacity-50 mt-2 tracking-wide">
                Dead-wax matrix 自动识别版本
              </p>
              <div className="mt-8 aspect-square bg-paper shadow-neumo-inset rounded-2xl relative overflow-hidden">
                <div className="absolute inset-10 border border-ink/30 rounded-md" />
                <div
                  className="absolute inset-10 border-[3px] border-ink rounded-md"
                  style={{
                    clipPath:
                      'polygon(0 0, 20% 0, 20% 4%, 4% 4%, 4% 20%, 0 20%, 0 0, 80% 0, 100% 0, 100% 20%, 96% 20%, 96% 4%, 80% 4%, 80% 0, 100% 80%, 100% 100%, 80% 100%, 80% 96%, 96% 96%, 96% 80%, 100% 80%, 0 80%, 0 100%, 20% 100%, 20% 96%, 4% 96%, 4% 80%, 0 80%)',
                  }}
                />
                {/* 扫描光带 */}
                <motion.div
                  initial={{ y: '10%' }}
                  animate={{ y: '90%' }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-x-10 h-[2px] bg-ink shadow-[0_0_12px_#1A4B9E]"
                />
              </div>
              <p className="text-center text-[10px] tracking-widest opacity-50 mt-4 uppercase">
                Scanning…
              </p>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="match"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <h2 className="font-serif text-[26px] leading-tight">
                匹配成功
              </h2>
              <p className="text-[11px] opacity-50 mt-2 tracking-wide">
                AI 在档案库中找到 1 个最可能的版本
              </p>

              <div className="mt-6 bg-paper shadow-neumo rounded-2xl p-5">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 shrink-0 bg-paper shadow-neumo-inset rounded-sm overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400"
                      alt=""
                      className="w-full h-full object-cover mix-blend-multiply opacity-80"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] tracking-widest opacity-50 uppercase">
                      {mockAlbum.artist} · {mockAlbum.year}
                    </p>
                    <p className="font-serif text-[20px] leading-tight mt-0.5">
                      {mockAlbum.title}
                    </p>
                    <p className="text-[11px] mt-0.5 opacity-60">{mockAlbum.price} Cr.</p>
                  </div>
                </div>

                <div className="mt-5 h-px bg-ink/15" />

                <div className="mt-4">
                  <p className="text-[9px] tracking-[0.3em] opacity-50 uppercase">
                    Historical Price Range
                  </p>
                  <div className="mt-3 relative h-10 rounded-full bg-paper shadow-neumo-inset flex items-center px-4">
                    <span className="text-[10px] opacity-50">18 Cr.</span>
                    <div className="flex-1 mx-3 h-[2px] bg-ink/30 relative">
                      <div className="absolute inset-y-0 left-[15%] right-[25%] bg-ink rounded-full" />
                      <div className="absolute -top-1.5 left-[50%] w-3 h-3 rounded-full bg-paper border-[1.5px] border-ink -translate-x-1/2" />
                    </div>
                    <span className="text-[10px] opacity-50">68 Cr.</span>
                  </div>
                  <p className="text-center mt-2 font-serif text-[14px]">
                    建议挂牌 ≈ <span className="font-bold">{mockAlbum.price} Cr.</span>
                  </p>
                </div>
              </div>

              <HapticTap
                onClick={() => setStep(2)}
                className="w-full h-14 mt-8 bg-ink text-paper rounded-full shadow-neumo font-bold tracking-[0.3em] text-[12px] uppercase"
              >
                确认版本 · 下一步
              </HapticTap>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <h2 className="font-serif text-[26px] leading-tight">
                拍摄实物照片
              </h2>
              <p className="text-[11px] opacity-50 mt-2 tracking-wide">
                系统将自动进行视觉校准，融入档案色调
              </p>

              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFile}
              />

              <div
                onClick={() => fileInput.current?.click()}
                className="mt-6 aspect-[4/5] bg-paper shadow-neumo-inset rounded-2xl flex items-center justify-center relative overflow-hidden cursor-pointer"
              >
                {photo ? (
                  <>
                    <img
                      src={photo}
                      alt=""
                      className="w-full h-full object-cover"
                      style={{
                        filter: calibrating
                          ? 'sepia(0) contrast(1) brightness(1)'
                          : 'sepia(0.35) saturate(0.8) contrast(0.95) brightness(0.95)',
                        mixBlendMode: calibrating ? 'normal' : 'multiply',
                        opacity: calibrating ? 1 : 0.88,
                        transition: 'all 1.2s ease',
                      }}
                    />
                    {calibrating && (
                      <motion.div
                        initial={{ y: '-10%' }}
                        animate={{ y: '110%' }}
                        transition={{
                          duration: 1.6,
                          ease: 'easeInOut',
                        }}
                        className="absolute inset-x-0 h-12 bg-gradient-to-b from-transparent via-white/70 to-transparent"
                      />
                    )}
                    {calibrating && (
                      <div className="absolute bottom-4 left-4 right-4 bg-paper/90 backdrop-blur px-3 py-2 rounded-lg text-[11px] font-serif italic tracking-wide text-center">
                        正在进行视觉校准…
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center opacity-50">
                    <Camera size={32} strokeWidth={1.5} className="text-ink" />
                    <p className="text-[11px] tracking-widest mt-2 uppercase font-bold">
                      Tap to Capture
                    </p>
                  </div>
                )}
              </div>

              <HapticTap
                disabled={!photo || calibrating || listing}
                onClick={handlePublish}
                className={`w-full h-14 mt-8 rounded-full font-bold tracking-[0.3em] text-[12px] uppercase flex items-center justify-center gap-2 ${
                  !photo || calibrating || listing
                    ? 'bg-paper shadow-neumo-inset opacity-40'
                    : 'bg-ink text-paper shadow-neumo'
                }`}
              >
                {listing ? (
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
