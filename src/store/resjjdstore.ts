import { create } from 'zustand';

interface AppState {
  resume: string;
  jobDescription: string;
  companyName: string;
  setResume: (resume: string) => void;
  setJobDescription: (jobDescription: string) => void;
  setCompanyName: (companyName: string) => void;
}

const useAppStore = create<AppState>((set) => ({
  resume: '',
  jobDescription: '',
  companyName: '',
  setResume: (resume) => set({ resume }),
  setJobDescription: (jobDescription) => set({ jobDescription }),
  setCompanyName: (companyName) => set({ companyName }),
}));

export default useAppStore;