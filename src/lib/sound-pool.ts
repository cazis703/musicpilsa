export class SoundPool {
  private pool: HTMLAudioElement[];
  private index = 0;

  constructor(src: string, poolSize: number, initialVolume: number) {
    this.pool = Array.from({ length: poolSize }, () => {
      const audio = new Audio(src);
      audio.preload = "auto"; // 마운트 시점에 미리 로드해, 재생 시점 지연을 없앤다.
      audio.volume = initialVolume;
      return audio;
    });
  }

  play(): void {
    const audio = this.pool[this.index];
    this.index = (this.index + 1) % this.pool.length;
    try {
      audio.currentTime = 0; // 재사용 시 항상 처음부터 재생
    } catch {
      // 메타데이터가 아직 로드되지 않은 극히 드문 환경에서도 재생 자체는 계속 시도한다.
    }
    audio.play().catch(() => {
      // 브라우저 자동재생 정책 등으로 거부되어도 앱 동작에 영향 없음(무음 유지).
    });
  }

  setVolume(volume: number): void {
    this.pool.forEach((audio) => {
      audio.volume = volume;
    });
  }
}
