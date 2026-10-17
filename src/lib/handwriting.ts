/** 손글씨 획: 좌표와 시각(ms) */
export interface Stroke {
  xs: number[];
  ys: number[];
  ts: number[];
}

/** 한 파일로 묶어 웹(아티팩트 등)에 올린 버전은 외부 서버 접속이 막혀 있어서 끈다 */
export const handwritingAvailable =
  !(import.meta.env.MODE === 'file' && typeof window !== 'undefined' && window.location.protocol !== 'file:');

export interface Recognizer {
  /** 후보 글자들을 가능성 높은 순서로 돌려준다 */
  recognize(strokes: Stroke[], size: { width: number; height: number }, lang: string): Promise<string[]>;
}

/**
 * Google 입력도구의 손글씨 인식 서버를 쓴다 (가입이나 키가 필요 없음).
 * 공식 지원 API가 아니라서 언젠가 막힐 수 있다. 그때는 이 인터페이스에 맞는
 * 다른 인식기(예: 서버를 거친 Claude API)로 바꾸면 된다.
 * 획의 좌표만 보내고 다른 플래너 데이터는 보내지 않는다.
 */
export const googleRecognizer: Recognizer = {
  async recognize(strokes, size, lang) {
    if (!strokes.length) return [];
    const res = await fetch(
      'https://inputtools.google.com/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          options: 'enable_pre_space',
          requests: [
            {
              writing_guide: { writing_area_width: size.width, writing_area_height: size.height },
              ink: strokes.map((s) => [s.xs, s.ys, s.ts]),
              language: lang,
            },
          ],
        }),
      },
    );
    if (!res.ok) throw new Error(`인식 서버 오류 (${res.status})`);
    const json = await res.json();
    if (json?.[0] !== 'SUCCESS') throw new Error('글씨를 알아보지 못했어요.');
    return (json[1]?.[0]?.[1] as string[] | undefined) ?? [];
  },
};
