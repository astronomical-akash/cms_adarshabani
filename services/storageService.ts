import { supabase } from '../lib/supabase';
import { Material, CurriculumTree, MaterialStatus } from '../types';
import { INITIAL_CURRICULUM } from '../constants';

// Materials
export const getMaterials = async (): Promise<Material[]> => {
  const { data, error } = await supabase
    .from('materials')
    .select(`
      *,
      profiles:contributor_id (full_name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching materials:', error);
    return [];
  }

  return data.map((m: any) => ({
    ...m,
    uploadDate: m.upload_date, // Map back to camelCase for frontend
    className: m.class_name,
    bloomsLevel: m.blooms_level,
    fileSize: m.file_size,
    contributorName: m.profiles?.full_name || 'Anonymous'
  }));
};

export const saveMaterial = async (material: Omit<Material, 'id' | 'uploadDate' | 'status'>): Promise<Material | null> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('No authenticated user');
    return null;
  }

  const dbMaterial = {
    title: material.title,
    description: material.description,
    type: material.type,
    url: material.url,
    file_size: material.fileSize,
    class_name: material.className,
    subject: material.subject,
    chapter: material.chapter,
    topic: material.topic,
    subtopic: material.subtopic,
    blooms_level: material.bloomsLevel,
    contributor_id: user.id,
    status: MaterialStatus.PENDING
  };

  const { data, error } = await supabase
    .from('materials')
    .insert(dbMaterial)
    .select()
    .single();

  if (error) {
    console.error('Error saving material:', error);
    return null;
  }

  return {
    ...data,
    uploadDate: data.upload_date,
    className: data.class_name,
    bloomsLevel: data.blooms_level,
    fileSize: data.file_size,
    contributorName: 'You' // Optimistic update
  };
};

export const updateMaterialStatus = async (id: string, status: MaterialStatus): Promise<void> => {
  const { error } = await supabase
    .from('materials')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error updating material status:', error);
  }
};

export const deleteMaterial = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting material:', error);
  }
};

// Curriculum Hierarchy
export const getCurriculum = async (): Promise<CurriculumTree> => {
  const { data, error } = await supabase
    .from('curriculum')
    .select('data')
    .eq('id', 1)
    .single();

  if (error || !data) {
    // If not found, try to initialize
    if (error?.code === 'PGRST116') { // Not found code
      await saveCurriculum(INITIAL_CURRICULUM);
      return INITIAL_CURRICULUM;
    }
    console.error('Error fetching curriculum:', error);
    return INITIAL_CURRICULUM;
  }

  return data.data;
};

export const saveCurriculum = async (curriculum: CurriculumTree): Promise<void> => {
  const { error } = await supabase
    .from('curriculum')
    .upsert({ id: 1, data: curriculum });

  if (error) {
    console.error('Error saving curriculum:', error);
  }
};
