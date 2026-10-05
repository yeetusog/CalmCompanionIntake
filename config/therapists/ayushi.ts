export interface TherapistVisualConfig {
  accent: string;
  background: string;
  fontFamily: string;
}

export interface TherapistProfileConfig {
  displayName: string;
  title: string;
  introduction: string;
  whatIWorkWith: string;
  sessionDetails: string;
  contactDetails: string;
  privacy: string;
  visual: TherapistVisualConfig;
}

export const ayushiProfile: TherapistProfileConfig = {
  displayName: 'Ayushi Pushkarna',
  title: 'Mental Health Professional',
  introduction: 'A warm, private space to begin the conversation at your own pace.',
  whatIWorkWith: 'Share what has been going on in your own words. Your intake helps create context for the first conversation.',
  sessionDetails: 'Session format, timing, and practical details can be discussed directly with Ayushi after your intake is received.',
  contactDetails: 'Professional contact details can be configured in Supabase for your published therapist profile.',
  privacy: 'Your incomplete intake stays on your device. Nothing is sent to the server until you explicitly submit your completed form.',
  visual: {
    accent: '160 24% 33%',
    background: '40 35% 97%',
    fontFamily: 'Georgia, Cambria, Times New Roman, serif',
  },
};

export const ayushiTherapist = {
  name: 'Ayushi Pushkarna',
  email: '',
  slug: 'ayushi-pushkarna',
  status: 'active' as const,
};
