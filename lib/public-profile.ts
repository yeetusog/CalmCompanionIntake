import { ayushiProfile, ayushiTherapist } from '@/config/therapists/ayushi';
import { hasSupabaseServerConfig, createAdminClient } from '@/lib/supabase/admin';

export interface PublicTherapist {
  id: string;
  name: string;
  slug: string;
  profile: typeof ayushiProfile;
}

export async function getPublicTherapist(slug: string): Promise<PublicTherapist | null> {
  if (slug !== ayushiTherapist.slug) return null;
  if (!hasSupabaseServerConfig()) {
    return { id: 'local-fallback', name: ayushiTherapist.name, slug: ayushiTherapist.slug, profile: ayushiProfile };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('therapists')
    .select('id,name,slug,status,therapist_profiles(display_name,introduction,specialties,session_details,contact_details,visual_config)')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !data) return null;
  const rawProfile = Array.isArray(data.therapist_profiles) ? data.therapist_profiles[0] : data.therapist_profiles;
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    profile: {
      displayName: rawProfile?.display_name ?? ayushiProfile.displayName,
      title: ayushiProfile.title,
      introduction: rawProfile?.introduction ?? ayushiProfile.introduction,
      whatIWorkWith: rawProfile?.specialties ?? ayushiProfile.whatIWorkWith,
      sessionDetails: rawProfile?.session_details ?? ayushiProfile.sessionDetails,
      contactDetails: rawProfile?.contact_details ?? ayushiProfile.contactDetails,
      privacy: ayushiProfile.privacy,
      visual: rawProfile?.visual_config ?? ayushiProfile.visual,
    },
  };
}
