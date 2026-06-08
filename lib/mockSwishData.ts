import { Customer, Project } from '@/types/meeting'

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c1', name: '株式会社テクノ産業' },
  { id: 'c2', name: 'グローバル商事株式会社' },
  { id: 'c3', name: '株式会社フューチャーワークス' },
  { id: 'c4', name: '東京デジタル株式会社' },
  { id: 'c5', name: '株式会社スマートオフィス' },
]

export const MOCK_PROJECTS: Project[] = [
  { id: 'p1', customerId: 'c1', name: '本社オフィス移転2026' },
  { id: 'p2', customerId: 'c1', name: '大阪支社レイアウト変更' },
  { id: 'p3', customerId: 'c2', name: '東京本社リデザイン' },
  { id: 'p4', customerId: 'c2', name: '新オフィス立ち上げ（渋谷）' },
  { id: 'p5', customerId: 'c3', name: '全社ABW導入プロジェクト' },
  { id: 'p6', customerId: 'c4', name: '本社移転・統合' },
  { id: 'p7', customerId: 'c5', name: 'オフィス縮小・コスト最適化' },
]
