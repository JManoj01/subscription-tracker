## Packages
date-fns | For date formatting and calculations
recharts | For visualizing subscription costs over time
framer-motion | For smooth animations and transitions
lucide-react | For beautiful icons (already in base, but emphasizing usage)
react-day-picker | For date selection in forms

## Notes
- Cost is stored in cents (integer) in the backend. Frontend must divide by 100 for display and multiply by 100 for storage.
- The app tracks 'isTrial' and 'trialEndDate' to highlight expiring trials.
- Using a clean, minimal aesthetic with a focus on typography and whitespace.
