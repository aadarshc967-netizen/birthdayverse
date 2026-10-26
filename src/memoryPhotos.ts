const photoContent = [
  {
    filename: 'WhatsApp Image 2026-10-26 at 5.01.56 PM.jpeg',
    title: 'A Little Sunshine',
    tone: 'rose',
    galleryWish: 'A little extra sunshine, smiles, and sweet surprises.',
    wish: `Happy Birthday to someone who deserves a little extra sunshine today! 💗

May your day be filled with tiny happy moments, unexpected smiles, sweet surprises, and all the little things that make your heart happy.

Never forget how wonderfully unique you are. Keep that beautiful smile shining!`,
  },
  {
    filename: 'WhatsApp Image 2026-10-26 at 5.30.49 PM.jpeg',
    title: 'A Wish From the Heart',
    tone: 'violet',
    galleryWish: 'Gentle days, genuine happiness, and care for yourself.',
    wish: `On your special day, I hope life is as gentle with you as you are with the people around you. 🫶

May you always find comfort when days feel difficult, strength when you need it, and people who remind you how special you are.

You deserve genuine happiness, peaceful days, and a heart full of beautiful memories.

Take care of yourself, keep smiling, and remember that your happiness matters too.`,
  },
  {
    filename: 'WhatsApp Image 2026-10-26 at 5.30.50 PM.jpeg',
    title: 'Birthday Rules: Extra Cake!',
    tone: 'gold',
    galleryWish: 'Cake is mandatory. Birthday rules are birthday rules!',
    wish: `Official birthday announcement! 😂🎂

Today, calories are imaginary, cake is mandatory, and being a little dramatic is completely acceptable.

Your responsibilities include smiling, enjoying yourself, accepting compliments, and pretending you are not getting older.

May your cake be huge, your gifts be amazing, and your problems take the day off.

Birthday rules are birthday rules. No arguments allowed!`,
  },
  {
    filename: 'WhatsApp Image 2026-10-26 at 5.01.54 PM.jpeg',
    title: 'Your Story Is Just Beginning',
    tone: 'blue',
    galleryWish: 'Dream bigger, celebrate your progress, and trust yourself.',
    wish: `Happy Birthday to someone with so much potential and so many beautiful possibilities ahead. ✨

Never be afraid to dream bigger, start again, learn something new, or take a different path.

Not every day will be perfect, and not every plan will work out. But every step forward matters, even the small ones.

Trust yourself, celebrate your progress, and keep becoming the person you want to be.

Your next chapter has so much waiting for you!`,
  },
  {
    filename: 'WhatsApp Image 2026-10-26 at 5.01.55 PM.jpeg',
    title: 'A Beautiful Year Ahead',
    tone: 'rose',
    galleryWish: 'More laughter, new possibilities, and reasons to feel proud.',
    wish: `One more year of life, laughter, lessons, and new possibilities! 🎂💖

I hope this year brings you spontaneous adventures, unforgettable moments, beautiful opportunities, and countless reasons to feel proud of yourself.

May you laugh a little louder, worry a little less, dream a little bigger, and make memories you will smile about for years.

Here's to a wonderful birthday and an even more wonderful year ahead!`,
  },
] as const

export const memoryPhotos = photoContent.map((photo) => ({
  ...photo,
  src: `/images/memories/${encodeURIComponent(photo.filename)}`,
}))
