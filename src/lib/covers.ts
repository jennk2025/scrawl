/** 표지 색. bg=표지, ink=라벨/글자, accent=책갈피 띠 */
export const COVERS = [
  { id: 'navy', name: '밤하늘', bg: '#2f4a7a', ink: '#f6ecd6', accent: '#e8836b' },
  { id: 'rose', name: '장미', bg: '#c4727f', ink: '#fff3ec', accent: '#f6d77a' },
  { id: 'sage', name: '세이지', bg: '#6b8f7b', ink: '#fbf6e7', accent: '#e6a28f' },
  { id: 'plum', name: '플럼', bg: '#6e4d86', ink: '#f8eefc', accent: '#f4c26b' },
  { id: 'mustard', name: '머스터드', bg: '#d9a23d', ink: '#2f2410', accent: '#b8453a' },
  { id: 'cocoa', name: '코코아', bg: '#6a4a3c', ink: '#f7e9d7', accent: '#e7a44f' },
] as const;

export const coverById = (id: string) => COVERS.find((c) => c.id === id) ?? COVERS[0];
