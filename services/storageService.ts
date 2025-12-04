
import { Material, CurriculumTree, MaterialStatus } from '../types';
import { INITIAL_CURRICULUM } from '../constants';

const MATERIALS_KEY = 'adarshabani_materials_v2';
const CURRICULUM_KEY = 'adarshabani_curriculum_v1';

// Materials
export const getMaterials = (): Material[] => {
  const data = localStorage.getItem(MATERIALS_KEY);
  if (!data) return [];
  
  const parsed = JSON.parse(data);
  // Migrate existing data to have a status
  return parsed.map((m: any) => ({
    ...m,
    status: m.status || MaterialStatus.APPROVED, // Default legacy items to Approved
    contributorName: m.contributorName || 'Anonymous'
  }));
};

export const saveMaterial = (material: Material): void => {
  const materials = getMaterials();
  materials.push(material);
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(materials));
};

export const updateMaterialStatus = (id: string, status: MaterialStatus): void => {
  const materials = getMaterials();
  const index = materials.findIndex(m => m.id === id);
  if (index !== -1) {
    materials[index].status = status;
    localStorage.setItem(MATERIALS_KEY, JSON.stringify(materials));
  }
};

export const deleteMaterial = (id: string): void => {
  const materials = getMaterials();
  const filtered = materials.filter(m => m.id !== id);
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(filtered));
};

// Curriculum Hierarchy
export const getCurriculum = (): CurriculumTree => {
  const data = localStorage.getItem(CURRICULUM_KEY);
  if (data) return JSON.parse(data);
  
  // Initialize if empty
  localStorage.setItem(CURRICULUM_KEY, JSON.stringify(INITIAL_CURRICULUM));
  return INITIAL_CURRICULUM;
};

export const saveCurriculum = (curriculum: CurriculumTree): void => {
  localStorage.setItem(CURRICULUM_KEY, JSON.stringify(curriculum));
};
