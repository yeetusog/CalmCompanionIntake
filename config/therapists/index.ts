import { ayushiProfile, ayushiTherapist } from '@/config/therapists/ayushi';

export const therapistRegistry = {
  [ayushiTherapist.slug]: {
    therapist: ayushiTherapist,
    profile: ayushiProfile,
  },
};
