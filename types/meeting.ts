export type ThemeStatus = 'pending' | 'confirmed' | 'skipped'

export interface Customer {
  id: string
  name: string
}

export interface Project {
  id: string
  customerId: string
  name: string
}

export interface SessionRecord {
  sessionId: string
  date: string
  keyDecisions: string[]
  openQuestions: string[]
  coverage: ThemeCoverage[]
  confirmedThemeIds: string[]
}

export interface MeetingContext {
  customer: Customer
  project: Project
  priorHistory?: SessionRecord[]
}

export interface Theme {
  id: string
  name: string
  nameEn: string
  description: string
  status: ThemeStatus
  priority: number
  keywords: string[]
  questions: string[]
}

export interface TranscriptEntry {
  id: string
  text: string
  timestamp: Date
  speakerId?: number
  isNew?: boolean
}

export type CoverageDepth = 'none' | 'surface' | 'moderate' | 'deep'

export interface ThemeFeedback {
  themeId: string
  themeName: string
  depth: CoverageDepth
  comment: string
}

export interface MeetingFeedback {
  score: number
  summary: string
  positives: string[]
  improvements: string[]
  themeResults: ThemeFeedback[]
}

export interface ThemeCoverage {
  themeId: string
  depth: CoverageDepth
  coveredPercent: number
  alert?: string
}

export interface Suggestion {
  id: string
  themeId: string
  themeName: string
  question: string
  reason?: string
  status: 'pending' | 'used' | 'skipped'
}

export interface MeetingState {
  isRecording: boolean
  startTime: Date | null
  duration: number
  themes: Theme[]
  transcript: TranscriptEntry[]
  suggestions: Suggestion[]
  notes: string | null
  isGeneratingNotes: boolean
  isLoadingSuggestions: boolean
}

