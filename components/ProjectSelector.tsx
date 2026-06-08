'use client'

import { useState } from 'react'
import { Building2, FolderOpen, ChevronDown, ArrowRight, X } from 'lucide-react'
import { Customer, Project, MeetingContext } from '@/types/meeting'
import { MOCK_CUSTOMERS, MOCK_PROJECTS } from '@/lib/mockSwishData'

interface ProjectSelectorProps {
  onStart: (context: MeetingContext) => void
  onClose: () => void
}

export default function ProjectSelector({ onStart, onClose }: ProjectSelectorProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const projects = selectedCustomer
    ? MOCK_PROJECTS.filter((p) => p.customerId === selectedCustomer.id)
    : []

  const handleCustomerChange = (id: string) => {
    const customer = MOCK_CUSTOMERS.find((c) => c.id === id) ?? null
    setSelectedCustomer(customer)
    setSelectedProject(null)
  }

  const handleStart = () => {
    if (!selectedCustomer || !selectedProject) return
    onStart({ customer: selectedCustomer, project: selectedProject })
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <FolderOpen size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">案件を紐付ける</h2>
              <p className="text-xs text-slate-400">後から変更することもできます</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors mt-0.5">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* 顧客選択 */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
              <Building2 size={12} /> 顧客
            </label>
            <div className="relative">
              <select
                value={selectedCustomer?.id ?? ''}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
              >
                <option value="">顧客を選択してください</option>
                {MOCK_CUSTOMERS.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* 案件選択 */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
              <FolderOpen size={12} /> 案件
            </label>
            <div className="relative">
              <select
                value={selectedProject?.id ?? ''}
                onChange={(e) => {
                  const p = projects.find((p) => p.id === e.target.value) ?? null
                  setSelectedProject(p)
                }}
                disabled={!selectedCustomer}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">
                  {selectedCustomer ? '案件を選択してください' : '先に顧客を選択してください'}
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={!selectedCustomer || !selectedProject}
          className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
        >
          紐付けて保存する
          <ArrowRight size={16} />
        </button>
        <button
          onClick={onClose}
          className="mt-3 w-full py-2 rounded-lg text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
        >
          <span className="font-medium">スキップして録音開始</span>
          <span className="block text-[10px] mt-0.5 opacity-70">紐付けなくても録音できますが、提案の精度が下がります</span>
        </button>
      </div>
    </div>
  )
}
