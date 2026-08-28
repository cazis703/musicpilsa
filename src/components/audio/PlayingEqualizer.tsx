"use client";

interface PlayingEqualizerProps {
  isPlaying: boolean;
  className?: string;
}

// 재생목록에서 지금 재생 중인 곡 옆에 붙는 이퀄라이저 바 3개. 일시정지 중엔 애니메이션을
// 멈추고 낮은 높이에 얼어붙게 해서, 곡을 멈추면 표시도 같이 멎는다는 걸 보여준다.
// 각 막대는 음수 animation-delay로 서로 어긋난 박자에서 시작해 다같이 튀지 않게 한다.
export default function PlayingEqualizer({ isPlaying, className = "" }: PlayingEqualizerProps) {
  const delays = ["-1.0s", "-0.5s", "-1.5s"];

  return (
    <span className={`flex h-3 w-3 items-end gap-[2px] ${className}`} aria-hidden="true">
      {delays.map((delay, index) => (
        <span
          key={index}
          className={`h-full w-[2px] origin-bottom rounded-[1px] bg-current ${
            isPlaying ? "animate-eq-bounce" : "scale-y-[0.42]"
          }`}
          style={isPlaying ? { animationDelay: delay } : undefined}
        />
      ))}
    </span>
  );
}