export const DEFAULT_THEMES: Theme[] = [
  {
    id: 'project_purpose',
    name: 'プロジェクトの目的',
    nameEn: 'Project Purpose',
    description: '移転・リデザインの目的（拡張・コスト削減・組織改革・BCP等）と優先順位',
    status: 'pending',
    priority: 5,
    keywords: ['目的', '移転理由', '拡張', 'コスト削減', 'BCP', 'ブランディング', '採用', '文化改革', '効率化', 'シナジー', '行動改革', '意識改革'],
    questions: [
      '今回の移転・リデザインで最も優先したい目的を3つ教えてください',
      'その目的を選んだ背景や、現状どんな課題があるか教えていただけますか？',
      'プロジェクトが成功した状態とはどんなイメージですか？',
      '目的を実現するための手段として、すでに検討していることはありますか？',
    ],
  },
  {
    id: 'partner_selection',
    name: 'パートナー選定',
    nameEn: 'Partner Selection',
    description: 'コンペ形式・選定プロセス・期待する能力（デザイン・PM・チェンジMGMT等）',
    status: 'pending',
    priority: 5,
    keywords: ['コンペ', '選定', 'パートナー', '審査', '投票', 'プレゼン', '評価', 'PM能力', 'デザイン能力', 'チェンジマネジメント', 'プログラミング能力'],
    questions: [
      'パートナーの選定方法（投票・採点・キーマン決定など）を教えてください',
      '選定の最終決裁者はどなたになりますか？',
      'パートナーに最も期待する能力を3つ順位をつけて教えてください',
      '既存パートナー以外にも声をかけた理由を教えていただけますか？',
    ],
  },
  {
    id: 'work_style',
    name: 'ワークスタイル',
    nameEn: 'Work Style',
    description: '現状と理想の働き方（時間・場所・内容軸）、変革の方向性',
    status: 'pending',
    priority: 4,
    keywords: ['ワークスタイル', '働き方', 'リモート', 'ハイブリッド', '出社', '変革', 'ABW', 'フリーアドレス', '時間自由', '場所自由'],
    questions: [
      '現在の出社頻度・働き方のスタイルを教えてください',
      '今後どのような働き方に変えていきたいですか？',
      'フリーアドレスやABW（活動基準働き方）の導入は検討されていますか？',
      'リモートと出社の理想的な割合はどのくらいですか？',
    ],
  },
  {
    id: 'budget',
    name: '予算',
    nameEn: 'Budget',
    description: '予算規模・工事区分（A/B/C工事）・坪単価レンジ・内装費配分',
    status: 'pending',
    priority: 3,
    keywords: ['予算', '費用', 'コスト', '坪', 'A工事', 'B工事', 'C工事', '内装費', '設計費', '坪単価', '工事区分'],
    questions: [
      'プロジェクト全体の予算感はどのくらいをイメージされていますか？',
      'A工事・B工事・C工事の区分は把握されていますか？',
      '坪単価のレンジはどのくらいをイメージされていますか？',
      '予算の中で特に重点配分したいエリアや工事項目はありますか？',
    ],
  },
  {
    id: 'space_function',
    name: '機能・空間要件',
    nameEn: 'Space & Function',
    description: '入居人数・出社率・席数・ABW・会議室・受付・収納・ゾーニング',
    status: 'pending',
    priority: 3,
    keywords: ['入居人数', '出社率', '席数', 'フリーアドレス', 'ABW', '会議室', '受付', '収納', '部門', 'ゾーニング', '収容人数'],
    questions: [
      '入居人数・想定出社率・必要席数を教えてください',
      '入居する部門と、近接させたい部門の組み合わせはありますか？',
      '会議室は何室、何名用が必要ですか？現状の稼働率はどのくらいですか？',
      '受付は有人対応を予定していますか？月間の来客数はどのくらいですか？',
    ],
  },
  {
    id: 'communication',
    name: 'コミュニケーション',
    nameEn: 'Communication',
    description: '増やしたいコミュニケーション（種類・誰と・理由）',
    status: 'pending',
    priority: 3,
    keywords: ['コミュニケーション', '連携', '部門間', '雑談', '1on1', '偶発', 'カジュアル', '一体感', 'フラット', 'ホウレンソウ'],
    questions: [
      '今後増やしたいコミュニケーションの種類を教えてください（雑談・会議・1on1など）',
      '特に連携を強化したい部門や役職の組み合わせはありますか？',
      '現在のコミュニケーションで最も課題に感じていることは何ですか？',
      '偶発的な出会いや雑談が生まれる仕掛けは必要ですか？',
    ],
  },
  {
    id: 'innovation',
    name: 'イノベーション・創造性',
    nameEn: 'Innovation',
    description: 'イノベーション重要度・ハード施策（コラボエリア等）・ソフト施策（文化・制度）',
    status: 'pending',
    priority: 3,
    keywords: ['イノベーション', '創造性', 'コラボエリア', 'セレンディピティ', '集中', 'AI活用', 'DX', 'クロスファンクション', '心理的安全'],
    questions: [
      'イノベーションや創造性向上の優先度は高いですか？',
      'コラボエリアや集中ブースなど、特に必要なスペースはありますか？',
      'AIやDXの活用促進はオフィス戦略に含まれていますか？',
      '失敗を許容するチャレンジ文化の醸成は課題になっていますか？',
    ],
  },
  {
    id: 'design',
    name: 'デザイン',
    nameEn: 'Design',
    description: '希望するデザインテイスト（ラグジュアリー・カフェライク・バイオフィリック等）',
    status: 'pending',
    priority: 3,
    keywords: ['デザイン', 'テイスト', 'ラグジュアリー', 'カフェ', 'バイオフィリック', 'シンプルモダン', '和モダン', '北欧', '内装', '空間'],
    questions: [
      '希望するデザインテイスト（ラグジュアリー・カフェ・シンプルモダンなど）を教えてください',
      'エントランスや来客エリアと執務エリアで異なるテイストは考えていますか？',
      '参考にしたい他社オフィスや空間のイメージはありますか？',
      '会社のブランドカラーやコーポレートイメージとの整合性は重視しますか？',
    ],
  },
  {
    id: 'culture',
    name: 'カルチャー',
    nameEn: 'Culture',
    description: '現在と理想の企業カルチャー（トップダウン/ボトムアップ・成果/プロセス重視等）',
    status: 'pending',
    priority: 3,
    keywords: ['カルチャー', '文化', 'トップダウン', 'ボトムアップ', '成果主義', '心理的安全', '自律分散', '情報共有', 'ハイコンテクスト'],
    questions: [
      '現在の企業カルチャーを一言で表すとどんな言葉が近いですか？',
      '今後どのようなカルチャーに変えていきたいですか？',
      '意思決定はトップダウンとボトムアップどちらが強いですか？',
      '情報共有はオープンですか、必要最低限クローズですか？',
    ],
  },
  {
    id: 'experience_design',
    name: '体験デザイン',
    nameEn: 'Experience Design',
    description: '社員にさせたい体験（感謝・一体感・チャレンジ・誇り等）',
    status: 'pending',
    priority: 2,
    keywords: ['体験', 'エンゲージメント', 'やりがい', '一体感', '誇り', 'チャレンジ', 'ウェルビーイング', '任される', '仲間'],
    questions: [
      '社員にどんな体験を多くしてもらいたいですか？（誇り・一体感・チャレンジなど）',
      '社員のエンゲージメントや定着率に課題はありますか？',
      '社員がやりがいを感じる瞬間はどんな場面が多いですか？',
      'ウェルビーイングの観点で取り組みたいことはありますか？',
    ],
  },
  {
    id: 'competition',
    name: '競合',
    nameEn: 'Competition',
    description: 'コンペ参加社数・競合種別・既存パートナーへの不満・新規参加への期待',
    status: 'pending',
    priority: 2,
    keywords: ['コンペ参加', '競合', '他社', '参加社数', 'メーカー系', 'デザイン会社', '既存パートナー', '声をかけた'],
    questions: [
      'コンペに参加する会社は何社くらいを想定していますか？',
      'どんな種別の会社に声をかけていますか？（メーカー系・デザイン会社・PM会社など）',
      '既存パートナー以外に声をかけた理由を教えてください',
      '新しく参加する会社に特に期待することは何ですか？',
    ],
  },
]
