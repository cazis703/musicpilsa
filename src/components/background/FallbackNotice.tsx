export default function FallbackNotice() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-10 z-10 flex justify-center">
      <p className="rounded-full bg-white/5 px-4 py-2 text-sm text-white/40">
        배경 영상을 준비 중입니다
      </p>
    </div>
  );
}
